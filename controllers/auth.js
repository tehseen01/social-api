const User = require("../models/user");
const { sendEmail } = require("../middlewares/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

//@description     Registration of user
//@route           POST /api/auth/register
//@access          Protected
exports.register = async (req, res) => {
  try {
    // get user information from request body
    const { name, username, email, password } = req.body;

    //check if user is already registered
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const defaultProfile =
      "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg";
    const uploadCloud = await cloudinary.uploader.upload(defaultProfile, {
      folder: "profiles",
    });
    const profilePicture = uploadCloud.secure_url;

    // create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      profilePicture,
    });

    await user.save();

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      sameSite: "none",
      secure: true,
      httpOnly: true,
    };

    res.status(201).cookie("token", token, options).json({ user, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
    console.log(err);
  }
};

//@description     Login user
//@route           POST /api/auth/login
//@access          Protected
exports.login = async (req, res) => {
  try {
    // Get user information from request body
    const { usernameOrEmail, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }

    const validPassword = await user.matchPassword(password);
    if (!validPassword) {
      return res.status(400).json({ message: "wrong password" });
    }

    await user.save();

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      sameSite: "none",
      secure: true,
      httpOnly: true,
    };

    res.status(200).cookie("token", token, options).json({ user, token });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//@description     Logout user
//@route           GET /api/auth/logout
//@access          Protected
exports.logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(0),
        sameSite: "none",
        secure: true,
        httpOnly: true,
      })
      .json({ success: true, message: "logged out" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

//@description     Forgot password
//@route           POST /api/auth/forgot/password
//@access          Protected
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is already resetting their password
    if (user.resetPasswordExpire && user.resetPasswordExpire < Date.now()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
    }

    const resetPasswordToken = await user.generateResetPasswordToken();

    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/password/reset/${resetPasswordToken}`;

    const message = `Reset your password by clicking the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset your password",
        message,
      });

      res
        .status(200)
        .json({ success: true, message: `Email sent to ${user.email}` });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      console.error(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//@description     Reset password
//@route           PUT /api/auth/password/reset/:token
//@access          Not Protected
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or expired. Please try again",
      });
    }

    if (!req.body.password) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password",
      });
    }

    // Add password validation here

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "password updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later",
    });
  }
};
