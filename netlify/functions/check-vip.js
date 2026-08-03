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
    const supabase = createClient(supabaseUrl, serviceKey);
    const uid = event.queryStringParameters?.uid;
    const etiqueta = event.queryStringParameters?.etiqueta;

    if (!uid) return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };

    const { data: pagamento } = await supabase.from('pagamentos').select('uid, status').eq('uid', uid).limit(1);
    if (!pagamento || pagamento.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
    }

    // Se já foi expirado manualmente, bloqueia direto
    if (pagamento[0].status === 'expired') {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, expired: true }) };
    }

    if (!etiqueta) return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, expired: false }) };

    const { data: lista } = await supabase.from('identificacao').select('*').eq('uid', uid).limit(1);

    if (!lista || lista.length === 0) {
      const expira = new Date();
      expira.setDate(expira.getDate() + 30);
      await supabase.from('identificacao').insert({
        uid,
        etiqueta,
        primeiro_acesso: new Date().toISOString(),
        expira_em: expira.toISOString()
      });
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, expired: false }) };
    }

    if (lista[0].etiqueta!== etiqueta) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true }) };
    }

    if (lista[0].expira_em) {
      const agora = new Date();
      const expira = new Date(lista[0].expira_em);
      if (agora > expira) {
        // SUA IDEIA AQUI: DESATIVA O UID ANTIGO PRA SEMPRE
        console.log(`UID ${uid} venceu, desativando...`);
        await supabase.from('identificacao').delete().eq('uid', uid);
        await supabase.from('pagamentos').update({ status: 'expired' }).eq('uid', uid);

        return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, expired: true }) };
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, expired: false }) };

  } catch (e) {
    console.error(e);
    return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
  }
};
