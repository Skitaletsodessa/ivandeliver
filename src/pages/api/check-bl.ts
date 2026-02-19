export const POST = async ({ request }) => {
  const { target } = await request.json();
  const reversedIp = target.split('.').reverse().join('.');

  // Выбрал 8 самых "убойных" листов из твоего старого списка
  const dnsbls = [
    'zen.spamhaus.org',
    'bl.spamcop.net',
    'b.barracudacentral.org',
    'dnsbl.sorbs.net',
    'bl.spamrats.com',
    'db.wpbl.info',
    'bl.blocklist.de',
    'all.s5h.net'
  ];

  const results = await Promise.all(dnsbls.map(async (bl) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${reversedIp}.${bl}&type=A`);
      const data = await response.json();
      return {
        host: bl,
        isBlacklisted: !!data.Answer,
        status: data.Answer ? 'LISTED' : 'CLEAN'
      };
    } catch {
      return { host: bl, isBlacklisted: false, status: 'ERROR' };
    }
  }));

  return new Response(JSON.stringify({ results }), { status: 200 });
};