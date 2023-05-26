const Notification = require("../models/notification");
const Post = require("../models/post");
const User = require("../models/user");
const cloudinary = require("cloudinary").v2;

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    const myCloud = await cloudinary.uploader.upload(req.body.image, {
      folder: "posts",
    });

    const newPost = {
      img: myCloud.secure_url,
      caption: req.body.caption,
      userId: req.user._id,
    };

    const post = await Post.create(newPost);

    const user = await User.findById(req.user._id);
    user.posts.push(post._id);
    await user.save();

    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "User not authorized" });
    }

    post.caption = req.body.caption;
    await post.save();
    res.status(200).json({ success: true, message: "Post updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const getPublicId = post.img.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(`posts/${getPublicId}`);

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { posts: postId } },
      { new: true }
    );

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// LIKE AND DISLIKE POST
exports.likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);
    if (!isLiked) {
      await Post.findByIdAndUpdate(
        postId,
        { $push: { likes: userId } },
        { new: true }
      );

      const notification = new Notification({
        recipient: post.userId,
        sender: userId,
        type: "like",
        post: postId,
      });

      await notification.save();

      res.status(200).json({ message: "Post liked" });
    } else {
      await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      res.status(200).json({ message: "Post disliked" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET A SINGLE POST
exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes userId comments.userId"
    );
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL POSTS
exports.getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const totalPosts = await Post.countDocuments();

    const totalPages = Math.ceil(totalPosts / limit);
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("userId", "name")
      .skip(skip)
      .limit(limit);

    const randomizedPosts = posts.sort(() => Math.random() - 0.5);

    res.status(200).json({
      posts: randomizedPosts,
      page,
      totalPosts,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// USER FEED POSTS
exports.getUserFeedPosts = async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;

  try {
    const user = await User.findById(userId);

    const totalPosts = await Post.countDocuments();

    const totalPages = Math.ceil(totalPosts / limit);
    const skip = (page - 1) * limit;

    // Try to get posts from the user and their followings
    const followingPosts = await Post.find({
      $or: [{ userId }, { userId: { $in: user.followings } }],
    })
      .populate("likes userId comments.userId")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const userFollowings = user.followings;

    const timelinePosts = await Post.find({
      userId: { $nin: [...userFollowings, user._id] },
    })
      .populate("likes userId comments.userId")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const posts = [...followingPosts, ...timelinePosts];

    res.status(200).json({
      posts: posts,
      page: page,
      totalPages: totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
