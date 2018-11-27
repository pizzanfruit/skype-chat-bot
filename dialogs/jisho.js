let rest = require("../utils/rest");

module.exports = function() {
  let jisho = [];
  jisho.push(getMoreResult);
  return jisho;
};

function getMoreResult(session) {
  let prevResult = session.dialogData.result;
  if (prevResult) {
    if (session.message.text.search(/\bmore\b/i) < 0) {
      session.endConversation();
      return;
    }
    index = ++session.dialogData.index;
    if (!index) index = 1;
    printResult(session, prevResult, index);
  } else {
    getFirstResult(session);
  }
}

function getFirstResult(session) {
  let text = session.message.text;
  let jishoIndex = text.search(/!jisho /i);
  let word = session.message.text.slice(7 + jishoIndex);
  let options = {
    host: "jisho.org",
    port: 80,
    path: "/api/v1/search/words?keyword=" + encodeURIComponent(word),
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };
  session.send(" Wait a sec, I'm looking for it...");
  rest.getJSON(options, function(statusCode, result) {
    session.dialogData.result = result;
    console.log("statusCode");
    console.log(statusCode);
    if (statusCode == 200) printResult(session, result, 0, word);
    else {
      session.send("I think the server is down...");
      session.endConversation();
      return;
    }
  });
}

function printResult(session, result, index, word = null) {
  let data = result.data[index];
  if (!data) {
    if (index != 0) {
      session.send("Sorry, that's it. There's no more result :(");
      session.endConversation();
      return;
    }
    session.send("Sorry, I couldn't find anything about **" + word + "**");
    session.endConversation();
    return;
  }
  let res = "";
  let tags = data.tags;
  let japanese = data.japanese;
  let senses = data.senses;
  if (result) {
    // Readings
    if (japanese && japanese.length > 0)
      res +=
        "**Reading(s):** " +
        japanese
          .map(it => {
            if (it.word)
              return it.word + (it.reading ? "(" + it.reading + ")" : "");
            else return it.reading;
          })
          .join("、 ") +
        "\n\n";
    // Definitions
    if (senses && senses.length > 0) res += "**Definition(s):** " + "\n\n";
    for (let i = 0; i < senses.length; i++) {
      let english = senses[i].english_definitions;
      let pos = senses[i].parts_of_speech;
      if (senses.length > 1) res += i + 1 + ". ";
      if (pos && pos.lenght > 0) {
        res += pos.map(it => "_" + it + "_").join(", ");
        res += ": ";
      }
      if (english && english.length > 0) res += english.join(", ");
      res += "\n";
    }
    // Tags
    if (tags && tags.length > 0) res += "\n**Tag(s):** " + tags.join(", ");
    session.send(res);
  }
}
