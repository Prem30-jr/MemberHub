import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err) {
            console.error('Login Error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('Account not found. Please register first.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect access key. Please try again.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please login.');
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
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Side: Illustration & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-primary to-purple-800 p-12 flex-col justify-between text-white relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter italic">MemberHub</h1>
                    </div>

                    <div className="mt-12 max-w-lg">
                        <h2 className="text-6xl font-black leading-tight mb-6">
                            Smart <span className="text-white/70">Membership</span> Management.
                        </h2>
                        <p className="text-xl text-indigo-100/80 leading-relaxed font-medium">
                            The all-in-one platform for recurring billing, member engagement, and financial analytics.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center text-[10px] font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-bold text-indigo-100">Trusted by 500+ Organizations</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50 relative">
                <div className="absolute top-0 right-0 p-8">
                    <button className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">Help Center</button>
                </div>

                <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fade-in">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                            {isRegistering ? 'Create Account' : 'System Login'}
                        </h3>
                        <p className="text-slate-500 font-medium">
                            {isRegistering ? 'Secure your operational access now.' : 'Please enter your operational credentials.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl mb-8 text-sm font-bold flex items-center animate-shake">
                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Email Domain</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-semibold text-slate-900 placeholder:text-slate-300"
                                    placeholder="admin@memberhub.io"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Access Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all duration-300 outline-none font-semibold text-slate-900 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${isRegistering ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-primary-dark'} text-white font-black py-4 px-4 rounded-2xl transition-all duration-300 shadow-xl shadow-primary/30 disabled:opacity-50 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center space-x-2`}
                        >
                            <span>{loading ? 'Authenticating...' : (isRegistering ? 'Create Security Profile' : 'Establish Session')}</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm font-bold text-slate-400">
                        {isRegistering ? 'Already have access?' : "Need system access?"}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="ml-2 text-primary hover:underline"
                        >
                            {isRegistering ? 'Login Instead' : 'Register Now'}
                        </button>
                    </p>

                    <div className="mt-8 flex items-center justify-between">
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                        <span className="mx-4 text-xs font-black text-slate-300 uppercase tracking-widest">Enterprise Sync</span>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="mt-8 w-full flex items-center justify-center space-x-3 bg-white border-2 border-slate-50 text-slate-700 font-bold py-4 px-4 rounded-2xl hover:border-primary/20 hover:bg-slate-50 transition-all duration-300 group shadow-sm"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Continue with SSO</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
