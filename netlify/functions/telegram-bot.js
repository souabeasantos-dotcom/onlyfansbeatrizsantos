exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: 'Bot online - use POST from Telegram' };
  }
  try {
    if (!event.body) return { statusCode: 200, body: 'ok' };
    const body = JSON.parse(event.body);
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const siteUrl = 'https://beasantosonlyfans.netlify.app';
    
    const message = body.message || body.callback_query?.message;
    if (!message) return { statusCode: 200, body: 'ok' };
    const chatId = body.message ? body.message.chat.id : body.callback_query.message.chat.id;
    const text = body.message ? body.message.text : body.callback_query.data;

    if (text === '/start' || text === '/START') {
      const keyboard = { inline_keyboard: [[{ text: '🔥 LIBERAR TESTE - R$1 🔥', callback_data: 'pagar' }]] };
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '👋 Bem-vinda ao VIP da Bea Santos!\n\nTESTE: Clique abaixo para liberar por apenas R$1:', reply_markup: keyboard })
      });
    }

    if (text === 'pagar') {
      const uid = Math.random().toString(36).substring(2, 10);
      const pixRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ value: 100, webhook_url: `${siteUrl}/.netlify/functions/pushinpay-webhook` })
      });
      const pixData = await pixRes.json();
      console.log('PIX GERADO:', pixData);
      await supabase.from('pagamentos').insert({ uid: uid, telegram_id: String(chatId), pix_id: pixData.id, status: 'pending', valor: 1 });
      await supabase.from('transacoes').insert({ pix_id: pixData.id, telegram_id: String(chatId), status: 'pending' });
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `💳 PIX TESTE R$1 gerado!\n\nCopia e cola no seu banco:\n\n\`${pixData.qr_code || pixData.qr_code_text || pixData.pix_qrcode}\`\n\nApós pagar, digite /verificar`, parse_mode: 'Markdown' })
      });
    }

    if (text === '/verificar') {
      const { data: pagamento } = await supabase.from('pagamentos').select('*').eq('telegram_id', String(chatId)).order('created_at', { ascending: false }).limit(1).single();
      if (!pagamento) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: '❌ Nenhum pagamento encontrado. Gere um PIX primeiro com /start' })
        });
        return { statusCode: 200, body: 'ok' };
      }
      let pago = false;
      try {
        const checkRes = await fetch(`https://api.pushinpay.com.br/api/transactions/${pagamento.pix_id}`, {
          headers: { 'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`, 'Accept': 'application/json' }
        });
        const checkData = await checkRes.json();
        if (checkData.status === 'paid' || checkData.status === 'approved' || checkData.paid === true) pago = true;
      } catch (e) {}
      if (pago || pagamento.status === 'paid') {
        await supabase.from('pagamentos').update({ status: 'paid' }).eq('uid', pagamento.uid);
        const link = `${siteUrl}/?uid=${pagamento.uid}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: `✅ Pagamento de R$1 confirmado!\n\nSeu acesso VIP:\n${link}` })
        });
      } else {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: '❌ Ainda não identificamos seu pagamento. Aguarde 1 minuto e tente /verificar de novo.' })
        });
      }
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: 'ok' };
  }
};
