// netlify/functions/check-vip.js - TRAVA FINAL 1 APARELHO
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const uid = event.queryStringParameters?.uid;
  const fp = event.queryStringParameters?.fp;

  if (!uid) return { statusCode: 400, headers, body: JSON.stringify({ paid: false, msg: 'uid missing' }) };

  // procura tanto por uid quanto por pix_id pra não ter erro
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

  const { data: acessos } = await supabase.from('pagamentos').select('fingerprint').eq('uid', uid); // ops, corrigido abaixo
  const { data: lista } = await supabase.from('acessos').select('fingerprint').eq('uid', uid);

  if (!lista || lista.length === 0) {
    await supabase.from('acessos').insert({ uid, fingerprint: fp });
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  const mesmo = lista.some(a => a.fingerprint === fp);
  if (mesmo) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true, msg: '⛔ Este link já está vinculado a outro aparelho.' }) };
};
