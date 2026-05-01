import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ScrollText } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — The Rejoice Collection" },
      { name: "description", content: "Refund policy, store policy, and platform terms & conditions for The Rejoice Collection." },
      { property: "og:title", content: "Terms & Conditions — The Rejoice Collection" },
      { property: "og:description", content: "Refund, store and platform terms & conditions." },
    ],
  }),
});

const DEFAULT_TERMS = `# Terms & Conditions

_Last updated: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}_

Welcome to **The Rejoice Collection**. By using our website, mobile experience, AI Concierge, or making a purchase, you agree to the following terms. Admin can update these terms at any time from the Admin Settings page.

---

## 1. Refund Policy

1.1 We accept refund requests within **7 days of delivery** for items that arrive damaged, defective, or significantly different from what was advertised.

1.2 To request a refund, open your order in the **Orders** page and click *Request Refund*, or ask the AI Concierge — it can submit the request for you.

1.3 Refunds are reviewed by admin in the following stages and you can track progress in real time:
- **Reviewing Payment** — admin verifying the original payment
- **Refund In Progress** — admin has approved and started the transfer
- **Escalating Refund** — case has been escalated for higher review
- **Refunded** — funds have been sent back to your account
- **Refund Denied** — refund was not approved (a reason is provided)

1.4 Refunds are paid back to the original bank account used for payment, in **Nigerian Naira (₦)**, within **5–10 business days** after approval.

1.5 The following are **not refundable**: items damaged by the customer, items returned without the original packaging, hygiene-sensitive products (innerwear, earrings), and items from the **Vault** unless faulty.

---

## 2. Orders & Payments

2.1 All prices are quoted and charged in **Nigerian Naira (₦)**.

2.2 Payments are made by **Bank Transfer** to the account details shown at checkout. You must upload a clear payment proof (screenshot or photo) so admin can verify and confirm your order.

2.3 Orders move through the following statuses, and you'll receive a notification at each step: *Pending Payment → Payment Confirmed → Processing → Shipped → Delivered*.

2.4 We reserve the right to decline any order, and you'll be notified with the reason. Declined payments can be re-uploaded.

---

## 3. Shipping & Delivery

3.1 We deliver nationwide across Nigeria. Standard delivery is **3–7 business days**, express is **1–3 business days**.

3.2 Free shipping applies to orders above **₦50,000**.

3.3 You can track every delivery from the **Orders** page — the timeline shows every status update with a timestamp.

3.4 Risk passes to you on delivery. You are responsible for providing an accurate delivery address, LGA, state and a reachable phone number.

---

## 4. Vault — Members-Only Products

4.1 The **Vault** contains exclusive products available to registered members only.

4.2 Vault items are limited stock and may have separate refund rules — refer to the product page.

---

## 5. Promotions, Coupons & Spin Wheel

5.1 Promo codes, coupons and spin-wheel rewards are valid for the period stated and have no cash value.

5.2 We reserve the right to cancel a promotion if abuse is detected (e.g. multiple accounts).

5.3 Discounts and countdown timers shown on product cards are real-time. When the timer reaches zero, the discount automatically ends.

---

## 6. Account Security

6.1 You must be at least **18 years old** to create an account.

6.2 Keep your password safe. You are responsible for all activity under your account.

6.3 We will never ask for your password by email, WhatsApp or chat.

---

## 7. AI Concierge

7.1 Our AI Concierge can help you place orders, request refunds, cancel pending orders, and answer policy questions. It is trained on this terms document and on knowledge curated by admin.

7.2 For sensitive issues, the AI will hand you over to a human admin. You can also ask for a human at any time.

7.3 The AI may make mistakes. For binding decisions (refund approval, payment status), only admin actions are final.

---

## 8. Privacy

8.1 We collect your name, contact details, address, and order history to fulfil orders. We do not sell your data.

8.2 You can update or remove your data from the **Profile** page or by contacting admin.

---

## 9. Acceptable Use

9.1 No fraudulent payments, fake reviews, harassment of staff or other users, or attempts to bypass platform security.

9.2 We may restrict or close any account that violates these terms — affected users are notified with a reason.

---

## 10. Changes to These Terms

10.1 Admin may update these terms at any time. The latest version is always available on this page.

10.2 Continued use of the platform after an update means you accept the new terms.

---

## 11. Contact

For any questions about these terms, please use the **Contact** page or email us. The AI Concierge can also help you understand any clause.
`;

function TermsPage() {
  const [content, setContent] = useState<string>(DEFAULT_TERMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "terms_and_conditions").maybeSingle()
      .then(({ data }) => {
        if (data?.value && data.value.trim().length > 0) setContent(data.value);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ScrollText className="h-8 w-8 text-gold" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-gold">Terms & Conditions</h1>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <article className="glass-card rounded-2xl p-6 sm:p-10 prose prose-invert prose-headings:font-display prose-headings:text-gradient-gold prose-a:text-gold max-w-none text-sm sm:text-base leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
