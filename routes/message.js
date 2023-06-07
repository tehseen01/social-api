const router = require("express").Router();

const { isAuthenticated } = require("../middlewares/auth");
const { allMessages, sendMessage } = require("../controllers/message");

router.route("/:chatId").get(isAuthenticated, allMessages);
router.route("/").post(isAuthenticated, sendMessage);

module.exports = router;
