// netlify/functions/check-vip.js - TRAVA FINAL 1 APARELHO
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  
  // TEM QUE SER SERVICE_ROLE, não ANON
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
  );
  
  const uid = event.queryStringParameters?.uid;
  const fp = event.queryStringParameters?.fp;

  if (!uid) return { statusCode: 400, headers, body: JSON.stringify({ paid: false, msg: 'uid missing' }) };

  let { data: pagamento } = await supabase.from('pagamentos').select('status').eq('uid', uid).single();
  if (!pagamento) {
    const r = await supabase.from('pagamentos').select('status').eq('pix_id', uid).single();
    pagamento = r.data;
  }

  if (!pagamento || pagamento.status !== 'paid') {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: false }) };
  }

  if (!fp || fp === 'undefined') {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, no_fp: true }) };
  }

  const { data: lista, error: errSelect } = await supabase.from('acessos').select('fingerprint').eq('uid', uid);
  if(errSelect) console.log('ERRO SELECT ACESSOS:', errSelect);

  if (!lista || lista.length === 0) {
    const { error: errInsert } = await supabase.from('acessos').insert({ uid, fingerprint: fp });
    if(errInsert) {
      console.log('ERRO INSERT ACESSOS:', errInsert);
      // retorna erro pra você ver no Network
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, insert_error: errInsert.message }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  const mesmo = lista.some(a => a.fingerprint === fp);
  if (mesmo) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true, msg: '⛔ Este link já está vinculado a outro aparelho.' }) };
};
