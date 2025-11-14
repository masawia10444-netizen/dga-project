import { useState } from 'react';
import './App.css'; // เราจะใช้ CSS จากไฟล์นี้แทน <style>

// ⭐️⭐️ แก้ไข URL นี้ให้ตรงกับ Nginx Proxy Manager ของคุณ ⭐️⭐️
const BACKEND_URL = '/test5';

function App() {
  // --- 1. สร้าง State สำหรับเก็บข้อมูล ---
  // useState คือ "ความจำ" ของ Component
  const [userData, setUserData] = useState(null); // เก็บข้อมูลผู้ใช้หลัง Login
  const [status, setStatus] = useState(''); // เก็บข้อความสถานะ
  const [error, setError] = useState(''); // เก็บข้อความ Error
  const [isLoading, setIsLoading] = useState(false); // สถานะ Loading

  const [notiMessage, setNotiMessage] = useState('ทดสอบการส่ง Notification จาก React!');
  const [notiStatus, setNotiStatus] = useState('');

  // --- 2. ฟังก์ชัน Login ---
  // (แปลงมาจาก `handleLogin` และ `handleGetUserData` ใน Demo)
  const handleLogin = async () => {
    setIsLoading(true);
    setStatus('กำลัง Login...');
    setError('');
    // เทส

    try {
      // ขั้นตอนที่ 1: เรียก SDK (Mock)
      const mockAppId = window.czpSdk.getAppId();
      const mToken = window.czpSdk.getToken();

      // ขั้นตอนที่ 2: เรียก Backend /profile/login (ต้องใช้ 'credentials: include')
      const loginResponse = await fetch(`${BACKEND_URL}/profile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: mockAppId, mToken: mToken }),
        credentials: 'include' // สำคัญมากสำหรับ Session
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed (Status: ${loginResponse.status})`);
      }

      console.log('Login successful, fetching user data...');

      // ขั้นตอนที่ 3: เรียก /api/get-user-data (จาก Session)
      const userResponse = await fetch(`${BACKEND_URL}/api/get-user-data`, {
        method: 'GET',
        credentials: 'include' // สำคัญมากสำหรับ Session
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to get user data (Status: ${userResponse.status})`);
      }

      const userDataFromApi = await userResponse.json();
      console.log('Get User Data Result:', userDataFromApi);

      // ⭐️ บันทึกข้อมูลผู้ใช้ลง State (ความจำ)
      setUserData(userDataFromApi);
      setStatus('Login และดึงข้อมูลสำเร็จ!');

    } catch (err) {
      console.error('Login Flow Error:', err);
      setError(`Login Error: ${err.message}`);
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. ฟังก์ชันส่ง Notification ---
  const handleSendNotification = async () => {
    if (!userData || !(userData.userid || userData.userId)) {
      alert('Error: User ID not found. Please log in again.');
      return;
    }
    
    // ดึง userId จาก State
    const currentUserId = userData.userid || userData.userId;

    setIsLoading(true);
    setNotiStatus('กำลังส่ง Notification...');
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/send-single-noti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          message: notiMessage
        }),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      const transactionId = result.result ? result.result[0] : 'N/A';
      setNotiStatus(`Notification sent! TransactionID: ${transactionId}`);

    } catch (err) {
      console.error('Send Noti Error:', err);
      setError(`Send Noti Error: ${err.message}`);
      setNotiStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. ส่วนแสดงผล (UI) ---
  return (
    <div className="container">
      <h1>DGA Miniapp Frontend (React)</h1>

      {/* --- ส่วนแสดงผล Status --- */}
      {status && <div className="status success">{status}</div>}
      {error && <div className="status error">{error}</div>}

      {/* --- ส่วนที่ 1: Login --- */}
      {!userData && (
        <div className="section">
          <h2>1. Login Flow</h2>
          <p>คลิกปุ่มนี้เพื่อจำลองการเรียก SDK และส่ง `mToken` ไปให้ Backend</p>
          <button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'กำลังโหลด...' : 'Login'}
          </button>
        </div>
      )}

      {/* --- ส่วนที่ 2 & 3 (จะแสดงก็ต่อเมื่อ Login สำเร็จ) --- */}
      {userData && (
        <>
          <div className="section">
            <h2>2. User Data (from Session)</h2>
            <p>ข้อมูลนี้ดึงมาจาก <code>GET /api/get-user-data</code></p>
            <pre>{JSON.stringify(userData, null, 2)}</pre>
          </div>

          <div className="section">
            <h2>3. Send Notification (Single)</h2>
            <p>ส่งข้อความไปยัง User ID: {userData.userid || userData.userId}</p>
            <input
              type="text"
              value={notiMessage}
              onChange={(e) => setNotiMessage(e.target.value)}
            />
            <br />
            <button onClick={handleSendNotification} disabled={isLoading}>
              {isLoading ? 'กำลังส่ง...' : 'Send Notification'}
            </button>
            {notiStatus && <div className="status success">{notiStatus}</div>}
          </div>
        </>
      )}
    </div>
  );
}

export default App;