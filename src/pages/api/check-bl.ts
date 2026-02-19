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
      'bl.mailspike.net',      // Добавили: отличный репутационный лист
      'dnsbl.spfbl.net',       // Добавили: очень активный сейчас
      'bl.blocklist.de',
	  'combined.mail.abusix.zone', // Abusix - очень крутой современный лист
      'dnsbl.dronebl.org'
    ];
  } else {
    queryTarget = target;
    lists = [
      'uri.invaluement.com',
      'dbl.spamhaus.org',
      'multi.surbl.org',
      'black.uribl.com',
      'uribl.spameatingmonkey.net', // Добавили: хорош для новых доменов
      'dbl.nordspam.com',            // Добавили: современный европейский лист
	  'dhost.abusix.zone' // Доменный лист от Abusix
    ];
  }

  const results = await Promise.all(lists.map(async (bl) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${queryTarget}.${bl}&type=A`);
      const data = await response.json();
      
      if (!data.Answer || data.Answer.length === 0) {
        return { host: bl, isBlacklisted: false, status: 'CLEAN' };
      }

      const responseCode = data.Answer[0].data;

      // Умная обработка Spamhaus (PBL)
      if (bl === 'zen.spamhaus.org' && (responseCode === '127.0.0.10' || responseCode === '127.0.0.11')) {
        return { host: bl, isBlacklisted: false, status: 'CLEAN (PBL)' };
      }

      // Обработка Mailspike (они используют коды 127.0.0.10-14 для хороших IP)
      if (bl === 'bl.mailspike.net' && parseInt(responseCode.split('.').pop()) > 10) {
          return { host: bl, isBlacklisted: false, status: 'CLEAN (Rep)' };
      }

      return {
        host: bl,
        isBlacklisted: true,
        status: `LISTED (${responseCode})`
      };
    } catch (e) {
      return { host: bl, isBlacklisted: false, status: 'ERROR' };
    }
  }));

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};