const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Nexmo = require('nexmo');

// Initialize Firebase app for database access
admin.initializeApp();

// get Firebase environment variables for Nexmo
const {
  api_key,
  api_secret
} = functions.config().nexmo;

// Initialize Nexmo with application credentials
const nexmo = new Nexmo({
  apiKey: api_key,
  apiSecret: api_secret
});

// This function will serve as the webhook for incoming SMS messages,
// and will log the message into the Firebase Realtime Database
exports.inboundSMS = functions.https.onRequest(async (req, res) => {
  await admin.database().ref('/msgq').push(req.body);
  res.send(200);
});

// This function listens for updates to the Firebase Realtime Database
// and sends a message back to the original sender
exports.sendSMS = functions.database.ref('/msgq/{pushId}')
  .onCreate((message) => {
    const { msisdn, text, to } = message.val();
    // the incoming object - 'msisdn' is the your phone number, and 'to' is the Nexmo number
    // nexmo.message.sendSms(to, msisdn, text);
    return nexmo.message.sendSms(to, msisdn, `You sent the following text: ${text}`, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        if (res.messages[0]['status'] === "0") {
          console.log("Message sent successfully.");
        } else {
          console.log(`Message failed with error: ${res.messages[0]['error-text']}`);
        }
      }
    })
  });

