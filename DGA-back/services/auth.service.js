// services/auth.service.js
export const logoutUser = (req) => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve(true);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction failed:', err);
                return reject(err);
            }
            resolve(true);
        });
    });
};