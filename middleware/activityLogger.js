const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to log user activities
 * @param {string} action - The action being performed
 */
const logActivity = (action) => {
    return async (req, res, next) => {
        try {
            // Only log if user is authenticated
            if (req.user) {
                const company = req.user.company || req.user.currentCompany;

                const log = new ActivityLog({
                    user_id: req.user._id,
                    action: action,
                    details: `${req.method} ${req.originalUrl}`,
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('user-agent'),
                    company: company ? company.toString() : 'unknown'
                });

                // Save asynchronously without blocking the request
                log.save().catch(err => {
                    console.error('Failed to log activity:', err);
                });
            }

            next();
        } catch (error) {
            // Don't fail the request if logging fails
            console.error('Activity logging error:', error);
            next();
        }
    };
};

/**
 * Helper function to manually log an activity
 * @param {Object} user - User object
 * @param {string} action - Action performed
 * @param {string} details - Additional details
 */
const createActivityLog = async (user, action, details = '') => {
    try {
        const company = user.company || user.currentCompany;

        const log = new ActivityLog({
            user_id: user._id || user.userId,
            action: action,
            details: details,
            company: company ? company.toString() : 'unknown'
        });

        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to create activity log:', error);
        return null; // Return null instead of throwing to prevent blocking the main flow
    }
};

module.exports = { logActivity, createActivityLog };
