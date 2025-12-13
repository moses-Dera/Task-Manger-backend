require('dotenv').config();

try {
    console.log('Attempting to require cloudinary...');
    const cloudinary = require('cloudinary').v2;
    console.log('Cloudinary required.');

    console.log('Attempting to require multer-storage-cloudinary...');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    console.log('Multer-storage-cloudinary required.');

    console.log('Attempting to load config/cloudinary.js...');
    const config = require('./config/cloudinary');
    console.log('Config loaded.');

} catch (error) {
    console.error('ERROR:', error.message);
    console.error('STACK:', error.stack);
}
