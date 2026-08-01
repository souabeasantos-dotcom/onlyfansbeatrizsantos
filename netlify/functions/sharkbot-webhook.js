export async function handler(event) {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  try {
    const body = JSON.parse(event.body || '{}');
    const pix = body.data?.transaction?.pix_code || '';
    const tid = body.data?.transaction?.id || '';
    const tg = body.data?.customer?.telegram_id?.toString() || '';
    if(!pix &&!tid) return { statusCode: 200, body: 'sem pix' };
    const match = pix.match(/\/cob\/([a-f0-9\-]+)/i);
    const codigo_curto = match? match[1] : pix.slice(-60);
    await fetch(`${URL}/rest/v1/pagamentos`, {
      method: 'POST',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type':'application/json', 'Prefer':'resolution=merge-duplicates' },
      body: JSON.stringify({
        pix_codigo: codigo_curto,
        telegram_id: tg,
        transaction_id: tid,
        phone: codigo_curto
      })
    });
    return { statusCode: 200, body: 'ok '+codigo_curto };
  } catch(e){
    return { statusCode: 200, body: e.message };
  }
      }
