import { SPAMHAUS_DQS_KEY } from 'astro:env/server';

export const POST = async ({ request }) => {
  const { target } = await request.json();
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
  const dqsKey = SPAMHAUS_DQS_KEY || ''; 
  
  let queryTarget = target;
  let lists = [];

  if (isIp) {
    queryTarget = target.split('.').reverse().join('.');
    lists = [
      'sip.invaluement.com',
      dqsKey ? `${dqsKey}.zen.dq.spamhaus.net` : 'zen.spamhaus.org',
      'bl.spamcop.net',
      'b.barracudacentral.org',
      'bl.mailspike.net',
      'dnsbl.spfbl.net',
      'combined.mail.abusix.zone',
      'bl.blocklist.de'
    ];
  } else {
    // Для доменов (DBL) реверс не нужен
    queryTarget = target;
    lists = [
      'uri.invaluement.com',
      dqsKey ? `${dqsKey}.dbl.dq.spamhaus.net` : 'dbl.spamhaus.org',
      'multi.surbl.org',
      'black.uribl.com',
      'uribl.spameatingmonkey.net',
      'dbl.nordspam.com',
      'dhost.abusix.zone'
    ];
  }

  const results = await Promise.all(lists.map(async (bl) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${queryTarget}.${bl}&type=A`);
      const data = await response.json();
      
      const displayName = bl.includes('.dq.') ? 'Spamhaus (DQS)' : bl;

      if (!data.Answer || data.Answer.length === 0) {
        return { host: displayName, severity: 'safe', status: 'NOT LISTED' };
      }

      const responseCode = data.Answer[0].data;
      const lastOctet = parseInt(responseCode.split('.').pop() || '0');

      // 1. Обработка ошибок доступа (Query Refused)
      if (responseCode === '127.255.255.254' || responseCode === '127.255.255.252') {
        return { host: displayName, severity: 'safe', status: 'REFUSED (Use DQS)' };
      }

      // 2. Специфическая логика для Spamhaus DBL (Domain Block List)
      // DBL возвращает коды 127.0.1.x. Если мы в доменном режиме и это Spamhaus — любой 127.0.1.x это листинг.
      if (bl.includes('dbl') && responseCode.startsWith('127.0.1.')) {
        return {
          host: displayName,
          severity: 'danger',
          status: `LISTED (DBL: ${responseCode})`
        };
      }

      // 3. Логика Spamhaus IP PBL (127.0.0.10-11)
      if (bl.includes('zen') && (responseCode === '127.0.0.10' || responseCode === '127.0.0.11')) {
        return { host: displayName, severity: 'warning', status: 'POLICY (PBL)' };
      }

      // 4. Обработка Mailspike
      if (bl === 'bl.mailspike.net') {
        if (lastOctet >= 15 && lastOctet <= 20) {
          return { host: displayName, severity: 'warning', status: `LOW REP (${responseCode})` };
        }
        if (lastOctet >= 10 && lastOctet <= 14) {
          return { host: displayName, severity: 'safe', status: 'CLEAN (Rep)' };
        }
      }

      // 5. Все остальное — критический листинг
      return {
        host: displayName,
        severity: 'danger',
        status: `LISTED (${responseCode})`
      };
    } catch (e) {
      return { host: bl.includes('.dq.') ? 'Spamhaus' : bl, severity: 'safe', status: 'DNS ERROR' };
    }
  }));

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};