const dotenv = require("dotenv");
const express = require("express");
const { default: helmet } = require("helmet");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const messageRoutes = require("./routes/message");
const chatRoutes = require("./routes/chat");
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
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

cloudinary.config();

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(PORT, () => {
      console.log(`server is listening ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
