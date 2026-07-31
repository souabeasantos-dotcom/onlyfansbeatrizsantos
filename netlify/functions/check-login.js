export async function handler(event) {
  try {
    const phone = (event.queryStringParameters?.phone || '').replace(/\D/g,'');
    const URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_KEY;
    const res = await fetch(`${URL}/rest/v1/pagamentos?phone=eq.${phone}&select=phone`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, token: 'TOKEN-' + phone }) };
    } else {
      return { statusCode: 403, body: JSON.stringify({ ok: false }) };
    }
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
