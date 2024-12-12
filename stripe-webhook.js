const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');  // Používame knižnicu na generovanie PDF

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    const event = req.body;

    try {
      const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

      // Verifikácia webhooku
      stripe.webhooks.constructEvent(event, sig, endpointSecret);

      // Spracovanie udalosti 'payment_intent.succeeded'
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Generovanie PDF
        const doc = await PDFDocument.create();
        const page = doc.addPage([600, 400]);
        const { width, height } = page.getSize();
        const font = await doc.embedFont(PDFDocument.Font.Helvetica);
        const text = `Invoice for Payment ID: ${paymentIntent.id}\nAmount: ${(paymentIntent.amount_received / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`;

        page.drawText(text, {
          x: 50,
          y: height - 100,
          size: 12,
          font,
        });

        const pdfBytes = await doc.save();

        // Uloženie PDF na server alebo odoslanie cez email (prípadne ukladanie do cloud storage)
        const fs = require('fs');
        fs.writeFileSync(`/tmp/invoice_${paymentIntent.id}.pdf`, pdfBytes);

        res.status(200).send('Webhook processed and PDF generated.');
      } else {
        res.status(400).send(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.log('Error handling webhook:', err);
      res.status(500).send('Webhook Error');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}

