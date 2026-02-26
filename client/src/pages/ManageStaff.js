import React, { useEffect, useState } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    UserIcon,
    IdentificationIcon,
    EnvelopeIcon,
    PhoneIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { Button, Input, Modal } from '../components/UI';

const ManageStaff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/members?role=staff');
            setStaffList(res.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleOpenModal = () => {
        setFormData({ name: '', email: '', phone: '', password: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalData = { ...formData };
            if (!finalData.email.includes('@')) {
                finalData.email = `${finalData.email}@gmail.com`;
            }
            await api.post('/members/staff', finalData);
            await fetchStaff();
            setIsModalOpen(false);
            alert(`Staff member ${finalData.email} registered successfully.`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create staff member');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (staffId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
            await api.patch(`/members/staff/${staffId}`, { status: newStatus });
            await fetchStaff();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const filteredStaff = staffList.filter(s =>
        `${s.personalInfo.firstName} ${s.personalInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manage Staff</h3>
                    <p className="text-slate-500 font-medium">Control operational access and register new field officers.</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Register Staff
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/20">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 font-black text-xs uppercase tracking-widest italic">Syncing staff directory...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-4">Officer Identity</th>
                                    <th className="px-8 py-4">Communication</th>
                                    <th className="px-8 py-4">Access Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStaff.length > 0 ? filteredStaff.map((staff) => (
                                    <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mr-4">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                        {staff.personalInfo.firstName} {staff.personalInfo.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">ID: {staff._id.substring(18).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-slate-600 font-medium lowercase">
                                                    <EnvelopeIcon className="w-3 h-3 mr-2 text-slate-400" />
                                                    {staff.email}
                                                </div>
                                                <div className="flex items-center text-xs text-slate-600 font-medium">
                                                    <PhoneIcon className="w-3 h-3 mr-2 text-slate-400" />
                                                    {staff.personalInfo.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {staff.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => toggleStatus(staff._id, staff.status)}
                                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${staff.status === 'Active' ? 'text-rose-500 border-rose-100 hover:bg-rose-50' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-black text-[10px] uppercase italic tracking-widest">No staff members records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Staff">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center space-x-3 mb-2">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
                        <p className="text-[11px] font-bold text-indigo-900 leading-tight uppercase tracking-wider">
                            This person will be granted operational access to manage members and payments.
                        </p>
                    </div>

                    <Input
                        label="Full Legal Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        icon={IdentificationIcon}
                    />
                    <Input
                        label="Work Email Address"
                        type="email"
                        placeholder="e.g. staff_name@gmail.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        icon={EnvelopeIcon}
                    />
                    <Input
                        label="Contact Phone (Optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        icon={PhoneIcon}
                    />
                    <Input
                        label="Initial Access Key (Password)"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        icon={ShieldCheckIcon}
                    />

                    <div className="flex space-x-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" disabled={submitting}>
                            {submitting ? 'Registering...' : 'Confirm Registration'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageStaff;
