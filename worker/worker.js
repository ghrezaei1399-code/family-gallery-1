/**
 * Family Gallery API - Dr. Rezaei
 * Handlers: AI Chat (Houshyar), Public/Private Messages, Media Registry
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      // 1. Health & Ping
      if (url.pathname === "/" || url.pathname === "/api/ping") {
        return new Response(JSON.stringify({ status: "online", system: "Family Gallery Core" }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // 2. Chat with Houshyar (AI)
      if (url.pathname === "/api/ai/chat" && request.method === "POST") {
        const body = await request.json();
        const userPrompt = body.prompt || body.message || "";

        const systemPrompt = "شما «هوشیار»، مشاور خردمند، راوی و همراه امین خاندان رضائی هستید. با لحنی محترمانه، عاطفی، حکیمانه و در کمال ادب خانوادگی به فارسی پاسخ دهید. دکتر رضائی (بابا رضا) را با نهایت احترام و تکریم مخاطب قرار دهید.";

        const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        });

        return new Response(JSON.stringify({ reply: aiResponse.response }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // 3. Messages & Memory Cloud Store (KV)
      // GET: Retrieve all messages (public & private)
      if (url.pathname === "/api/messages" && request.method === "GET") {
        const data = await env.REZAEI_DATA.get("messages_store", { type: "json" });
        return new Response(JSON.stringify(data || { public: [], private: {}, media: [] }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // POST: Save or append messages / media
      if (url.pathname === "/api/messages" && request.method === "POST") {
        const payload = await request.json();
        let current = await env.REZAEI_DATA.get("messages_store", { type: "json" }) || { public: [], private: {}, media: [] };

        if (payload.type === "public") {
          current.public.unshift(payload.entry);
          if (current.public.length > 200) current.public.pop(); // keep latest 200
        } else if (payload.type === "private") {
          const target = payload.target;
          if (!current.private[target]) current.private[target] = [];
          current.private[target].unshift(payload.entry);
        } else if (payload.type === "media") {
          current.media.unshift(payload.entry);
        }

        await env.REZAEI_DATA.put("messages_store", JSON.stringify(current));

        return new Response(JSON.stringify({ success: true, updated: current }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
  }
};
