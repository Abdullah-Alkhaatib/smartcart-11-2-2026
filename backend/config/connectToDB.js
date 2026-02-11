const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB ^_^");

    } catch (error) {
        console.error("Error connecting to MongoDB: ", error);
        process.exit(1); // Exit process with failure
    }
}

module.exports = connectToDB;