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

// GET FOLLOWING POST
exports.getFollowingPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);

    const posts = await Post.find({
      $or: [{ userId }, { userId: { $in: user.followings } }],
    }).populate("likes userId comments.userId");

    res.status(200).json({ success: true, posts: posts.reverse() });
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
const DEFAULT_PAGE_SIZE = 10; // number of posts per page

exports.getAllPosts = async (req, res) => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, random = true } = req.query;

  try {
    // Get the total number of posts
    const totalPosts = await Post.countDocuments();

    // Calculate the number of pages based on the page size and total posts
    const totalPages = Math.ceil(totalPosts / pageSize);

    // Calculate the number of posts to skip based on the requested page
    const postsToSkip = (page - 1) * pageSize;

    let posts;

    if (random) {
      // If "random" query param is truthy, select posts randomly
      posts = await Post.aggregate([
        { $sample: { size: pageSize } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            "userId.name": { $arrayElemAt: ["$user.name", 0] },
          },
        },
        { $project: { user: 0 } },
      ]);
    } else {
      // Otherwise, select posts in order
      posts = await Post.find()
        .populate("userId")
        .sort({ createdAt: -1 })
        .skip(postsToSkip)
        .limit(pageSize);
    }

    res.status(200).json({
      posts,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TIMELINE POST
exports.timelinePost = async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id);
    const userFollowings = user.followings;

    const posts = await Post.find({
      userId: { $nin: [...userFollowings, user._id] },
    }).populate("likes userId comments.userId");

    res.status(200).json(posts.reverse());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
