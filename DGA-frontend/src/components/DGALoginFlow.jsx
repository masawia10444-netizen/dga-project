import React, { useState } from 'react';
import { validateToken } from '../services/AuthService';

const steps = [
    "1. Validate Token (/api/validate)", 
    "2. Login ด้วย mToken (/api/login)", 
    "3. Get Session Data (/api/get-user-data)"
];

function DGALoginFlow() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // success | error
    const [message, setMessage] = useState('');
    const [accessToken, setAccessToken] = useState(localStorage.getItem('dga_access_token') || null);

    const handleStartLoginFlow = async () => {
        setLoading(true);
        setStatus(null);
        setMessage('Starting DGA Authentication...');
        setAccessToken(null);

        try {
            // 1. ขั้นตอน Validate Token
            setMessage('Step 1: Calling /auth/validate...');
            const token = await validateToken();

            setAccessToken(token);
            setMessage(`Success! Access Token received. (Token: ${token.substring(0, 10)}...)`);
            setStatus('success');

            // ⭐️ หมายเหตุ: ตรงนี้คือจุดที่คุณจะเรียก API /login และ /get-user-data ต่อไป
            // 

        } catch (error) {
            setMessage(`Authentication Failed: ${error.message}`);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', color: '#1f2937' }}>DGA Miniapp Testing Hub</h1>
            
            <div style={{ border: '1px solid #1e3a8a', padding: '15px', borderRadius: '6px', margin: '20px 0', backgroundColor: '#eff6ff' }}>
                <h3 style={{ color: '#1e3a8a' }}>1. DGA Authentication Flow (Login)</h3>
                <p style={{ margin: '5px 0' }}>ขั้นตอน: {steps.join(' → ')}</p>
            </div>

            <button
                onClick={handleStartLoginFlow}
                disabled={loading}
                style={{
                    backgroundColor: loading ? '#6c757d' : '#1e3a8a',
                    color: 'white',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    width: '100%',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s'
                }}
            >
                {loading ? 'Processing...' : 'Start DGA Login Flow'}
            </button>

            {/* แสดงผลลัพธ์ */}
            {message && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    borderLeft: `5px solid ${status === 'success' ? '#10b981' : '#ef4444'}`, 
                    backgroundColor: status === 'success' ? '#d1fae5' : '#fee2e2',
                    borderRadius: '4px'
                }}>
                    <p><strong>Status:</strong> <span style={{ color: status === 'success' ? '#10b981' : '#ef4444' }}>{status === 'success' ? 'SUCCESS' : 'ERROR'}</span></p>
                    <p>{message}</p>
                </div>
            )}
            
            {accessToken && status === 'success' && (
                <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
                    <p>Token Stored in Local Storage: <strong>YES</strong></p>
                </div>
            )}

        </div>
    );
}

export default DGALoginFlow;