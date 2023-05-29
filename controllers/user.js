const User = require("../models/user");
const Post = require("../models/post");
const Notification = require("../models/notification");

const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { _id } = req.user;
    const { name, username, profilePicture, bio } = req.body;

    const user = await User.findById(_id);

    if (profilePicture && profilePicture !== user.profilePicture) {
      const publicId = user.profilePicture.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`profiles/${publicId}`);

      const uploadedProfile = await cloudinary.uploader.upload(profilePicture, {
        folder: "profiles",
      });

      user.profilePicture = uploadedProfile.secure_url;
    } else if (req.body.deleteProfile) {
      const publicId = user.profilePicture.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`profiles/${publicId}`);

      user.profilePicture = null;
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });

      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Username not available" });
      }

      user.username = username;
    }

    if (name && name !== user.name) {
      user.name = name;
    }

    if (bio && bio !== user.bio) {
      user.bio = bio;
    }

    await user.save();

    res.status(200).json({ success: true, message: "Your profile updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  try {
    const { _id } = req.user;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(_id).select("+password");

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid password" });
    }

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Old password" });
    }

    user.password = newPassword;
    user.save();

    res.status(200).json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { _id } = req.user;

    // find the user and their posts, followers, and following
    const currentUser = await User.findById(_id);
    const followers = currentUser.followers;
    const followings = currentUser.followings;

    // remove the user from their followers' following lists
    await Promise.all(
      followers.map(async (followerId) => {
        const followers = await User.findById(followerId);
        followers.followings.pull(_id);
        await followers.save();
      })
    );

    // remove the user from their following's follower lists
    await Promise.all(
      followings.map(async (followingId) => {
        const followingUser = await User.findById(followingId);
        followingUser.followers.pull(_id);
        await followingUser.save();
      })
    );

    // delete the user's posts and account
    await Promise.all([
      User.findByIdAndDelete(_id),
      Post.deleteMany({ userId: _id }),
    ]);

    // logout user
    res.cookie("token", null, {
      expires: new Date(0),
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "Profile deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// MY PROFILE
exports.myProfile = async (req, res) => {
  try {
    const { _id } = req.user;

    const user = await User.findById(_id).populate(
      "posts followings followers"
    );

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// FIND A USER
exports.findUser = async (req, res) => {
  try {
    const { idOrUsername } = req.params;

    let user;

    if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
      user = await User.findById(idOrUsername).populate(
        "posts followings followers"
      );
    } else {
      user = await User.findOne({ username: idOrUsername }).populate(
        "posts followings followers"
      );
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.posts.reverse();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SEARCH USER
exports.searchUser = async (req, res) => {
  const { q } = req.query;

  try {
    const regex = new RegExp(q, "i");

    const users = await User.find({
      $or: [{ username: regex }, { name: regex }],
    }).select("name username profilePicture");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// FOLLOW USER
exports.followOrUnFollowUser = async (req, res) => {
  const userToFollowId = req.params.id;
  const loggedUserId = req.user._id;

  try {
    const userToFollow = await User.findById(userToFollowId);
    const loggedUser = await User.findById(loggedUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (loggedUser.followings.includes(userToFollowId)) {
      await loggedUser.updateOne({ $pull: { followings: userToFollowId } });
      await userToFollow.updateOne({ $pull: { followers: loggedUserId } });

      res.status(200).json({ message: "User unFollowed!" });
    } else {
      await userToFollow.updateOne({ $push: { followers: loggedUserId } });
      await loggedUser.updateOne({ $push: { followings: userToFollowId } });

      const notification = new Notification({
        recipient: userToFollowId,
        sender: loggedUserId,
        type: "follow",
      });

      await notification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL USERS
exports.suggestedUser = async (req, res) => {
  try {
    const currentUser = req.user; // assuming the current user is available in the request object
    const followings = currentUser.followings.map((user) => user._id);

    const users = await User.aggregate([
      { $match: { _id: { $nin: [currentUser._id, ...followings] } } }, // exclude the current user
      { $sample: { size: 5 } }, // sample 8 users randomly
    ]);

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
