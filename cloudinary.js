const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
// The SDK will automatically pick up the CLOUDINARY_URL from the environment
cloudinary.config({
  secure: true, // Use HTTPS
});

module.exports = cloudinary;

console.log('Cloudinary configured.');
if (!process.env.CLOUDINARY_URL) {
  console.error('********************************************************************************');
  console.error('ERROR: CLOUDINARY_URL is not defined. Please check your .env file.');
  console.error('********************************************************************************');
  process.exit(1);
}