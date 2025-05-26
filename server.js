const express= require('express')
const Stripe = require('stripe')
const cors= require('cors')
require('dotenv').config()

const app= express();
const stripe= Stripe(process.env.STRIPE_SECRET_KEY)
const port= 3000;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.use(cors())

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next(); // skip JSON parsing for webhook route
  } else {
    express.json()(req, res, next); // parse JSON for other routes
  }
});

app.post('/create-payment-intent', async(req, res) => {
    try {
        console.log("Request body:", req.body);
        const{amount}= req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods:{
                enabled: true
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        })
        
    } catch (error) {
        console.log('Error: ', error)
        res.status(500).send({ error: error.message })
    }
})


//////
//Webhooks
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.sendStatus(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('✅ Payment succeeded for:', paymentIntent.id);
    // ✅ Mark order as paid in your DB here
  }else{
    const failedIntent = event.data.object;
    console.log('❌ Payment failed:', failedIntent);
  }

  res.sendStatus(200);
});

app.listen(port, () => console.log(`Server running on port ${port}...`));