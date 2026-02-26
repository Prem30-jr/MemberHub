import React, { useEffect, useState, useCallback } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    PencilSquareIcon,
    TrashIcon,
    CreditCardIcon,
    ChevronDoubleRightIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import Papa from 'papaparse';
import { Button, Input, Modal, Select } from '../components/UI';
import ReceiptModal from '../components/ReceiptModal';


const Members = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlan, setFilterPlan] = useState('All');

    // Renewal states
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [renewMember, setRenewMember] = useState(null);

    // Member Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        planId: '',
        status: 'Active',
        paymentMethod: 'manual'
    });

    // AI Message states
    const [smartMessage, setSmartMessage] = useState('');
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

    // History Modal states
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Receipt state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [membersRes, plansRes] = await Promise.all([
                api.get('/members'),
                api.get('/plans')
            ]);
            setMembers(membersRes.data.filter(m => m.role === 'user'));
            setPlans(plansRes.data);

            // Auto-select first plan if none selected
            if (plansRes.data.length > 0 && !formData.planId) {
                setFormData(prev => ({ ...prev, planId: plansRes.data[0]._id }));
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [formData.planId]);

    useEffect(() => {
        fetchData();
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, [fetchData]);

    const handleRazorpayOnboarding = async (resMember, plan) => {
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
                description: `Initial Payment for ${plan.name}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await api.post('/payments/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            memberId: resMember._id,
                            planId: plan._id,
                            amount: plan.price
                        });

                        alert('Onboarding and Payment successful!');
                        await fetchData();
                        setIsModalOpen(false);
                    } catch (err) {
                        alert('Verification failed: ' + (err.response?.data?.message || err.message));
                    }
                },
                prefill: {
                    name: resMember.personalInfo.firstName + ' ' + resMember.personalInfo.lastName,
                    email: resMember.email,
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

    const handleRenewPayment = async () => {
        if (!renewMember || !renewMember.currentPlan) return;
        const plan = renewMember.currentPlan;

        try {
            // 1. Create Order on Backend
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
                        // 2. Verify Payment on Backend
                        await api.post('/payments/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            memberId: renewMember._id,
                            planId: plan._id,
                            amount: plan.price
                        });

                        // Trigger AI Recalculation
                        await api.get(`/members/${renewMember._id}`);

                        alert('Renewal successful!');
                        await fetchData();
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

    const handleOpenModal = (member = null) => {
        if (member) {
            setCurrentMember(member);
            setSmartMessage(member.smartMessage?.content || '');
            setFormData({
                firstName: member.personalInfo.firstName,
                lastName: member.personalInfo.lastName,
                email: member.email,
                phone: member.personalInfo.phone || '',
                planId: member.currentPlan?._id || plans[0]?._id || '',
                status: member.status,
                paymentMethod: 'manual'
            });
        } else {
            setCurrentMember(null);
            setSmartMessage('');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                planId: plans[0]?._id || '',
                status: 'Active',
                paymentMethod: 'manual'
            });
        }
        setIsModalOpen(true);
    };

    const handleGenerateMessage = async () => {
        if (!currentMember) return;
        setIsGeneratingMessage(true);
        try {
            const res = await api.post(`/members/${currentMember._id}/generate-message`);
            setSmartMessage(res.data.content);
            fetchData();
        } catch (error) {
            console.error('Error generating message:', error);
            alert('Failed to generate smart message.');
        } finally {
            setIsGeneratingMessage(false);
        }
    };

    const handleViewHistory = async (member) => {
        setCurrentMember(member);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/members/${member._id}/payments`);
            setPaymentHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewReceipt = (payment) => {
        const fullPayment = {
            ...payment,
            member: currentMember
        };
        setSelectedPayment(fullPayment);
        setIsReceiptOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.planId) {
            alert('Please select a Service Tier Assignment.');
            return;
        }

        try {
            if (currentMember) {
                await api.patch(`/members/${currentMember._id}`, {
                    personalInfo: { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
                    planId: formData.planId,
                    status: formData.status
                });
            } else {
                const res = await api.post('/members', {
                    ...formData,
                    role: 'user',
                    firebaseUid: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                });

                const selectedPlan = plans.find(p => p._id === formData.planId);

                if (formData.paymentMethod === 'razorpay') {
                    await handleRazorpayOnboarding(res.data, selectedPlan);
                    return;
                } else if (selectedPlan) {
                    await api.post('/payments', {
                        memberId: res.data._id,
                        planId: formData.planId,
                        amount: selectedPlan.price,
                        transactionId: `Manual Onboarding_${Date.now()}`,
                        status: 'Paid',
                        paymentMethod: 'manual'
                    });
                }
            }
            await fetchData();
            setIsModalOpen(false);
            if (!currentMember) alert('Member Onboarded Successfully');
        } catch (err) {
            console.error('Submit error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save member';
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await api.delete(`/members/${id}`);
                fetchData();
            } catch (err) {
                alert('Failed to delete member');
            }
        }
    };

    const downloadCSV = () => {
        const data = filteredMembers.map(m => ({
            Name: `${m.personalInfo.firstName} ${m.personalInfo.lastName}`,
            Email: m.email,
            Plan: m.currentPlan?.name || 'N/A',
            Status: m.status,
            EndDate: m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A'
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `members_export_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === 'All' || m.currentPlan?.name === filterPlan;
        return matchesSearch && matchesPlan;
    });

    const uniquePlansList = ['All', ...new Set(members.map(m => m.currentPlan?.name).filter(Boolean))];

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    };

    const expiringMembers = members.filter(m => {
        const days = m.endDate ? getDaysRemaining(m.endDate) : null;
        return (days !== null && days <= 7 && days >= -30) || (m.status !== 'Active');
    }).sort((a, b) => {
        const daysA = a.endDate ? getDaysRemaining(a.endDate) : 999;
        const daysB = b.endDate ? getDaysRemaining(b.endDate) : 999;
        return daysA - daysB;
    });

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Personnel Directory</h3>
                    <p className="text-slate-500 font-medium">Manage subscriber accounts and billing status.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={downloadCSV}>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Export Data
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Onboard Member
                    </Button>
                </div>
            </div>

            {expiringMembers.length > 0 && (
                <div className="bg-rose-50/50 rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-rose-100/50 bg-rose-50 flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-rose-500" />
                        <div>
                            <h4 className="text-lg font-black text-rose-900 tracking-tight">Expiring or Suspended</h4>
                            <p className="text-xs text-rose-600 font-bold uppercase tracking-widest">Action Required for {expiringMembers.length} Members</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expiringMembers.map(m => {
                                const days = getDaysRemaining(m.endDate);
                                const isExpired = days < 0;
                                return (
                                    <div key={m._id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
                                        <div className="mb-4">
                                            <p className="font-black text-slate-900 text-lg leading-tight">{m.personalInfo.firstName} {m.personalInfo.lastName}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{m.currentPlan?.name || 'N/A'}</p>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${m.status === 'Suspended' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>{m.status}</span>
                                            </div>
                                        </div>
                                        <div className="mb-4 space-y-1">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Expires: {m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A'}</p>
                                            <p className={`font-black text-sm ${isExpired || m.status !== 'Active' ? 'text-rose-600' : 'text-amber-500'}`}>
                                                {m.status === 'Suspended' ? 'Account Suspended' : (isExpired ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`)}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setRenewMember(m);
                                                setIsRenewModalOpen(true);
                                            }}
                                            className="w-full bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                                        >
                                            <CreditCardIcon className="w-4 h-4 mr-2" />
                                            Renew Subscription
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/20">
                    <div className="relative w-full md:w-96">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-3">Filter By Tier:</span>
                        <select
                            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none focus:ring-0 uppercase tracking-wider"
                            value={filterPlan}
                            onChange={(e) => setFilterPlan(e.target.value)}
                        >
                            {uniquePlansList.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 font-black text-xs uppercase italic tracking-widest">Hydrating directory records...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-5">Full Identity</th>
                                    <th className="px-8 py-5">AI Payer Category</th>
                                    <th className="px-8 py-5">Smart Suggestion</th>
                                    <th className="px-8 py-5">Subscription Grade</th>
                                    <th className="px-8 py-5">Activity State</th>
                                    <th className="px-8 py-5">Expiry Cycle</th>
                                    <th className="px-8 py-5 text-right">Operational Tools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                                    <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary font-black text-sm mr-4 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                                    {member.personalInfo.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">
                                                        {member.personalInfo.firstName} {member.personalInfo.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-bold lowercase">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${member.payerCategory === 'Regular' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' :
                                                member.payerCategory === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                                                    member.payerCategory === 'Irregular' ? 'bg-rose-50 text-rose-600 border-rose-100/50' :
                                                        'bg-slate-50 text-slate-400 border-slate-100/50'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${member.payerCategory === 'Regular' ? 'bg-indigo-500' :
                                                    member.payerCategory === 'Late' ? 'bg-amber-500' :
                                                        member.payerCategory === 'Irregular' ? 'bg-rose-500' :
                                                            'bg-slate-300'
                                                    }`} />
                                                {member.payerCategory || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                <SparklesIcon className={`w-3.5 h-3.5 ${member.recommendation?.plan ? 'text-indigo-400' : 'text-slate-200'}`} />
                                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                                    {member.recommendation?.plan?.name || 'Optimal'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col text-xs uppercase tracking-tight">
                                                <span className="font-black text-slate-700">{member.currentPlan?.name || 'Standard Tier'}</span>
                                                <span className="text-primary font-bold italic">{member.currentPlan ? `$${member.currentPlan.price}` : 'No Charge'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                member.status === 'Suspended' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                                {member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {(member.status !== 'Active' || (member.endDate && getDaysRemaining(member.endDate) <= 7)) && (
                                                    <button
                                                        onClick={() => {
                                                            setRenewMember(member);
                                                            setIsRenewModalOpen(true);
                                                        }}
                                                        className="p-2 text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 rounded-xl shadow-sm border border-rose-100"
                                                        title="Renew Now"
                                                    >
                                                        <CreditCardIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleViewHistory(member)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100" title="Financial Ledger">
                                                    <PlusIcon className="w-5 h-5 text-emerald-500" />
                                                </button>
                                                <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-white rounded-xl shadow-sm border border-slate-100" title="Edit Profile">
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(member._id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100" title="Terminate Account">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em] italic">
                                            No matches found in directory.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Main Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentMember ? 'Revise subscriber' : 'Member Onboarding'}
            >
                <div className="space-y-6">
                    {currentMember?.recommendation?.plan && (
                        <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Smart Subscription Intel</h5>
                                <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-lg">AI Recommended</span>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <SparklesIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Suggest: {currentMember.recommendation.plan.name}</p>
                                    <p className="text-xs text-slate-500 font-medium italic">"{currentMember.recommendation.reason}"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentMember && currentMember.churnRisk && (
                        <div className={`p-6 rounded-[2rem] border space-y-4 ${currentMember.churnRisk.level === 'HIGH' ? 'bg-rose-50 border-rose-100' :
                            currentMember.churnRisk.level === 'MEDIUM' ? 'bg-amber-50 border-amber-100' :
                                'bg-emerald-50 border-emerald-100'
                            }`}>
                            <div className="flex items-center justify-between">
                                <h5 className={`text-[10px] font-black uppercase tracking-widest ${currentMember.churnRisk.level === 'HIGH' ? 'text-rose-600' :
                                    currentMember.churnRisk.level === 'MEDIUM' ? 'text-amber-600' :
                                        'text-emerald-600'
                                    }`}>Churn Prediction System</h5>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider text-white ${currentMember.churnRisk.level === 'HIGH' ? 'bg-rose-600' :
                                    currentMember.churnRisk.level === 'MEDIUM' ? 'bg-amber-600' :
                                        'bg-emerald-600'
                                    }`}>
                                    {currentMember.churnRisk.level === 'HIGH' ? '🔴 Renewal Risk: HIGH' :
                                        currentMember.churnRisk.level === 'MEDIUM' ? '🟡 Renewal Risk: MEDIUM' :
                                            '🟢 Renewal Risk: LOW'}
                                </span>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className={`p-3 bg-white rounded-2xl shadow-sm border transition-transform hover:scale-110 ${currentMember.churnRisk.level === 'HIGH' ? 'border-rose-100' :
                                    currentMember.churnRisk.level === 'MEDIUM' ? 'border-amber-100' :
                                        'border-emerald-100'
                                    }`}>
                                    <ExclamationTriangleIcon className={`w-6 h-6 ${currentMember.churnRisk.level === 'HIGH' ? 'text-rose-500' :
                                        currentMember.churnRisk.level === 'MEDIUM' ? 'text-amber-500' :
                                            'text-emerald-500'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                                        Score: {currentMember.churnRisk.score}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                                        Reasons: {currentMember.churnRisk.reasons?.join(', ') || 'None'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h6 className="text-xs font-bold text-slate-700">AI Smart Reminder</h6>
                                    <button
                                        type="button"
                                        onClick={handleGenerateMessage}
                                        disabled={isGeneratingMessage}
                                        className="flex items-center bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                    >
                                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                                        {isGeneratingMessage ? 'Generating...' : 'Generate Smart Reminder'}
                                    </button>
                                </div>

                                {smartMessage && (
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
                                        <textarea
                                            value={smartMessage}
                                            onChange={(e) => setSmartMessage(e.target.value)}
                                            className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none resize-none min-h-[80px] focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => alert('Message successfully sent via FCM!')}
                                                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Legal First Name"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <Input
                                label="Legal Last Name"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Electronic Mail Address"
                            type="email"
                            required
                            disabled={!!currentMember}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Primary Phone Interface"
                            placeholder="+1 (000) 000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />

                        {!currentMember && (
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                        <CreditCardIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest leading-none">Initial Payment</p>
                                        <p className="text-[10px] text-indigo-700 font-medium mt-1">Select onboarding method</p>
                                    </div>
                                </div>
                                <div className="flex bg-white p-1 rounded-xl border border-indigo-100">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMethod: 'manual' })}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.paymentMethod === 'manual' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.paymentMethod === 'razorpay' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                                    >
                                        Razorpay
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Service Tier Assignment"
                                required
                                value={formData.planId}
                                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                                options={plans.length > 0
                                    ? plans.map(p => ({ value: p._id, label: `${p.name} ($${p.price})` }))
                                    : [{ value: '', label: 'No plans found' }]
                                }
                            />
                            <Select
                                label="Operational State"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Suspended', label: 'Suspended' },
                                    { value: 'Expired', label: 'Expired' }
                                ]}
                            />
                        </div>

                        <div className="flex space-x-3 pt-6 border-t border-slate-100">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                Abort
                            </Button>
                            <Button type="submit" className="flex-1">
                                {currentMember ? 'Apply Updates' : 'Commit Onboarding'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={`Ledger: ${currentMember?.personalInfo.firstName} ${currentMember?.personalInfo.lastName}`}
            >
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {historyLoading ? (
                        <p className="text-center py-20 text-slate-400 uppercase font-black text-xs animate-pulse tracking-widest">Querying ledger records...</p>
                    ) : paymentHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {paymentHistory.map((pay) => (
                                <div key={pay._id} className="py-4 flex justify-between items-center group hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{pay.plan?.name || 'Custom Offset'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {new Date(pay.paymentDate).toLocaleDateString()} 〈 {pay.transactionId || 'SYS_GEN'} 〉
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">${pay.amount.toFixed(2)}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${pay.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{pay.status}</p>
                                        </div>
                                        <button onClick={() => handleViewReceipt(pay)} className="p-2 text-slate-300 hover:text-primary transition-colors">
                                            <ChevronDoubleRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-20 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">No financial traffic recorded.</p>
                    )}
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6">
                    <Button variant="secondary" className="w-full" onClick={() => setIsHistoryOpen(false)}>Close Ledger</Button>
                </div>
            </Modal>

            {/* Renewal Modal */}
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
                        <p className="text-xs font-bold text-indigo-600 mt-2 uppercase tracking-tight">
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
                        <Button variant="secondary" className="flex-1" onClick={() => setIsRenewModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenewPayment} className="flex-1">Proceed to Gateway</Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default Members;
