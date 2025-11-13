import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {

  // State สำหรับเก็บ Token และ Response
  const [authToken, setAuthToken] = useState(""); // 👈 "Token" (จาก Auth)
  const [authResponse, setAuthResponse] = useState("ยังไม่ได้ Auth...");
  const [mockResponse, setMockResponse] = useState("ยังไม่ได้ Mock...");

  // 1. ฟังก์ชัน Auth (เพื่อเอา "Token")
  const handleDgaAuthClick = async () => {
    setAuthResponse("...กำลัง Auth...");
    setAuthToken(""); // 👈 ล้าง Token เก่า
    try {
      const response = await axios.get('http://localhost:1040/api/dga/auth');
      
      // ดึง "Token" จาก response
      const token = response.data?.Result || response.data?.token || response.data?.Token; 

      if (token) {
        setAuthToken(token); // 👈 เก็บ Token ไว้ใน State
        setAuthResponse("ได้ Token แล้ว: " + token.substring(0, 15) + "..."); // แสดง Token แบบย่อ
      } else {
        setAuthResponse("Auth สำเร็จ แต่หา Token ไม่เจอ!");
      }

    } catch (error) {
      console.error("Auth ไม่สำเร็จ!", error);
      setAuthResponse("Auth ไม่สำเร็จ! (ดู Console)");
    }
  };

  // 2. ฟังก์ชัน Mock Data (เพื่อเอา "mToken")
  const handleMockDataClick = async () => {
    setMockResponse("...กำลัง Mock Data...");
    try {
      // 3. ยิงไปที่ Server ของเรา (/api/dga/mock-data)
      const response = await axios.post('http://localhost:1040/api/dga/mock-data', {
        token: authToken // 👈 ส่ง "Token" (จาก Auth) ไปให้ Back-end
      });

      // 4. แสดงผลลัพธ์ (ที่น่าจะมี mToken)
      setMockResponse(JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.error("Mock Data ไม่สำเร็จ!", error);
      setMockResponse("Mock Data ไม่สำเร็จ! (ดู Console)");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>ทดสอบ DGA API (2 ขั้นตอน)</h1>

      {/* --- 1. Authentication --- */}
      <div style={{ border: '1px solid gray', padding: '20px', marginBottom: '20px' }}>
        <h3>ขั้นตอนที่ 1: Authentication</h3>
        <button onClick={handleDgaAuthClick} style={{ fontSize: '1.2em', padding: '10px' }}>
          กดเพื่อ Auth (รับ Token)
        </button>
        <pre style={preStyle}>{authResponse}</pre>
      </div>

      {/* --- 2. Mock Data --- */}
      <div style={{ border: '1px solid gray', padding: '20px' }}>
        <h3>ขั้นตอนที่ 2: Mock Data (ใช้ Token เพื่อรับ mToken)</h3>
        <button 
          onClick={handleMockDataClick} 
          style={{ fontSize: '1.2em', padding: '10px', backgroundColor: 'lime' }}
          disabled={!authToken} // 👈 กดปุ่มไม่ได้ถ้ายังไม่ Auth
        >
          กดเพื่อ Mock Data
        </button>
        <pre style={preStyle}>{mockResponse}</pre>
      </div>

    </div>
  );
}

// Style สำหรับ <pre>
const preStyle = {
  marginTop: '20px', padding: '10px', backgroundColor: '#333', 
  color: 'lime', textAlign: 'left', minHeight: '50px',
  whiteSpace: 'pre-wrap', wordBreak: 'break-all'
};

export default App;