const authService = require('../services/auth.service'); // ใช้ Service Layer ใหม่

/**
 * @desc รับ ConsumerKey และ AgentID จาก Query, ConsumerSecret จาก Header
 * เพื่อทำการตรวจสอบสิทธิ์และสร้าง Access Token
 * @route GET /auth/validate?ConsumerKey=[KEY]&AgentID=[ID]
 */
exports.getAccessToken = async (req, res) => {
    try {
        // 1. รับค่า Input (ตรวจสอบจากภาพ: Consumer-Key, AgentID, ConsumerSecret)
        const consumerKey = req.query['Consumer-Key']; // Case-sensitive (ใช้ชื่อตามภาพ)
        const agentId = req.query.AgentID;
        const consumerSecret = req.header('ConsumerSecret');
        const contentType = req.header('Content-Type'); // ไม่ได้ใช้ในการประมวลผล แต่ควรรับไว้

        // 2. ตรวจสอบ Input เบื้องต้น (Validation)
        if (!consumerKey || !agentId || !consumerSecret) {
            return res.status(400).json({
                error: 'Missing required parameters: Consumer-Key, AgentID, and ConsumerSecret are required.'
            });
        }

        // 3. ส่งต่อให้ Service Layer จัดการ Business Logic
        const accessToken = await authService.validateAndGenerateToken(
            consumerKey,
            agentId,
            consumerSecret
        );

        // 4. ส่ง Response กลับตามรูปแบบที่ระบุในภาพ
        if (accessToken) {
            return res.status(200).json({
                Result: accessToken,
                // เพิ่ม message ตามที่เห็นใน Response: Stats successfully retrieved.
                message: 'Stats successfully retrieved.' 
            });
        } else {
            // กรณี Service Layer แจ้งว่า validation ไม่ผ่าน
            return res.status(401).json({ 
                error: 'Authentication failed. Invalid credentials.'
            });
        }

    } catch (error) {
        console.error('Authentication Error:', error);
        // การจัดการ Error ภายใน (เช่น ฐานข้อมูลล่ม, Server Error)
        return res.status(500).json({ 
            error: 'Internal Server Error' 
        });
    }
};