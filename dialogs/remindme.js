let moment = require('moment');
let schedule = require('node-schedule');

module.exports = function (builder, bot) {
    remindme = [];
    remindme.push(setReminder);
    return remindme;

    function setReminder(session) {
        let text = session.message.text;
        console.log(text);
        let regexp = /(\d+) (seconds|minutes|hours|days|second|minute|hour|day) "(.+)"/gi;
        let matches = regexp.exec(text);
        if (!matches || matches.length != 4) {
            session.send("Wrong reminder format :( Please try again.")
            session.endConversation();
            return;
        }
        let time = moment().utc().add(matches[1], matches[2]);
        let diff = time.diff(moment().utc());
        if (diff < 9500 || diff > 3600000) {
            if (diff < 9500) session.send(time.fromNow(true) + " is too soon from now >_< Try a later time!");
            else session.send(time.fromNow(true) + " is too far in the future >_< Try a nearer time!");
            session.endConversation();
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
            sendAudioMessage(session.message.address, audioCard);
        });
        session.endConversation();
    }

    function sendAudioMessage(address, audioCard) {
        let msg = new builder.Message().address(address);
        msg.text("Hey! I'm here to remind you like I promised ;)");
        msg.addAttachment(audioCard);
        bot.send(msg);
    }
}