const { User } = require('../model/UserModel.js');
const bcrypt = require('bcrypt');
const fs = require('fs'); // fs => للتعامل مع الملفات
const path = require('path');

// crud operations

// create user
const createUser = async (req, res) => {
    try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let profilePicture;
    if (req.file) { // إذا تم تحميل صورة
      profilePicture = `/images/${req.file.filename}`; // حفظ مسار الصورة
    }

    const user = new User({
      username,
      email,
      password,
      role: role || "user", // default to "user" if not provided
      ...(profilePicture && { profilePicture }), // إضافة profilePicture فقط إذا كانت موجودة
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// get all users
const getAllUsers = async (req, res) => {
    try {
    const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 }).select('-password')
    res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get users" });
    }
};

// get single user
const getSingleUser = async (req, res) => {
    const { id } = req.params;

    try {
    const user = await User.findOne({ _id: id, isDeleted: false }).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get user" });
    }
};

// update user
const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
    const { username, email, password, role } = req.body;

    const user = await User.findOne({ _id: id, isDeleted: false }).select("+password"); // find user by id
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
    const existingEmail = await User.findOne({ email, isDeleted: false });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
   }
}

    // تحديث البيانات الأساسية
    user.username = username || user.username; // update username if provided
    user.email = email || user.email; // update email if provided
    // user.role = role || user.role; // update role if provided

    // إذا في صورة جديدة
    if (req.file) {
      // حذف الصورة القديمة من مجلد images (إذا كانت محلية)
      if (user.profilePicture && user.profilePicture.startsWith("/images/")) {
        const oldImagePath = path.join(__dirname, "..", "public", user.profilePicture);
        fs.unlink(oldImagePath, (error) => {
            if (error) {
                console.error("Failed to delete old profile picture:", error);
            }
        });
      }

      // تعيين الصورة الجديدة
      user.profilePicture = `/images/${req.file.filename}`;
    }

    if (password) {
        user.password = password; // سيتم هاش الباسورد في الـ pre-save hook
    }

    const updatedUser = await user.save(); // save updated user

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update user' });
    }
};

// delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user || user.isDeleted) {
    return res.status(404).json({ message: "User not found" });
  }

  // تحقق إذا عنده صورة محلية (يعني تبدأ بـ "/images/")
   if (user.profilePicture && user.profilePicture.startsWith("/images/")) {
       const imagePath = path.join(__dirname, "..", "public", user.profilePicture);
       fs.unlink(imagePath, () => {}); // حذف بدون أي طباعة أو تعامل مع الخطأ
    }

    // بدل ما نحذف المستخدم من الداتا بيز، نعلم أنه محذوف
    user.isDeleted = true;
    await user.save();

    res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// get user profile
const getUserProfile = async (req, res) => {
    try {
    const user = await User.findOne({ _id: req.user._id, isDeleted: false }).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get user profile" });
    }
};

// update password
const updatePassword = async (req, res) => {
  try {
        const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // سيتم هاش الباسورد في الـ pre-save hook
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

module.exports = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    getUserProfile,
    updatePassword
};