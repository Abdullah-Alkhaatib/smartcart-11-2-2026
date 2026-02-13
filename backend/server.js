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

app.use('/images', express.static(__dirname + '/public/images')); // عشان نقدر نوصل للصور من خلال المسار /images

// Define routes
const authRoute = require('./routes/authRoute.js');
const userRoute = require('./routes/userRoute.js');
const categoryRoute = require('./routes/categoryRoute.js');
const productRoute = require('./routes/productRoute.js');

app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/products', productRoute);

// start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});