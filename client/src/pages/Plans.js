import React, { useEffect, useState } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { Button, Input, Modal, Select } from '../components/UI';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: 'monthly',
        description: ''
    });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/plans');
            setPlans(response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setCurrentPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                duration: plan.duration,
                description: plan.description
            });
        } else {
            setCurrentPlan(null);
            setFormData({ name: '', price: '', duration: 'monthly', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPlan(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentPlan) {
                await api.patch(`/plans/${currentPlan._id}`, formData);
            } else {
                await api.post('/plans', formData);
            }
            fetchPlans();
            handleCloseModal();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save plan');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this plan?')) {
            try {
                await api.delete(`/plans/${id}`);
                fetchPlans();
            } catch (err) {
                alert('Failed to delete plan');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Subscription Plans</h3>
                    <p className="text-slate-500">Configure and manage your tiered offerings</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create New Plan
                </Button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading plans...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.length > 0 ? plans.map((plan) => (
                        <div key={plan._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl group">
                            <div className="p-8 border-b border-slate-50">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {plan.name}
                                    </span>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(plan)} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 rounded-lg">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(plan._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-50 rounded-lg">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-baseline mb-2">
                                    <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                                    <span className="text-slate-500 ml-2 font-medium capitalize">/ {plan.duration}</span>
                                </div>
                            </div>

                            <div className="p-8 flex-1">
                                <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 mt-auto">
                                <Button onClick={() => handleOpenModal(plan)} variant="secondary" size="md" className="w-full">
                                    Update Plan Details
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <PlusIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No subscription plans found.</p>
                            <Button onClick={() => handleOpenModal()} variant="ghost" className="mt-2 text-primary">
                                Create your first plan to get started
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentPlan ? 'Edit Plan' : 'Create New Plan'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Plan Name"
                        placeholder="e.g. Premium Monthly"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Price ($)"
                            type="number"
                            placeholder="0.00"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                        <Select
                            label="Duration"
                            options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'quarterly', label: 'Quarterly' },
                                { value: 'yearly', label: 'Yearly' }
                            ]}
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm min-h-[100px]"
                            placeholder="Describe what's included in this plan..."
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex space-x-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {currentPlan ? 'Save Changes' : 'Create Plan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Plans;
