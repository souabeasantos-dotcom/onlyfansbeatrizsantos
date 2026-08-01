export async function handler(event) {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const body = JSON.parse(event.body || '{}');
  console.log(JSON.stringify(body).slice(0, 3000));

  const tg = body.data?.customer?.telegram_id?.toString() || null;
  // tenta achar o pix em qualquer lugar do payload
  const raw = JSON.stringify(body);
  const pix_match = raw.match(/000201[0-9A-Z\.\-\s]+/i); // pega o copia e cola
  const transaction_id = body.data?.payment?.id || body.data?.transaction?.id || body.data?.id || null;
  const pix_code = body.data?.payment?.pix_code || body.data?.pix?.code || (pix_match? pix_match[0] : null);

  const payload = {};
  if(tg) payload.telegram_id = tg;
  if(pix_code) payload.pix_codigo = pix_code.slice(-100); // salva os ultimos 100 chars que é o ID unico
  if(transaction_id) payload.pix_codigo = transaction_id; // garante que salva algo
  if(!payload.pix_codigo &&!tg) return { statusCode: 200, body: 'nada pra salvar' };

  await fetch(`${URL}/rest/v1/pagamentos`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  return { statusCode: 200, body: 'ok' };
}
