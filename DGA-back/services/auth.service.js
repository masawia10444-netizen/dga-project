// services/auth.service.js (Session-based)

/**
 * Logic สำหรับการ Logout (ล้าง Session)
 * @param {object} req - Express Request Object
 * @returns {Promise<boolean>} - true หาก Session ถูกล้างสำเร็จ
 */
export const logoutUser = (req) => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve(true); // ไม่มี Session ให้ล้าง ถือว่าสำเร็จ
        }
        
        // ใช้ req.session.destroy() เพื่อล้าง session ทั้งหมด
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction failed:', err);
                return reject(err);
            }
            resolve(true);
        });
    });
};