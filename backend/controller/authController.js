const { User } = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // check username
    let usernameExists = await User.findOne({ username, isDeleted: false });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // check email
    let emailExists = await User.findOne({ email, isDeleted: false });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create new user
    user = new User({
      username,
      email,
      password, // الباسورد هيتعمله هاش في الموديل قبل ما يتخزن في الداتا بيز
      role: "user", // كل اللي هيسجلوا من خلال الريجيستر هيكونوا يوزرز عاديين، مش أدمنز
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isDeleted: false }).select(
      "+password",
    ); // عشان نجيب الباسورد مع بيانات المستخدم عشان نتحقق منهم
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password); // عشان نتحقق من الباسورد اللي دخلها المستخدم مع الباسورد اللي في الداتا بيز
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateAccessToken(); // عشان نولد توكن

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token,
    }); // نرجع بيانات المستخدم مع التوكن
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const me = async (req, res) => {
  try {
    res.status(200).json({ user: req.user }); // يعني ارسال بيانات المستخدم الذي تم التحقق منه
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// refresh token
// const refreshTokenHandler = async (req, res) => {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//         return res.status(400).json({ message: "Refresh token is required" });
//     }

//     try {
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); // عشان نتحقق من صحة الريفرش توكن
//         const user = await User.findById(decoded._id).select('+refreshToken'); // عشان نجيب بيانات المستخدم مع الريفرش توكن

//         if (!user || user.refreshToken !== refreshToken) {
//             return res.status(401).json({ message: "Invalid refresh token" });
//         }

//         const newAccessToken = user.generateAccessToken(); // عشان نولد توكن جديد

//         res.json({ accessToken: newAccessToken });
//     } catch (error) {
//         res.status(401).json({ message: "Invalid refresh token" });
//     }
// };

// logout
// const logout = async (req, res) => {
//     const { refreshToken } = req.body;

//     try {
//         const user = await User.findOne({refreshToken}).select('+refreshToken'); // عشان نجيب بيانات المستخدم مع الريفرش توكن
//         if(user){
//             user.refreshToken = null; // عشان نمسح الريفرش توكن من الداتا بيز
//             await user.save();
//         }

//         res.json({ message: "Logged out successfully" });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

module.exports = {
  register,
  login,
  me,
  // refreshTokenHandler,
  // logout
};
