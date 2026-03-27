const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, mobile, age, className, examPrep, board, medium } = req.body;

        const userExists = await User.findOne({ $or: [{ username }, { mobile }] });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            mobile,
            age,
            className,
            examPrep,
            board,
            medium,
            coins: 100 // New user gets 100 coins
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                mobile: user.mobile,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { mobile } = req.body; // In real app, you'd use OTP. For mock, just login by mobile.
        const user = await User.findOne({ mobile });

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Mobile number not registered' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

module.exports = router;
