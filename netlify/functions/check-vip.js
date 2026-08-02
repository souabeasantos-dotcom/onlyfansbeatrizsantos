exports.handler = async (event) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
  const uid = event.queryStringParameters.uid;
  const fp = event.queryStringParameters.fp;
  
  if (!uid) return { statusCode: 400, body: 'uid missing' };

  // 1. Verifica se pagou
  const { data: pagamento } = await supabase.from('pagamentos').select('status').eq('uid', uid).single();
  
  const isPaid = pagamento && pagamento.status === 'paid';
  if (!isPaid) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: false }) };
  }

  // 2. Se não mandou fingerprint (acesso antigo), libera por enquanto
  if (!fp) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true }) };
  }

  // 3. TRAVA DE 1 APARELHO + IP ILIMITADO
  const { data: acessos } = await supabase.from('acessos').select('fingerprint').eq('uid', uid);

  // Primeiro acesso desse uid - salva e libera
  if (!acessos || acessos.length === 0) {
    await supabase.from('acessos').insert({ uid, fingerprint: fp });
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  // Já tem acesso salvo - verifica se é o mesmo aparelho
  const mesmoAparelho = acessos.some(a => a.fingerprint === fp);
  if (mesmoAparelho) {
    // Mesmo celular, mesmo que tenha trocado de WiFi/4G ou limpado cache/anônima
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: false }) };
  }

  // É outro aparelho tentando usar o mesmo link - BLOQUEIA
  if (acessos.length >= 1) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: true }) };
  }

  // Se liberasse 2 aparelhos, cairia aqui - mas como você quer 1 só, já bloqueia acima
  await supabase.from('acessos').insert({ uid, fingerprint: fp });
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, blocked: false }) };
};
