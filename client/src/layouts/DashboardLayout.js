import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
    const { user, role } = useAuth();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-24 bg-white/80 backdrop-blur-lg border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            Portal <span className="text-primary text-sm font-bold bg-primary/5 px-2 py-1 rounded-lg ml-2">{role?.toUpperCase()}</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Membership Management System</p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 leading-none">{user?.displayName || user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] font-bold text-primary mt-1">{user?.email}</p>
                        </div>
                        <div className="relative">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 flex items-center justify-center text-white font-black text-lg">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-10 bg-[#fbfcfd]">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
