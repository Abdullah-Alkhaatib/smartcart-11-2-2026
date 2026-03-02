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

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
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
