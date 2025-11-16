import React from 'react';
import DGALoginFlow from './components/DGALoginFlow';
import './index.css'; // ใช้ index.css แทน App.css ตามโครงสร้างไฟล์

function App() {
  return (
    // ใช้ Tailwind classes หรือ CSS อื่นๆ ใน index.css/App.css เพื่อจัดวางให้อยู่กึ่งกลาง
    <div className="App" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px' }}>
      <DGALoginFlow />
    </div>
  );
}

export default App;