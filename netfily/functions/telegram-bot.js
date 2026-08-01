// netlify/functions/telegram-bot.js - SUA SHARKBOT PRÓPRIA
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
  const siteUrl = process.env.SITE_URL || 'https://beasantosoficial.netlify.app';

  try {
    const body = JSON.parse(event.body);
    
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const data = body.callback_query.data;

      if (data === 'gerar_pix') {
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

        await sendMessage(botToken, chatId, 
          `🔥 *Pague R$1,00 para liberar:*\n\nPIX Copia e Cola:\n\`${pixData.qr_code}\`\n\nOu escaneie o QR Code abaixo. Pagamento libera na hora!`
        );
        
        await fetch(`${TELEGRAM_API(botToken)}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: pixData.qr_code_base64 ? `data:image/png;base64,${pixData.qr_code_base64}` : pixData.qr_code,
            caption: 'Escaneie e pague para liberar seu acesso VIP único 🔓'
          })
        });
      }
      return { statusCode: 200, body: 'ok' };
    }

    if (body.message) {
      const chatId = body.message.chat.id;
      const name = body.message.from.first_name;
      await sendMessage(botToken, chatId,
        `Oi, ${name}! 🔥\n\nBem-vinda ao acesso VIP da Bea.\n\nSeu acesso será *100% único e vinculado ao seu aparelho*.\n\nClique abaixo para liberar por R$1,00:`,
        [[{ text: '🔓 LIBERAR ACESSO R$1,00', callback_data: 'gerar_pix' }]]
      );
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: 'error' };
  }
};
