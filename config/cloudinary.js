const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

if (process.env.CLOUDINARY_URL) {
    // Validate URL format to prevent crashes with unclear errors
    if (!process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
        console.error('❌ ERROR: Invalid CLOUDINARY_URL environment variable.');
        console.error('   It must start with "cloudinary://".');
        console.error('   Format: cloudinary://<api_key>:<api_secret>@<cloud_name>');
        // Attempt to fix it if it's just missing the protocol (common copy-paste error)
        if (!process.env.CLOUDINARY_URL.includes('://')) {
            console.log('   Attempting to auto-fix by adding cloudinary:// prefix...');
            process.env.CLOUDINARY_URL = `cloudinary://${process.env.CLOUDINARY_URL}`;
        }
    }

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

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = { cloudinary, upload };
