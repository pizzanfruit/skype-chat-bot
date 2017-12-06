let express = require("express");
let builder = require("botbuilder");

let jishoDialog = require("./dialogs/jisho")
let remindMeDialog = require("./dialogs/remindme")

let inMemoryStorage = new builder.MemoryBotStorage();
let app = express();

app.use(express.static(__dirname + '/static'));

app.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log("Listening");
});

// Create chat connector for communicating with the Bot Framework Service
let connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
app.post("/api/messages", connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
let bot = new builder.UniversalBot(connector, function (session) {
  let text = session.message.text;
  session.beginDialog("unknown");
}).set('storage', inMemoryStorage);

bot
  .dialog("jisho", jishoDialog())
  .triggerAction({ matches: /^!jisho /i });

bot
  .dialog("remindme", remindMeDialog(builder, bot))
  .triggerAction({ matches: /^!remindme /i });

bot
  .dialog("haha", (session) => { session.send("hihi"); session.endDialog(); })
  .triggerAction({ matches: /haha/i });

bot
  .dialog("greetings", (session) => { session.send("(bye)"); session.endDialog(); })
  .triggerAction({ matches: /(hello|hi)/i });

bot
  .dialog("unknown", function (session) { session.send(":-/"); session.endDialog(); })