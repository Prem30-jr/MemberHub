import React, { useEffect, useState } from 'react';
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    BellAlertIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { Button } from '../components/UI';

const Notifications = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/members');
            const members = response.data;

            const now = new Date();
            const sevenDays = new Date();
            sevenDays.setDate(now.getDate() + 7);

            const newAlerts = [];

            // 1. Critical Expiries (Warning)
            const expiring = members.filter(m => {
                const expiry = new Date(m.endDate);
                return expiry > now && expiry <= sevenDays;
            });

            if (expiring.length > 0) {
                newAlerts.push({
                    id: 'expiry',
                    priority: 'high',
                    type: 'warning',
                    title: 'Upcoming Expirations',
                    message: `${expiring.length} member accounts are within the 7-day renewal window. Reach out to prevent service interruption.`,
                    count: expiring.length,
                    icon: ExclamationTriangleIcon,
                    color: 'amber'
                });
            }

            // 2. Officially Expired (Error)
            const expired = members.filter(m => m.status === 'Expired' || new Date(m.endDate) < now);
            if (expired.length > 0) {
                newAlerts.push({
                    id: 'expired',
                    priority: 'critical',
                    type: 'error',
                    title: 'Service Suspensions',
                    message: `${expired.length} memberships have reached their terminal date. Automated access restriction triggered.`,
                    count: expired.length,
                    icon: BellAlertIcon,
                    color: 'rose'
                });
            }

            // 3. System Health (Success)
            newAlerts.push({
                id: 'system',
                priority: 'low',
                type: 'success',
                title: 'Infrastructure Status',
                message: 'Subscription synchronization and cron tasks are performing optimally. MongoDB & Firebase connectivity: STABLE.',
                icon: CheckCircleIcon,
                color: 'emerald'
            });

            setAlerts(newAlerts);
        } catch (err) {
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-widest">Alerts & Dispatch</h3>
                    <p className="text-slate-500 font-medium">Critical system notifications and maintenance reminders.</p>
                </div>
                <Button variant="secondary" onClick={fetchAlerts} disabled={loading}>
                    <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Radar
                </Button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-16 text-center text-slate-400 font-black text-xs uppercase tracking-[0.2em] italic">Scanning system logs...</div>
                ) : alerts.length > 0 ? alerts.map((alert) => (
                    <div key={alert.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-start space-x-6 hover:shadow-xl transition-all duration-300 group">
                        <div className={`p-4 rounded-2xl bg-${alert.color}-50 text-${alert.color}-500 border border-${alert.color}-100 shadow-sm transition-transform group-hover:scale-110`}>
                            <alert.icon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-black text-slate-800 uppercase tracking-widest">{alert.title}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${alert.priority === 'critical' ? 'bg-rose-100 text-rose-700' :
                                        alert.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {alert.priority} Priority
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                                {alert.message}
                            </p>
                            <div className="flex space-x-3">
                                {alert.id !== 'system' && (
                                    <Button size="sm" className="font-black text-[10px] uppercase tracking-widest px-6">
                                        Take Resolution Action
                                    </Button>
                                )}
                                <button className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-slate-600 transition-colors pl-2">
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-center text-slate-400 py-24 font-black uppercase text-xs tracking-widest">Sky is clear. No active threats detected.</p>}
            </div>
        </div>
    );
};

export default Notifications;
