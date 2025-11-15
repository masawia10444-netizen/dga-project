import { useState } from 'react';

// ⭐️⭐️ CSS Styles (Integrated for self-containment) ⭐️⭐️
// เนื่องจากไม่สามารถ Resolve ไฟล์ .css แยกได้ จึงนำ Style มาใส่ใน Component นี้แทน
const AppStyles = () => (
    <style>{`
        /* DGA Miniapp Styling - Using custom CSS to mimic Tailwind classes 
          for clean, responsive design. 
        */

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        /* Base Styles */
        body {
            background-color: #f4f7f9; /* Light background */
            font-family: 'Inter', sans-serif;
            color: #333;
            line-height: 1.6;
        }

        .miniapp-container {
            max-width: 700px;
            margin: 20px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        /* Typography Utilities */
        .text-2xl { font-size: 1.5rem; }
        .text-xl { font-size: 1.25rem; }
        .text-sm { font-size: 0.875rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .text-indigo-600 { color: #4f46e5; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-600 { color: #4b5563; }
        .text-green-600 { color: #10b981; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .p-4 { padding: 1rem; }
        .p-3 { padding: 0.75rem; }
        .p-2 { padding: 0.5rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded { border-radius: 0.25rem; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
        .border { border-width: 1px; border-style: solid; }

        /* Status Boxes */
        .bg-red-100 { background-color: #fee2e2; }
        .text-red-700 { color: #b91c1c; }
        .border-red-300 { border-color: #fca5a5; }

        .bg-green-100 { background-color: #d1fae5; }
        .text-green-700 { color: #047857; }
        .border-green-300 { border-color: #6ee7b7; }

        .bg-indigo-100 { background-color: #eef2ff; }
        .text-indigo-700 { color: #4338ca; }
        .border-indigo-300 { border-color: #a5b4fc; }

        /* Section Styles */
        .section {
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            margin-bottom: 15px;
            border: 1px solid #e5e7eb;
        }

        /* Button Styles */
        button {
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
        }

        .btn-primary {
            background-color: #4f46e5; /* Indigo 600 */
            color: white;
        }
        .btn-primary:hover:not(:disabled) {
            background-color: #4338ca; /* Indigo 700 */
        }

        .btn-secondary {
            background-color: #e5e7eb; /* Gray 200 */
            color: #4b5563; /* Gray 600 */
            border: 1px solid #d1d5db;
        }
        .btn-secondary:hover:not(:disabled) {
            background-color: #d1d5db; /* Gray 300 */
        }

        .btn-action {
            background-color: #0d9488; /* Teal 600 */
            color: white;
        }
        .btn-action:hover:not(:disabled) {
            background-color: #0f766e; /* Teal 700 */
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Input Styles */
        .input-text {
            padding: 10px;
            border: 1px solid #d1d5db; /* Gray 300 */
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .input-text:focus {
            border-color: #4f46e5; /* Indigo 600 */
            outline: none;
            box-shadow: 0 0 0 1px #4f46e5;
        }
        .w-full { width: 100%; }

        /* Pre/Code Block */
        pre {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Consolas', 'Courier New', monospace;
        }
        .bg-gray-50 { background-color: #f9fafb; }
        .overflow-x-auto { overflow-x: auto; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
    `}</style>
);


// ⚠️ เนื่องจากเราไม่สามารถเข้าถึง window.czpSdk ได้โดยตรงในสภาพแวดล้อมนี้
// เราจึงใช้ Mock object แทน หากคุณรันจริงใน DGA Miniapp Environment 
// คุณสามารถเปลี่ยนกลับไปใช้ const mockAppId = window.czpSdk.getAppId(); ได้

const BACKEND_URL = 'http://localhost:1040'; // ใช้ Port 1040 ตามที่คุณตั้งใน server.js

// Mock SDK Functions (จำลองการทำงานของ DGA SDK)
const czpSdk = {
    getAppId: () => 'MOCK_APP_ID_12345',
    getToken: () => 'MOCK_M_TOKEN_ABCDE',
};


function App() {
    const [userData, setUserData] = useState(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dgaToken, setDgaToken] = useState(null); // เก็บ Token จาก /api/validate

    const [notiMessage, setNotiMessage] = useState('ทดสอบการส่ง Notification!');
    const [notiStatus, setNotiStatus] = useState('');

    // --- Utility Function สำหรับ Fetch API ---
    const fetchApi = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // สำคัญสำหรับ Session/Cookie
        });

        const data = await response.json();

        if (!response.ok) {
            // โยน Error พร้อมข้อความที่ Backend ส่งกลับมา
            throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
        }
        return data;
    };


    // --- 1. Login Flow (Validate -> Login -> GetUserData) ---
    const handleLogin = async () => {
        setIsLoading(true);
        setStatus('กำลังเริ่มต้น Login Flow...');
        setError('');

        try {
            // ** STEP 1.1: Mock SDK Call **
            const mockAppId = czpSdk.getAppId();
            const mToken = czpSdk.getToken();
            setStatus('1. ได้รับ App ID และ mToken จาก SDK แล้ว...');
            
            // ** STEP 1.2: เรียก Backend /api/validate (เพื่อขอ DGA Token) **
            setStatus('2. กำลังเรียก Backend /api/validate เพื่อขอ DGA Token...');
            const validateResult = await fetchApi(`${BACKEND_URL}/api/validate`, { method: 'GET' });
            
            const token = validateResult.token;
            setDgaToken(token);
            setStatus('3. ได้รับ DGA Token สำเร็จ!');

            // ** STEP 1.3: เรียก Backend /api/login (เพื่อแลก mToken เป็น User Data) **
            setStatus('4. กำลังเรียก Backend /api/login เพื่อดึงข้อมูลผู้ใช้...');
            const loginResult = await fetchApi(`${BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId: mockAppId, mToken: mToken, token: token }), // ส่ง DGA Token ที่ได้มาด้วย
            });

            // ** STEP 1.4: เรียก Backend /api/get-user-data (จาก Session) **
            setStatus('5. Login สำเร็จ! กำลังดึงข้อมูลผู้ใช้จาก Session...');
            const userDataFromApi = await fetchApi(`${BACKEND_URL}/api/get-user-data`, { method: 'GET' });

            // ⭐️ บันทึกข้อมูลผู้ใช้ลง State
            setUserData(userDataFromApi);
            setStatus('Login และดึงข้อมูลสำเร็จ!');

        } catch (err) {
            console.error('Login Flow Error:', err);
            setError(`Login Flow Error: ${err.message}`);
            setDgaToken(null);
            setUserData(null);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. ฟังก์ชันส่ง Notification ---
    const handleSendNotification = async () => {
        const currentUserId = userData?.userid || userData?.userId;
        
        if (!currentUserId || !dgaToken) {
            setError('Error: User ID or DGA Token not found. Please log in again.');
            return;
        }
        
        setIsLoading(true);
        setNotiStatus('กำลังส่ง Notification...');
        setError('');

        try {
            // ** เปลี่ยน Endpoint เป็น /api/notification **
            const result = await fetchApi(`${BACKEND_URL}/api/notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: czpSdk.getAppId(),
                    userId: currentUserId,
                    token: dgaToken, // ส่ง DGA Token ไปให้ Backend ใช้
                    message: notiMessage
                }),
            });

            const transactionId = result.result?.data?.[0]?.txid || 'N/A';
            setNotiStatus(`Notification sent! TransactionID: ${transactionId}`);

        } catch (err) {
            console.error('Send Noti Error:', err);
            setError(`Send Noti Error: ${err.message}`);
            setNotiStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. ฟังก์ชัน Logout ---
    const handleLogout = async () => {
        setIsLoading(true);
        setStatus('กำลังออกจากระบบ...');
        setError('');
        
        try {
            await fetchApi(`${BACKEND_URL}/api/logout`, { method: 'GET' });
            setUserData(null);
            setDgaToken(null);
            setStatus('ออกจากระบบเรียบร้อยแล้ว');
        } catch (err) {
            console.error('Logout Error:', err);
            setError(`Logout Error: ${err.message}`);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };


    // --- 4. ส่วนแสดงผล (UI) ---
    return (
        <>
            <AppStyles /> {/* เรียกใช้ Component สำหรับ Style */}
            <div className="miniapp-container">
                <h1 className="text-2xl font-bold text-indigo-600 mb-6">DGA Miniapp Connector (React)</h1>

                {/* --- ส่วนแสดงผล Status --- */}
                {(status || error) && (
                    <div className={`p-3 mb-4 rounded-lg shadow-md font-medium ${error ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                        {error || status}
                    </div>
                )}
                
                {/* --- ส่วนที่ 1: Login/Logout Control --- */}
                <div className="section">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Authentication</h2>
                    {!userData ? (
                        <button 
                            className="btn-primary" 
                            onClick={handleLogin} 
                            disabled={isLoading}
                        >
                            {isLoading ? 'กำลังโหลด...' : 'Start DGA Login Flow'}
                        </button>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-green-600 font-medium">✅ User Logged In</span>
                            <button 
                                className="btn-secondary" 
                                onClick={handleLogout} 
                                disabled={isLoading}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* --- ส่วนที่ 2 & 3 (จะแสดงก็ต่อเมื่อ Login สำเร็จ) --- */}
                {userData && (
                    <>
                        {/* --- 2. User Data --- */}
                        <div className="section mt-6">
                            <h2 className="text-xl font-semibold mb-3 text-gray-800">2. User Data (Session/DGA)</h2>
                            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border">
                                <h3 className="font-mono text-gray-600 mb-2">User ID: <span className="font-bold text-indigo-600">{userData.userid || userData.userId || 'N/A'}</span></h3>
                                <pre className="text-gray-800 whitespace-pre-wrap">{JSON.stringify(userData, null, 2)}</pre>
                            </div>
                        </div>

                        {/* --- 3. Send Notification --- */}
                        <div className="section mt-6">
                            <h2 className="text-xl font-semibold mb-3 text-gray-800">3. Send Notification</h2>
                            <p className="text-sm text-gray-600 mb-2">ส่งข้อความไปยัง User ID: <span className="font-medium text-indigo-600">{userData.userid || userData.userId}</span></p>
                            
                            <input
                                type="text"
                                className="input-text w-full mb-3"
                                value={notiMessage}
                                onChange={(e) => setNotiMessage(e.target.value)}
                                placeholder="Enter notification message"
                            />
                            
                            <button 
                                className="btn-action w-full" 
                                onClick={handleSendNotification} 
                                disabled={isLoading}
                            >
                                {isLoading ? 'กำลังส่ง...' : 'Send Notification to DGA'}
                            </button>
                            
                            {notiStatus && (
                                <div className="p-2 mt-3 text-sm rounded bg-indigo-100 text-indigo-700 font-medium border border-indigo-300">
                                    {notiStatus}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default App;