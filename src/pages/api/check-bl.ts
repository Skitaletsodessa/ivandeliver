export const POST = async ({ request }) => {
  const { target } = await request.json();
  
  // Проверяем, является ли таргет IP-адресом
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
  
  let queryTarget = target;
  let lists = [];

  if (isIp) {
    // Если это IP — реверсируем и используем IP-листы
    queryTarget = target.split('.').reverse().join('.');
    lists = [
      'sip.invaluement.com',
	  'zen.spamhaus.org',
      'bl.spamcop.net',
      'b.barracudacentral.org',
      'bl.blocklist.de',
	  'dnsbl.dronebl.org'
    ];
  } else {
    // Если это домен — НЕ реверсируем и используем Domain-листы (DBL)
    queryTarget = target;
    lists = [
      'uri.invaluement.com',
	  'dbl.spamhaus.org',      // Тот самый, где сидит твой пример
      'surriel.com',
      'multi.surbl.org',
      'black.uribl.com'
    ];
  }

  const results = await Promise.all(lists.map(async (bl) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${queryTarget}.${bl}&type=A`);
      const data = await response.json();
      
      // Spamhaus DBL возвращает 127.0.1.x если домен заблокирован
      const isListed = !!data.Answer;
      
      return {
        host: bl,
        isBlacklisted: isListed,
        status: isListed ? 'LISTED' : 'CLEAN'
      };
    } catch {
      return { host: bl, isBlacklisted: false, status: 'ERROR' };
    }
  }));

  return new Response(JSON.stringify({ results }), { status: 200 });
};