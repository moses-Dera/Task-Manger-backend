const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        secure: true
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'task-manager-uploads',
            resource_type: 'auto',
            public_id: file.originalname.replace(/\.[^/.]+$/, "") + '-' + Date.now(),
        };
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
