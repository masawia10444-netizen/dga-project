// middleware/auth.middleware.js
export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Unauthorized. Please login first or session expired.' 
        });
    }
};