let express = require("express");
let builder = require("botbuilder");
var redis = require("redis");

let jishoDialog = require("./dialogs/jisho")
let remindMeDialog = require("./dialogs/remindme")

let inMemoryStorage = new builder.MemoryBotStorage();
let app = express();

let redisOptions = {
  host: process.env.redis_host,
  port: process.env.redis_port,
  password: process.env.redis_password
}

let redisClient = redis.createClient(redisOptions);

app.use(express.static(__dirname + '/static'));

let server = app.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log("Listening");
});

// Create chat connector for communicating with the Bot Framework Service
let connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
app.post("/api/messages", connector.listen());
app.post("/", connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
let bot = new builder.UniversalBot(connector, function (session) {
  let text = session.message.text;
  session.beginDialog("unknown");
}).set('storage', inMemoryStorage);

bot
  .dialog("jisho", jishoDialog())
  .triggerAction({ matches: /!jisho /i });

bot
  .dialog("remindme", remindMeDialog(builder, bot))
  .triggerAction({ matches: /!remindme /i });

bot
  .dialog("haha", (session) => { session.send("hihi"); session.endConversation(); })
  .triggerAction({ matches: /haha\b/i });

bot
  .dialog("greetings", (session) => { session.send("Hi there :)"); session.endConversation(); })
  .triggerAction({ matches: /(hello|hi)\b/i });

bot
  .dialog("redis", (session) => {
    let text = session.message.text;
    console.log("::redis Text: " + text);
    let regexp = /!redis (KEYS|GET) (.+)/i;
    let matches = regexp.exec(text);
    console.log(matches);
    if (!matches || matches.length != 3) {
      session.send("Wrong reminder format :( Please try again.")
      session.endConversation();
      return;
    }
    if (matches[1].toLowerCase() == "keys") {
      redisClient.keys(matches[2], function (err, replies) {
        let res = "I found **" + replies.length + " key(s)**:\n\n";
        replies.forEach(function (reply, i) {
          res += "    " + (i + 1) + ". " + reply + "\n";
        });
        session.send(res);
      });
    } else {
      redisClient.get(matches[2], function (err, reply) {
        if (!reply) session.send("I can't find the key you were looking for :(\n");
        else session.send("The value is: **" + reply + "** :)\n");
      });
    }
  })
  .triggerAction({ matches: /!redis\b/i });

bot
  .dialog("help", (session) => {
    let card = new builder.HeroCard(session);
    card.title("Here are some stuff I can do :)");
    card.buttons([
      builder.CardAction.imBack(session, "Hi! :D", "Say hello"),
      builder.CardAction.imBack(session, "!jisho-manual", "JP-EN Dictionary"),
      builder.CardAction.imBack(session, "!remindme-manual", "Make a reminder"),
      builder.CardAction.imBack(session, "!redis-manual", "Query Redis Cache")
    ]);
    let msg = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments([card]);
    session.send(msg);
    session.endConversation();
  })
  .triggerAction({ matches: /!help\b/i });

bot
  .dialog("jisho-manual", function (session) {
    let res = "";
    res += "You can look for a dictionary entry for a English or Japanese phrase.\n\n";
    res += "Here's how you can ask me. Just say this: \n\n";
    res += "**> !jisho [word]**\n\n";
    res += "I'll send back a dictionary entry in return. You can even ask for more! Just tell me, ok? ;) \n\n";
    res += "\n\n";
    let card = new builder.HeroCard(session);
    card.buttons([
      builder.CardAction.imBack(session, "!jisho これ", "Japanese example"),
      builder.CardAction.imBack(session, "!jisho program", "English example"),
    ]);
    let msg = new builder.Message(session)
      .addAttachment(card);
    session.send(res);
    session.send(msg);
    session.endConversation();
  })
  .triggerAction({ matches: /!jisho-manual$/i });

bot
  .dialog("remindme-manual", function (session) {
    let res = "";
    res += "You can ask me to remind you of something later.\n\n";
    res += "It's simple, just say this! \n\n";
    res += "**> !remindme [period of time] \"[your message]\"**\n\n";
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
    session.endConversation();
  })
  .triggerAction({ matches: /!remindme-manual$/i });

bot
  .dialog("redis-manual", function (session) {
    let res = "";
    res += "I can fetch KEYS and VALUES from a certain redis database.\n\n";
    res += "Just say something like this and you're set! \n\n";
    res += "**> !redis (KEYS|GET) [query content]**\n\n";
    res += "Give it a try!\n\n";
    res += "\n\n";
    let card = new builder.HeroCard(session);
    card.buttons([
      builder.CardAction.imBack(session, "!redis KEYS *", "Query all keys"),
      builder.CardAction.imBack(session, "!redis GET longth", "Query a value"),
    ]);
    let msg = new builder.Message(session)
      .addAttachment(card);
    session.send(res);
    session.send(msg);
    session.endConversation();
  })
  .triggerAction({ matches: /!redis-manual$/i });

bot
  .dialog("goodnight", function (session) {
    let min = 0;
    let max = 9;
    let rand = Math.floor(Math.random() * (max - min + 1)) + min
    let pool = [
      "Good night to you too :)",
      "Sweet dream! ;)",
      "G9 (bye)",
      "Night night :)",
      "Have a sweet dream ^_^",
      "Night~ :)",
      "Good night! :)",
      "Sweet dream~",
      "Oyasumi ;)",
      "You too :D",
    ]
    session.send(pool[rand]);
    session.endConversation();
  })
  .triggerAction({ matches: /(good night|g9$|goodnight)/i });

bot
  .dialog("unknown", function (session) { session.send(":-/"); session.endConversation(); })

function cleanup() {
  server.close(function () {
    console.log("Close out redis");
    redisClient.quit();
    process.exit();
  });

  setTimeout(function () {
    console.error("Could not close connections in time, forcing shut down");
    process.exit(1);
  }, 30 * 1000);
}


process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);