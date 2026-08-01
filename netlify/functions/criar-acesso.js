import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function handler(event) {
  // Pega o ID do Telegram que vem na URL ?telegram_id=123
  const telegram_id = event.queryStringParameters?.telegram_id || event.queryStringParameters?.uid || 'anonimo'
  const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  
  await supabase.from('acessos').insert([{ token, telegram_id: String(telegram_id) }])

  // Já cria o acesso e manda direto pro seu site com cookie
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': `acesso=${token}; Path=/; Max-Age=2592000; SameSite=Lax`,
      'Location': `https://${process.env.URL_SITE}/index.html`
    },
    body: ''
  }
}
