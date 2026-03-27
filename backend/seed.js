const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-learn-earn';

const seedQuestions = [
    {
        questionText: "What is the unit of power?",
        options: ["Watt", "Joule", "Pascal", "Newton"],
        correctOption: 0,
        category: "JEE"
    },
    {
        questionText: "What is the atomic number of Hydrogen?",
        options: ["1", "2", "3", "4"],
        correctOption: 0,
        category: "JEE"
    },
    {
        questionText: "DNA is present in which cell organelle?",
        options: ["Nucleus", "Ribosome", "Golgi Body", "Cell Wall"],
        correctOption: 0,
        category: "NEET"
    },
    {
        questionText: "The Fundamental Rights are mentioned in which part of the Constitution?",
        options: ["Part III", "Part IV", "Part V", "Part II"],
        correctOption: 0,
        category: "UPSC"
    },
    {
        questionText: "Which planet is known as the Red Planet?",
        options: ["Mars", "Venus", "Jupiter", "Saturn"],
        correctOption: 0,
        category: "General"
    }
];

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB for seeding...');
        await Question.deleteMany({});
        await Question.insertMany(seedQuestions);
        console.log('Successfully seeded questions!');
        process.exit();
    })
    .catch(err => {
        console.error('Seeding error:', err);
        process.exit(1);
    });
