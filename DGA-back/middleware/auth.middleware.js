const jwt = require('jsonwebtoken');

// ดึง JWT_SECRET จาก .env
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
    // 1. ตรวจสอบว่ามี Token ใน Header: Authorization: Bearer [Token]
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(403).json({ error: 'Access Denied: No Token Provided' });
    }

    // 2. แยก Token ออกจาก "Bearer "
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ error: 'Access Denied: Invalid Token Format' });
    }

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