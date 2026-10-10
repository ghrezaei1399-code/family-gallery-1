export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // تنظیمات سربرگ CORS برای اجازه اتصال از گیت‌هاب پیجز
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // مدیریت درخواست‌های مقدماتی مرورگر (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // مسیر گفت‌وگو با هوش مصنوعی هوشیار
    if (url.pathname === "/api/ai/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const messages = body.messages || [];

        // فراخوانی مدل Llama 3.3 70B در کلودفلر ورکرز
        const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: messages,
          max_tokens: 1024,
          temperature: 0.7,
        });

        return new Response(JSON.stringify({ reply: response.response }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "خطا در پردازش هوش مصنوعی", details: err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // پاسخ پیش‌فرض برای تست سلامت ورکر
    return new Response(
      JSON.stringify({ status: "active", message: "Family Gallery Worker is running." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  },
};
