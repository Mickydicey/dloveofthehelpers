// api/initialize-payment.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({
      error: "Payment system not configured",
      details: "Missing PAYSTACK_SECRET_KEY in Vercel environment variables",
    });
  }

  try {
    const { amount, purpose, email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({
        error: "Could not initialize payment",
        details: "Email is required",
      });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return res.status(400).json({
        error: "Could not initialize payment",
        details: "Invalid amount. Minimum is 1",
      });
    }

    // Paystack expects amount in kobo (NGN * 100)
    const amountInKobo = Math.round(numericAmount * 100);

    const reference =
      "dlove-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);

    const payload = {
      email,
      amount: amountInKobo,
      currency: "NGN", // ✅ use NGN for testing
      reference,
      callback_url: "https://dloveofthehelpers.vercel.app/success.html",
      metadata: {
        donor_name: name || "Anonymous",
        donation_purpose: purpose || "General Donation",
        cancel_action:
          "https://dloveofthehelpers.vercel.app/success.html?status=cancelled",
      },
    };

    const psRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await psRes.json();

    // Helpful debug (view in Vercel logs)
    console.log("Paystack initialize response:", data);

    if (!data.status || !data.data?.authorization_url) {
      return res.status(400).json({
        error: "Could not initialize payment",
        details: data?.message || "Paystack returned an error",
        raw: data, // useful while testing; you can remove later
      });
    }

    return res.status(200).json({
      status: "success",
      payment_link: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("Initialize payment error:", err);
    return res.status(500).json({
      error: "Server error. Please try again.",
      details: err.message,
    });
  }
}