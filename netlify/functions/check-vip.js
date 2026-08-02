exports.handler = async (event) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const uid = event.queryStringParameters.uid;
  const fp = event.queryStringParameters.fp || "teste123";
  
  const { data: acessos, error: errSelect } = await supabase.from('acessos').select('*').eq('uid', uid);
  const { data: inserted, error: errInsert } = await supabase.from('acessos').insert({ uid, fingerprint: fp }).select();

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ 
      uid, fp, 
      acessos, 
      errSelect: errSelect?.message, 
      inserted, 
      errInsert: errInsert?.message,
      envUrl: !!process.env.SUPABASE_URL,
      envKey: !!process.env.SUPABASE_KEY
    }, null, 2)
  };
};
