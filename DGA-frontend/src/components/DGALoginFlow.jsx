import { useEffect, useState } from 'react'; // ลบ Suspense, Link
// ⭐️⭐️ เปลี่ยนจาก next/navigation เป็นการดึง URL ธรรมดา ⭐️⭐️
// import { useSearchParams } from 'next/navigation' 
import { FiTool, FiActivity, FiLoader, FiAlertCircle, FiCheckCircle, FiDatabase, FiUser } from 'react-icons/fi';
import axios from 'axios'; // ใช้ axios แทน fetch
// import type { ApiResponse, UserDto } from '@/types/dga'; // ถ้าไม่มีไฟล์ types ให้ลบบรรทัดนี้

// ... (ประกาศ type สำหรับ window.czpSdk เหมือนเดิม) ...
// ... (interface AppTokenPair เหมือนเดิม) ...
// ... (function getAppIdAndMTokenFromSDK เหมือนเดิม) ...

// ⭐️⭐️ เปลี่ยนชื่อ Component ⭐️⭐️
function DGAProductionFlowInner() {
  const [result, setResult] = useState(null); // ใช้ null แทน UserDto | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ⭐️⭐️ ลบ Hook Next.js ⭐️⭐️
  // const searchParams = useSearchParams()

  // ⭐️⭐️ ใช้ axios instance ที่เราสร้างไว้ ⭐️⭐️
  const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000 });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        // ⭐️⭐️ ดึง URL Params ⭐️⭐️
        const params = new URLSearchParams(window.location.search);
        
        // 1) ลองจาก SDK ก่อน
        const fromSdk = getAppIdAndMTokenFromSDK();

        // 2) ถ้า SDK ไม่มี → fallback จาก URL Query
        const appId = fromSdk?.appId ?? params.get('appId');
        const mToken = fromSdk?.mToken ?? params.get('mToken');

        if (!appId || !mToken) {
          setError(
            'ไม่สามารถอ่าน appId/mToken ได้ทั้งจาก SDK และ URL...'
          );
          return;
        }

        const pair = { appId, mToken };

        // (option) ตั้งชื่อ Title + ปุ่ม Back จาก SDK ถ้ามี
        if (typeof window !== 'undefined') {
          const sdk = window.czpSdk;
          if (sdk?.setTitle) {
            sdk.setTitle('ตรวจสอบข้อมูลผู้ใช้', true);
          }
        }

        // ⭐️⭐️ Call Backend: /api/validate + /api/login ใน Endpoint เดียวกัน (ถ้า Backend รองรับ) ⭐️⭐️
        // (อิงจากตัวอย่างนี้ที่ส่ง AppId/mToken ใน request เดียว แต่ Backend เราแยกเป็น 2 ขั้นตอน)
        
        // 🚨 หมายเหตุ: Backend ของเราแยกเป็น 2 ขั้นตอน (Validate -> Login)
        // โค้ดนี้ต้องถูกเปลี่ยนให้ตรงกับ Backend 2 ขั้นตอนของเรา
        
        // 1. Validate (ขอ Token)
        const validateRes = await api.get('/validate');
        const token = validateRes.data.token;
        
        // 2. Login (ใช้ Token + AppId/mToken)
        const loginResponse = await api.post('/login', { appId, mToken, token });
        
        const data = loginResponse.data.user; // ดึง user data

        // ตัวอย่างนี้บันทึก result.user ที่ได้มาจาก loginResponse.data.user
        setResult(data); 

      } catch (err) {
        setError(String(err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }

    // ⭐️⭐️ เรียกใช้ run() ⭐️⭐️
    void run();
  }, []); // ลบ [searchParams]

  // ... (ส่วนการ Render UI ทั้งหมดเหมือนเดิม) ...
  return (
    // ... UI Code ...
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
    {/* ... UI Code ... */}
    </div>
  )
}

/**
 * default export – ครอบด้วย Suspense ตามที่ Next.js ต้องการ
 */
// ⭐️⭐️ ปรับเป็น React Component ธรรมดา ⭐️⭐️
export default function DGAProductionFlow() {
  return (
    // ถ้าใช้ React/Vite ธรรมดา มักไม่จำเป็นต้องใช้ Suspense ในลักษณะนี้
    // แต่ถ้าต้องการใช้ ต้องมั่นใจว่ามีการตั้งค่า Suspense ที่เหมาะสมใน main.jsx
    <DGAProductionFlowInner /> 
  )
}
