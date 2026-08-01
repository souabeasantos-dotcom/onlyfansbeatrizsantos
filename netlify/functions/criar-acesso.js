import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function handler(event) {
  const { telegram_id } = JSON.parse(event.body)
  const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  await supabase.from('acessos').insert([{ token, telegram_id: String(telegram_id) }])
  const link = `https://${process.env.URL_SITE}/.netlify/functions/validar?token=${token}`
  return { statusCode: 200, body: JSON.stringify({ link }) }
                                                     }
