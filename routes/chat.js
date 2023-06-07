const router = require("express").Router();

const { accessChat, fetchChats } = require("../controllers/chat");

const { isAuthenticated } = require("../middlewares/auth");

router.route("/").post(isAuthenticated, accessChat);
router.route("/").get(isAuthenticated, fetchChats);

module.exports = router;
