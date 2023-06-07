const Chat = require("../models/chat");
const User = require("../models/user");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = req.user._id;

    if (!userId) {
      res.status(400).json({ success: false, error: "Invalid userId" });
    }

    const existingChat = await Chat.findOne({
      participants: { $all: [currentUser, userId] },
    })
      .populate("participants", "name profilePicture username")
      .populate("latestMessage")
      .populate("latestMessage.sender", "name profilePicture username");

    if (!existingChat) {
      // Create a new chat if it doesn't exist
      const participants = [currentUser, userId];
      const newChat = await Chat.create({ participants });

      await newChat.populate("participants", "name profilePicture username");

      return res.status(201).json({ chat: newChat });
    }

    // Return the existing chat
    return res.status(200).json({ chat: existingChat });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: { $in: [req.user._id] } })
      .populate("participants", "name profilePicture username")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name profilePicture username",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
