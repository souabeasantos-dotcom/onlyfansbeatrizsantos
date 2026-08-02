// netlify/functions/check-vip.js - TABELA IDENTIFICACAO NOVA
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

  const uid = event.queryStringParameters?.uid;
  const etiqueta = event.queryStringParameters?.etiqueta;

  if (!uid) return { statusCode: 400, headers, body: JSON.stringify({ paid: false }) };

  // MODO TESTE - libera mesmo sem pagamento pra testar
  // Depois a gente volta a checar pagamentos
  let pago = true;

  if (!etiqueta) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: pago, blocked: false }) };
  }

  const { data: lista, error } = await supabase.from('identificacao').select('*').eq('uid', uid);
  if (error) console.log('ERRO SELECT:', error);

  if (!lista || lista.length === 0) {
    const { error: errInsert } = await supabase.from('identificacao').insert({ uid, etiqueta });
    if (errInsert) console.log('ERRO INSERT:', errInsert);
    return { statusCode: 200, headers, body: JSON.stringify({ paid: pago, blocked: false }) };
  }

  const salvo = lista[0].etiqueta;
  if (salvo === etiqueta) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: pago, blocked: false }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ paid: pago, blocked: true }) };
};
