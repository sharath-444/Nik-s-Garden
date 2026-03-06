import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageCircle, BarChart3, Database, RefreshCcw, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Admin = () => {
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('messages');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const [msgRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/messages`),
                fetch(`${API_URL}/api/flowers/stats`)
            ]);
            if (msgRes.ok && statsRes.ok) {
                setMessages(await msgRes.json());
                setStats(await statsRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow w-full bg-gray-50 font-sans p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <LayoutDashboard className="text-[#8b5a2b]" /> Admin Dashboard
                        </h1>
                        <p className="text-gray-500">Manage the digital garden environment.</p>
                    </div>
                    <button
                        onClick={fetchAdminData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm text-sm"
                    >
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 text-blue-500 mb-2">
                            <Database size={20} /> <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Flowers</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.totalFlowers || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 text-pink-500 mb-2">
                            <MessageCircle size={20} /> <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Inquiries</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{messages.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
                        <div className="flex items-center gap-3 text-orange-500 mb-2">
                            <BarChart3 size={20} /> <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Top Gardener</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{stats?.mostLiked?.planterName || 'N/A'}</p>
                        <p className="text-sm text-gray-400">with {stats?.mostLiked?.likes || 0} likes</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 font-bold text-sm">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`px-6 py-3 transition-all border-b-2 ${activeTab === 'messages' ? 'border-[#8b5a2b] text-[#8b5a2b]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Inquiries ({messages.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`px-6 py-3 transition-all border-b-2 ${activeTab === 'tools' ? 'border-[#8b5a2b] text-[#8b5a2b]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Garden Tools
                    </button>
                </div>

                {activeTab === 'messages' && (
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="bg-white p-10 rounded-3xl text-center text-gray-400 border border-gray-100">
                                No messages received yet.
                            </div>
                        ) : (
                            messages.map(msg => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg._id}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start gap-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800">{msg.name}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-sm text-gray-500">{msg.email}</span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">{msg.text}</p>
                                        <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-widest">{new Date(msg.createdAt).toLocaleString()}</p>
                                    </div>
                                    <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="bg-white p-10 rounded-3xl text-center text-gray-400 border border-gray-100">
                        Advanced garden maintenance tools coming soon.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
