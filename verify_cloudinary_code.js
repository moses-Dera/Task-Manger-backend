require('dotenv').config();

try {
    console.log('Loading config/cloudinary.js...');
    const cloudinaryConfig = require('./config/cloudinary');
    console.log('✅ config/cloudinary.js loaded successfully.');

    console.log('Loading controllers/userController.js...');
    const userController = require('./controllers/userController');
    console.log('✅ controllers/userController.js loaded successfully.');

    console.log('Loading controllers/chatController.js...');
    const chatController = require('./controllers/chatController');
    console.log('✅ controllers/chatController.js loaded successfully.');

    console.log('Loading routes/tasks.js...');
    // routes/tasks.js requires models which require mongoose connection or at least definition.
    // It also uses middleware. This might be tricky to load in isolation if it connects to DB immediately.
    // But usually routes just define the router.
    const taskRoutes = require('./routes/tasks');
    console.log('✅ routes/tasks.js loaded successfully.');

    console.log('\nAll modified files loaded without syntax errors.');

} catch (error) {
    console.error('❌ Error loading files:', error);
    process.exit(1);
}
