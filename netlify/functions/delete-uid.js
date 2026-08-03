const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const uid = event.queryStringParameters?.uid;
  if (!uid) return { statusCode: 400, headers, body: '{"error":"sem uid"}' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  await supabase.from('identificacao').delete().eq('uid', uid);
  await supabase.from('pagamentos').delete().eq('uid', uid);
  return { statusCode: 200, headers, body: '{"ok":true}' };
};
