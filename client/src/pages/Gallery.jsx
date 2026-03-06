import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, Clock, Shuffle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAudio } from '../context/AudioContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = API_URL;

const Gallery = () => {
    const [flowers, setFlowers] = useState([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('newest'); // newest, liked, random
    const { playPopSound } = useAudio();

    useEffect(() => {
        fetchData();

        const socket = io(SOCKET_URL);

        socket.on('new-flower', (newFlower) => {
            // Prepend new flowers to the list
            setFlowers(prev => [newFlower, ...prev]);
            setCount(prev => prev + 1);
        });

        socket.on('flower-liked', (updatedFlower) => {
            setFlowers(prev => prev.map(f =>
                f._id === updatedFlower._id
                    ? { ...f, likes: updatedFlower.likes } // spread keeps hasLikedLocally intact
                    : f
            ));
        });

        return () => socket.disconnect();
    }, []);

    const fetchData = async () => {
        try {
            const [flowersRes, countRes] = await Promise.all([
                fetch(`${API_URL}/api/flowers`),
                fetch(`${API_URL}/api/flowers/count`)
            ]);

            if (flowersRes.ok && countRes.ok) {
                const flowersData = await flowersRes.json();
                const countData = await countRes.json();

                setFlowers(flowersData);
                setCount(countData.count);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (id) => {
        try {
            // Optimistic update
            setFlowers(prev => prev.map(f => {
                if (f._id === id) return { ...f, likes: (f.likes || 0) + 1, hasLikedLocally: true };
                return f;
            }));

            playPopSound(); // gentle feedback

            const res = await fetch(`${API_URL}/api/flowers/${id}/like`, {
                method: 'PUT'
            });

            if (!res.ok) {
                // Revert if failed (simple way is refetch, but let's just ignore for now to keep it smooth)
                console.error("Failed to like");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sortedFlowers = [...flowers].sort((a, b) => {
        if (filter === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (filter === 'liked') return (b.likes || 0) - (a.likes || 0);
        if (filter === 'random') return 0.5 - Math.random(); // Note: random re-sorts on every render unless memoized, but it's okay for a simple shuffle
        return 0;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow w-full bg-[#f5f3e7] p-4 md:p-8 lg:p-12 min-h-[calc(100vh-4rem)] relative"
        >
            <div className="max-w-6xl mx-auto z-10 relative">
                <header className="mb-10 text-center">
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-5xl text-[#8b5a2b] font-bold mb-4 font-caveat"
                    >
                        Community Gallery
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-500 font-sans"
                    >
                        {isLoading ? 'Counting flowers...' : `A beautiful collection of ${count} hand-drawn flowers`}
                    </motion.p>
                </header>

                {/* Filters */}
                <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10">
                    {[
                        { id: 'newest', label: 'Newest', icon: <Clock size={16} /> },
                        { id: 'liked', label: 'Most Loved', icon: <TrendingUp size={16} /> },
                        { id: 'random', label: 'Shuffle', icon: <Shuffle size={16} /> }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm md:text-base border-2 transition-all ${filter === f.id
                                ? 'bg-white border-[#8b5a2b] text-[#8b5a2b] shadow-sm transform scale-105'
                                : 'bg-transparent border-[#e2d6c1] text-gray-500 hover:bg-white hover:text-[#8b5a2b]'
                                }`}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center flex-col items-center gap-4 py-20">
                        <div className="w-12 h-12 border-4 border-[#8b5a2b] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[#8b5a2b] text-xl animate-pulse font-caveat">Gathering flowers...</p>
                    </div>
                ) : (
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6 pb-20">
                        <AnimatePresence>
                            {sortedFlowers.map((flower, index) => (
                                <motion.div
                                    layout
                                    key={flower._id} // Using _id here keeps React Spring / Framer happy during sorts
                                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{
                                        layout: { type: "spring", stiffness: 100, damping: 14 },
                                        opacity: { duration: 0.3 },
                                        scale: { duration: 0.3 }
                                    }}
                                    className="bg-white p-4 rounded-3xl shadow-sm border border-[#e5e1ca] hover:shadow-xl hover:-translate-y-2 hover:border-[#8b5a2b]/30 hover:shadow-[#8b5a2b]/20 transition-all duration-300 break-inside-avoid flex flex-col items-center relative group"
                                >
                                    {/* Like Button overlay */}
                                    <button
                                        onClick={() => handleLike(flower._id)}
                                        disabled={flower.hasLikedLocally}
                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm border transition-all ${flower.hasLikedLocally
                                            ? 'bg-pink-100 border-pink-200 cursor-default scale-110'
                                            : 'bg-white/80 border-[#e5e1ca] hover:bg-white hover:scale-110 active:scale-95'
                                            }`}
                                    >
                                        <Heart
                                            size={18}
                                            className={flower.hasLikedLocally ? 'text-pink-500 fill-pink-500' : 'text-gray-400 group-hover:text-pink-400'}
                                        />

                                        {(flower.likes > 0) && (
                                            <span className="absolute -bottom-2 -left-2 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                {flower.likes}
                                            </span>
                                        )}
                                    </button>

                                    <img
                                        src={flower.imageData}
                                        alt={`Planted by ${flower.planterName}`}
                                        className="w-full h-auto object-contain max-h-48 drop-shadow-sm mb-4 mt-2"
                                        loading="lazy"
                                    />
                                    <div className="text-center w-full mt-auto">
                                        <h3 className="font-caveat font-bold text-xl md:text-2xl text-[#8b5a2b] truncate px-2">{flower.planterName || 'Anonymous Gardener'}</h3>
                                        <div className="flex justify-center items-center gap-2 mt-1 blur-[0.3px]">
                                            <span className="text-[10px] uppercase text-gray-400 font-sans tracking-widest font-bold">
                                                {new Date(flower.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {flowers.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 py-20 text-xl font-caveat w-full flex justify-center break-inside-avoid">
                                No flowers in the gallery yet. Be the first to plant one!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Background Details */}
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#e2d6c1]/20 to-transparent pointer-events-none -z-0"></div>
        </motion.div>
    );
};

export default Gallery;
