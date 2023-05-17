const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const { default: helmet } = require("helmet");
const mongoose = require("mongoose");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const cloudinary = require("cloudinary").v2;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 8080;

mongoose.set("strictQuery", false);

const connectDB = (url) => {
  console.log("connected");
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Middleware
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://instagram-clone-tehseen01.vercel.app/",
  ],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
    "Accept",
  ],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "10mb", extended: false }));
app.use(helmet());
app.use(morgan("common"));

// Routes
app.use("/api/user", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

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
