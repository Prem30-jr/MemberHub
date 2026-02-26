import React, { useEffect, useState, useCallback } from 'react';
import {
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    PlusIcon,
    CreditCardIcon,
    UserIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, Select } from '../components/UI';
import ReceiptModal from '../components/ReceiptModal';

const Payments = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ total: 0, pendingCount: 0, overdueCount: 0, pendingAmount: 0, overdueAmount: 0 });
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Renewal Modal state
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [renewMember, setRenewMember] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('manual');
    const [formData, setFormData] = useState({
        memberId: '',
        planId: '',
        amount: '',
        transactionId: '',
        status: 'Paid'
    });

    // Receipt state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [paymentsRes, membersRes, plansRes] = await Promise.all([
                api.get('/payments'),
                api.get('/members'),
                api.get('/plans')
            ]);

            const data = paymentsRes.data;
            setPayments(data);
            setMembers(membersRes.data);
            setPlans(plansRes.data);

            // Calculate summary
            const total = data.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
            const pendingCount = data.filter(p => p.status === 'Pending').length;
            const overdueCount = data.filter(p => p.status === 'Overdue').length;
            const pendingAmount = data.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
            const overdueAmount = data.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);

            setSummary({ total, pendingCount, overdueCount, pendingAmount, overdueAmount });
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, [fetchData]);

    const handleOpenModal = () => {
        setFormData({
            memberId: members[0]?._id || '',
            planId: plans[0]?._id || '',
            amount: plans[0]?.price || '',
            transactionId: '',
            status: 'Paid'
        });
        setPaymentMethod('manual');
        setIsModalOpen(true);
    };

    const handleViewReceipt = (payment) => {
        setSelectedPayment(payment);
        setIsReceiptOpen(true);
    };

    const handleRenewPayment = async () => {
        if (!renewMember || !renewMember.currentPlan) return;
        const plan = renewMember.currentPlan;

        try {
            const orderRes = await api.post('/payments/razorpay/order', {
                amount: plan.price,
                currency: 'USD'
            });

            const { id: order_id, key_id, amount, currency } = orderRes.data;

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "MemberHub Premium",
                description: `Renewal for ${plan.name}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await api.post('/payments/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            memberId: renewMember._id,
                            planId: plan._id,
                            amount: plan.price
                        });

                        alert('Renewal successful!');
                        fetchData();
                        setIsRenewModalOpen(false);
                    } catch (err) {
                        alert('Verification failed: ' + (err.response?.data?.message || err.message));
                    }
                },
                prefill: {
                    name: renewMember.personalInfo.firstName + ' ' + renewMember.personalInfo.lastName,
                    email: renewMember.email,
                },
                theme: {
                    color: "#6366f1",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert('Razorpay initiation failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRazorpayPayment = async () => {
        try {
            // 1. Create Order on Backend
            const orderRes = await api.post('/payments/razorpay/order', {
                amount: formData.amount,
                currency: 'USD'
            });

            const { id: order_id, key_id, amount, currency } = orderRes.data;

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "MemberHub Premium",
                description: `Payment for ${plans.find(p => p._id === formData.planId)?.name}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        // 2. Verify Payment on Backend
                        await api.post('/payments/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            memberId: formData.memberId,
                            planId: formData.planId,
                            amount: formData.amount
                        });

                        alert('Payment successful!');
                        fetchData();
                        setIsModalOpen(false);
                    } catch (err) {
                        alert('Verification failed: ' + (err.response?.data?.message || err.message));
                    }
                },
                prefill: {
                    name: members.find(m => m._id === formData.memberId)?.personalInfo.firstName + ' ' + members.find(m => m._id === formData.memberId)?.personalInfo.lastName,
                    email: members.find(m => m._id === formData.memberId)?.email,
                },
                theme: {
                    color: "#6366f1",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert('Razorpay initiation failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.memberId) {
            alert('Please select a member.');
            return;
        }

        if (!formData.planId) {
            alert('Please select a plan.');
            return;
        }

        if (paymentMethod === 'razorpay') {
            handleRazorpayPayment();
            return;
        }

        try {
            await api.post('/payments', {
                ...formData,
                paymentMethod: 'manual'
            });
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Record entry error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to record payment';
            alert(`Error: ${errorMsg}`);
        }
    };

    const downloadCSV = () => {
        const data = filteredPayments.map(p => ({
            TransactionID: p.transactionId || p._id,
            Member: p.member ? `${p.member.personalInfo.firstName} ${p.member.personalInfo.lastName}` : 'N/A',
            Amount: p.amount,
            Date: new Date(p.paymentDate).toLocaleDateString(),
            Status: p.status,
            Plan: p.plan?.name || 'N/A',
            Method: p.paymentMethod || 'manual'
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `payments_report_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const filteredPayments = payments.filter(p => {
        const memberName = p.member ? `${p.member.personalInfo.firstName} ${p.member.personalInfo.lastName}` : '';
        const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.transactionId && p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleMemberChange = (id) => {
        const member = members.find(m => m._id === id);
        if (member && member.currentPlan) {
            setFormData({
                ...formData,
                memberId: id,
                planId: member.currentPlan._id,
                amount: member.currentPlan.price
            });
        } else {
            setFormData({ ...formData, memberId: id });
        }
    };

    const handlePlanChange = (id) => {
        const plan = plans.find(p => p._id === id);
        setFormData({
            ...formData,
            planId: id,
            amount: plan ? plan.price : formData.amount
        });
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h3>
                    <p className="text-slate-500 font-medium">Monitoring economic flow and individual transaction metadata.</p>
                </div>
                <div className="flex space-x-3">
                    <Button onClick={downloadCSV} variant="secondary">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Export Audit
                    </Button>
                    {role === 'staff' && (
                        <Button onClick={handleOpenModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Record Entry
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue (Paid)</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-bold text-slate-900">${summary.total.toLocaleString()}</h4>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Collected</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                    <p className="text-sm font-medium text-slate-500 mb-1">Expected (Pending)</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-bold text-slate-900">${summary.pendingAmount?.toLocaleString() || 0}</h4>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{summary.pendingCount} Invoices</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                    <p className="text-sm font-medium text-slate-500 mb-1">Loss Risk (Overdue)</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-bold text-slate-900">${summary.overdueAmount?.toLocaleString() || 0}</h4>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{summary.overdueCount} Critical</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 bg-slate-50/20">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by name or transaction ID..."
                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px] uppercase tracking-wider"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Paid">Processed</option>
                        <option value="Pending">Awaiting</option>
                        <option value="Overdue">Defaulted</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 font-black text-xs uppercase italic tracking-widest">Querying financial records...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-4 text-center">Reference</th>
                                    <th className="px-8 py-4">Account Holder</th>
                                    <th className="px-8 py-4">Financial Payload</th>
                                    <th className="px-8 py-4">Timeline</th>
                                    <th className="px-8 py-4 text-right">Operational Tools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredPayments.length > 0 ? filteredPayments.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <p className="font-mono text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">
                                                    #{txn.transactionId || txn._id.substring(18).toUpperCase()}
                                                </p>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-100 ${txn.paymentMethod === 'razorpay' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-400'}`}>
                                                    {txn.paymentMethod || 'manual'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800">
                                                    {txn.member ? `${txn.member.personalInfo.firstName} ${txn.member.personalInfo.lastName}` : 'Direct Entry'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                    {txn.plan?.name || 'Custom Service'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">${txn.amount.toFixed(2)}</span>
                                                <span className={`text-[9px] font-black uppercase inline-block mt-0.5 tracking-widest ${txn.status === 'Paid' ? 'text-emerald-500' :
                                                    txn.status === 'Pending' ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>
                                                    {txn.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                            {new Date(txn.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                {role === 'staff' && txn.member && (txn.member.status !== 'Active') && (
                                                    <button
                                                        onClick={() => {
                                                            setRenewMember(txn.member);
                                                            setIsRenewModalOpen(true);
                                                        }}
                                                        className="p-2 text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 rounded-xl shadow-sm border border-rose-100"
                                                        title="Process Renewal"
                                                    >
                                                        <CreditCardIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleViewReceipt(txn)}
                                                    className="p-2 text-slate-400 hover:text-primary transition-colors bg-white rounded-xl shadow-sm border border-slate-100"
                                                    title="View Receipt"
                                                >
                                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/members?id=${txn.member?._id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100"
                                                    title="Member Profile"
                                                >
                                                    <UserIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-black text-[10px] uppercase italic tracking-[0.2em]">
                                            No financial traffic recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Record Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Financial Injection"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                <CreditCardIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Payment Method</p>
                                <p className="text-xs text-indigo-700 font-medium">Select gateway or manual log</p>
                            </div>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-indigo-100">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('manual')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-slate-50'}`}
                            >
                                Manual
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('razorpay')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'razorpay' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-slate-50'}`}
                            >
                                Razorpay
                            </button>
                        </div>
                    </div>

                    <Select
                        label="Member Selection"
                        required
                        value={formData.memberId}
                        onChange={(e) => handleMemberChange(e.target.value)}
                        options={members.length > 0
                            ? members.map(m => ({ value: m._id, label: `${m.personalInfo.firstName} ${m.personalInfo.lastName}` }))
                            : [{ value: '', label: 'No members found' }]
                        }
                    />
                    <div className="grid grid-cols-2 gap-5">
                        <Select
                            label="Applied Tier"
                            required
                            value={formData.planId}
                            onChange={(e) => handlePlanChange(e.target.value)}
                            options={plans.length > 0
                                ? plans.map(p => ({ value: p._id, label: p.name }))
                                : [{ value: '', label: 'No active plans found' }]
                            }
                        />
                        <Input
                            label="Net Amount ($)"
                            type="number"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>

                    {paymentMethod === 'manual' ? (
                        <>
                            <Input
                                label="Log Ref / Memo"
                                placeholder="e.g. CASH_REF_102"
                                value={formData.transactionId}
                                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                            />
                            <Select
                                label="Transaction Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                options={[
                                    { value: 'Paid', label: 'Processed (Paid)' },
                                    { value: 'Pending', label: 'Queued (Pending)' }
                                ]}
                            />
                        </>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Razorpay Checkout Enabled</p>
                            <p className="text-xs text-slate-500 font-medium italic">Payment will be processed via test gateway upon clicking "Proceed to Gateway".</p>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-6 border-t border-slate-100 mt-6">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Abort
                        </Button>
                        <Button type="submit" className="flex-1">
                            {paymentMethod === 'razorpay' ? 'Proceed to Gateway' : 'Commit Record'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                payment={selectedPayment}
            />

            {/* Renew Modal */}
            <Modal
                isOpen={isRenewModalOpen}
                onClose={() => setIsRenewModalOpen(false)}
                title="Process Renewal"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center">
                        <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-1">Renewal For</p>
                        <p className="text-lg font-black text-indigo-700">
                            {renewMember?.personalInfo?.firstName} {renewMember?.personalInfo?.lastName}
                        </p>
                        <p className="text-xs font-bold text-indigo-600 mt-2">
                            {renewMember?.currentPlan?.name} 〈 ${renewMember?.currentPlan?.price} 〉
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50 flex items-start gap-4 rounded-2xl border border-slate-200">
                        <ExclamationTriangleIcon className="w-6 h-6 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            A secure checkout window provided by Razorpay will open. After a successful payment, the subscription will auto-renew.
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsRenewModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenewPayment} type="button" className="flex-1">
                            Proceed to Gateway
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Payments;
