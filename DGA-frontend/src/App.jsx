import { useState } from 'react';

// ใช้ Prefix ที่กำหนดใน Backend (server.js)
const API_PREFIX = '/api'; 
// ฟังก์ชันสำหรับ Log (เพื่อแสดงผลใน Console)
const log = (message) => console.log(`[LOG] ${message}`);

// ตรวจสอบว่า `window.czpSdk` พร้อมใช้งานหรือไม่
if (!window.czpSdk) {
    console.warn("⚠️ czpSdk not detected. Login will fail unless mock data is manually added to window.");
    // หากต้องการทดสอบในเครื่องโดยไม่มี SDK จริง ให้เปิดคอมเมนต์บรรทัดด้านล่างนี้
    /*
    window.czpSdk = {
        getAppId: () => 'ec90675a-MOCK-app',
        getToken: () => 'eac2b585-MOCK-mtoken',
    };
    */
}


function App() {
  // --- 1. สร้าง State สำหรับเก็บข้อมูล ---
  const [userData, setUserData] = useState(null); 
  const [status, setStatus] = useState(''); // เก็บข้อความสถานะ (Success/Info)
  const [error, setError] = useState(''); // เก็บข้อความ Error
  const [isLoading, setIsLoading] = useState(false); // สถานะ Loading

  const [notiMessage, setNotiMessage] = useState('ทดสอบการส่ง Notification จาก React!');
  const [notiStatus, setNotiStatus] = useState('');
  const [batchStatus, setBatchStatus] = useState(''); // สถานะสำหรับ Batch Notification

  // Helper function to display error instead of alert()
  const displayError = (msg) => {
    setError(msg);
    setIsLoading(false);
  }

  // --- 2. ฟังก์ชัน Login ---
  const handleLogin = async () => {
    setIsLoading(true);
    setStatus('กำลัง Login...');
    setError('');
    setUserData(null); 
    setNotiStatus('');

    try {
        // --- ขั้นตอนที่ 1: เรียก SDK (ไม่มี Mock แล้ว) ---
        if (!window.czpSdk || typeof window.czpSdk.getAppId !== 'function' || typeof window.czpSdk.getToken !== 'function') {
             throw new Error("SDK Not Ready: czpSdk หรือฟังก์ชันที่จำเป็นไม่พร้อมใช้งาน");
        }
        
        const mockAppId = window.czpSdk.getAppId(); 
        const mToken = window.czpSdk.getToken();

        if (!mockAppId || !mToken) {
            throw new Error("ไม่พบ AppID หรือ mToken จาก SDK (อาจหมดอายุหรือยังไม่ได้รับสิทธิ์)");
        }

        log(`Start Login Flow. AppId: ${mockAppId}, mToken: ${mToken}`);

      // ขั้นตอนที่ 2: เรียก Backend /test5/api/login (เพื่อตั้งค่า Session)
      const loginResponse = await fetch(`${API_PREFIX}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: mockAppId, mToken: mToken }),
        credentials: 'include' 
      });

      if (!loginResponse.ok) {
        const errJson = await loginResponse.json().catch(() => ({ error: 'Unknown response' }));
        throw new Error(`Login failed (Status: ${loginResponse.status}, Detail: ${errJson.error || 'Server error'})`);
      }

      log('Login successful, fetching user data...');
      
      // ขั้นตอนที่ 3: เรียก /test5/api/get-user-data (ดึงข้อมูลจาก Session)
      const userResponse = await fetch(`${API_PREFIX}/get-user-data`, {
        method: 'GET',
        credentials: 'include' 
      });

      if (!userResponse.ok) {
        const errJson = await userResponse.json().catch(() => ({ error: 'Unknown response' }));
        throw new Error(`Failed to get user data (Status: ${userResponse.status}, Detail: ${errJson.error || 'Server error'})`);
      }

      const userDataFromApi = await userResponse.json();
      log('Get User Data Result:', userDataFromApi);

      // บันทึกข้อมูลผู้ใช้ลง State
      setUserData(userDataFromApi);
      setStatus('Login และดึงข้อมูลสำเร็จ! ✅');

    } catch (err) {
      console.error('Login Flow Error:', err);
      displayError(`Login Error: ${err.message}`);
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. ฟังก์ชันส่ง Notification เดี่ยว ---
  const handleSendNotification = async () => {
    if (!userData || !(userData.userid || userData.userId)) {
      displayError('Error: ไม่พบ User ID กรุณา Login ก่อน.');
      return;
    }
    
    const currentUserId = userData.userid || userData.userId;

    setIsLoading(true);
    setNotiStatus('กำลังส่ง Notification...');
    setError('');

    try {
        // --- ขั้นตอนที่ 1: Validate เพื่อขอ Token ---
        log(`[Noti] Calling ${API_PREFIX}/validate to get token...`);
        const validateRes = await fetch(`${API_PREFIX}/validate`).then(res => res.json());
        if (!validateRes.success) throw new Error(validateRes.error || "Validate failed.");
        const token = validateRes.token;
        log(`[Noti] Got Token: ${token}`);

      // --- ขั้นตอนที่ 2: เรียก Backend /test5/api/notification ---
      log(`[Noti] Calling ${API_PREFIX}/notification...`);
      const response = await fetch(`${API_PREFIX}/notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          message: notiMessage,
          token: token // ส่ง token ไปให้ Backend
        }),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }

      const transactionId = result.result ? result.result[0] : 'N/A';
      setNotiStatus(`Notification sent! TransactionID: ${transactionId} ✅`);

    } catch (err) {
      console.error('Send Noti Error:', err);
      displayError(`Send Noti Error: ${err.message}`);
      setNotiStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. ฟังก์ชันส่ง Batch Notification ---
  const handleSendBatchNotification = async () => {
    if (!userData) {
      displayError('Error: กรุณา Login ก่อนเพื่อทดสอบ Batch Notification.');
      return;
    }

    setIsLoading(true);
    setBatchStatus('กำลังส่ง Batch Notification...');
    setError('');

    try {
        // Backend (/test5/api/send-batch-noti) จะจัดการการขอ Token เอง
        log(`[Batch Noti] Calling ${API_PREFIX}/send-batch-noti...`);
        const response = await fetch(`${API_PREFIX}/send-batch-noti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to send batch notification');
        }

        setBatchStatus(`Batch schedule request sent! (Message: ${result.message}) ✅`);

    } catch (err) {
        console.error('Send Batch Noti Error:', err);
        displayError(`Send Batch Noti Error: ${err.message}`);
        setBatchStatus('');
    } finally {
        setIsLoading(false);
    }
  };


  // --- 5. ส่วนแสดงผล (UI) ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-2xl p-6 space-y-6">
          <h1 className="text-2xl font-bold text-blue-700 border-b pb-2">DGA Miniapp Frontend (React)</h1>

        {/* --- ส่วนแสดงผล Status --- */}
        {status && (
            <div className="p-3 rounded-lg bg-green-100 text-green-700 font-medium border border-green-300">
                {status}
            </div>
        )}
        {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 font-medium border border-red-300">
                ❌ Error: {error}
            </div>
        )}

        {/* --- ส่วนที่ 1: Login --- */}
        {!userData && (
          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700">1. Login Flow</h2>
            <p className="text-sm text-gray-500">คลิกปุ่มนี้เพื่อเรียก SDK เพื่อดึง mToken และส่งไปให้ Backend ผ่าน <code>POST {API_PREFIX}/login</code></p>
            <button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังโหลด...' : 'Login & Get User Data'}
            </button>
          </div>
        )}

        {/* --- ส่วนที่ 2, 3, 4 (จะแสดงก็ต่อเมื่อ Login สำเร็จ) --- */}
        {userData && (
          <>
            <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-700">2. User Data (from Session)</h2>
              <p className="text-sm text-gray-500">ข้อมูลนี้ดึงมาจาก <code>GET {API_PREFIX}/get-user-data</code></p>
              <pre className="bg-gray-800 text-green-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(userData, null, 2)}
              </pre>
            </div>

            <div className="space-y-4 p-4 border rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700">3. Send Notification (Single)</h2>
              <p className="text-sm text-gray-500">ส่งข้อความไปยัง User ID: <span className="font-bold text-blue-600">{userData.userid || userData.userId}</span> ผ่าน <code>POST {API_PREFIX}/notification</code></p>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                value={notiMessage}
                onChange={(e) => setNotiMessage(e.target.value)}
              />
              <button 
                    onClick={handleSendNotification} 
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                {isLoading ? 'กำลังส่ง...' : 'Send Notification'}
              </button>
              {notiStatus && (
                    <div className="p-3 rounded-lg bg-yellow-50 text-purple-700 font-medium border border-yellow-300">
                        {notiStatus}
                    </div>
                )}
            </div>

            {/* --- ส่วนที่ 4: Batch Notification Test --- */}
            <div className="space-y-4 p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-700">4. Send Notification (Batch Schedule Test)</h2>
                <p className="text-sm text-gray-500">
                    จำลองการส่ง Batch Notification แบบตั้งเวลาไปยังผู้ใช้หลายคนผ่าน <code>POST {API_PREFIX}/send-batch-noti</code>
                </p>
                <button
                    onClick={handleSendBatchNotification}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-yellow-600 text-white font-bold rounded-lg shadow hover:bg-yellow-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'กำลังส่ง...' : 'Test Batch Schedule'}
                </button>
                {batchStatus && (
                    <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 font-medium border border-yellow-300">
                        {batchStatus}
                    </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;