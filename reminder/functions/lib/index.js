"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const builder = require("botbuilder");
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
const bot = new builder.UniversalBot(connector, function (session) {
    const text = session.message.text;
    session.beginDialog("unknown");
}).set("storage", inMemoryStorage);
exports.logworkReminder = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    const collectionRef = db.collection("logwork-reminder-subscribers");
    const subscribers = [];
    yield collectionRef.get().then(snapshot => snapshot.forEach(doc => {
        subscribers.push(doc.data());
    }));
    for (const subscriber of subscribers) {
        const msg = new builder.Message().address(subscriber);
        msg.text("Nhớ logwork nhé :)");
        console.log("msg.data");
        console.log(msg.data);
        bot.send(msg);
    }
    res.sendStatus(200);
}));
//# sourceMappingURL=index.js.map