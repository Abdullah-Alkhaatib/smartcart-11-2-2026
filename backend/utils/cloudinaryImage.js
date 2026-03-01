const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const uploadImageBuffer = (file, options = {}) => {
  if (!file || !file.buffer) {
    throw new Error("No image buffer provided");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(file.buffer);
  });
};

const getCloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    if (uploadIndex === -1) return null;

    let publicIdSegments = segments.slice(uploadIndex + 1);
    const versionIndex = publicIdSegments.findIndex((segment) =>
      /^v\d+$/.test(segment),
    );

    if (versionIndex !== -1) {
      publicIdSegments = publicIdSegments.slice(versionIndex + 1);
    }

    if (publicIdSegments.length === 0) return null;

    const lastIndex = publicIdSegments.length - 1;
    publicIdSegments[lastIndex] = publicIdSegments[lastIndex].replace(
      /\.[^/.]+$/,
      "",
    );

    return publicIdSegments.join("/");
  } catch (error) {
    return null;
  }
};

const deleteLocalImage = (url) => {
  if (!url || typeof url !== "string") return;

  let fileName = "";
  if (url.startsWith("/images/")) {
    fileName = url.replace("/images/", "");
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    fileName = url;
  }

  if (!fileName) return;

  const imagePath = path.join(__dirname, "..", "public", "images", fileName);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

const deleteImageByUrl = async (url) => {
  if (!url || typeof url !== "string") return;

  const isLocalPath =
    url.startsWith("/images/") ||
    (!url.startsWith("http://") && !url.startsWith("https://"));

  if (isLocalPath) {
    deleteLocalImage(url);
    return;
  }

  const publicId = getCloudinaryPublicIdFromUrl(url);
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = {
  uploadImageBuffer,
  deleteImageByUrl,
  getCloudinaryPublicIdFromUrl,
};
