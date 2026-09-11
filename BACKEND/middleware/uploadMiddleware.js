const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Target directory: BACKEND/uploads/scrap
const uploadDir = path.join(__dirname, "../uploads/scrap");

// Ensure target directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `scrap-${uniqueSuffix}${ext}`);
    }
});

// File validation filter: allow JPG, JPEG, PNG, and WEBP
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /^\.(jpg|jpeg|png|webp)$/i;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    const ext = path.extname(file.originalname).toLowerCase();
    const isExtValid = allowedExtensions.test(ext);
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);

    if (isExtValid && isMimeValid) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
};

// Multer upload instance (5MB file size limit)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

// Reusable middleware wrapper to catch and format multer errors cleanly as JSON
const uploadScrapImage = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File size exceeds the 5MB limit"
                });
            }
            return res.status(400).json({
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                message: err.message
            });
        }

        next();
    });
};

module.exports = {
    uploadScrapImage,
    uploadDir
};
