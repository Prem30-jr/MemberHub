import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ShieldCheckIcon, UserGroupIcon, IdentificationIcon, KeyIcon } from '@heroicons/react/24/outline';

const Login = () => {
    const [loginType, setLoginType] = useState('admin'); // 'admin' or 'staff'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const { loginWithGoogle, loginStaff, user, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && role) {
            if (role === 'admin') navigate('/dashboard/admin');
            else if (role === 'staff') navigate('/dashboard/staff');
            else navigate('/dashboard/user');
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let finalEmail = email;
            if (loginType === 'staff' && !email.includes('@')) {
                finalEmail = `${email}@gmail.com`;
            }

            if (loginType === 'admin') {
                if (isRegistering) {
                    await createUserWithEmailAndPassword(auth, finalEmail, password);
                } else {
                    await signInWithEmailAndPassword(auth, finalEmail, password);
                }
            } else {
                // Custom Staff Login
                await loginStaff(finalEmail, password);
            }
            // Navigate will be handled by useEffect [user, role]
        } catch (err) {
            console.error('Login Error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('Account not found. Please register first.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect access key. Please try again.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(err.message || 'Failed to establish session. Check credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Failed to log in with Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden font-sans">
            {/* Left Side: Illustration & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-primary p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <ShieldCheckIcon className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic">MemberHub <span className="text-primary-light">Pro</span></h1>
                    </div>

                    <div className="mt-20 max-w-lg">
                        <h2 className="text-7xl font-black leading-[1.1] mb-8 tracking-tighter">
                            Secure <span className="text-white/40">Enterprise</span> Access.
                        </h2>
                        <p className="text-xl text-indigo-100/60 leading-relaxed font-medium">
                            The intelligent gateway for administrative oversight and operational excellence.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-xs font-black tracking-widest">
                                    0{i}
                                </div>
                            ))}
                        </div>
                        <div className="h-12 w-[1px] bg-white/10"></div>
                        <span className="text-sm font-bold text-indigo-200/50 uppercase tracking-[0.2em]">Deployment V2.4.0</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50 relative">
                <div className="max-w-md w-full">
                    {/* Role Switcher */}
                    <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] mb-12 border border-slate-200 shadow-inner">
                        <button
                            onClick={() => { setLoginType('admin'); setError(''); }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest ${loginType === 'admin' ? 'bg-white text-primary shadow-lg ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>Administrator</span>
                        </button>
                        <button
                            onClick={() => { setLoginType('staff'); setError(''); setIsRegistering(false); }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest ${loginType === 'staff' ? 'bg-white text-primary shadow-lg ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <UserGroupIcon className="w-4 h-4" />
                            <span>Field Staff</span>
                        </button>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fade-in relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-colors duration-500 ${loginType === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>

                        <div className="mb-12 relative z-10">
                            <h3 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                                {isRegistering ? 'Initialize Profile' : (loginType === 'admin' ? 'Admin Vault' : 'Staff Portal')}
                            </h3>
                            <p className="text-slate-400 font-medium">
                                {loginType === 'admin'
                                    ? 'Access the master supervisory control system.'
                                    : 'Enter your operational communication channel.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-[1.5rem] mb-8 text-xs font-black uppercase tracking-widest flex items-center animate-shake leading-relaxed shadow-sm">
                                <span className="bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-[10px]">!</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identity Signature</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <IdentificationIcon className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                        placeholder={loginType === 'admin' ? 'master@memberhub.io' : 'staff_name@gmail.com'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Security Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <KeyIcon className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-5 px-6 rounded-[1.5rem] text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-50 transform hover:-translate-y-1 active:scale-[0.98] ${loginType === 'admin'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                    }`}
                            >
                                <span>{loading ? 'Validating...' : (isRegistering ? 'Setup Profile' : 'Authorize Session')}</span>
                                <div className="w-2 h-2 rounded-full bg-white/30 animate-ping"></div>
                            </button>
                        </form>

                        {loginType === 'admin' && (
                            <>
                                <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {isRegistering ? 'Existing Security ID?' : "First Administrative Entry?"}
                                    <button
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="ml-2 text-primary hover:text-indigo-800 transition-colors"
                                    >
                                        {isRegistering ? 'Login' : 'Initialize'}
                                    </button>
                                </p>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    <span className="mx-6 text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">External SSO</span>
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                </div>

                                <button
                                    onClick={handleGoogleSignIn}
                                    className="mt-10 w-full flex items-center justify-center space-x-4 bg-white border-2 border-slate-50 text-slate-600 font-bold py-5 px-6 rounded-[1.5rem] hover:border-primary/20 hover:bg-slate-50 transition-all duration-300 group shadow-sm"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0" />
                                    <span className="text-[11px] uppercase tracking-widest font-black">Sync with Corporate ID</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
