/**
 * Rezaei Family Gallery Worker - Production Backend
 * 1. AI Chat ("Houshyar") via Cloudflare Workers AI (@cf/meta/llama-3.3-70b-instruct)
 * 2. Persistent Storage (Messages & Activity) via Cloudflare KV (REZAEI_DATA)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // 1. Health check
      if (pathname === '/health' || pathname === '/') {
        return jsonResponse({
          ok: true,
          service: 'rezaei-family-worker',
          status: 'online',
          kv_connected: Boolean(env.REZAEI_DATA),
          ai_connected: Boolean(env.AI),
          timestamp: new Date().toISOString()
        });
      }

      // 2. AI Chat Endpoint (Houshyar)
      if (pathname === '/api/ai/chat' && request.method === 'POST') {
        if (!env.AI) {
          return jsonResponse({ error: 'موتور هوش مصنوعی در سرور فعال نیست.' }, 500);
        }

        const body = await request.json().catch(() => ({}));
        let userPrompt = '';

        if (Array.isArray(body.messages) && body.messages.length > 0) {
          const lastMsg = body.messages[body.messages.length - 1];
          userPrompt = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || '');
        } else if (body.prompt) {
          userPrompt = body.prompt;
        } else if (body.message) {
          userPrompt = body.message;
        } else if (body.question) {
          userPrompt = body.question;
        }

        if (!userPrompt.trim()) {
          return jsonResponse({ error: 'متن پیام نمی‌تواند خالی باشد.' }, 400);
        }

        const systemPrompt = `تو «هوشیار» هستی، دستیار هوشمند و همیار باوفای خاندان بزرگ رضائی و همراه دکتر رضائی (بابا رضا).
لحن تو صمیمی، محترمانه، خردمندانه، گرم، تمدنی و امیدبخش است.
به پرسش‌های اعضای خانواده درباره شجره‌نامه، عکس‌ها، تاریخچه خانوادگی و همدلی اعضا با دقت و مهربانی به زبان فارسی پاسخ بده.`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1024,
          temperature: 0.7
        });

        const replyText = aiResponse.response || aiResponse.text || 'پاسخی از مدل دریافت نشد.';

        return jsonResponse({
          success: true,
          reply: replyText,
          response: replyText,
          message: replyText
        });
      }

      // 3. Messages Endpoint (Persistent KV Storage)
      if (pathname === '/api/messages') {
        if (!env.REZAEI_DATA) {
          return jsonResponse({ error: 'پایگاه داده KV متصل نیست.' }, 500);
        }

        // GET: Fetch all persistent messages
        if (request.method === 'GET') {
          const stored = await env.REZAEI_DATA.get('family_messages', 'json');
          return jsonResponse(stored || { public: [], private: {} });
        }

        // POST: Save or append new message
        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const current = (await env.REZAEI_DATA.get('family_messages', 'json')) || { public: [], private: {} };

          if (body.type === 'public') {
            const newMsg = {
              id: 'pub_' + Date.now(),
              from: body.from || 'یکی از اعضای خاندان',
              text: body.text || '',
              time: Date.now()
            };
            if (!current.public) current.public = [];
            current.public.push(newMsg);
            if (current.public.length > 100) current.public = current.public.slice(-100);

            await env.REZAEI_DATA.put('family_messages', JSON.stringify(current));
            return jsonResponse({ success: true, message: newMsg });
          }

          if (body.type === 'private') {
            const target = String(body.target || 'general');
            const newMsg = {
              id: 'priv_' + Date.now(),
              from: body.from || 'من',
              target: target,
              text: body.text || '',
              time: Date.now()
            };
            if (!current.private) current.private = {};
            if (!current.private[target]) current.private[target] = [];
            current.private[target].push(newMsg);
            if (current.private[target].length > 100) current.private[target] = current.private[target].slice(-100);

            await env.REZAEI_DATA.put('family_messages', JSON.stringify(current));
            return jsonResponse({ success: true, message: newMsg });
          }

          return jsonResponse({ error: 'نوع پیام نامعتبر است (باید public یا private باشد).' }, 400);
        }
      }

      return jsonResponse({ error: 'مسیر یافت نشد (Not Found).' }, 404);

    } catch (err) {
      return jsonResponse({ error: 'خطای داخلی سرور', details: err.message }, 500);
    }
  }
};
