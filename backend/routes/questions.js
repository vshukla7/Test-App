const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect } = require('../middleware/authMiddleware');

// Get Questions by Category
router.get('/fetch', protect, async (req, res) => {
    try {
        const { category, limit = 5 } = req.query; // Default limit 5 questions
        const questions = await Question.aggregate([
            { $match: { category } },
            { $sample: { size: parseInt(limit) } } // Randomly select questions
        ]);

        if (questions && questions.length > 0) {
            res.json(questions);
        } else {
            res.status(404).json({ message: 'No questions found for this category' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
