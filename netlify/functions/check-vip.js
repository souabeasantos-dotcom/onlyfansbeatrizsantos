exports.handler = async (event) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const uid = event.queryStringParameters.uid;
  if (!uid) return { statusCode: 400, body: 'uid missing' };
  const { data } = await supabase.from('pagamentos').select('status').eq('uid', uid).single();
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: data && data.status === 'paid' }) };
};
