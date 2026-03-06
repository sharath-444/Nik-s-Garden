import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flower2, Image as ImageIcons, Moon, Sun, Volume2, VolumeX, Mail, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

const Navbar = () => {
    const location = useLocation();
    const { isNightMode, toggleTheme } = useTheme();
    const { soundEnabled, toggleSound } = useAudio();

    const links = [
        { name: 'Garden', path: '/', icon: <Flower2 size={20} /> },
        { name: 'Gallery', path: '/gallery', icon: <ImageIcons size={20} /> },
        { name: 'Contact', path: '/contact', icon: <Mail size={20} /> },
        { name: 'Admin', path: '/admin', icon: <LayoutDashboard size={20} /> },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-[#f5f3e7]/80 backdrop-blur-md z-50 border-b border-[#e5e1ca] flex items-center justify-between px-6 md:px-12 shadow-sm transition-colors duration-500">
            <Link to="/" className="flex items-center gap-2 group">
                <motion.div
                    whileHover={{ rotate: 15 }}
                    className="text-pink-500"
                >
                    <Flower2 size={28} />
                </motion.div>
                <span className="font-caveat font-bold text-3xl tracking-wide text-[#8b5a2b]">Nik's Garden</span>
            </Link>

            <div className="flex items-center gap-4">
                <ul className="flex items-center gap-2 mr-2 border-r border-[#e5e1ca] pr-4">
                    <li>
                        <button onClick={toggleSound} className="p-2 rounded-full text-gray-500 hover:bg-white/50 hover:text-[#8b5a2b] transition-colors" title="Toggle Sound">
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                    </li>
                    <li>
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-white/50 hover:text-[#8b5a2b] transition-colors" title="Toggle Day/Night Mode">
                            {isNightMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </li>
                </ul>

                <ul className="flex items-center gap-2 md:gap-6">
                    {links.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white shadow-sm text-[#8b5a2b] scale-105' : 'text-gray-600 hover:text-[#8b5a2b] hover:bg-white/50'}`}
                                >
                                    {link.icon}
                                    <span className="hidden sm:block text-lg">{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
