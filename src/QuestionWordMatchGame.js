import React, { useState, useEffect } from 'react';

const QuestionWordMatchGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // Question word challenges based on new files
    const challenges = [
        // WAIN (Where) questions
        {
            id: 'where_daughter',
            question: 'wain bentik',
            english: 'Where is your daughter?',
            correctAnswer: 'wain',
            options: ['wain', 'emnoo', 'kaif', 'laish'],
            explanation: 'wain = where (asking about location)',
            category: 'location'
        },
        {
            id: 'where_house',
            question: 'wain bayt Maryam',
            english: 'Where is Maryam\'s house?',
            correctAnswer: 'wain',
            options: ['shoo', 'wain', 'meta', 'kam'],
            explanation: 'wain = where (asking about location)',
            category: 'location'
        },

        // EMNOO (Who) questions  
        {
            id: 'who_man',
            question: 'emnoo el rayyal',
            english: 'Who\'s the man?',
            correctAnswer: 'emnoo',
            options: ['emnoo', 'wain', 'shoo', 'meta'],
            explanation: 'emnoo = who (asking about people)',
            category: 'people'
        },
        {
            id: 'who_this',
            question: 'emnoo hatha',
            english: 'Who\'s this?',
            correctAnswer: 'emnoo',
            options: ['kaif', 'emnoo', 'kam', 'laish'],
            explanation: 'emnoo = who (asking about people)',
            category: 'people'
        },
        {
            id: 'who_boss',
            question: 'emnoo el mudeer',
            english: 'Who\'s the boss?',
            correctAnswer: 'emnoo',
            options: ['emnoo', 'wain', 'meta', 'shoo'],
            explanation: 'emnoo = who (asking about people)',
            category: 'people'
        },

        // KAIF (How) questions
        {
            id: 'how_work',
            question: 'kaif el sheghel',
            english: 'How is the work?',
            correctAnswer: 'kaif',
            options: ['kaif', 'wain', 'emnoo', 'shoo'],
            explanation: 'kaif = how (asking about condition/manner)',
            category: 'condition'
        },
        {
            id: 'how_day',
            question: 'kaif youmik',  
            english: 'How is your day?',
            correctAnswer: 'kaif',
            options: ['meta', 'kaif', 'laish', 'kam'],
            explanation: 'kaif = how (asking about condition/manner)',
            category: 'condition'
        },

        // LAISH (Why) questions
        {
            id: 'why_crowded',
            question: 'laish za7mah',
            english: 'Why is it crowded?',
            correctAnswer: 'laish',
            options: ['laish', 'kaif', 'wain', 'emnoo'],
            explanation: 'laish = why (asking for reason)',
            category: 'reason'
        },
        {
            id: 'why_happy',
            question: 'laish mistaanes',
            english: 'Why are you happy?',
            correctAnswer: 'laish',
            options: ['shoo', 'laish', 'meta', 'kam'],
            explanation: 'laish = why (asking for reason)',
            category: 'reason'
        },
        {
            id: 'why_late',
            question: 'laish met\'akher',
            english: 'Why are you late?',
            correctAnswer: 'laish',
            options: ['laish', 'kaif', 'wain', 'emnoo'],
            explanation: 'laish = why (asking for reason)',
            category: 'reason'
        },

        // SHOO (What) questions
        {
            id: 'what_name',
            question: 'shoo ismek',
            english: 'What is your name?',
            correctAnswer: 'shoo',
            options: ['shoo', 'emnoo', 'wain', 'kaif'],
            explanation: 'shoo = what (asking about things/information)',
            category: 'information'
        },
        {
            id: 'what_lunch',
            question: 'shoo el ghada',
            english: 'What is for lunch?',
            correctAnswer: 'shoo',
            options: ['meta', 'shoo', 'laish', 'kam'],
            explanation: 'shoo = what (asking about things/information)',
            category: 'information'
        },
        {
            id: 'what_this',
            question: 'shoo hadha',
            english: 'What is this?',
            correctAnswer: 'shoo',
            options: ['shoo', 'wain', 'emnoo', 'meta'],
            explanation: 'shoo = what (asking about things/information)',
            category: 'information'
        },

        // META (When) questions
        {
            id: 'when_dinner',
            question: 'meta el 3asha',
            english: 'When is the dinner?',
            correctAnswer: 'meta',
            options: ['meta', 'shoo', 'kaif', 'wain'],
            explanation: 'meta = when (asking about time)',
            category: 'time'
        },
        {
            id: 'when_birthday',
            question: 'meta 3eed milaadek',
            english: 'When is your birthday?',
            correctAnswer: 'meta',
            options: ['laish', 'meta', 'emnoo', 'kam'],
            explanation: 'meta = when (asking about time)',
            category: 'time'
        },
        {
            id: 'when_meeting',
            question: 'meta el ejtimaa3',
            english: 'When is the meeting?',
            correctAnswer: 'meta',
            options: ['meta', 'wain', 'shoo', 'kaif'],
            explanation: 'meta = when (asking about time)',
            category: 'time'
        },

        // KAM (How many/much) questions
        {
            id: 'how_old',
            question: 'kam 3omrek',
            english: 'How old are you?',
            correctAnswer: 'kam',
            options: ['kam', 'kaif', 'meta', 'shoo'],
            explanation: 'kam = how many/much (asking about quantity/age)',
            category: 'quantity'
        },
        {
            id: 'how_many_phones',
            question: 'kam telifoon 3endek',
            english: 'How many phones do you have?',
            correctAnswer: 'kam',
            options: ['wain', 'kam', 'emnoo', 'laish'],
            explanation: 'kam = how many/much (asking about quantity)',
            category: 'quantity'
        },
        {
            id: 'how_much_this',
            question: 'ibkam hadha',
            english: 'How much is this?',
            correctAnswer: 'kam',
            options: ['kam', 'shoo', 'meta', 'kaif'],
            explanation: 'kam = how many/much (asking about price/quantity)',
            category: 'quantity'
        }
    ];

    // Select random challenge
    const selectRandomChallenge = () => {
        const availableChallenges = challenges.filter(c => !usedChallenges.has(c.id));
        
        if (availableChallenges.length === 0) {
            setFeedback('🎉 Congratulations! You mastered all question words!');
            setCurrentChallenge(null);
            return;
        }

        const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        setCurrentChallenge(randomChallenge);
        setFeedback('');
    };

    // Handle answer selection
    const handleAnswer = (selectedAnswer) => {
        if (!currentChallenge) return;

        const isCorrect = selectedAnswer === currentChallenge.correctAnswer;
        
        if (isCorrect) {
            // Play success sound and show animation
            new Audio('./sounds/success.wav').play().catch(() => {});
            setAnimationState('success');
            setScore(score + 1);
            setFeedback('✅ Correct! You identified the question word perfectly!');
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            setTimeout(() => {
                setAnimationState('');
                setRound(round + 1);
                selectRandomChallenge();
            }, 2000);
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
        selectRandomChallenge();
    };

    // Initialize game
    useEffect(() => {
        selectRandomChallenge();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-yellow-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🔤 Question Word Match</h1>
                <p className="text-center text-orange-200 mb-6">Identify the question word in each Arabizi phrase!</p>

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
                            <div className="text-3xl font-bold mb-3">{currentChallenge.question}</div>
                            <div className="text-lg text-gray-300 mb-4">{currentChallenge.english}</div>
                            <div className="text-sm text-orange-200">Which question word is used here?</div>
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-2 gap-4">
                            {currentChallenge.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Explanation */}
                        {feedback.includes('Correct') && (
                            <div className="mt-4 p-4 bg-green-600/20 border border-green-400 rounded-lg">
                                <div className="font-bold mb-2">💡 Explanation:</div>
                                <div className="text-sm">{currentChallenge.explanation}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose the correct question word!'}</div>
                </div>

                {/* New Game Button */}
                {!currentChallenge && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Question Word Reference */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-3">📚 Question Word Reference:</h3>
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

export default QuestionWordMatchGame;