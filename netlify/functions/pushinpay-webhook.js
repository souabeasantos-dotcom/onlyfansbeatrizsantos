// netlify/functions/pushinpay-webhook.js - VERSÃO NOVA - SITE DIRETO
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TELEGRAM_API = (token) => `https://api.telegram.org/bot${token}`;

exports.handler = async (event) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const payload = JSON.parse(event.body);
    console.log('Webhook:', payload);

    if (payload.status === 'paid' || payload.status === 'PAID') {
      const pixId = payload.id;
      const { data: transacao } = await supabase.from('transacoes').select('*').eq('pix_id', pixId).single();
      if (!transacao) return { statusCode: 200, body: 'nao achou transacao' };

      const telegram_id = transacao.telegram_id;
      
      // GERA UID CURTO IGUAL AO QUE TESTAMOS
      const uid = crypto.randomBytes(3).toString('hex'); // ex: a8k9p2

      // Salva na tabela que o check-vip.js verifica
      await supabase.from('pagamentos').insert({
        uid: uid,
        telegram_id: telegram_id,
        paid: true
      });

      // Atualiza transacao como paga
      await supabase.from('transacoes').update({ status: 'paid' }).eq('pix_id', pixId);

      // LINK NOVO DIRETO PRO SITE
      const linkPersonalizado = `https://meusaco.netlify.app/?uid=${uid}`;

      await fetch(`${TELEGRAM_API(botToken)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram_id,
          text: `✅ Pagamento aprovado!\n\n🔗 *Seu acesso VIP liberado:*\n${linkPersonalizado}\n\n⚠️ Link pessoal e intransferível.`,
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
