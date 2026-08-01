exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: 'Bot online - use POST from Telegram' };
  }
  try {
    if (!event.body) {
      return { statusCode: 200, body: 'ok' };
    }
    const body = JSON.parse(event.body);
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const siteUrl = process.env.SITE_URL || 'https://beasantosonlyfans.netlify.app';
    
    const message = body.message || body.callback_query?.message;
    if (!message) return { statusCode: 200, body: 'ok' };
    
    const chatId = body.message ? body.message.chat.id : body.callback_query.message.chat.id;
    const text = body.message ? body.message.text : body.callback_query.data;
    
    if (text === '/start' || text === '/START') {
      const keyboard = {
        inline_keyboard: [[
          { text: '🔥 LIBERAR MEU ACESSO - R$10 🔥', callback_data: 'pagar' }
        ]]
      };
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Bem-vinda ao VIP da Bea Santos!\n\nClique abaixo para liberar seu acesso completo por apenas R$10:',
          reply_markup: keyboard
        })
      });
    }
    
    if (text === 'pagar') {
      const uid = Math.random().toString(36).substring(2, 10);
      
      // Cria cobrança na PushinPay
      const pixRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          value: 1000,
          webhook_url: `${siteUrl}/.netlify/functions/pushinpay-webhook`
        })
      });
      
      const pixData = await pixRes.json();
      
      await supabase.from('pagamentos').insert({
        uid: uid,
        telegram_id: String(chatId),
        pix_id: pixData.id,
        status: 'pending',
        valor: 10
      });
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `💳 PIX gerado!\n\nCopia e cola no seu banco:\n\n\`${pixData.qr_code || pixData.pix_qrcode}\`\n\nApós pagar, digite /verificar`,
          parse_mode: 'Markdown'
        })
      });
    }
    
    if (text === '/verificar') {
      const { data } = await supabase.from('pagamentos').select('*').eq('telegram_id', String(chatId)).order('created_at', { ascending: false }).limit(1).single();
      
      if (data && data.status === 'paid') {
        const link = `${siteUrl}/vip.html?uid=${data.uid}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Pagamento confirmado!\n\nSeu acesso VIP:\n${link}`
          })
        });
      } else {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Ainda não identificamos seu pagamento. Aguarde 1 minuto e tente /verificar de novo.'
          })
        });
      }
    }
    
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: 'ok' };
  }
};
