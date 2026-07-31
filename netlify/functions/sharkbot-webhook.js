export async function handler(event){
  if(event.httpMethod !== 'POST') return {statusCode:200, body:'ok'};
  try{
    const body = JSON.parse(event.body || '{}');
    console.log('SharkBot:', JSON.stringify(body));

    // A SharkBot manda de vários jeitos dependendo da config
    let phone = body.phone || body.telefone || body.customer_phone || body.user_phone || body.data?.phone || '';
    let status = body.status || body.payment_status || 'paid';

    phone = phone.toString().replace(/\D/g,'');
    if(phone.length == 11) phone = '55' + phone;
    if(phone.length < 12) return {statusCode:200, body:'sem telefone'};

    // Só libera se pagou
    const okStatus = ['approved','paid','pago','aprovado','completed','concluido'];
    const s = status.toString().toLowerCase();
    if(!okStatus.includes(s) && s !== 'paid'){
      // Se a SharkBot não mandar status, a gente libera mesmo assim
    }

    const URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_KEY;

    await fetch(`${URL}/rest/v1/pagamentos`,{
      method:'POST',
      headers:{
        'apikey':KEY,
        'Authorization':`Bearer ${KEY}`,
        'Content-Type':'application/json',
        'Prefer':'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        phone: phone,
        status: 'paid',
        created_at: new Date().toISOString()
      })
    });

    return {statusCode:200, body: JSON.stringify({ok:true, phone})};
  }catch(e){
    return {statusCode:500, body:e.message};
  }
      }
