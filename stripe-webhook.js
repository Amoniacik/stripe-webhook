const stripe = require('stripe')('YOUR_SECRET_KEY'); // Nahradiť tvojím Stripe Secret Key
const nodemailer = require('nodemailer'); // Na odosielanie e-mailov

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'YOUR_WEBHOOK_SECRET'; // Nahradiť tvojím Webhook Secret

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.log('Webhook error: ', err.message);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    // Ak platba bola úspešná, odošleme e-mail
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Definovanie e-mailu
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-email-password', // Používaj environment variables pre lepšiu bezpečnosť
        },
      });

      const mailOptions = {
        from: 'info@tvojadomena.sk',
        to: paymentIntent.receipt_email,
        subject: 'Hello World',
        text: 'Hello World',
      };

      try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('E-mail bol odoslaný');
      } catch (error) {
        console.error('Chyba pri odosielaní e-mailu: ', error);
        res.status(500).send('Chyba pri odosielaní e-mailu');
      }
    } else {
      res.status(200).send('Udalosť nie je platba');
    }
  } else {
    res.status(405).send('Metóda zakázaná');
  }
}
