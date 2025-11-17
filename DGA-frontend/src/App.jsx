import React from 'react';
// ⭐️ แก้ไขให้เรียกใช้ DGAProductionFlow.jsx (หรือชื่อไฟล์ที่คุณใช้จริง)
import DGAProductionFlow from './components/DGAProductionFlow.jsx'; 
import './index.css';

function App() {
  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px' }}>
      <DGAProductionFlow />
    </div>
  );
}

export default App;