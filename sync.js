// Скрипт синхронизации GreenArrow -> Cloudflare D1
// Запускается командой: node sync.js

const GA_MANAGER_URL = 'https://ga-manager.skitalets-od.workers.dev';

async function syncData() {
  console.log('⏳ 1/3: Fetching Global Directory...');
  try {
    const listRes = await fetch(`${GA_MANAGER_URL}/api/ga-list`);
    const lists = await listRes.json();
    
    const ipMtas = lists.mtas.filter(m => m.type === 'ip_address' || !m.type);
    const ruleMtas = lists.rules || []; 
    
    const ipIds = ipMtas.map(r => r.id);
    const ruleIds = ruleMtas.map(r => r.id);

    const chunkSize = 15;

    // --- 1. Синхронизация IP-адресов ---
    console.log(`\n⏳ 2/3: Syncing ${ipIds.length} MTAs...`);
    for (let i = 0; i < ipIds.length; i += chunkSize) {
      console.log(`   Processing MTA chunk: ${Math.min(i+chunkSize, ipIds.length)}/${ipIds.length}`);
      const chunk = ipIds.slice(i, i+chunkSize);
      
      const detailsRes = await fetch(`${GA_MANAGER_URL}/api/ga-details`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ip_addresses', ids: chunk }) 
      });
      const detailsData = await detailsRes.json();

      const usedByRes = await fetch(`${GA_MANAGER_URL}/api/ga-details`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'used_by', ids: chunk }) 
      });
      const usedByData = await usedByRes.json();

      let batchPayload = { ips: [], rules: [], relations: [], processed_mta_ids: chunk };

      for (let j = 0; j < chunk.length; j++) {
        const mtaId = chunk[j];
        const detail = detailsData[j];
        const usedBy = usedByData[j];

        if (detail && detail.success && detail.data && detail.data.ip_address) {
          const ipData = detail.data.ip_address;
          batchPayload.ips.push({
            id: ipData.id,
            name: ipData.name,
            ip: ipData.ip || null,
            hostname: ipData.hostname || null,
            delivery_paused: ipData.delivery_paused ? 1 : 0,
            throttling_template_id: ipData.throttling_template?.id || null,
            throttling_template_name: ipData.throttling_template?.name || null,
            raw_json: JSON.stringify(ipData)
          });
        }

        if (usedBy && usedBy.success && usedBy.data && Array.isArray(usedBy.data.used_by)) {
          usedBy.data.used_by.forEach(ref => {
            batchPayload.relations.push({
              mta_id: mtaId,
              used_by_id: ref.id,
              used_by_type: ref.type,
              used_by_name: ref.name
            });
          });
        }
      }

      if (batchPayload.ips.length > 0 || batchPayload.relations.length > 0 || batchPayload.processed_mta_ids.length > 0) {
          await fetch(`${GA_MANAGER_URL}/api/update-inventory`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchPayload)
          });
      }
    }

    // --- 2. Синхронизация Пулов ---
    console.log(`\n⏳ 3/3: Syncing ${ruleIds.length} Pools...`);
    for (let i = 0; i < ruleIds.length; i += chunkSize) {
      console.log(`   Processing Pool chunk: ${Math.min(i+chunkSize, ruleIds.length)}/${ruleIds.length}`);
      const chunk = ruleIds.slice(i, i+chunkSize);
      
      const rulesRes = await fetch(`${GA_MANAGER_URL}/api/ga-details`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'routing_rules', ids: chunk }) 
      });
      const rulesData = await rulesRes.json();

      let batchPayload = { ips: [], rules: [], relations: [] };

      rulesData.forEach(r => {
        if (r && r.success && r.data && r.data.routing_rule) {
          const ruleData = r.data.routing_rule;
          batchPayload.rules.push({
            id: ruleData.id,
            name: ruleData.name,
            randomization_type: ruleData.default?.randomization_type || null,
            raw_json: JSON.stringify(ruleData)
          });
        }
      });

      if (batchPayload.rules.length > 0) {
          await fetch(`${GA_MANAGER_URL}/api/update-inventory`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchPayload)
          });
      }
    }

    console.log('\n✅ Sync completed successfully!');
  } catch (err) {
    console.error('❌ Sync failed:', err);
  }
}

syncData();