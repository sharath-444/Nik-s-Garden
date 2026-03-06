require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const Flower = require('./models/Flower');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Enable CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json({ limit: '10mb' })); // Allow large base64 image strings

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_garden';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Digital Garden datastore');
    }).catch(err => console.error('MongoDB connection error:', err));

// Routes
// Get all flowers
app.get('/api/flowers', async (req, res) => {
    try {
        const flowers = await Flower.find().sort({ createdAt: -1 });
        res.json(flowers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch flowers' });
    }
});

// Get total count
app.get('/api/flowers/count', async (req, res) => {
    try {
        const count = await Flower.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch flower count' });
    }
});

// Post a new flower drawing
app.post('/api/flowers', async (req, res) => {
    try {
        const { imageData, planterName } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        const newFlower = new Flower({
            imageData,
            planterName: planterName || 'Anonymous Gardener'
        });
        await newFlower.save();

        // Broadcast to all connected clients
        io.emit('new-flower', newFlower);

        res.status(201).json(newFlower);
    } catch (error) {
        console.error('Failed to save flower:', error);
        res.status(500).json({ error: 'Failed to save flower' });
    }
});

// Like a flower
app.put('/api/flowers/:id/like', async (req, res) => {
    try {
        const flower = await Flower.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!flower) return res.status(404).json({ error: 'Flower not found' });

        // Broadcast the updated flower so everyone's gallery updates live
        io.emit('flower-liked', flower);
        res.json(flower);
    } catch (error) {
        res.status(500).json({ error: 'Failed to like flower' });
    }
});

// Get Garden Stats
app.get('/api/flowers/stats', async (req, res) => {
    try {
        const totalFlowers = await Flower.countDocuments();
        const mostLiked = await Flower.findOne().sort({ likes: -1 }).select('planterName likes imageData');

        res.json({
            totalFlowers,
            mostLiked
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Post a new contact message
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, text } = req.body;
        if (!name || !email || !text) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const newMessage = new Message({ name, email, text });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get all messages (Admin)
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// AI Gardener Logic
const plantAIFlower = async () => {
    try {
        const aiNames = ['AI Gardener', 'Robo-Rose', 'Digital Daisy', 'Bot-any'];
        const randomName = aiNames[Math.floor(Math.random() * aiNames.length)];

        // Generate a simple SVG flower as base64
        const colors = ['#ff4b4b', '#ffa500', '#ffd700', '#4caf50', '#2196f3', '#e91e63'];
        const petColor = colors[Math.floor(Math.random() * colors.length)];
        const centerColor = colors[Math.floor(Math.random() * colors.length)];

        const svg = `
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="15" fill="${centerColor}" stroke="#333" stroke-width="2"/>
                <circle cx="50" cy="25" r="12" fill="${petColor}" stroke="#333" stroke-width="2"/>
                <circle cx="50" cy="75" r="12" fill="${petColor}" stroke="#333" stroke-width="2"/>
                <circle cx="25" cy="50" r="12" fill="${petColor}" stroke="#333" stroke-width="2"/>
                <circle cx="75" cy="50" r="12" fill="${petColor}" stroke="#333" stroke-width="2"/>
                <path d="M50 75 L50 100" stroke="#4caf50" stroke-width="4"/>
            </svg>
        `.trim();

        const imageData = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

        const newFlower = new Flower({
            imageData,
            planterName: randomName
        });
        await newFlower.save();
        io.emit('new-flower', newFlower);
        console.log(`[AI] ${randomName} planted a flower.`);
    } catch (err) {
        console.error('AI Gardener failed to plant:', err);
    }
};

// Plant a flower every 5-10 minutes
const activityInterval = setInterval(() => {
    if (Math.random() > 0.7) { // 30% chance every check
        plantAIFlower();
    }
}, 5 * 60 * 1000);

// Socket.io connection handling
let activeGardeners = 0;

io.on('connection', (socket) => {
    activeGardeners++;
    io.emit('active-gardeners', activeGardeners);
    console.log('A gardener connected:', socket.id, '| Total:', activeGardeners);

    socket.on('disconnect', () => {
        activeGardeners--;
        io.emit('active-gardeners', activeGardeners);
        console.log('Gardener disconnected:', socket.id, '| Total:', activeGardeners);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
