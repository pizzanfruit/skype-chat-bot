import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as builder from "botbuilder";

// Firestore setup
admin.initializeApp(functions.config().firebase);
const settings = { timestampsInSnapshots: true };
const db = admin.firestore();
db.settings(settings);
// Bot framework setup
const inMemoryStorage = new builder.MemoryBotStorage();
// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: functions.config().bot.microsoft_app_id,
  appPassword: functions.config().bot.microsoft_app_password
});
const bot = new builder.UniversalBot(connector, function(session) {
  session.beginDialog("unknown");
}).set("storage", inMemoryStorage);

export const logworkReminder = functions.https.onRequest(async (req, res) => {
  const collectionRef = db.collection("logwork-reminder-subscribers");
  const subscribers = [];
  await collectionRef.get().then(snapshot =>
    snapshot.forEach(doc => {
      subscribers.push(doc.data());
    })
  );
  for (const subscriber of subscribers) {
    const msg = new builder.Message().address(subscriber);
    msg.text("Nhớ logwork nhé :)");
    bot.send(msg);
  }

  res.sendStatus(200);
});
