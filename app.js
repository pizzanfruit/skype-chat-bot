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
  .triggerAction({ matches: /^(hello|hi)/i });

bot
  .dialog("help", (session) => {
    let card = new builder.HeroCard(session);
    card.title("Here's are some stuff I can do");
    card.buttons([
      builder.CardAction.imBack(session, "Hi! :D", "Say hello (bye)"),
      builder.CardAction.postBack(session, "!print-jisho-manual", "JP-EN Dictionary"),
      builder.CardAction.postBack(session, "!print-remindme-manual", "Make a reminder (waiting)")
    ]);
    let msg = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments([card]);
    session.send(msg);
    session.endDialog();
  })
  .triggerAction({ matches: /^help/i });

bot
  .dialog("jisho-manual", function (session) {
    let res = "";
    res += "You can look for a dictionary entry for a English or Japanese phrase.\n\n";
    res += "Here's how you can ask me. Just say this: \n\n";
    res += ">  **!jisho <word>**\n\n";
    res += "I'll send back a dictionary entry in return. You can even ask for more! Just tell me, ok? ;) \n\n";
    res += "\n\n";
    let card = new builder.HeroCard(session);
    card.buttons([
      builder.CardAction.imBack(session, "!jisho これ", "Look up an example Japanese phrase"),
      builder.CardAction.imBack(session, "!jisho program", "Look up an example English phrase"),
    ]);
    let msg = new builder.Message(session)
      .addAttachment(card);
    session.send(res);
    session.send(msg);
    session.endDialog();
  })
  .triggerAction({ matches: /^!print-jisho-manual$/i });

bot
  .dialog("remindme-manual", function (session) {
    let res = "";
    res += "You can ask me to remind you of something later.\n\n";
    res += "It's simple, just say this! \n\n";
    res += "> **!remindme <period of time> \"<your message>\"**\n\n";
    res += "Your message will then be delivered to you, just in time to remind you of your important task! Convenient right? ;)\n\n";
    res += "\n\n";
    let card = new builder.HeroCard(session);
    card.buttons([
      builder.CardAction.imBack(session, "!remindme 10 seconds \"Scrum daily meeting!\"", "Try out an example"),
    ]);
    let msg = new builder.Message(session)
      .addAttachment(card);
    session.send(res);
    session.send(msg);
    session.endDialog();
  })
  .triggerAction({ matches: /^!print-remindme-manual$/i });

bot
  .dialog("unknown", function (session) { session.send(":-/"); session.endDialog(); })