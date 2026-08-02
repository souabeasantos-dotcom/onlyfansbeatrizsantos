// netlify/functions/check-vip.js - VERSÃO BLINDADA
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Se for OPTIONS (preflight) libera
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!SUPABASE_URL ||!SUPABASE_KEY) {
      console.error('FALTA VARIAVEL DE AMBIENTE');
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, warning: 'sem env var' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const uid = event.queryStringParameters?.uid;
    const etiqueta = event.queryStringParameters?.etiqueta;

    if (!uid) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false, blocked: false }) };
    }

    if (!etiqueta) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    const { data: lista, error } = await supabase.from('identificacao').select('*').eq('uid', uid);

    if (error) {
      console.error('ERRO SUPABASE SELECT:', error);
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    if (!lista || lista.length === 0) {
      const { error: errInsert } = await supabase.from('identificacao').insert({ uid, etiqueta });
      if (errInsert) console.error('ERRO INSERT:', errInsert);
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    const salvo = lista[0].etiqueta;
    if (salvo === etiqueta) {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: true }) };

  } catch (e) {
    console.error('ERRO GERAL check-vip:', e);
    // Nunca trava a tela, libera o acesso se der erro
    return { statusCode: 200, headers, body: JSON.stringify({ paid: true, blocked: false, error: e.message }) };
  }
};
