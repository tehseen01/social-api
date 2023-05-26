// middlewares/corsMiddleware.js
const cors = require("cors");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://instagram-clone-tehseen01.vercel.app",
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

module.exports = cors(corsOptions);
