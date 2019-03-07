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

const reminders = [
  "Nhớ logwork nhé :)",
  "Quên logwork là không có xèng đâu :-S",
  "Lại quên logwork đúng không x-(?",
  "Hôm nay logwork chưa thế :-?"
];

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
    const randomReminder = randomValueFromArray(reminders);
    msg.text(`${randomReminder} --> https://insight.fsoft.com.vn/jira`);
    bot.send(msg);
    console.log(subscriber);
  }
  res.sendStatus(200);
});

function randomValueFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
