const express = require('express');
const router = express.Router();
const dgaController = require('../controllers/dga.controller');
const authMiddleware = require('../middleware/auth.middleware'); // นำเข้า Middleware

// 1. Route สำหรับขอ Token (ไม่ต้องมี Middleware)
router.get('/auth/validate', dgaController.getAccessToken);

// 2. Route ที่ต้องมีการยืนยันตัวตน (มี Middleware)
router.get('/dga/data', authMiddleware.verifyToken, dgaController.getDGAData); 

module.exports = router;