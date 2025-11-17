// src/App.jsx
import React from 'react';
// ⭐️⭐️ เปลี่ยนไปเรียก Component ใหม่ ⭐️⭐️
import DGAProductionFlow from './components/DGAProductionFlow'; 
import './index.css';

function App() {
  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px' }}>
      <DGAProductionFlow />
    </div>
  );
}

export default App;