// ...
if (text === '/start' || text === '/START') {
  const keyboard = { inline_keyboard: [[{ text: '🔥 LIBERAR ACESSO TESTE - R$1 🔥', callback_data: 'pagar' }]] };
  // ...
}
if (text === 'pagar') {
  const uid = Math.random().toString(36).substring(2, 10);
  const pixRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ value: 100, webhook_url: `${siteUrl}/.netlify/functions/pushinpay-webhook` })
  });
  const pixData = await pixRes.json();
  await supabase.from('pagamentos').insert({ uid: uid, telegram_id: String(chatId), pix_id: pixData.id, status: 'pending', valor: 1 });
  // ...
}
if (text === '/verificar') {
  // ...
  const link = `https://beasantosonlyfans.netlify.app/?uid=${pagamento.uid}`;
  // ...
    }
