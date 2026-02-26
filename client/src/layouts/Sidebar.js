import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    UsersIcon,
    CreditCardIcon,
    ClipboardDocumentListIcon,
    BellIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { role, logout, user } = useAuth();

    const menuItems = [
        { title: 'Overview', path: '/', icon: HomeIcon, roles: ['admin', 'staff'] },
        { title: 'Personal Hub', path: '/dashboard/user', icon: HomeIcon, roles: ['user'] },
        { title: 'Manage Staff', path: '/staff', icon: UsersIcon, roles: ['admin'] },
        { title: 'Members Directory', path: '/members', icon: UsersIcon, roles: ['admin', 'staff'] },
        { title: 'Subscription Plans', path: '/plans', icon: ClipboardDocumentListIcon, roles: ['admin'] },
        { title: 'Financial Ledger', path: '/payments', icon: CreditCardIcon, roles: ['admin', 'staff'] },
        { title: 'Alert Center', path: '/notifications', icon: BellIcon, roles: ['admin', 'staff'] },
    ];

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(role));

    return (
        <div className="flex flex-col h-screen w-72 bg-white border-r border-slate-200">
            <div className="p-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                        <CreditCardIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-black tracking-tight text-slate-800">
                        Member<span className="text-primary">Hub</span>
                    </h1>
                </div>
            </div>

            <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
                {role === 'admin' && (
                    <div>
                        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supervisory</p>
                        <div className="space-y-1">
                            {filteredMenuItems.filter(i => ['Manage Staff', 'Subscription Plans'].includes(i.title)).map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 group ${isActive
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 mr-3.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        {role === 'user' ? 'Member Access' : 'Operational'}
                    </p>
                    <div className="space-y-1">
                        {filteredMenuItems.filter(i => !['Manage Staff', 'Subscription Plans'].includes(i.title)).map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 group ${isActive
                                        ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 mr-3.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase">{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200"
                    >
                        <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-medium">Operations Hub</p>
            </div>
        </div>
    );
};

export default Sidebar;
