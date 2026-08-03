const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl ||!serviceKey) {
      console.error("FALTA CHAVE SUPABASE");
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const uid = event.queryStringParameters?.uid;
    const etiqueta = event.queryStringParameters?.etiqueta;

    if (!uid) return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };

    const { data: pagamento } = await supabase.from('pagamentos').select('uid').eq('uid', uid).limit(1);
    if (!pagamento || pagamento.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
    }

    if (!etiqueta) return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };

    const { data: lista } = await supabase.from('identificacao').select('*').eq('uid', uid).limit(1);

    if (!lista || lista.length === 0) {
      await supabase.from('identificacao').insert({ uid, etiqueta });
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    if (lista[0].etiqueta === etiqueta) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true }) };

  } catch (e) {
    console.error(e);
    return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
  }
};
