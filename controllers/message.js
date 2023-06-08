const Message = require("../models/message");
const Chat = require("../models/chat");
const { default: mongoose } = require("mongoose");
const pusher = require("../config/pusher");

//@description     Get all Messages
//@route           GET /api/Message/chatId
//@access          Protected
exports.allMessages = async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.isValidObjectId(chatId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid chatId",
    });
  }

  try {
    const messages = await Message.find({ chat: chatId })
      .populate({
        path: "sender",
        select: "name profilePicture username",
        model: "User",
      })
      .populate({
        path: "chat",
        populate: {
          path: "participants",
          select: "name profilePicture username",
          model: "User",
        },
      })
      .exec();

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data passed into request" });
    }

    const messageData = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(messageData);

    message = await Message.findById(message._id)
      .populate([
        {
          path: "sender",
          select: "name profilePicture username",
          model: "User",
        },
        { path: "chat" },
        { path: "chat.participants", select: "name profilePicture username" },
      ])
      .exec();

    await Chat.findByIdAndUpdate(chatId, {
      $set: { latestMessage: message },
    });

    await pusher.trigger("chat", "new-message", message);

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
