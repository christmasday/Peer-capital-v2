const crypto = require('crypto');

// === FILL IN YOUR ACTUAL PAYSTACK SECRET KEY HERE ===
const PAYSTACK_SECRET_KEY = '';

// === DO NOT CHANGE BELOW THIS LINE ===

const WEBHOOK_URL = 'https://peercapital.com.ng/api/webhooks/paystack';

const payload = {
  event: "charge.success",
  data: {
    amount: 100000, // 1000.00 NGN in kobo
    currency: "NGN",
    reference: "PC-091917-3580",
    customer: {
      // You can add more customer details if you want, but it's optional for your handler
    },
    metadata: {
      user_id: "",
      transaction_id: "",
      payment_method: "Paystack"
    },
    channel: "card"
  }
};

const bodyString = JSON.stringify(payload);
const signature = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(bodyString).digest('hex');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-paystack-signature': signature
  },
  body: bodyString
})
  .then(res => res.json())
  .then(data => {
    console.log('Webhook response:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  }); 