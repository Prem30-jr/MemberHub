import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ShieldCheckIcon, UserGroupIcon, IdentificationIcon, KeyIcon, UserIcon } from '@heroicons/react/24/outline';

const Login = () => {
    const [loginType, setLoginType] = useState('admin'); // 'admin', 'staff', 'user'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const { loginWithGoogle, loginCustom, user, role } = useAuth();
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

            // Auto-append @gmail.com for staff and user if not present
            if ((loginType === 'staff' || loginType === 'user') && !email.includes('@')) {
                finalEmail = `${email}@gmail.com`;
            }

            if (loginType === 'admin') {
                if (isRegistering) {
                    await createUserWithEmailAndPassword(auth, finalEmail, password);
                } else {
                    await signInWithEmailAndPassword(auth, finalEmail, password);
                }
            } else if (loginType === 'staff') {
                // Staff only has login (Admin creates them)
                await loginCustom(finalEmail, password, 'staff');
            } else {
                // Simplified User Flow: No Password Required
                await loginCustom(finalEmail, null, 'user');
            }
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
        } catch (err) {
            setError('Failed to log in with Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden font-sans">
            {/* Left Side: Illustration & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-indigo-950 to-primary p-12 flex-col justify-between text-white relative overflow-hidden">
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
                            Scale your <span className="text-white/40">Community</span> smarter.
                        </h2>
                        <p className="text-xl text-indigo-100/60 leading-relaxed font-medium">
                            Premium membership management with AI-driven insights and automated workflows.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-xs font-black tracking-widest text-primary-light">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <div className="h-12 w-[1px] bg-white/10"></div>
                        <span className="text-sm font-bold text-indigo-200/50 uppercase tracking-[0.2em]">Build 2024.12A</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 relative overflow-y-auto">
                <div className="max-w-md w-full py-12">
                    {/* Role Switcher */}
                    <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] mb-10 border border-slate-200 shadow-inner">
                        {['admin', 'staff', 'user'].map((type) => (
                            <button
                                key={type}
                                onClick={() => { setLoginType(type); setError(''); setIsRegistering(false); }}
                                className={`flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${loginType === type ? 'bg-white text-primary shadow-lg ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type === 'admin' ? <ShieldCheckIcon className="w-3.5 h-3.5" /> : type === 'staff' ? <UserGroupIcon className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                                <span>{type}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fade-in relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-colors duration-500 ${loginType === 'admin' ? 'bg-indigo-600' : loginType === 'staff' ? 'bg-emerald-600' : 'bg-primary'}`}></div>

                        <div className="mb-10 relative z-10">
                            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                                {isRegistering ? 'Join Hub' : (loginType === 'admin' ? 'Superuser' : loginType === 'staff' ? 'Staff Desk' : 'Member Portal')}
                            </h3>
                            <p className="text-slate-400 text-sm font-medium">
                                {isRegistering
                                    ? 'Create your personal account today.'
                                    : `Identify yourself for the ${loginType} session.`}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-[1.25rem] mb-8 text-[11px] font-black uppercase tracking-widest flex items-center animate-shake leading-relaxed shadow-sm">
                                <span className="bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-[10px]">!</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            {isRegistering && (
                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <UserIcon className="h-4.5 w-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Username Signal</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <IdentificationIcon className="h-4.5 w-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                                        placeholder={loginType === 'admin' ? 'admin@corp.io' : `${loginType}_name@gmail.com`}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {loginType !== 'user' && (
                                <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <KeyIcon className="h-4.5 w-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-[1.25rem] text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-xl flex items-center justify-center space-x-3 disabled:opacity-50 transform hover:-translate-y-1 active:scale-[0.98] ${loginType === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' :
                                    loginType === 'staff' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' :
                                        'bg-primary hover:bg-primary-dark shadow-primary/20'
                                    }`}
                            >
                                <span>{loading ? 'Processing...' : (isRegistering ? 'Confirm Join' : 'Authorize Entry')}</span>
                            </button>
                        </form>

                        {loginType === 'admin' && (
                            <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                                {isRegistering ? 'Existing Security ID?' : "System Entry?"}
                                <button
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="ml-2 text-primary hover:text-indigo-800 transition-colors"
                                >
                                    {isRegistering ? 'Login Instead' : 'Register Now'}
                                </button>
                            </p>
                        )}

                        {loginType === 'admin' && (
                            <>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    <span className="mx-4 text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">SSO</span>
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                </div>

                                <button
                                    onClick={handleGoogleSignIn}
                                    className="mt-8 w-full flex items-center justify-center space-x-4 bg-white border border-slate-100 text-slate-600 font-bold py-4 px-6 rounded-[1.25rem] hover:border-primary/20 hover:bg-slate-50 transition-all duration-300 group shadow-sm"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                                    <span className="text-[10px] uppercase tracking-widest font-black">Sync via Corp Account</span>
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
