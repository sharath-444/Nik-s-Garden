import { Eraser, Send, Info, Users, Heart, Cloud, Wind, Thermometer, Bot } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

const SOCKET_URL = 'http://localhost:5000';

const COLORS = [
    { name: 'Red', hex: '#ff4b4b' },
    { name: 'Orange', hex: '#ffa500' },
    { name: 'Yellow', hex: '#ffd700' },
    { name: 'Green', hex: '#4caf50' },
    { name: 'Blue', hex: '#2196f3' },
    { name: 'Purple', hex: '#9c27b0' },
    { name: 'Pink', hex: '#e91e63' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#000000' }
];

const BRUSH_SIZES = [2, 5, 8, 12];

const Garden = () => {
    const [flowers, setFlowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // const containerRef = useRef(null); // This was removed in the diff, but not explicitly in the instruction. Keeping it for now as it's used later.
    const containerRef = useRef(null);


    // Canvas State from PlantFlower
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState(COLORS[0].hex);
    const [brushSize, setBrushSize] = useState(5);
    const [isPlanting, setIsPlanting] = useState(false);
    const [planterName, setPlanterName] = useState('');
    const [hoveredFlower, setHoveredFlower] = useState(null);
    const [undoStack, setUndoStack] = useState([]); // Track history of strokes

    // New V2 states
    const [activeGardeners, setActiveGardeners] = useState(1);
    const { isNightMode } = useTheme();
    const { playPopSound, playSparkleSound } = useAudio();

    const getRandomPosition = () => {
        // Return relative % positions
        // Adjust bounds to spawn in the right 80% (grass area) and avoid the bottom edge to stop pop-out
        const top = Math.floor(Math.random() * 45) + 30; // 30% to 75%
        const left = Math.floor(Math.random() * 60) + 25; // 25% to 85% (right side lawn)
        const scale = (Math.random() * 0.4) + 0.6; // 0.6 to 1.0 (perspective)
        return { top: `${top}%`, left: `${left}%`, scale };
    };

    useEffect(() => {
        // Fetch initial flowers
        const fetchFlowers = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/flowers');
                if (res.ok) {
                    const data = await res.json();
                    const positionedData = data.map(f => ({ ...f, pos: getRandomPosition(), isNew: false }));
                    setFlowers(positionedData);
                }
            } catch (error) {
                console.error("Failed to load flowers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlowers();

        // Setup Socket
        const socket = io(SOCKET_URL);
        socket.on('new-flower', (flower) => {
            // New flowers get a special 'isNew' flag to trigger sparkles
            const positionedFlower = { ...flower, pos: getRandomPosition(), isNew: true };
            setFlowers(prev => [...prev, positionedFlower]);
            playPopSound();
            setTimeout(() => playSparkleSound(), 200);
        });

        socket.on('active-gardeners', (count) => {
            setActiveGardeners(count);
        });

        socket.on('flower-liked', (updatedFlower) => {
            setFlowers(prev => prev.map(f => f._id === updatedFlower._id ? { ...f, likes: updatedFlower.likes } : f));
        });

        return () => socket.disconnect();
    }, [playPopSound, playSparkleSound]);

    const handleLike = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            // Optimistic update
            setFlowers(prev => prev.map(f => {
                if (f._id === id) return { ...f, likes: (f.likes || 0) + 1, hasLikedLocally: true };
                return f;
            }));

            playPopSound(); // gentle feedback

            const res = await fetch(`http://localhost:5000/api/flowers/${id}/like`, {
                method: 'PUT'
            });

            if (!res.ok) {
                console.error("Failed to like");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Save the bare initial blank canvas
    const saveBlankState = () => {
        if (!canvasRef.current) return;
        setUndoStack([canvasRef.current.toDataURL()]);
    };

    // Canvas Setup
    useEffect(() => {
        const initCanvas = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            // Size the canvas correctly based on its parent container logic
            canvas.width = 300;
            canvas.height = 300;

            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Save empty state as the base of the undo stack
            saveBlankState();
        };
        initCanvas();
    }, []);

    const getCoordinates = (event) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const rect = canvas.getBoundingClientRect();
        // Calculate scaling ratio
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const saveState = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL();
        setUndoStack(prev => [...prev, dataUrl]);
    };

    const undoLastStroke = () => {
        if (undoStack.length <= 1) return; // Cannot undo past the blank state

        const newStack = [...undoStack];
        newStack.pop(); // Remove current state
        const previousState = newStack[newStack.length - 1]; // Get prior state

        setUndoStack(newStack);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = previousState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    };

    const startDrawing = (e) => {
        // Only prevent default for touch to avoid scrolling
        if (e.type.includes('touch') && e.cancelable) {
            e.preventDefault();
        }
        const coords = getCoordinates(e);
        if (!coords) return;

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (e.type.includes('touch') && e.cancelable) {
            e.preventDefault();
        }

        const coords = getCoordinates(e);
        if (!coords) return;

        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.closePath();
            setIsDrawing(false);
            // Save canvas state immediately after finalizing a stroke
            saveState();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveBlankState(); // reset stack to just blank
    };

    const isCanvasEmpty = () => {
        const canvas = canvasRef.current;
        if (!canvas) return true;
        const ctx = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some((color) => color !== 0);
    };

    const plantFlower = async () => {
        if (!canvasRef.current || isCanvasEmpty()) {
            alert("Please draw a flower first!");
            return;
        }

        setIsPlanting(true);
        // Using audio context sound on local actions makes UI feel responsive instantly
        playPopSound();

        const imageData = canvasRef.current.toDataURL('image/png');

        try {
            const res = await fetch('http://localhost:5000/api/flowers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData,
                    planterName: planterName.trim() || 'Anonymous Gardener'
                })
            });

            if (res.ok) {
                clearCanvas();
                setPlanterName('');
                playSparkleSound();
            } else {
                alert("Failed to plant flower. Please try again.");
            }
        } catch (error) {
            console.error("Planting error:", error);
            alert("Connection error.");
        } finally {
            setIsPlanting(false);
        }
    };

    // Component purely for the Soil Pop UI effect
    const SoilPop = () => {
        return (
            <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 2.5, 3], opacity: [1, 0.5, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute rounded-full border-2 border-[#8b5a2b]/30"
                style={{ width: 60, height: 20, top: '95%', left: '50%', transform: 'translateX(-50%)', zIndex: -1 }}
            />
        )
    };

    // Component inside mapped flowers to render sparkles
    const Sparkles = () => {
        return (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: 0,
                            scale: Math.random() * 1.5 + 0.5,
                            x: (Math.random() - 0.5) * 120,
                            y: (Math.random() - 0.5) * -120
                        }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: Math.random() * 0.3 }}
                        className="absolute top-full left-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_8px_4px_rgba(253,224,71,0.5)]"
                    />
                ))}
            </div>
        )
    };

    const PersistentGlow = ({ isNightMode }) => {
        return (
            <motion.div
                animate={{
                    opacity: isNightMode ? [0.4, 0.7, 0.4] : [0.1, 0.3, 0.1],
                    scale: [0.9, 1.1, 0.9]
                }}
                transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full blur-2xl -z-10 ${isNightMode ? 'bg-blue-400/30' : 'bg-yellow-400/20'}`}
            />
        );
    };

    // Creature Animations (Bees & Butterflies)
    const Bee = () => {
        return (
            <motion.div
                initial={{ left: "-10%", top: `${Math.random() * 80 + 10}%`, scale: 0.8 }}
                animate={{
                    left: "110%",
                    top: `${Math.random() * 80 + 10}%`,
                    rotate: [0, 10, -10, 0]
                }}
                transition={{
                    duration: 15 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "linear",
                    rotate: { duration: 0.5, repeat: Infinity }
                }}
                className="absolute z-40 pointer-events-none drop-shadow-md"
            >
                <div className="relative text-2xl xl:text-4xl">
                    🐝
                    {/* Tiny wings */}
                    <motion.div
                        animate={{ rotateX: [0, 180, 0] }}
                        transition={{ duration: 0.1, repeat: Infinity }}
                        className="absolute -top-2 left-1 text-white text-sm opacity-80"
                    >
                        〰️
                    </motion.div>
                </div>
            </motion.div>
        );
    };

    const Butterfly = () => {
        return (
            <motion.div
                initial={{ left: "110%", top: `${Math.random() * 60 + 10}%`, scale: 0.8 }}
                animate={{
                    left: "-10%",
                    top: [
                        `${Math.random() * 60 + 10}%`,
                        `${Math.random() * 60 + 10}%`,
                        `${Math.random() * 60 + 10}%`
                    ]
                }}
                transition={{
                    duration: 20 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute z-40 pointer-events-none drop-shadow-lg"
            >
                <motion.div
                    animate={{ scaleX: [1, 0.2, 1], y: [0, -10, 0] }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-3xl xl:text-5xl filter hue-rotate-15"
                >
                    🦋
                </motion.div>
            </motion.div>
        );
    };

    const Ladybug = () => {
        const startLeft = Math.random() > 0.5 ? "-5%" : "105%";
        const endLeft = startLeft === "-5%" ? "105%" : "-5%";
        return (
            <motion.div
                initial={{ left: startLeft, top: `${Math.floor(Math.random() * 40) + 50}%`, scale: 0.6 }}
                animate={{ left: endLeft }}
                transition={{
                    duration: 25 + Math.random() * 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute z-20 pointer-events-none text-xl"
            >
                🐞
            </motion.div>
        );
    };

    const Pollen = () => {
        return (
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={`pollen-${i}`}
                        initial={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            top: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            opacity: [0, 0.4, 0],
                            x: [0, 50, -50, 0],
                            y: [0, -50, 50, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-1 h-1 bg-yellow-200/40 rounded-full blur-[1px]"
                    />
                ))}
            </div>
        );
    };

    const GardenDecorations = () => {
        const decos = [
            { emoji: '🌳', size: 'text-6xl md:text-8xl', top: '10%', left: '20%' },
            { emoji: '🌲', size: 'text-5xl md:text-7xl', top: '5%', left: '75%' },
            { emoji: '🌿', size: 'text-3xl md:text-5xl', top: '40%', left: '5%' },
            { emoji: '🌿', size: 'text-3xl md:text-5xl', top: '70%', left: '90%' },
            { emoji: '🪨', size: 'text-2xl md:text-4xl', top: '85%', left: '15%' },
            { emoji: '🍄', size: 'text-xl md:text-3xl', top: '15%', left: '40%' },
            { emoji: '🍄', size: 'text-xl md:text-3xl', top: '75%', left: '60%' },
            { emoji: '🌻', size: 'text-2xl md:text-4xl', top: '25%', left: '85%' },
            { emoji: '🌼', size: 'text-xl md:text-3xl', top: '35%', left: '55%' },
            { emoji: '🌱', size: 'text-xl md:text-2xl', top: '55%', left: '25%' },
            { emoji: '🌱', size: 'text-xl md:text-2xl', top: '20%', left: '10%' },
            { emoji: '🌱', size: 'text-xl md:text-2xl', top: '80%', left: '45%' },
            { emoji: '🌱', size: 'text-xl md:text-2xl', top: '45%', left: '70%' },
            { emoji: '🌱', size: 'text-xl md:text-2xl', top: '90%', left: '80%' },
        ];

        return (
            <div className="absolute inset-0 pointer-events-none z-0">
                {decos.map((d, i) => (
                    <motion.div
                        key={`deco-${i}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 0.6,
                            scale: 1,
                            rotate: [0, 2, -2, 0],
                            y: [0, -2, 0]
                        }}
                        transition={{
                            opacity: { duration: 1 },
                            rotate: { duration: 4 + i % 3, repeat: Infinity, ease: "easeInOut" },
                            y: { duration: 3 + i % 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className={`absolute ${d.size} filter grayscale-[20%] opacity-50 flex items-center justify-center`}
                        style={{ top: d.top, left: d.left, transform: 'translate(-50%, -50%)' }}
                    >
                        {d.emoji}
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-grow w-full bg-[#f5f3e7] flex flex-col xl:flex-row-reverse min-h-[calc(100vh-4rem)] relative overflow-hidden">

            {/* Right Sidebar: Drawing Tool */}
            <div className="xl:w-1/3 p-6 md:p-8 flex flex-col border-b-2 xl:border-b-0 xl:border-l-2 border-[#e5e1ca] bg-white/40 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20">

                <div className="mb-6 flex xl:flex-col items-center xl:items-start justify-between gap-4">
                    <div>
                        <h2 className="text-3xl text-[#8b5a2b] font-bold flex items-center gap-2">
                            <Sparkles className="text-pink-500" size={24} /> Add to Garden
                        </h2>
                        <p className="text-gray-600 mt-1">Draw a flower and drop it in.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#f5f3e7] px-3 py-1.5 rounded-full border border-[var(--color-garden-brown)] text-sm xl:hidden">
                        <Users size={16} className="text-[#8b5a2b]" />
                        <span className="font-bold text-[#8b5a2b]">{flowers.length}</span> Flowers
                    </div>
                </div>

                <div className="flex flex-col md:flex-row xl:flex-col gap-6">
                    {/* Canvas Wrapper */}
                    <div className="relative border-[6px] border-[#e2d6c1] rounded-3xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')] bg-[#fdfbf6] shadow-inner mx-auto xl:mx-0 shrink-0 w-[300px] h-[300px]">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="cursor-crosshair w-full h-full mix-blend-multiply"
                            style={{ touchAction: 'none' }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-5 flex-grow">

                        {/* Color & Size */}
                        <div className="flex xl:flex-col sm:flex-row flex-col gap-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-gray-500">Color</h3>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setColor(c.hex)}
                                            className={`w-7 h-7 rounded-full shadow-sm hover:scale-110 transition-transform ${color === c.hex ? 'ring-[3px] ring-offset-2 ring-[#8b5a2b]' : 'border border-gray-200'
                                                }`}
                                            style={{ backgroundColor: c.hex }}
                                            aria-label={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex-grow">
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-gray-500">Brush Size</h3>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8b5a2b]"
                                />
                            </div>
                        </div>

                        {/* Name Input */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-gray-500">Your Name</h3>
                            <input
                                type="text"
                                placeholder="e.g. Grandma Rose"
                                maxLength={24}
                                value={planterName}
                                onChange={(e) => setPlanterName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-[#e5e1ca] bg-white focus:outline-none focus:border-[#8b5a2b] font-kalam text-lg transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && plantFlower()}
                            />
                        </div>

                        <div className="flex gap-3 mt-auto pt-2">
                            <button
                                onClick={undoLastStroke}
                                disabled={undoStack.length <= 1}
                                className="flex items-center justify-center gap-1 xl:gap-2 py-3 px-3 xl:px-4 rounded-xl border-2 border-[#e2d6c1] bg-[#fdfaf1] text-gray-600 font-bold hover:bg-white transition-colors flex-1 disabled:opacity-50 text-sm xl:text-base"
                            >
                                <Eraser size={16} className="hidden xl:block" /> Undo
                            </button>
                            <button
                                onClick={clearCanvas}
                                className="flex items-center justify-center gap-1 xl:gap-2 py-3 px-3 xl:px-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex-1 text-sm xl:text-base"
                            >
                                Clear
                            </button>
                            <button
                                onClick={plantFlower}
                                disabled={isPlanting}
                                className="flex items-center justify-center gap-2 py-3 px-4 xl:px-6 rounded-xl bg-[#8b5a2b] text-white font-bold text-lg hover:bg-[#6e4620] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex-[2]"
                            >
                                <Send size={18} />
                                {isPlanting ? 'Planting...' : 'Plant'}
                            </button>
                        </div>

                        {/* Inspiration Note */}
                        <div className="mt-6 text-center text-sm text-gray-500 font-sans">
                            Inspired by <a href="https://annasgarden.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#8b5a2b] hover:underline hover:text-pink-500 transition-colors">Anna's Garden</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Side: Garden Island View */}
            <div className={`xl:w-2/3 relative flex-grow overflow-hidden flex items-start justify-center p-4 xl:p-8 pt-4 xl:pt-8 min-h-[60vh] xl:min-h-0 transition-colors duration-1000 ${isNightMode ? 'bg-[#1a1e29]' : 'bg-blue-50/30'}`}>

                {/* Stars / Fireflies in Night Mode */}
                <AnimatePresence>
                    {isNightMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            {[...Array(25)].map((_, i) => (
                                <motion.div
                                    key={`star-${i}`}
                                    animate={{
                                        opacity: [0.2, 0.8, 0.2],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 4,
                                        repeat: Infinity,
                                        delay: Math.random() * 2
                                    }}
                                    className="absolute w-1 h-1 bg-yellow-100 rounded-full shadow-[0_0_4px_2px_rgba(255,255,255,0.4)]"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Garden Stats Badge (Desktop only for space, could make it a floating button on mobile) */}
                <div className="absolute top-8 left-8 z-50 hidden xl:flex flex-col gap-2">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border transition-colors ${isNightMode ? 'bg-[#2a2e39]/80 border-white/10 text-gray-200' : 'bg-white/90 border-white/50 text-[#8b5a2b]'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-current/10">
                            <Users size={20} className={isNightMode ? 'text-blue-400' : 'text-[#8b5a2b]'} />
                            <span className="font-bold font-sans tracking-wide">
                                <span className={isNightMode ? 'text-white text-lg' : 'text-lg text-[#8b5a2b]'}>{flowers.length}</span> Flowers
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                            <span className="font-sans text-sm tracking-wide">
                                <span className="font-bold">{activeGardeners}</span> Active Gardeners
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Garden Status Dashboard (Desktop) */}
                <div className="absolute bottom-8 right-8 z-50 hidden 2xl:flex flex-col gap-4">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`backdrop-blur-md p-6 rounded-[32px] shadow-2xl border transition-all ${isNightMode ? 'bg-[#1a1e29]/90 border-blue-500/20 text-blue-200' : 'bg-white/90 border-[#e2d6c1] text-[#8b5a2b]'
                            }`}
                    >
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
                            <RefreshCcw size={14} /> Environment Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isNightMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                    <Thermometer size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Temp</p>
                                    <p className="font-bold">{isNightMode ? '18°C' : '24°C'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isNightMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                    <Wind size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Breeze</p>
                                    <p className="font-bold">2 km/h</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isNightMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                                    <Cloud size={18} className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Sky</p>
                                    <p className="font-bold">{isNightMode ? 'Clear' : 'Sunny'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isNightMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                                    <Bot size={18} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Bots</p>
                                    <p className="font-bold">Active</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {isLoading ? (
                    <div className={`animate-pulse flex flex-col items-center gap-4 mt-20 ${isNightMode ? 'text-blue-200' : 'text-[#8b5a2b]'}`}>
                        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isNightMode ? 'border-blue-400' : 'border-[#8b5a2b]'}`}></div>
                        <p className="text-xl font-caveat text-2xl">Watering the garden...</p>
                    </div>
                ) : (
                    <div className="relative w-full max-w-5xl 2xl:max-w-7xl aspect-[4/3] md:aspect-[3/2] z-0 mx-auto mt-4 md:mt-0 xl:mt-[-20px]">

                        {/* Ambient Creatures (Inside Garden scope) */}
                        <Bee />
                        <Bee />
                        <Butterfly />

                        {/* The Garden Island Visuals */}
                        <div className="absolute inset-x-0 bottom-0 top-[5%] z-0 overflow-hidden flex shadow-2xl rounded-r-3xl md:rounded-r-[60px]">

                            {/* House Edge (Left Side) */}
                            <div className="w-[15%] h-full bg-[#d9c7ad] border-r-4 border-[#8b6b55] relative z-20 flex flex-col justify-end shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
                                {/* Brick texture foundation */}
                                <div className="absolute bottom-0 w-full h-1/4 bg-[#a65d3c] border-t-2 border-[#7a4128]"
                                    style={{
                                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(0,0,0,0.2) 18px, rgba(0,0,0,0.2) 20px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.2) 28px, rgba(0,0,0,0.2) 30px)' // Pseudo brick pattern
                                    }}
                                ></div>
                                {/* Door / Porch dummy element */}
                                <div className="absolute bottom-[20%] right-[-10px] w-6 h-12 bg-[#5c3e21] rounded-l-md shadow-md z-30"></div>
                                {/* Roof overhang */}
                                <div className="absolute top-0 w-[120%] -left-[10%] h-12 bg-[#a63c3c] rounded-b-sm border-b-4 border-[#7a2323] z-30 shadow-lg diagonal-stripes"></div>
                            </div>

                            {/* The Lawn (Right Side) */}
                            <div className="flex-grow h-full bg-[#6aa84f] relative overflow-hidden flex flex-col pt-4 pb-2 shadow-inner"
                                style={{
                                    // Classic 5-lane PvZ checkerboard pattern using CSS gradients
                                    backgroundImage: `
                                        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15), transparent 70%),
                                        linear-gradient(rgba(0,0,0,0.04) 50%, transparent 50%),
                                        linear-gradient(90deg, rgba(0,0,0,0.06) 50%, transparent 50%)
                                    `,
                                    backgroundSize: '100% 100%, 20% 20%, 20% 20%', // Creating a 5x5 grid feel visually
                                }}>

                                {/* Noise filter for grass texture */}
                                <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')] pointer-events-none"></div>

                                {/* Ambient Lighting Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none z-10"></div>

                                {/* Environment Enhancements */}
                                <GardenDecorations />
                                <Pollen />
                                <Ladybug />

                                {/* Back fence */}
                                <div className="absolute top-0 left-0 right-0 h-10 flex px-2 opacity-80 pointer-events-none -translate-y-2">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="flex-1 mx-0.5 bg-[#e0e0e0] border-2 border-[#c2c2c2] rounded-t-full h-full pb-2 shadow-sm transform -rotate-1 origin-bottom"></div>
                                    ))}
                                </div>

                                {/* Dirt bottom edge path before road */}
                                <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#8b6b55] border-t-2 border-[#5c3e21] opacity-60"></div>

                            </div>

                        </div>

                        {/* Flowers Container */}
                        <div ref={containerRef} className="absolute inset-0 z-10 bottom-[5%]">

                            <AnimatePresence>
                                {flowers.map((flower, index) => (
                                    <motion.div
                                        key={flower._id || index}
                                        initial={{ opacity: 0, scale: 0.5, y: -200 }}
                                        animate={{ opacity: 1, scale: flower.pos.scale, y: 0 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{
                                            duration: 0.8,
                                            type: "spring",
                                            bounce: 0.4
                                        }}
                                        className="absolute cursor-pointer group"
                                        style={{
                                            top: flower.pos.top,
                                            left: flower.pos.left,
                                            transformOrigin: 'bottom center',
                                            transform: `translateX(-50%) translateY(-100%) scale(${flower.pos.scale})`,
                                            zIndex: Math.floor(parseFloat(flower.pos.top)) // Sort z-index by Y position for depth
                                        }}
                                        onMouseEnter={() => setHoveredFlower(flower)}
                                        onMouseLeave={() => setHoveredFlower(null)}
                                    >
                                        {/* Name Tooltip (Hover) */}
                                        <AnimatePresence>
                                            {hoveredFlower && hoveredFlower._id === flower._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 5, scale: 0.8 }}
                                                    className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-sm font-sans whitespace-nowrap z-50 text-[#8b5a2b] border border-[#e2d6c1] pointer-events-none select-none flex flex-col items-center"
                                                >
                                                    <span className="font-bold">{flower.planterName}</span>
                                                    <button
                                                        onClick={(e) => handleLike(flower._id, e)}
                                                        disabled={flower.hasLikedLocally}
                                                        className={`mt-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${flower.hasLikedLocally
                                                            ? 'bg-pink-100 text-pink-500 cursor-default scale-105'
                                                            : 'bg-white text-gray-400 hover:text-pink-500 hover:bg-pink-50 hover:scale-105 active:scale-95 border border-[#e2d6c1]'
                                                            }`}
                                                        style={{ pointerEvents: 'auto' }}
                                                    >
                                                        <Heart size={12} className={flower.hasLikedLocally ? 'fill-pink-500' : ''} />
                                                        {flower.likes > 0 ? flower.likes : 'Like'}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Optional V2 Visual FX */}
                                        {flower.isNew && <SoilPop />}
                                        {flower.isNew && <Sparkles />}
                                        <PersistentGlow isNightMode={isNightMode} />

                                        {/* Subtle breathing animation for planted flowers */}
                                        <motion.div
                                            animate={{
                                                y: [0, -3, 0],
                                                rotate: [0, 1, -1, 0]
                                            }}
                                            whileHover={{ scale: 1.1, rotate: 2 }}
                                            transition={{
                                                duration: 4 + Math.random() * 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="relative"
                                        >
                                            {/* Depth Shadow */}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-4 bg-black/10 blur-md rounded-full -z-10 group-hover:bg-black/20 transition-colors"></div>

                                            <img
                                                src={flower.imageData}
                                                alt={`A beautiful flower planted by ${flower.planterName}`}
                                                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain filter drop-shadow-2xl brightness-100 group-hover:brightness-110 transition-all"
                                                style={{ pointerEvents: 'auto' }}
                                                draggable={false}
                                            />
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {
                                flowers.length === 0 && !isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <p className="text-[#8b5a2b] font-kalam text-xl md:text-2xl opacity-60 bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm">
                                            The garden is empty. Be the first to plant a flower!
                                        </p>
                                    </div>
                                )
                            }
                        </div>

                    </div>
                )}
            </div>

        </div>
    );
};

export default Garden;
