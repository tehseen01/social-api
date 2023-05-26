const dotenv = require("dotenv");
const express = require("express");
const { default: helmet } = require("helmet");
const morgan = require("morgan");
const app = express();
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const cloudinary = require("./config/cloudinaryConfig");
const connectDB = require("./connection/connectDB");
const corsMiddleware = require("./middlewares/corsMiddleware");

dotenv.config();

const PORT = process.env.PORT || 8080;

// Middleware setup
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "10mb", extended: false }));
app.use(helmet());
app.use(morgan("common"));

// Routes
app.use("/api/user", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

cloudinary.config();

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    server.listen(PORT, () => {
      console.log(`server is listening ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();

let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://instagram-clone-tehseen01.vercel.app",
    ],
  },
});

io.on("connection", (socket) => {
  socket.on("newUser", ({ userId }) => {
    addNewUser(userId, socket.id);
  });

  socket.on("send", ({ recipient, notification }) => {
    const receiver = getUser(recipient);
    io.to(receiver.socketId).emit("get", notification);
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log("client disconnected");
  });
});
