export async function handler(event) {
  const phone = (event.queryStringParameters?.phone || '').replace(/\D/g,'');
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!URL || !KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ ok: false, msg: "Falta configurar SUPABASE_URL ou SERVICE_KEY na Netlify" }) 
    };
  }

  try {
    const res = await fetch(`${URL}/rest/v1/pagamentos?phone=eq.${phone}&select=phone`, {
      headers: { 
        'apikey': KEY, 
        'Authorization': `Bearer ${KEY}` 
      }
    });
    
    const data = await res.json();

    if (data && data.length > 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, token: 'TOKEN-' + phone }) };
    } else {
      return { statusCode: 200, body: JSON.stringify({ ok: false, msg: `Número ${phone} não encontrado no banco` }) };
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, msg: "Erro Supabase: " + e.message }) };
  }
}
