let express = require("express");
let builder = require("botbuilder");
let moment = require("moment");
let schedule = require('node-schedule');

let jishoDialog = require("./dialogs/jisho")

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
  .dialog("jisho", jishoDialog)
  .triggerAction({ matches: /^!jisho /i });

bot
  .dialog("remindme", (session) => {
    let text = session.message.text;
    let regexp = /(\d+) (seconds|minutes|hours|days|second|minute|hour|day) "(.+)"/gi;
    let matches = regexp.exec(text);
    if (matches && matches.length != 4) {
      session.send("Wrong reminder format :( Please try again.")
      session.endDialog();
      return;
    }
    let time = moment().utc().add(matches[1], matches[2]);
    let diff = time.diff(moment().utc());
    if (diff < 9500 || diff > 3600000) {
      if (diff < 9500) session.send(time.fromNow(true) + " is too soon from now >_< Try a later time!");
      else session.send(time.fromNow(true) + " is too far in the future >_< Try a nearer time!");
      session.endDialog();
      return;
    }
    session.send("Roger! Your reminder will be sent to you on " + time.format("MMMM Do YYYY, h:mm:ss A") + " (UTC Time)  :D");
    let reminderTime = time.toDate();
    let audioCard = new builder.AudioCard(session)
      .autoloop(true)
      .autostart(true)
      .title(matches[3])
      .media([
        { url: 'https://kukuklok.com/audio/guitar.mp3' }
      ])
    let j = schedule.scheduleJob(reminderTime, function () {
      sendProactiveMessage(session.message.address, audioCard);
    });
    session.endDialog();
  })
  .triggerAction({ matches: /^!remindme /i });

bot
  .dialog("haha", (session) => { session.send("hihi"); session.endDialog(); })
  .triggerAction({ matches: /haha/i });

bot
  .dialog("greetings", (session) => { session.send("(bye)"); session.endDialog(); })
  .triggerAction({ matches: /(hello|hi)/i });

bot
  .dialog("unknown", function (session) { session.send(":-/"); session.endDialog(); })

function sendProactiveMessage(address, audioCard) {
  let msg = new builder.Message().address(address);
  msg.text("Hey! I'm here to remind you like I promised ;)");
  msg.addAttachment(audioCard);
  bot.send(msg);
}