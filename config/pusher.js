const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1613621",
  key: "faf59d87efe6da6caecc",
  secret: "cc279f8040f08d686f43",
  cluster: "ap2",
  useTLS: true,
});

module.exports = pusher;
