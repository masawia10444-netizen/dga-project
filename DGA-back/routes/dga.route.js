// routes/dga.route.js (ES Modules)

import express from 'express';
// *** นำเข้า Controller Functions แบบ Destructuring ***
import * as dgaController from '../controllers/dga.controller.js'; // ต้องเพิ่ม .js นามสกุล

const router = express.Router();

// DGA API Routes
router.get('/validate', dgaController.validateToken);
router.post('/login', dgaController.loginUser);
router.post('/notification', dgaController.sendNotification);

// Session Routes
router.get('/get-user-data', dgaController.getUserData);
router.get('/logout', dgaController.logoutUser);

// *** ใช้ export default ***
export default router;