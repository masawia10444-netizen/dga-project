import * as authService from '../services/auth.service.js'; 

/**
 * @desc รับ ConsumerKey และ AgentID จาก Query, ConsumerSecret จาก Header
 * เพื่อทำการตรวจสอบสิทธิ์และสร้าง Access Token
 * @route GET /auth/validate?ConsumerKey=[KEY]&AgentID=[ID]
 */
export const getAccessToken = async (req, res) => { // ใช้ export const แทน exports.
    try {
        // 1. รับค่า Input (ตรวจสอบจากภาพ: Consumer-Key, AgentID, ConsumerSecret)
        const consumerKey = req.query['Consumer-Key']; 
        const agentId = req.query.AgentID;
        // NOTE: req.header() ใช้ได้ดีกว่า req.headers['consumersecret'] เพราะจัดการเรื่อง Case-insensitivity ได้ง่ายกว่า
        const consumerSecret = req.header('ConsumerSecret'); 
        
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

        // 4. ส่ง Response กลับ
        if (accessToken) {
            return res.status(200).json({
                Result: accessToken,
                message: 'Stats successfully retrieved.' 
            });
        } else {
            // กรณี Service Layer แจ้งว่า validation ไม่ผ่าน
            return res.status(401).json({ 
                error: 'Authentication failed. Invalid credentials.'
            });
        }

    } catch (error) {
        console.error('Authentication Error in Controller:', error);
        // การจัดการ Error ภายใน (เช่น ฐานข้อมูลล่ม, Server Error)
        return res.status(500).json({ 
            error: 'Internal Server Error' 
        });
    }
};

// ⭐️ เพิ่ม export สำหรับฟังก์ชันอื่น ๆ ที่เกี่ยวข้องใน Controller (ถ้ามี)
export const login = (req, res) => { 
    return res.status(501).json({ error: 'Not Implemented Yet' }); 
};

export const getProtectedData = (req, res) => {
    return res.status(200).json({ data: 'This is protected data.' });
}