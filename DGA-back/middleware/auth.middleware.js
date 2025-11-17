// middleware/auth.middleware.js (Session-based)

/**
 * Middleware: ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่ (มีข้อมูลใน Session)
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export const isAuthenticated = (req, res, next) => {
    // 1. ตรวจสอบว่ามี object 'user' ใน session หรือไม่
    // ข้อมูลนี้ถูกบันทึกไว้ใน dga.controller.js หลังจากเรียก /api/login สำเร็จ
    if (req.session && req.session.user) {
        // ถ้ามี: อนุญาตให้ไปต่อ
        next();
    } else {
        // ถ้าไม่มี: ส่งสถานะ 401 Unauthorized กลับไป
        console.log('🛑 Access Denied: User not authenticated (No active session).');
        res.status(401).json({ 
            success: false, 
            message: 'Unauthorized. Please login first or session expired.' 
        });
    }
};