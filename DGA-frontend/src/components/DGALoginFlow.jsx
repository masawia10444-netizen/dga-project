// src/components/DGALoginFlow.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ตั้งค่า axios instance สำหรับการเรียก API
const api = axios.create({
    baseURL: '/api', 
    withCredentials: true, 
    timeout: 15000,
});

const DGA_APP_ID = 'YOUR_DGA_APP_ID'; // ใช้ค่า App ID จริงของคุณ

function DGALoginFlow() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [mToken, setMToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ------------------------------------------
    // 1. ดึง mToken จาก URL Query และตรวจสอบ Session
    // ------------------------------------------
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlMToken = params.get('mToken');

        if (urlMToken) {
            setMToken(urlMToken);
            console.log('✅ mToken found in URL:', urlMToken);
        } else {
            console.log('No mToken found in URL. Checking active session...');
            checkSession(); 
        }

        async function checkSession() {
            try {
                const response = await api.get('/get-user-data');
                setUser(response.data);
                setError(null);
            } catch (err) {
                console.log('No active user session.');
                setUser(null);
            }
        };
    }, []);

    // ------------------------------------------
    // 2. Login Flow หลัก (Validate -> Login)
    // ------------------------------------------
    const handleLoginFlow = async () => {
        if (!mToken) {
            setError("Cannot start flow: mToken is missing. Check the DGA redirect URL.");
            return;
        }

        setLoading(true);
        setError(null);
        let validatedToken = null;

        try {
            // A. STEP 1: ขอ Token (Validate)
            const validateResponse = await api.get('/validate');
            validatedToken = validateResponse.data.token;
            setToken(validatedToken);

            // B. STEP 2: ใช้ Token และ mToken ที่ดึงจาก URL เพื่อขอข้อมูลผู้ใช้ (Login)
            const loginResponse = await api.post('/login', {
                appId: DGA_APP_ID,
                mToken: mToken,
                token: validatedToken, 
            });

            setUser(loginResponse.data.user);

        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Unknown error occurred.';
            setError(message);
            setUser(null); 
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------
    // 3. Render UI (ปรับปรุงการแสดงผล)
    // ------------------------------------------
    return (
        <div className="dga-login-flow-container p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">DGA Login Flow (Client)</h2>

            {!user ? (
                <>
                    <p className="text-gray-600 mb-4">
                        สถานะ: {mToken ? 'พร้อมเข้าสู่ระบบ' : 'รอ mToken'}
                    </p>
                    <button
                        onClick={handleLoginFlow}
                        disabled={loading || !mToken} 
                        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-200 
                            ${(loading || !mToken) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {loading ? 'กำลังดำเนินการ...' : '🚀 Start DGA Login Flow'}
                    </button>
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            Error: {error}
                        </div>
                    )}
                    {!mToken && !loading && (
                         <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                            ไม่พบ mToken ใน URL: DGA API ต้องทำการ Redirect มาที่หน้านี้พร้อม Query Parameter 'mToken'
                        </div>
                    )}
                </>
            ) : (
                // ⭐️ โค้ดแสดงข้อมูลผู้ใช้เมื่อสำเร็จ (แก้ไข syntax ในส่วนนี้)
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded">
                    <h3 className="text-lg font-bold mb-2">✅ เข้าสู่ระบบสำเร็จ</h3>
                    <p>ชื่อ: **{user.citizenName || 'N/A'}**</p>
                    <p>เลขบัตร: **{user.citizenId || 'N/A'}**</p>
                    <p className="text-sm mt-2">ข้อมูลนี้ถูกดึงมาจาก Session ของ Backend</p>
                    <button
                        onClick={() => setUser(null)}
                        className="mt-3 text-sm py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Reset / Logout
                    </button>
                    <p className="mt-4 pt-2 border-t text-sm text-gray-500">
                        Token (Debug): {token ? token.substring(0, 30) + '...' : 'None'}
                    </p>
                </div>
            )}
        </div>
    );
}


export default DGALoginFlow;