const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ----------------- CONFIG -----------------
// Pull secrets from Render environment variables
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
// -----------------------------------------

// 1️⃣ Webhook Verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'careopd_verify';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if(mode === 'subscribe' && token === VERIFY_TOKEN){
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2️⃣ Webhook Receiver (incoming messages)
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry;
    if(entry && entry[0].changes) {
      const changes = entry[0].changes[0].value;
      if(changes.messages) {
        const message = changes.messages[0];
        const from = message.from; // sender phone
        const text = message.text ? message.text.body : '';

        console.log('Incoming message:', text, 'from:', from);

        // Send reply
        await sendMessage(from, `Hello! You said: "${text}"`);
      }
    }
    res.sendStatus(200);
  } catch(err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// 3️⃣ Send message function
async function sendMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: message }
      },
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      }
    );
    console.log('Message sent to', to);
  } catch(err) {
    console.error('Error sending message:', err.response?.data || err.message);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
