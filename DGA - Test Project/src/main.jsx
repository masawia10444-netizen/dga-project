import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 👈 ชี้ไปที่ App.jsx
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* 👈 เรียกใช้ <App /> ตรงๆ เลย */}
  </React.StrictMode>,
)