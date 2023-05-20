const router = require("express").Router();
const { addComment, deleteComment } = require("../controllers/comment");
const {
  createPost,
  updatePost,
  deletePost,
  likePost,
  getSinglePost,
  getAllPosts,
  getUserFeedPosts,
} = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");

// Get all posts and crate post
router
  .route("/")
  .get(isAuthenticated, getAllPosts)
  .post(isAuthenticated, createPost);

// Update a post and delete
router
  .route("/:id")
  .put(isAuthenticated, updatePost)
  .delete(isAuthenticated, deletePost);

//Like and dislike a post
router.put("/like/:id", isAuthenticated, likePost);

//Add comments
router
  .route("/comment/:id")
  .post(isAuthenticated, addComment)
  .delete(isAuthenticated, deleteComment);

// Get single posts
router.route("/post/:id").get(isAuthenticated, getSinglePost);

// get user feed posts
router.get("/feed", isAuthenticated, getUserFeedPosts);

module.exports = router;
