import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Audio references (using synthentic beeps/bloops since we don't have local mp3 assets)
    // We'll use Web Audio API for simple, cute, zero-dependency sound effects!
    const audioCtxRef = useRef(null);

    useEffect(() => {
        // Initialize Web Audio API on first user interaction to satisfy browser policies
        const initAudio = () => {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
        };

        document.addEventListener('click', initAudio, { once: true });
        return () => document.removeEventListener('click', initAudio);
    }, []);

    const playPopSound = () => {
        if (!soundEnabled || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        // Cute high-pitched pop
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    };

    const playSparkleSound = () => {
        if (!soundEnabled || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        // Play a tiny arpeggio to simulate sparkles
        const freqs = [880, 1108, 1318, 1760]; // A5, C#6, E6, A6

        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = ctx.currentTime + (i * 0.05);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    };

    const toggleSound = () => setSoundEnabled(!soundEnabled);

    return (
        <AudioContext.Provider value={{ soundEnabled, toggleSound, playPopSound, playSparkleSound }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => useContext(AudioContext);
