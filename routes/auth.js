const router = require("express").Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");
const { isAuthenticated } = require("../middlewares/auth");

//REGISTER
router.post("/register", register);

//LOGIN
router.post("/login", login);

// LOGOUT
router.get("/logout", isAuthenticated, logout);

// FORGOT PASSWORD
router.route("/forgot/password").post(forgotPassword);

// RESET PASSWORD
router.route("/password/reset/:token").put(isAuthenticated, resetPassword);

module.exports = router;
