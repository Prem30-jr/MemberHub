import React, { useEffect, useState } from 'react';
import {
    UsersIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    BellAlertIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import api from '../services/api';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { Button, Toast } from '../components/UI';

const Dashboard = () => {
    const { role } = useAuth();
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [aiPieData, setAiPieData] = useState([]);
    const [activities, setActivities] = useState([]);
    const [renewals, setRenewals] = useState([]);
    const [recData, setRecData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ isOpen: false, message: '' });

    const COLORS = ['#6366f1', '#f43f5e', '#eab308'];
    const AI_COLORS = ['#818cf8', '#fbbf24', '#f87171'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [membersRes, paymentsRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/payments')
                ]);

                const members = membersRes.data;
                const payments = paymentsRes.data;

                // Calculate Stats
                const totalMembers = members.length;
                const activeMembers = members.filter(m => m.status === 'Active').length;
                const expiredMembers = members.filter(m => m.status === 'Expired').length;
                const suspendedMembers = members.filter(m => m.status === 'Suspended').length;

                const totalRevenue = payments
                    .filter(p => p.status === 'Paid')
                    .reduce((sum, p) => sum + p.amount, 0);
                const overduePayments = payments.filter(p => p.status === 'Overdue').length;

                // AI Category distribution
                const regularPayers = members.filter(m => m.payerCategory === 'Regular').length;
                const latePayers = members.filter(m => m.payerCategory === 'Late').length;
                const irregularPayers = members.filter(m => m.payerCategory === 'Irregular').length;

                const dashboardStats = [
                    { title: 'Total Members', value: totalMembers, icon: UsersIcon, color: 'blue' },
                    { title: 'Active vs Expired', value: `${activeMembers} / ${expiredMembers}`, icon: ClockIcon, color: 'green' },
                ];

                // Only Admin sees revenue stats
                if (role === 'admin') {
                    dashboardStats.push(
                        { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'purple' },
                        { title: 'Behavioral Health', value: `${Math.round((regularPayers / totalMembers) * 100 || 0)}% Regular`, icon: BellAlertIcon, color: 'indigo' }
                    );
                }

                setStats(dashboardStats);

                // Pie Chart Data
                setPieData([
                    { name: 'Active', value: activeMembers },
                    { name: 'Expired', value: expiredMembers },
                    { name: 'Suspended', value: suspendedMembers },
                ]);

                // AI Pie Data
                setAiPieData([
                    { name: 'Regular', value: regularPayers },
                    { name: 'Late', value: latePayers },
                    { name: 'Irregular', value: irregularPayers },
                ]);

                // Mock Revenue Growth data for chart
                setChartData([
                    { name: 'Jul', revenue: 4200 },
                    { name: 'Aug', revenue: 3800 },
                    { name: 'Sep', revenue: 5100 },
                    { name: 'Oct', revenue: 4600 },
                    { name: 'Nov', revenue: 5900 },
                    { name: 'Dec', revenue: 6400 },
                ]);

                // Recent Members
                setActivities(members.slice(0, 5).map(m => ({
                    id: m._id,
                    name: `${m.personalInfo.firstName} ${m.personalInfo.lastName}`,
                    plan: m.currentPlan?.name || 'No Plan',
                    time: new Date(m.createdAt).toLocaleDateString()
                })));

                // Upcoming Renewals
                const now = new Date();
                const sevenDays = new Date();
                sevenDays.setDate(now.getDate() + 7);

                setRenewals(members.filter(m => {
                    const expiry = new Date(m.endDate);
                    return expiry > now && expiry <= sevenDays;
                }).map(m => ({
                    id: m._id,
                    name: `${m.personalInfo.firstName} ${m.personalInfo.lastName}`,
                    expiry: new Date(m.endDate).toLocaleDateString(),
                })));

                // Recommendation Chart Data
                const recommendationCounts = members.reduce((acc, m) => {
                    const planName = m.recommendation?.plan?.name || 'Not Analyzed';
                    acc[planName] = (acc[planName] || 0) + 1;
                    return acc;
                }, {});
                setRecData(Object.entries(recommendationCounts).map(([name, value]) => ({ name, value })));

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [role]);

    const downloadReport = () => {
        const data = activities.map(a => ({ Name: a.name, Plan: a.plan, Joined: a.time }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `summary_report_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const handleNotify = (memberName) => {
        setToast({
            isOpen: true,
            message: `Notification sent to ${memberName}`
        });
        setTimeout(() => {
            setToast({ isOpen: false, message: '' });
        }, 4000);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium italic">Generating analytical insights...</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Overview</h3>
                    <p className="text-slate-500 font-medium">Hello, <span className="text-primary font-bold capitalize">{role}</span>. Here is your operational status.</p>
                </div>
                <Button onClick={downloadReport} variant="secondary">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Export Brief
                </Button>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-primary transition-colors`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.title}</h4>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {role === 'admin' && (
                    <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">Revenue Trajectory</h4>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+12.5% this month</span>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className={`${role === 'admin' ? '' : 'lg:col-span-3'} bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100`}>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-10">Membership Health</h4>
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Insights Row */}
            {role === 'admin' && (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">AI Behavioral Analysis</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Smart classification based on renewal & payment history</p>
                        </div>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg uppercase tracking-wider border border-indigo-100">Live AI Logic</span>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={aiPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    labelLine={false}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {aiPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={AI_COLORS[index % AI_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontWeight: 'black', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* AI Recommendation Insights Row */}
            {
                role === 'admin' && (
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">Growth Engine: Recommended Plans</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1">AI suggestions to maximize LTV and retention</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={recData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} width={120} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            }

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-md font-black text-slate-800 uppercase tracking-widest">Renewal Radar</h4>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-lg uppercase tracking-wider border border-amber-100">Alert Required</span>
                    </div>
                    <div className="space-y-4">
                        {renewals.length > 0 ? renewals.map((member) => (
                            <div key={member.id} className="flex items-center p-5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-primary/20 hover:bg-white transition-all group">
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900">{member.name}</p>
                                    <p className="text-[11px] text-slate-400 font-bold">Expiration: {member.expiry}</p>
                                </div>
                                <button
                                    onClick={() => handleNotify(member.name)}
                                    className="text-[10px] font-black text-primary px-4 py-2 bg-primary/5 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                    Notify Member
                                </button>
                            </div>
                        )) : <p className="text-sm text-slate-400 italic py-4">No critical expiries detected for this window.</p>}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h4 className="text-md font-black text-slate-800 uppercase tracking-widest mb-8">Recently Registered</h4>
                    <div className="space-y-4">
                        {activities.map((member) => (
                            <div key={member.id} className="flex items-center p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mr-5 shadow-sm">
                                    <span className="text-primary font-black text-sm">{member.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 leading-tight mb-0.5">{member.name}</p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{member.plan} 〈 Assigned on {member.time} 〉</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div >
    );
};

export default Dashboard;
