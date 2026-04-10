const express = require("express");
const connectToDB = require("./config/connectToDB.js");
const cors = require("cors");
const helmet = require("helmet"); // إضافة Helmet لتحسين الأمان
const hpp = require("hpp");
const http = require("http");
const { initializeSocket } = require("./config/socket.js");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

connectToDB();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "https://smart-cartt.netlify.app",
  "https://smartcart-11-2-2026.netlify.app",
];

const envAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin (curl/Postman/server-to-server).
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(hpp());

// Define routes
const authRoute = require("./routes/authRoute.js");
const userRoute = require("./routes/userRoute.js");
const categoryRoute = require("./routes/categoryRoute.js");
const productRoute = require("./routes/productRoute.js");
const cartRoute = require("./routes/cartRoute.js");
const contactUsRoute = require("./routes/contactUsRoute.js");
const supportRoute = require("./routes/supportRoute.js");
const orderRoute = require("./routes/orderRoute.js");

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/contact", contactUsRoute);
app.use("/api/support", supportRoute);
app.use("/api/orders", orderRoute);

app.get("/", (req, res) => {
  res.send("SmartCart API is running 🚀");
});

// start the server
const PORT = process.env.PORT || 5000;
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
