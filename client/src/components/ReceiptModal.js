import React, { useRef } from 'react';
import { Modal, Button } from './UI';
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReceiptModal = ({ isOpen, onClose, payment }) => {
    const receiptRef = useRef();

    if (!payment) return null;

    const downloadPDF = async () => {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${payment.transactionId || 'Payment'}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt">
            <div className="space-y-6">
                {/* Print Area */}
                <div ref={receiptRef} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm receipt-print-area">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm italic">M</div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">MemberHub</h2>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">
                                Premium Subscription<br />
                                Management Enterprise
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {payment.status}
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">
                                TXN ID: #{payment.transactionId || payment._id.substring(18).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-slate-50 py-6">
                        <div>
                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Bill To</p>
                            <p className="text-sm font-black text-slate-800">{payment.member?.personalInfo.firstName} {payment.member?.personalInfo.lastName}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{payment.member?.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Issue Date</p>
                            <p className="text-sm font-black text-slate-800">{new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                            <span>Service Description</span>
                            <span>Total</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                            <div>
                                <p className="text-sm font-black text-slate-800">Subscription Tier: {payment.plan?.name}</p>
                                <p className="text-[11px] text-slate-500 font-bold uppercase italic tracking-tighter">Plan Duration: {payment.plan?.duration}</p>
                            </div>
                            <p className="text-lg font-black text-slate-900">${payment.amount.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end pt-4 border-t border-slate-100 italic">
                        <div className="flex justify-between w-full max-w-[200px] mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal</span>
                            <span className="text-sm font-bold text-slate-900">${payment.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-[200px] pt-2 border-t border-slate-200">
                            <span className="text-[10px] font-black text-primary uppercase">Grand Total</span>
                            <span className="text-xl font-black text-primary font-mono">${payment.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Thank you for your business</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-6 border-t border-slate-100">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Close
                    </Button>
                    <Button type="button" variant="secondary" onClick={handlePrint}>
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </Button>
                    <Button className="flex-1" onClick={downloadPDF}>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .receipt-print-area, .receipt-print-area * { visibility: visible; }
                    .receipt-print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .fixed, .Modal, button { display: none !important; }
                }
            `}} />
        </Modal>
    );
};

export default ReceiptModal;
