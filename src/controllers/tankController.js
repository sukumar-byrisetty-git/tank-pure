const Tank = require('../models/Tank');

const addTank = async (req, res) => {
    const { type, capacity, lastCleanedAt, nextDueDate, location } = req.body;
    const tank = await Tank.create({
        user: req.user._id,
        type,
        capacity,
        lastCleanedAt,
        nextDueDate,
        location,
    });
    res.status(201).json(tank);
};

const listTanks = async (req, res) => {
    const tanks = await Tank.find({ user: req.user._id });
    res.json(tanks);
};

module.exports = { addTank, listTanks };
