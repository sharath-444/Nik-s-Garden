import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, MessageSquare, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', text: '' });
    const [status, setStatus] = useState('idle'); // idle, sending, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', text: '' });
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow w-full bg-[#f5f3e7] p-6 md:p-12 lg:p-20 flex justify-center items-center font-sans"
        >
            <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white flex flex-col md:flex-row">
                {/* Left side decoration */}
                <div className="md:w-1/3 bg-[#8b5a2b] p-8 text-white flex flex-col justify-center">
                    <h2 className="text-4xl font-caveat font-bold mb-4">Leaf us a message!</h2>
                    <p className="opacity-80">We'd love to hear from our fellow gardeners. Questions, feedback, or just a hello!</p>
                    <div className="mt-8 text-6xl">🌻</div>
                </div>

                {/* Form side */}
                <div className="md:w-2/3 p-8 md:p-12">
                    {status === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500 mb-4">
                                <CheckCircle size={64} />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-[#8b5a2b] mb-2">Message Sent!</h3>
                            <p className="text-gray-500 mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="px-6 py-2 bg-[#8b5a2b] text-white rounded-full font-bold hover:bg-[#6e4620] transition-colors"
                            >
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#8b5a2b] focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#8b5a2b] focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Message</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="What's on your mind?"
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#8b5a2b] focus:bg-white outline-none transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="w-full py-4 bg-[#8b5a2b] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#6e4620] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                <Send size={20} />
                                {status === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>
                            {status === 'error' && <p className="text-red-500 text-sm text-center">Oops! Something went wrong.</p>}
                        </form>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Contact;
