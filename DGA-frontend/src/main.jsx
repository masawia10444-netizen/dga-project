import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.czpSdk = {
    getAppId: () => "mock-app-id-from-sdk",
    getToken: () => "mock-mToken-from-sdk-12345"
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)