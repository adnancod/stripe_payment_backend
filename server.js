const express= require('express')
const Stripe = require('stripe')
const cors= require('cors')
require('dotenv').config()

const app= express();
const stripe= Stripe(process.env.STRIPE_SECRET_KEY)
const port= 3000;

app.use(cors())
app.use(express.json())

app.post('/create-payment-intent', async(req, res) => {
    try {
        console.log("Request body:", req.body);
        const{amount}= req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
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

app.listen(port, () => console.log(`Server running on port ${port}...`));