const mongoose = require('mongoose');

const flowerSchema = new mongoose.Schema({
    imageData: {
        type: String,
        required: true,
    },
    planterName: {
        type: String,
        default: 'Anonymous Gardener',
    },
    likes: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Flower', flowerSchema);
