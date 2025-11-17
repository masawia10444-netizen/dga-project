import { useEffect, useState } from 'react';
import axios from 'axios';
// Import icons ที่จำเป็นทั้งหมด
import { FiTool, FiActivity, FiLoader, FiAlertCircle, FiCheckCircle, FiDatabase, FiUser } from 'react-icons/fi';

// ⭐️⭐️ ประกาศ Axios Instance ⭐️⭐️
const api = axios.create({
    baseURL: '/api', 
    withCredentials: true, 
    timeout: 15000,
});

// ⭐️ ค่า App ID จริง (สามารถดึงจาก ENV ได้หากต้องการ)
const DGA_APP_ID = '7938515d-0bf0-4445-99b3-d941e9c72136'; 

// ------------------------------------------
// ⭐️ Logic ดึง AppId และ mToken จาก SDK ก่อน (ปรับเป็น JavaScript)
// ------------------------------------------
const getAppIdAndMTokenFromSDK = () => {
    if (typeof window === 'undefined') return null;

    const sdk = window.czpSdk;
    if (!sdk || typeof sdk.getAppId !== 'function' || typeof sdk.getToken !== 'function') {
        return null;
    }

    try {
        const appId = sdk.getAppId();
        const mToken = sdk.getToken();

        if (!appId || !mToken) {
            return null;
        }

        return { appId, mToken };
    } catch {
        return null;
    }
};

// ⭐️⭐️ Component หลัก ⭐️⭐️
function DGAProductionFlowInner() {
    // ใช้ null แทน UserDto | null
    const [result, setResult] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appIdToUse, setAppIdToUse] = useState(DGA_APP_ID);
    const [mToken, setMToken] = useState(null);


    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError(null);
            setResult(null);

            try {
                const params = new URLSearchParams(window.location.search);
                
                // 1) ลองจาก SDK ก่อน
                const fromSdk = getAppIdAndMTokenFromSDK();

                // 2) ถ้า SDK ไม่มี → fallback จาก URL Query
                const appId = fromSdk?.appId ?? params.get('appId');
                const mToken = fromSdk?.mToken ?? params.get('mToken');

                if (!appId || !mToken) {
                    setError(
                        'ไม่สามารถอ่าน appId/mToken ได้ทั้งจาก SDK และ URL (ตรวจสอบว่าเปิดผ่านแอปทางรัฐ MiniApp หรือแนบ ?appId=...&mToken=... มาหรือไม่)',
                    );
                    return;
                }

                setAppIdToUse(appId);
                setMToken(mToken);

                // (option) ตั้งชื่อ Title + ปุ่ม Back จาก SDK ถ้ามี
                if (typeof window !== 'undefined') {
                    const sdk = window.czpSdk;
                    if (sdk?.setTitle) {
                        sdk.setTitle('ตรวจสอบข้อมูลผู้ใช้', true);
                    }
                }

                // ⭐️⭐️ 1. Validate (ขอ Token) ⭐️⭐️
                const validateRes = await api.get('/validate');
                const token = validateRes.data.token;
                
                // ⭐️⭐️ 2. Login (ใช้ Token + AppId/mToken) ⭐️⭐️
                const loginResponse = await api.post('/login', { appId, mToken, token });
                
                const data = loginResponse.data.user; 

                // ตัวอย่างนี้บันทึก result.user ที่ได้มาจาก loginResponse.data.user
                setResult(data); 

            } catch (err) {
                // จัดการ Error ให้แสดงผลจาก Backend หรือข้อความ Error ทั่วไป
                setError(String(err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        // ⭐️⭐️ เรียกใช้ run() ⭐️⭐️
        void run();
    }, []); 

    // ------------------------------------------
    // ส่วน Render UI
    // ------------------------------------------
    return (
        // ใช้ Tailwind CSS classes ที่มีสไตล์สวยงาม
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
                
                {/* Header */}
                <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-800">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800">
                                <FiActivity className="h-3 w-3 text-emerald-400" />
                            </span>
                            <span>Production · SDK Mode</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                DGA Miniapp – ตรวจสอบข้อมูลผู้ใช้
                            </h1>
                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                                <FiTool className="h-4 w-4 text-emerald-400" />
                                <span>
                                    SDK Mode – ดึง{' '}
                                    <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-sky-300">
                                        appId
                                    </code>{' '}
                                    และ{' '}
                                    <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-sky-300">
                                        mToken
                                    </code>{' '}
                                    จาก{' '}
                                    <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-violet-300">
                                        window.czpSdk
                                    </code>{' '}
                                    หรือ URL
                                </span>
                            </p>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="grid flex-1 gap-6 md:grid-cols-[1.3fr,1fr]">
                    {/* Status & messages */}
                    <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                                    <FiActivity className="h-4 w-4 text-emerald-400" />
                                    <span>สถานะการประมวลผล</span>
                                </h2>
                                <p className="mt-1 text-xs text-slate-400">
                                    validate → deproc → บันทึกลงฐานข้อมูล
                                </p>
                            </div>

                            {/* Badge ที่เปลี่ยนตามสถานะ */}
                            <div>
                                {loading && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                                        <FiLoader className="h-3 w-3 animate-spin text-emerald-400" />
                                        <span>กำลังประมวลผล</span>
                                    </span>
                                )}
                                {!loading && error && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-500/40">
                                        <FiAlertCircle className="h-3 w-3" />
                                        <span>เกิดข้อผิดพลาด</span>
                                    </span>
                                )}
                                {!loading && !error && result && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
                                        <FiCheckCircle className="h-3 w-3" />
                                        <span>สำเร็จแล้ว</span>
                                    </span>
                                )}
                                {!loading && !error && !result && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                        <FiActivity className="h-3 w-3 text-slate-400" />
                                        <span>รอข้อมูลจาก SDK</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-200 ring-1 ring-slate-800/70">
                            {loading && (
                                <p>
                                    ส่งคำขอไปยังระบบกลางแล้ว…{' '}
                                    <span className="text-slate-400">
                                        (กำลังตรวจสอบ token และดึงข้อมูลผู้ใช้)
                                    </span>
                                </p>
                            )}

                            {error && (
                                <p className="whitespace-pre-wrap text-red-300">
                                    {error}
                                </p>
                            )}

                            {!loading && !error && !result && (
                                <p className="text-slate-300">
                                    ยังไม่ได้รับข้อมูลจาก SDK ของทางรัฐ หรือกำลังรอการประมวลผลแรกเริ่ม…
                                </p>
                            )}

                            {!loading && !error && result && (
                                <p className="text-emerald-300">
                                    ดึงข้อมูลผู้ใช้สำเร็จ และบันทึกลงฐานข้อมูลแล้ว
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Quick user summary */}
                    <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                            <FiUser className="h-4 w-4 text-sky-300" />
                            <span>สรุปข้อมูลผู้ใช้ล่าสุด</span>
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            ข้อมูลที่ได้รับจาก DGA (หลังผ่าน deproc แล้ว)
                        </p>

                        {result ? (
                            <div className="mt-4 space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400">ชื่อ - นามสกุล</p>
                                    <p className="font-medium text-slate-50">
                                        {result.firstName ?? '-'} {result.lastName ?? ''}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-400">Citizen ID</p>
                                        <p className="font-medium text-slate-100">
                                            {result.citizenId ?? '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Mobile</p>
                                        <p className="font-medium text-slate-100">
                                            {result.mobile ?? '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Email</p>
                                        <p className="font-medium text-slate-100">
                                            {result.email ?? '-'}
                                        </p>
                                    </div>
                                    {/* เราไม่แสดง Notification field เพราะข้อมูลนี้ไม่ได้มาจาก CZP DeProc โดยตรง 
                                       แต่ถ้า Backend ส่งมาใน object user เราจะแสดงได้ 
                                    <div>
                                        <p className="text-slate-400">Notification</p>
                                        <p className="font-medium">
                                            ...
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-400">
                                ยังไม่มีข้อมูลผู้ใช้ที่บันทึกในรอบล่าสุด
                            </div>
                        )}
                    </section>
                </main>

                {/* Raw JSON */}
                <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-inner shadow-black/40">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                            <FiDatabase className="h-4 w-4 text-emerald-300" />
                            <span>Raw JSON (User Data)</span>
                        </h2>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                            สำหรับตรวจสอบ / debug
                        </span>
                    </div>

                    <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/80 p-4 text-xs font-mono text-emerald-300">
                        {result ? JSON.stringify(result, null, 2) : 'No result'}
                    </pre>
                </section>
            </div>
        </div>
    );
}

// ⭐️⭐️ default export สำหรับ React/Vite ⭐️⭐️
export default function DGAProductionFlow() {
    return (
        <DGAProductionFlowInner /> 
    )
}