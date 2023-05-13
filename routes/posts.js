const router = require("express").Router();
const { addComment, deleteComment } = require("../controllers/comment");
const {
  createPost,
  updatePost,
  deletePost,
  likePost,
  getSinglePost,
  timelinePost,
  getFollowingPosts,
  getAllPosts,
} = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");

// Get all posts
router.get("/", isAuthenticated, getAllPosts);

// Create a post
router.post("/", isAuthenticated, createPost);

// Update a post
router.put("/:id", isAuthenticated, updatePost);

// delete a post
router.delete("/:id", isAuthenticated, deletePost);

//Like and dislike a post
router.put("/like/:id", isAuthenticated, likePost);

//Add comments
router
  .route("/comment/:id")
  .post(isAuthenticated, addComment)
  .delete(isAuthenticated, deleteComment);

// Get following posts
router.route("/followings").get(isAuthenticated, getFollowingPosts);

// Get single posts
router.route("/post/:id").get(isAuthenticated, getSinglePost);

// get timeline posts
router.get("/timeline/all", isAuthenticated, timelinePost);

module.exports = router;
