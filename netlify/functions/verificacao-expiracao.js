const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const agora = new Date().toISOString();

  // 1. Pega todos que venceram
  const { data: vencidos } = await supabase
   .from('identificacao')
   .select('uid')
   .lt('expira_em', agora);

  if (!vencidos || vencidos.length === 0) {
    return { statusCode: 200, body: 'Nenhum vencido' };
  }

  const uids = vencidos.map(v => v.uid);

  // 2. Muda o pagamento pra expired pra não liberar mais no /verificar
  await supabase.from('pagamentos').update({ status: 'expired' }).in('uid', uids);

  // 3. Opcional: apaga da identificacao ou deixa lá como histórico
  // await supabase.from('identificacao').delete().in('uid', uids);

  console.log(`Expirados: ${uids.join(', ')}`);
  return { statusCode: 200, body: `Expirados: ${uids.length}` };
};
