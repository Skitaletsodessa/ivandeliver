export const POST = async ({ request }) => {
  const { target } = await request.json();
  
  // Регулярка для проверки, IP это или домен
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
  
  let queryTarget = target;
  let lists = [];

  if (isIp) {
    // Для IP: делаем реверс (1.2.3.4 -> 4.3.2.1)
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
    // Для доменов: реверс не нужен
    queryTarget = target;
    lists = [
      'uri.invaluement.com',
      'dbl.spamhaus.org',
      'surriel.com',
      'multi.surbl.org',
      'black.uribl.com'
    ];
  }

  const results = await Promise.all(lists.map(async (bl) => {
    try {
      // Используем Google DoH для проверки
      const response = await fetch(`https://dns.google/resolve?name=${queryTarget}.${bl}&type=A`);
      const data = await response.json();
      
      // Если ответов нет — адрес чист
      if (!data.Answer || data.Answer.length === 0) {
        return { host: bl, isBlacklisted: false, status: 'CLEAN' };
      }

      // Получаем конкретный IP ответа (например, 127.0.0.10)
      const responseCode = data.Answer[0].data;

      // ЛОГИКА ИСКЛЮЧЕНИЯ PBL (Policy Block List) для Spamhaus
      // Коды 127.0.0.10 и 127.0.0.11 означают, что IP динамический/домашний.
      // На сайте Spamhaus это отображается как "No issues", сделаем так же.
      if (bl === 'zen.spamhaus.org' && (responseCode === '127.0.0.10' || responseCode === '127.0.0.11')) {
        return { host: bl, isBlacklisted: false, status: 'CLEAN (PBL)' };
      }

      // Во всех остальных случаях — это реальный листинг
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