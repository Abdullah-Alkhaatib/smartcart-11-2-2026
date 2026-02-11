const mongoose = require("mongoose");

module.exports = (req, res, next) => {

const {id} = req.params; // api/users/:id => id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)){// إذا كان الـ id غير صالح
        return res.status(400).json({message: "Invalid user ID"});
    }
        next();
};