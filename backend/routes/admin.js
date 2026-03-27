const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');

// Admin Login (Hardcoded as per request)
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'admin-token-mock' });
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
});

// Add/Edit/Delete Questions
router.post('/questions', async (req, res) => {
    try {
        const question = await Question.create(req.body);
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/questions/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/questions/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// AI Question Generator Button Simulation
router.post('/generate-ai', async (req, res) => {
    const { category, subject } = req.body;

    // Simulate AI generation logic
    const mockQuestions = [
        {
            questionText: `Artificial Intelligence generated question for ${category} - ${subject}: What is the basic unit of life?`,
            options: ['Cell', 'Atom', 'Molecule', 'Proton'],
            correctOption: 0,
            category: category
        },
        {
            questionText: `Artificial Intelligence generated question for ${category} - ${subject}: Which element is most abundant in Earth's atmosphere?`,
            options: ['Oxygen', 'Nitrogen', 'Helium', 'Carbon Dioxide'],
            correctOption: 1,
            category: category
        }
    ];

    try {
        // Bulk save mock questions
        const savedQuestions = await Question.insertMany(mockQuestions);
        res.json({ message: 'Successfully generated and saved AI questions!', count: savedQuestions.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error during AI generation simulation' });
    }
});

// View all users and stats
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('username mobile coins streak attemptHistory');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
