const router = require("express").Router();
const { getNotifications } = require("../controllers/notification");
const {
  updateProfile,
  deleteUser,
  followOrUnFollowUser,
  findUser,
  updatePassword,
  myProfile,
  searchUser,
  suggestedUser,
} = require("../controllers/user");
const { isAuthenticated } = require("../middlewares/auth");

// My Profile
router.get("/me", isAuthenticated, myProfile);

// Notifications
router.get("/me/notification", isAuthenticated, getNotifications);

// update profile
router.put("/update/profile", isAuthenticated, updateProfile);

// Update password
router.put("/update/password", isAuthenticated, updatePassword);

// delete user
router.delete("/delete/me", isAuthenticated, deleteUser);

// get a user
router.get("/:idOrUsername", isAuthenticated, findUser);

// Get all users
router.get("/random/u", isAuthenticated, suggestedUser);

// follow Or unFollow user
router.put("/follow/:id", isAuthenticated, followOrUnFollowUser);

// Search user
router.get("/", isAuthenticated, searchUser);

module.exports = router;
