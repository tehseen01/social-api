const Notification = require("../models/notification");

exports.getNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    const notification = await Notification.find({ recipient: userId })
      .sort({
        createdAt: -1,
      })
      .populate("sender", "username profilePicture")
      .populate("post", "img userId");

    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
