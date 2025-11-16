import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware: ยืนยัน JWT Access Token
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export const verifyToken = (req, res, next) => { // ⭐️ ใช้ export const เพื่อให้เข้ากับ ES Module
    // 1. ตรวจสอบว่ามี Token ใน Header: Authorization: Bearer [Token]
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Access Denied: No Bearer Token Provided' });
    }

    // 2. แยก Token ออกจาก "Bearer "
    const token = authHeader.split(' ')[1];
    
    // ไม่จำเป็นต้องตรวจสอบ token อีกครั้ง เพราะถูกตรวจสอบใน startsWith('Bearer ') แล้ว
    
    try {
        // 3. ยืนยัน Token (Verify)
        const verified = jwt.verify(token, JWT_SECRET);
        
        // 4. เก็บข้อมูล Payload ไว้ใน Request สำหรับใช้ใน Controller
        req.user = verified; 
        
        next(); // ไปยัง Controller ถัดไป
    } catch (err) {
        // Token หมดอายุ หรือไม่ถูกต้อง
        return res.status(401).json({ error: 'Invalid Token or Token Expired' });
    }
};
// เราเปลี่ยนชื่อฟังก์ชันใน routes/dga.route.js เป็น authMiddleware
// แต่ถ้าฟังก์ชันหลักคือ verifyToken เราควร export มันออกมาเพื่อใช้ใน routes
export const authMiddleware = verifyToken;