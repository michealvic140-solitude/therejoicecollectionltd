import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the AI Concierge for "The Rejoice Collection" — a premium luxury fashion e-commerce platform based in the Philippines. You are a REAL, helpful AI assistant similar to Temu's AI assistant.

YOUR CAPABILITIES:
1. **General Assistance**: You can help with ANY question — not just fashion. If users ask general knowledge questions, math, directions, advice, etc., help them.
2. **Platform Guide**: Explain how the platform works — shopping, cart, checkout, vault (exclusive members-only products), orders, account management.
3. **Product Help**: Recommend products, explain sizing, categories (Watches, Bags, Jewelry, Accessories, Footwear, Clothes), and product details.
4. **Order Support**: Help with order tracking, returns (7-day policy, original condition), refunds (5-7 business days).
5. **Shipping**: Nationwide PH shipping. Standard: 3-5 days. Express: 1-2 days. Free shipping above ₱2,000.
6. **Payment**: GCash, Maya, bank transfer, COD accepted.
7. **Account Help**: Guide users on creating accounts, updating profiles, resetting passwords, viewing order history.

IMPORTANT BEHAVIORS:
- Be warm, professional, and concise. Use emojis sparingly but naturally.
- If a user seems frustrated, confused, or explicitly asks to talk to a human/admin/support agent, respond with the EXACT phrase "[ESCALATE_TO_ADMIN]" at the END of your message (after your helpful response). This will notify the admin team.
- If you don't know something specific about the platform, be honest and offer to connect them with the admin team.
- For product recommendations, suggest browsing the Shop page or specific categories.
- The Vault section is for exclusive/limited items available to registered members only.
- Currency is Philippine Peso (₱).

PLATFORM PAGES:
- Home (/): Featured products, announcements, categories
- Shop (/shop): Browse all products with category filters and search
- Vault (/vault): Exclusive members-only products
- Cart (/cart): Shopping cart
- Orders (/orders): Order history
- Profile (/profile): Account settings
- Chat (/chat): Direct message to support team

Keep responses concise (2-4 sentences for simple questions, more for complex ones). Be helpful, not robotic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting a lot of requests right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-concierge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
