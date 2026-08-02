exports.handler = async (event) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const uid = event.queryStringParameters.uid;
  const fp = event.queryStringParameters.fp;
  if (!uid) return { statusCode: 400, body: 'uid missing' };
  const { data: pagamento } = await supabase.from('pagamentos').select('status').eq('uid', uid).single();
  if (!pagamento || pagamento.status !== 'paid') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: false }) };
  }
  if (!fp) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true }) };
  }
  const { data: acessos } = await supabase.from('acessos').select('fingerprint').eq('uid', uid);
  if (!acessos || acessos.length === 0) {
    await supabase.from('acessos').insert({ uid, fingerprint: fp });
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: false }) };
  }
  const mesmo = acessos.some(a => a.fingerprint === fp);
  if (mesmo) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: false }) };
  }
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: true }) };
};
