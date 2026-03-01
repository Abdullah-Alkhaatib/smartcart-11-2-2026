const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage();

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
