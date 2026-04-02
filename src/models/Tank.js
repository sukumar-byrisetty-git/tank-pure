const mongoose = require('mongoose');

const tankSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    capacity: { type: Number, required: true },
    lastCleanedAt: { type: Date, required: true },
    nextDueDate: { type: Date, required: true },
    location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Tank', tankSchema);
