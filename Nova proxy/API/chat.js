export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors() });
  }

  try {
    const body = await req.json();
    const { system, user, model } = body;

    if (!system || !user) {
      return new Response(JSON.stringify({ error: 'Missing system or user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors() },
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || 'Groq error' }), {
        status: groqRes.status,
        headers: { 'Content-Type': 'application/json', ...cors() },
      });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors() },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors() },
    });
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
