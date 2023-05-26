const Notification = require("../models/notification");
const Post = require("../models/post");
const User = require("../models/user");

//  ADD COMMENTS ON POST
exports.addComment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { comment } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
    }

    const addedComment = {
      userId: _id,
      comment: comment,
      date: new Date(),
    };

    post.comments.push(addedComment);
    post.comments.reverse();
    await post.save();

    const notification = new Notification({
      recipient: post.userId,
      sender: _id,
      type: "comment",
      post: post._id,
      comment: comment,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment,
    });
  } catch (err) {
    res.status(500).json({
      success: true,
      message: err.message,
    });
  }
};

// DELETE COMMENTS
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
    }

    const { commentId } = req.body;
    const userId = req.user._id.toString();

    let commentIndex;

    // Checking if owner of the post want to delete the comment
    if (post.userId.toString() === userId) {
      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "Comment Id is required",
        });
      }

      commentIndex = post.comments.findIndex(
        (comment) => comment._id.toString() === commentId.toString()
      ); // Find index of comment in post.comments array

      if (commentIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      post.comments.splice(commentIndex, 1);

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Selected comment successfully deleted",
      });
    } else {
      // Checking if owner of the comment want to delete the comment
      if (commentId) {
        commentIndex = post.comments.findIndex(
          (comment) => comment._id.toString() === commentId.toString()
        ); // Find index of comment in post.comments array

        if (commentIndex === -1) {
          return res
            .status(404)
            .json({ success: false, message: "Comment not found" });
        }
      } else {
        commentIndex = post.comments.findIndex(
          (comment) => comment.userId.toString() === userId
        ); // Find index of comment in post.comments array

        if (commentIndex === -1) {
          return res
            .status(404)
            .json({ success: false, message: "Comment not found" });
        }
      }

      post.comments.splice(commentIndex, 1);

      await post.save();

      return res
        .status(200)
        .json({ success: true, message: "Comment deleted successfully" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
