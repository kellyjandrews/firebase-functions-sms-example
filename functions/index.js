const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Nexmo = require('nexmo');

// Initialize Firebase app for database access
admin.initializeApp();

// get Firebase environment variables
const {
  api_key,
  api_secret,
  application_id
} = functions.config().nexmo;

// Initialize Nexmo with application credentials
const nexmo = new Nexmo({
  apiKey: api_key,
  apiSecret: api_secret,
  applicationId: application_id,
  privateKey: './private.key'
});

exports.inboundSMS = functions.https.onRequest(async (req, res) => {
  await admin.database().ref('/msgq').push(req.body);
  res.send(200);
});


exports.sendSMS = functions.database.ref('/msgq/{pushId}')
  .onCreate((message) => {
    const { msisdn, text, to } = message.val();

    nexmo.channel.send(
      { "type": "sms", "number": msisdn },
      { "type": "sms", "number": to },
      {
        "content": {
          "type": "text",
          "text": `You sent the following message: ${text}`
        }
      },
      (err, data) => {
        console.error('Error:', err);
        console.log(data.message_uuid);
      }
    );
  });

