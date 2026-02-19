export const POST = async ({ request }) => {
  const data = await request.json();
  const target = data.target; // IP или Домен

  // Самые важные листы из твоего blacklist.sh
  const blacklists = [
    'zen.spamhaus.org',
    'bl.spamcop.net',
    'b.barracudacentral.org',
    'dnsbl.sorbs.net',
    'bl.spamrats.com',
    'all.s5h.net'
  ];

  // Реверсируем IP для DNSBL проверки (1.2.3.4 -> 4.3.2.1)
  const reversedIp = target.split('.').reverse().join('.');

  const checks = blacklists.map(async (bl) => {
    try {
      // Используем Google DNS-over-HTTPS для быстрой проверки
      const response = await fetch(`https://dns.google/resolve?name=${reversedIp}.${bl}&type=A`);
      const result = await response.json();
      
      return {
        list: bl,
        // Если Google вернул Answer, значит IP в блеклисте (код 127.0.0.x)
        isBlacklisted: !!result.Answer,
        status: result.Answer ? 'Listed' : 'Clean'
      };
    } catch (e) {
      return { list: bl, isBlacklisted: false, status: 'Error' };
    }
  });

  const results = await Promise.all(checks);
  return new Response(JSON.stringify({ results }), { status: 200 });
};