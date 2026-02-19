export const POST = async ({ request }) => {
  const { target } = await request.json();
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
  
  let queryTarget = target;
  let lists = [];

  if (isIp) {
    queryTarget = target.split('.').reverse().join('.');
    lists = [
      'sip.invaluement.com',
      'zen.spamhaus.org',
      'bl.spamcop.net',
      'b.barracudacentral.org',
      'bl.mailspike.net',
      'dnsbl.spfbl.net',
      'bl.blocklist.de',
      'combined.mail.abusix.zone',
      'dnsbl.dronebl.org'
    ];
  } else {
    queryTarget = target;
    lists = [
      'uri.invaluement.com',
      'dbl.spamhaus.org',
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
      
      // Если ответов нет (NXDOMAIN) — значит всё чисто
      if (!data.Answer || data.Answer.length === 0) {
        return { host: bl, severity: 'safe', status: 'NOT LISTED' };
      }

      const responseCode = data.Answer[0].data;
      const lastOctet = parseInt(responseCode.split('.').pop() || '0');

      // 1. Обработка ошибки доступа Spamhaus (Query Refused)
      // Если видим 127.255.255.254/252 — это не листинг, а отказ в запросе через Google DNS
      if (bl.includes('spamhaus') && (responseCode === '127.255.255.254' || responseCode === '127.255.255.252')) {
        return { host: bl, severity: 'safe', status: 'REFUSED (Use DQS)' };
      }

      // 2. Логика Spamhaus PBL (Желтый - Warning)
      if (bl === 'zen.spamhaus.org' && (responseCode === '127.0.0.10' || responseCode === '127.0.0.11')) {
        return { host: bl, severity: 'warning', status: 'POLICY (PBL)' };
      }

      // 3. Обработка Mailspike (Репутация)
      if (bl === 'bl.mailspike.net') {
        if (lastOctet >= 15 && lastOctet <= 20) {
          return { host: bl, severity: 'warning', status: `LOW REP (${responseCode})` };
        }
        if (lastOctet >= 10 && lastOctet <= 14) {
          return { host: bl, severity: 'safe', status: 'CLEAN (Rep)' };
        }
      }

      // 4. Все остальные случаи (SBL, XBL, Spamcop и т.д.) — это реальный листинг
      return {
        host: bl,
        severity: 'danger',
        status: `LISTED (${responseCode})`
      };
    } catch (e) {
      return { host: bl, severity: 'safe', status: 'DNS ERROR' };
    }
  }));

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};