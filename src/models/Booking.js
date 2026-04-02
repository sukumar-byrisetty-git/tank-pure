const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
    date: { type: Date, required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'completed', 'verified'], default: 'pending' },
    beforeImages: [{ type: String }],
    afterImages: [{ type: String }],
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
