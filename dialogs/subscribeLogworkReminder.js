const admin = require("firebase-admin");
const serviceAccount = require("../credentials/ServiceAccountCredentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const SUBSCRIBERS_LIMIT = 20;

var db = admin.firestore();
module.exports = function() {
  let subscribe = [];
  subscribe.push(subscribeLogworkReminder);
  return subscribe;
};

async function subscribeLogworkReminder(session) {
  const address = session.message.address;
  if (!address || !address.user || !address.user.id)
    console.error("Invalid user address format: ", address);
  delete address.conversation;
  const collectionRef = db.collection("logwork-reminder-subscribers");
  const currentSubscribersSnapshot = await collectionRef.get();
  if (currentSubscribersSnapshot.size >= SUBSCRIBERS_LIMIT) {
    session.send(
      `Sorry, hiện tại giới hạn ${SUBSCRIBERS_LIMIT} người đăng ký thôi nhé :(`
    );
    session.endConversation();
    return;
  }
  let alreadyExisted = false;
  currentSubscribersSnapshot.forEach(doc => {
    if (doc.id === address.user.id) alreadyExisted = true;
  });
  if (alreadyExisted) {
    session.send(`Đăng ký sẵn rồi nhé :D`);
    session.endConversation();
    return;
  }
  collectionRef
    .doc(address.user.id)
    .set(address)
    .then(writeResult => {
      session.send(`Đăng ký remind logwork thành công! ^_^`);
      session.endConversation();
      console.log(
        `Document written at: ${writeResult.toDate()} to logwork-reminder-subscribers collection.`
      );
    });
}
