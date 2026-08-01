import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
export async function handler(event) {
  const token = event.queryStringParameters.token
  const { data } = await supabase.from('acessos').select('*').eq('token', token).single()
  if (!data) {
    return { statusCode: 302, headers: { Location: `https://${process.env.URL_SITE}/negado.html` }, body: '' }
  }
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': `acesso=${token}; Path=/; Max-Age=2592000`,
      'Location': `https://${process.env.URL_SITE}/index.html`
    },
    body: ''
  }
}
