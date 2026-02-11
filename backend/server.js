const express = require('express');
const connectToDB = require('./config/connectToDB.js');
const cors = require('cors');

require('dotenv').config();

const app = express();

connectToDB();

app.use(cors ({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));

app.use(express.json());

// Define routes
app.get("/", (req, res) => {
  res.send("SmartCart AI API Running...");
});

// start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});