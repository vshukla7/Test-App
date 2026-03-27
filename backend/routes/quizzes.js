const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Post Quiz Results & Deduct/Reward Coins
router.post('/submit', protect, async (req, res) => {
    try {
        const { score, totalQuestions, coinsEarned, isPremium } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for Premium Deduction
        if (isPremium) {
            if (user.coins < 5) {
                return res.status(400).json({ message: 'Not enough coins for premium quiz' });
            }
            user.coins -= 5;
        }

        // Add Score & Reward Coins
        const accuracy = (score / totalQuestions) * 100;
        user.coins += coinsEarned;
        
        // Push to History
        user.attemptHistory.push({
            score,
            accuracy: accuracy,
            coinsEarned,
            date: new Date()
        });

        // Basic streak logic
        const today = new Date().toISOString().split('T')[0];
        const lastQuizDate = user.lastQuizDate ? user.lastQuizDate.toISOString().split('T')[0] : null;

        if (lastQuizDate !== today) {
            user.streak += 1;
            user.lastQuizDate = new Date();
        }

        await user.save();

        res.json({
            message: 'Quiz success!',
            newBalance: user.coins,
            streak: user.streak,
            rank: Math.floor(Math.random() * 100) + 1 // Mock rank for now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find({})
            .sort({ coins: -1 }) // Sort by coins for leaderboard
            .limit(10)
            .select('username coins');

        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Recommended Quizzes (Based on user class/exam type)
router.get('/recommend', protect, async (req, res) => {
    try {
        const user = req.user;
        const recommendations = [
            { category: user.examPrep, title: `Daily ${user.examPrep} Quiz` }
        ];

        // Add additional recommendations based on class if needed
        if (user.className) {
            recommendations.push({ category: 'General', title: `Subject-wise Quiz for Class ${user.className}` });
        }

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get User Stats
router.get('/stats', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('coins attemptHistory streak');
        const attempts = user.attemptHistory.length;
        const avgAccuracy = attempts > 0 ? (user.attemptHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / attempts) : 0;

        res.json({
            coins: user.coins,
            streak: user.streak,
            attempts,
            avgAccuracy: avgAccuracy.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
