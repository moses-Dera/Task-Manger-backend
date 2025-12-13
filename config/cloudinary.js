const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'task-manager-uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'],
        resource_type: 'auto' // Allow other file types like PDFs
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
