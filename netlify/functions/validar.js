// netlify/functions/validar.js - TRAVA DE 1 DISPOSITIVO
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const { uid, t, fp } = event.queryStringParameters || {};

  if (!uid || !t) return { statusCode: 403, headers, body: JSON.stringify({ ok: false, msg: 'Link inválido' }) };

  try {
    const { data: acesso } = await supabase.from('acessos').select('*').eq('token', t).eq('telegram_id', uid).single();
    if (!acesso) return { statusCode: 403, headers, body: JSON.stringify({ ok: false, msg: 'Link não encontrado' }) };

    // PRIMEIRO ACESSO - grava o aparelho
    if (!acesso.device_id) {
      await supabase.from('acessos').update({
        device_id: fp,
        first_access: new Date().toISOString()
      }).eq('token', t);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // JÁ VINCULADO - verifica se é o mesmo aparelho
    if (acesso.device_id !== fp) {
      return { statusCode: 403, headers, body: JSON.stringify({ ok: false, msg: '⛔ Este link já está vinculado a outro dispositivo. Cada compra libera apenas 1 aparelho.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, msg: e.message }) };
  }
};
