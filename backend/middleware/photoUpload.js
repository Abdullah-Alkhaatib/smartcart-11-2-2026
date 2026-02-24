const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // npm install uuid

// إعداد مكان التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueName);
  },
});

// التحقق من نوع الملف (نسمح فقط بالصور)
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed (jpeg, jpg, png, gif, webp, avif)!",
      ),
    );
  }
}

// إعداد الميدلوير
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
