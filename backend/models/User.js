const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    className: { type: String, required: true }, // e.g., '6-12', 'Dropper', 'College'
    examPrep: { type: String, required: true }, // JEE, NEET, etc.
    board: { type: String }, // Optional (CBSE, ICSE, etc.)
    medium: { type: String }, // Optional (Hindi/English)
    coins: { type: Number, default: 100 },
    streak: { type: Number, default: 0 },
    lastQuizDate: { type: Date },
    attemptHistory: [{
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        score: Number,
        accuracy: Number,
        coinsEarned: Number,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
