// netlify/functions/check-vip.js - TRAVA GAVETA / ETIQUETA
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
  );

  const uid = event.queryStringParameters?.uid;
  const etiqueta = event.queryStringParameters?.etiqueta;

  if (!uid) return { statusCode: 400, headers, body: JSON.stringify({ paid: false, msg: 'uid missing' }) };

  // 1. VERIFICA SE PAGOU
  let { data: pagamento } = await supabase.from('pagamentos').select('status').eq('uid', uid).single();
  if (!pagamento) {
    const r = await supabase.from('pagamentos').select('status').eq('pix_id', uid).single();
    pagamento = r.data;
  }
  if (!pagamento || pagamento.status!== 'paid') {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: false }) };
  }

  if (!etiqueta) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, no_etiqueta: true }) };
  }

  // 2. TESTE DA TABELA ACESSOS - com etiqueta
  const { data: lista, error: errSelect } = await supabase.from('acessos').select('*').eq('uid', uid);
  if(errSelect) console.log('ERRO SELECT ACESSOS:', errSelect);

  // PRIMEIRO ACESSO - salva e libera
  if (!lista || lista.length === 0) {
    const { error: errInsert } = await supabase.from('acessos').insert({
      uid,
      etiqueta: etiqueta,
      fingerprint: etiqueta, // compatibilidade com sua tabela antiga
      visitor_id: etiqueta
    });
    if(errInsert) {
      console.log('ERRO INSERT ACESSOS:', errInsert);
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, insert_error: errInsert.message }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  // JÁ TEM DONO - verifica se é o mesmo aparelho
  const salvo = lista[0].etiqueta || lista[0].fingerprint || lista[0].visitor_id;
  const mesmo = salvo === etiqueta;

  if (mesmo) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  // OUTRO APARELHO - BLOQUEIA AUTOMATICO
  return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true }) };
};
