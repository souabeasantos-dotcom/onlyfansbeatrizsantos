// netlify/functions/pushinpay-webhook.js - Gera link único por lead
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TELEGRAM_API = (token) => `https://api.telegram.org/bot${token}`;

exports.handler = async (event) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = process.env.SITE_URL;

  try {
    const payload = JSON.parse(event.body);
    console.log('Webhook PushinPay:', payload);

    if (payload.status === 'paid' || payload.status === 'PAID') {
      const pixId = payload.id;
      const { data: transacao } = await supabase.from('transacoes').select('*').eq('pix_id', pixId).single();
      if (!transacao) return { statusCode: 200, body: 'transacao nao encontrada' };

      const telegram_id = transacao.telegram_id;
      const tokenUnico = crypto.randomBytes(16).toString('hex');

      await supabase.from('acessos').insert({
        token: tokenUnico,
        telegram_id: telegram_id,
        device_id: null,
        created_at: new Date().toISOString()
      });

      await supabase.from('transacoes').update({ status: 'paid' }).eq('pix_id', pixId);

      const linkPersonalizado = `${siteUrl}/vip.html?uid=${telegram_id}&t=${tokenUnico}`;

      await fetch(`${TELEGRAM_API(botToken)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram_id,
          text: `✅ Pagamento aprovado!\n\n🔗 *Seu link único e intransferível:*\n${linkPersonalizado}\n\n⚠️ Este link só funciona no *primeiro aparelho* que abrir. Se compartilhar, será bloqueado.`,
          parse_mode: 'Markdown'
        })
      });
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: 'error' };
  }
};
