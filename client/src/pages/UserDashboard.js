import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    UserIcon,
    CreditCardIcon,
    ClockIcon,
    SparklesIcon,
    ArrowPathIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
// import { Button } from '../components/UI';

const UserDashboard = () => {
    const { memberData } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!memberData?._id) return;
            try {
                // The /me route will already have updated memberData if we refresh or on mount
                // but we also need payment history
                const res = await api.get(`/members/${memberData._id}/payments`);
                setPayments(res.data.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)));
            } catch (err) {
                console.error('Error fetching user data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [memberData]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Personal Hub...</p>
        </div>
    );

    const daysLeft = memberData?.endDate ? Math.ceil((new Date(memberData.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    const isExpired = daysLeft < 0;

    return (
        <div className="space-y-8 pb-12 animate-fade-in">
            {/* Header Greeting */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-[80px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="bg-primary/20 text-primary-light text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-primary/30">
                                {memberData?.payerCategory || 'Regular'} Member
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${memberData?.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                {memberData?.status}
                            </span>
                        </div>
                        <h2 className="text-5xl font-black tracking-tight mb-3">Hello, {memberData?.personalInfo?.firstName}!</h2>
                        <p className="text-indigo-200/60 font-medium text-lg">Managing your premium access and community insights.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl px-8 py-6 rounded-[2rem] border border-white/10 text-center shadow-xl">
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-indigo-300/50 mb-2 leading-none">Days remaining</p>
                            <p className="text-4xl font-black text-white">{Math.max(0, daysLeft)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <ShieldCheckIcon className="w-32 h-32" />
                        </div>

                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Subscription Essence</h3>
                                <p className="text-sm text-slate-400 font-medium">Core metadata regarding your current tier.</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl">
                                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between group hover:border-primary/20 transition-colors">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Active Tier</p>
                                    <p className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors">{memberData?.currentPlan?.name || 'Standard Access'}</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200/60">
                                    <p className="text-primary font-black text-xl">${memberData?.currentPlan?.price || 0}<span className="text-xs text-slate-400 ml-1">/ cycle</span></p>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between group hover:border-emerald-500/20 transition-colors">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Terminus Date</p>
                                    <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors">
                                        {memberData?.endDate ? new Date(memberData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}
                                    </p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200/60">
                                    <p className={`font-black text-xs uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {isExpired ? '⚠ Phase Expired' : '✓ Status Synchronized'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Intel Pack */}
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {memberData?.recommendation?.plan && (
                                <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500">
                                        <SparklesIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">AI Recommendation</p>
                                        <p className="text-xs font-bold text-indigo-700 mb-1">Upgrade to {memberData.recommendation.plan.name}</p>
                                        <p className="text-[10px] text-indigo-600/70 font-medium italic leading-relaxed">"{memberData.recommendation.reason}"</p>
                                    </div>
                                </div>
                            )}

                            {memberData?.smartMessage?.content && (
                                <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-start gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl text-primary-light">
                                        <SparklesIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Smart Advisor</p>
                                        <p className="text-[10px] text-slate-200 font-medium leading-relaxed italic">"{memberData.smartMessage.content}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Financial Ledger</h3>
                                <p className="text-sm text-slate-400 font-medium">Audit trail of all processed transactions.</p>
                            </div>
                            <CreditCardIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="space-y-4">
                            {payments.length > 0 ? payments.map((pay) => (
                                <div key={pay._id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <ArrowPathIcon className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{pay.plan?.name || 'Subscription Update'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(pay.paymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">${pay.amount}</p>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${pay.status === 'Paid' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                                            {pay.status}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">No financial traffic recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Security & Identity */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <UserIcon className="w-24 h-24" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Identity Module</h3>
                        <div className="space-y-5">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">System Identifier</p>
                                <p className="text-[10px] font-mono font-bold text-slate-600 break-all">{memberData?._id}</p>
                            </div>
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200">
                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Alias</p>
                                    <p className="text-xs font-black text-slate-900">{memberData?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200">
                                    <ClockIcon className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registration Epoch</p>
                                    <p className="text-xs font-black text-slate-900">{new Date(memberData?.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Progression */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Cycle Progression</h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10 tracking-widest">
                                        Term Progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black inline-block text-slate-400 uppercase tracking-widest">
                                        {Math.max(0, 100 - Math.round((daysLeft / 30) * 100))}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                                <div
                                    style={{ width: `${Math.max(5, 100 - (daysLeft / 30) * 100)}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-1000"
                                ></div>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                                Visualizing your distance from the next renewal milestone.
                            </p>
                        </div>
                    </div>

                    {/* Exclusive Perks */}
                    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8">Exclusive Perks</h3>
                        <ul className="space-y-4">
                            {[
                                { title: 'Priority Access', desc: 'Direct operations link' },
                                { title: 'Smart Insights', desc: 'AI-driven behavioral tech' },
                                { title: 'Unified Billing', desc: 'Seamless financial ledger' }
                            ].map((perk, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">{perk.title}</p>
                                        <p className="text-[8px] text-slate-400 font-medium">{perk.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
