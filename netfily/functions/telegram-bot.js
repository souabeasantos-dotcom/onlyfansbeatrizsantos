// SUA SHARKBOT PRÓPRIA - gera PIX e link único por lead
const { createClient } = require('@supabase/supabase-js');
const TELEGRAM_API = (token) => `https://api.telegram.org/bot${token}`;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function sendMessage(botToken, chatId, text, buttons = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (buttons) payload.reply_markup = { inline_keyboard: buttons };
  await fetch(`${TELEGRAM_API(botToken)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

exports.handler = async (event) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const pushToken = process.env.PUSHINPAY_TOKEN;
  const siteUrl = process.env.SITE_URL;

  try {
    const body = JSON.parse(event.body);
    
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      if (body.callback_query.data === 'gerar_pix') {
        const pixRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pushToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            value: 100,
            webhook_url: `${siteUrl}/.netlify/functions/pushinpay-webhook`
          })
        });
        const pixData = await pixRes.json();
        
        await supabase.from('transacoes').insert({
          telegram_id: chatId,
          pix_id: pixData.id,
          status: 'pending'
        });

        await sendMessage(botToken, chatId, `🔥 *Pague R$1,00 para liberar:*\n\nPIX Copia e Cola:\n\`${pixData.qr_code}\``);
        await fetch(`${TELEGRAM_API(botToken)}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: pixData.qr_code_base64 ? `data:image/png;base64,${
