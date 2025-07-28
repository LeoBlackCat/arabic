import React, { useState, useEffect } from 'react';

const QuestionWordPuzzleGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''
    const [selectedAnswer, setSelectedAnswer] = useState('');

    // Question word puzzle challenges - fill in the blank
    const challenges = [
        // WAIN (Where) blanks
        {
            id: 'where_blank_1',
            sentence: '_____ bentik?',
            correctAnswer: 'wain',
            english: 'Where is your daughter?',
            explanation: 'wain = where (asking for location)',
            category: 'location'
        },
        {
            id: 'where_blank_2', 
            sentence: '_____ el mat3am?',
            correctAnswer: 'wain',
            english: 'Where is the restaurant?',
            explanation: 'wain = where (asking for location)',
            category: 'location'
        },

        // EMNOO (Who) blanks
        {
            id: 'who_blank_1',
            sentence: '_____ el rayyal?',
            correctAnswer: 'emnoo',
            english: 'Who\'s the man?',
            explanation: 'emnoo = who (asking about people)',
            category: 'people'
        },
        {
            id: 'who_blank_2',
            sentence: '_____ el mudeer?',
            correctAnswer: 'emnoo', 
            english: 'Who\'s the boss?',
            explanation: 'emnoo = who (asking about people)',
            category: 'people'
        },

        // KAIF (How) blanks
        {
            id: 'how_blank_1',
            sentence: '_____ el sheghel?',
            correctAnswer: 'kaif',
            english: 'How is the work?',
            explanation: 'kaif = how (asking about condition)',
            category: 'condition'
        },
        {
            id: 'how_blank_2',
            sentence: '_____ youmik?',
            correctAnswer: 'kaif',
            english: 'How is your day?',
            explanation: 'kaif = how (asking about condition)',
            category: 'condition'
        },

        // LAISH (Why) blanks
        {
            id: 'why_blank_1',
            sentence: '_____ za7mah?',
            correctAnswer: 'laish',
            english: 'Why is it crowded?',
            explanation: 'laish = why (asking for reason)',
            category: 'reason'
        },
        {
            id: 'why_blank_2',
            sentence: '_____ mistaanes?',
            correctAnswer: 'laish',
            english: 'Why are you happy?',
            explanation: 'laish = why (asking for reason)',
            category: 'reason'
        },

        // SHOO (What) blanks
        {
            id: 'what_blank_1',
            sentence: '_____ ismek?',
            correctAnswer: 'shoo',
            english: 'What is your name?',
            explanation: 'shoo = what (asking for information)',
            category: 'information'
        },
        {
            id: 'what_blank_2',
            sentence: '_____ el ghada?',
            correctAnswer: 'shoo',
            english: 'What is for lunch?',
            explanation: 'shoo = what (asking for information)',
            category: 'information'
        },

        // META (When) blanks
        {
            id: 'when_blank_1',
            sentence: '_____ el 3asha?',
            correctAnswer: 'meta',
            english: 'When is the dinner?',
            explanation: 'meta = when (asking about time)',
            category: 'time'
        },
        {
            id: 'when_blank_2',
            sentence: '_____ 3eed milaadek?',
            correctAnswer: 'meta',
            english: 'When is your birthday?',
            explanation: 'meta = when (asking about time)',
            category: 'time'
        },

        // KAM (How many/much) blanks
        {
            id: 'how_many_blank_1',
            sentence: '_____ 3omrek?',
            correctAnswer: 'kam',
            english: 'How old are you?',
            explanation: 'kam = how many/much (asking about quantity/age)',
            category: 'quantity'
        },
        {
            id: 'how_many_blank_2',
            sentence: '_____ telifoon 3endek?',
            correctAnswer: 'kam',
            english: 'How many phones do you have?',
            explanation: 'kam = how many/much (asking about quantity)',
            category: 'quantity'
        },

        // Mixed advanced challenges
        {
            id: 'mixed_1',
            sentence: '_____ kaan el youm?',
            correctAnswer: 'kaif',
            english: 'How was the day?',
            explanation: 'kaif = how (asking about past condition)',
            category: 'condition'
        },
        {
            id: 'mixed_2',
            sentence: '_____ esm zawjtik?',  
            correctAnswer: 'shoo',
            english: 'What is your wife\'s name?',
            explanation: 'shoo = what (asking for information about name)',
            category: 'information'
        },
        {
            id: 'mixed_3',
            sentence: '_____ met\'akher dayman?',
            correctAnswer: 'laish',
            english: 'Why are you always late?',
            explanation: 'laish = why (asking for reason about behavior)',
            category: 'reason'
        },
        {
            id: 'mixed_4',
            sentence: '_____ walad 3endich?',
            correctAnswer: 'kam',
            english: 'How many sons do you have?',
            explanation: 'kam = how many (asking about quantity of children)',
            category: 'quantity'
        }
    ];

    // Question word options
    const questionWords = ['wain', 'emnoo', 'kaif', 'laish', 'shoo', 'meta', 'kam', 'ay'];

    // Select random challenge
    const selectRandomChallenge = () => {
        const availableChallenges = challenges.filter(c => !usedChallenges.has(c.id));
        
        if (availableChallenges.length === 0) {
            setFeedback('🎉 Incredible! You completed all question word puzzles!');
            setCurrentChallenge(null);
            return;
        }

        const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        setCurrentChallenge(randomChallenge);
        setSelectedAnswer('');
        setFeedback('');
    };

    // Handle word selection
    const handleWordSelect = (word) => {
        setSelectedAnswer(word);
    };

    // Handle answer submission
    const handleSubmit = () => {
        if (!currentChallenge || !selectedAnswer) return;

        const isCorrect = selectedAnswer === currentChallenge.correctAnswer;
        
        if (isCorrect) {
            // Play success sound and show animation
            new Audio('./sounds/success.wav').play().catch(() => {});
            setAnimationState('success');
            setScore(score + 1);
            setFeedback('✅ Perfect! You filled in the correct question word!');
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            setTimeout(() => {
                setAnimationState('');
                setRound(round + 1);
                selectRandomChallenge();
            }, 2500);
        } else {
            // Play error sound and show animation
            new Audio('./sounds/error.wav').play().catch(() => {});
            setAnimationState('error');
            setFeedback(`❌ Not quite right. The correct answer is "${currentChallenge.correctAnswer}"`);
            setTimeout(() => setAnimationState(''), 800);
        }
    };

    // Start new game
    const startNewGame = () => {
        setScore(0);
        setRound(1);
        setUsedChallenges(new Set());
        setSelectedAnswer('');
        selectRandomChallenge();
    };

    // Initialize game
    useEffect(() => {
        selectRandomChallenge();
    }, []);

    // Get display sentence with selected answer
    const getDisplaySentence = () => {
        if (!currentChallenge) return '';
        return currentChallenge.sentence.replace('_____', selectedAnswer || '_____');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🧩 Question Word Puzzle</h1>
                <p className="text-center text-purple-200 mb-6">Fill in the blanks with the correct question word!</p>

                {/* Stats */}
                <div className="flex justify-between items-center mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <div className="text-yellow-300 font-bold">Score: {score}</div>
                    <div className="text-blue-300 font-bold">Round: {round}</div>
                    <div className="text-green-300 font-bold">Remaining: {challenges.length - usedChallenges.size}</div>
                </div>

                {/* Current Challenge */}
                {currentChallenge && (
                    <div className={`bg-white/10 backdrop-blur p-6 rounded-lg mb-6 transition-all duration-500 ${
                        animationState === 'success' ? 'animate-pulse bg-green-500/30 scale-105' :
                        animationState === 'error' ? 'animate-bounce bg-red-500/30' : ''
                    }`}>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold mb-4 font-mono tracking-wider">
                                {getDisplaySentence()}
                            </div>
                            <div className="text-lg text-gray-300 mb-4">{currentChallenge.english}</div>
                            <div className="text-sm text-purple-200">Fill in the blank with the correct question word</div>
                        </div>

                        {/* Question Word Options */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {questionWords.map((word, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleWordSelect(word)}
                                    className={`p-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                                        selectedAnswer === word 
                                            ? 'bg-yellow-600 text-white shadow-lg scale-105' 
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="text-center mb-4">
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedAnswer}
                                className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                                    selectedAnswer 
                                        ? 'bg-green-600 hover:bg-green-700 transform hover:scale-105' 
                                        : 'bg-gray-600 cursor-not-allowed'
                                }`}
                            >
                                Submit Answer
                            </button>
                        </div>

                        {/* Explanation */}
                        {feedback.includes('Perfect') && (
                            <div className="mt-4 p-4 bg-green-600/20 border border-green-400 rounded-lg">
                                <div className="font-bold mb-2">💡 Explanation:</div>
                                <div className="text-sm">{currentChallenge.explanation}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Select a question word and submit your answer!'}</div>
                </div>

                {/* New Game Button */}
                {!currentChallenge && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Question Word Reference */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-3">📚 Quick Reference:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>wain</strong> = where</div>
                        <div><strong>emnoo</strong> = who</div>
                        <div><strong>kaif</strong> = how</div>
                        <div><strong>laish</strong> = why</div>
                        <div><strong>shoo</strong> = what</div>
                        <div><strong>meta</strong> = when</div>
                        <div><strong>kam</strong> = how many/much</div>
                        <div><strong>ay</strong> = which</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionWordPuzzleGame;