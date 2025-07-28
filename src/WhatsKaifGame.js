import React, { useState, useEffect } from 'react';

const WhatsKaifGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // "Kaif" (How) challenges - English to Arabizi
    const challenges = [
        {
            id: 'how_work',
            arabizi: 'kaif el sheghel',
            correctAnswer: 'How is the work?',
            options: [
                'How is the work?',
                'What is the work?',
                'Where is the work?',
                'When is the work?'
            ],
            explanation: 'kaif el sheghel = How is the work? (kaif = how, sheghel = work)',
            arabicScript: 'كيف الشغل؟',
            category: 'work'
        },
        {
            id: 'how_day',
            arabizi: 'kaif youmik',
            correctAnswer: 'How is your day?',
            options: [
                'How is your day?',
                'What is your day?',
                'Where is your day?',
                'Who is your day?'
            ],
            explanation: 'kaif youmik = How is your day? (youm = day, -ik = your)',
            arabicScript: 'كيف يومك؟',  
            category: 'daily'
        },
        {
            id: 'how_was_work',
            arabizi: 'kaif kaan el sheghel',
            correctAnswer: 'How was the work?',
            options: [
                'How was the work?',
                'How is the work?',
                'What was the work?',
                'Where was the work?'
            ],
            explanation: 'kaif kaan el sheghel = How was the work? (kaan = was, past tense)',
            arabicScript: 'كيف كان الشغل؟',
            category: 'work'
        },
        {
            id: 'how_was_day',
            arabizi: 'kaif kaan el youm',
            correctAnswer: 'How was the day?',
            options: [
                'How was the day?',
                'How is the day?',
                'What was the day?',
                'When was the day?'
            ],
            explanation: 'kaif kaan el youm = How was the day? (kaan = was, past tense)',
            arabicScript: 'كيف كان اليوم؟',
            category: 'daily'
        },
        {
            id: 'how_health',
            arabizi: 'kaif sa7tek',
            correctAnswer: 'How is your health?',
            options: [
                'How is your health?',
                'What is your health?',
                'Where is your health?',
                'Why is your health?'
            ],
            explanation: 'kaif sa7tek = How is your health? (sa7a = health, -tek = your)',
            arabicScript: 'كيف صحتك؟',
            category: 'health'
        },
        {
            id: 'how_family',
            arabizi: 'kaif el 3a2ila',
            correctAnswer: 'How is the family?',
            options: [
                'How is the family?',
                'Where is the family?',
                'Who is the family?',
                'What is the family?'
            ],
            explanation: 'kaif el 3a2ila = How is the family? (3a2ila = family)',
            arabicScript: 'كيف العائلة؟',
            category: 'family'
        },
        {
            id: 'how_weather',
            arabizi: 'kaif el jaw',
            correctAnswer: 'How is the weather?',
            options: [
                'How is the weather?',
                'What is the weather?',
                'When is the weather?',
                'Where is the weather?'
            ],
            explanation: 'kaif el jaw = How is the weather? (jaw = weather/atmosphere)',
            arabicScript: 'كيف الجو؟',
            category: 'weather'
        },
        {
            id: 'how_food',
            arabizi: 'kaif el akil',
            correctAnswer: 'How is the food?',
            options: [
                'How is the food?',
                'What is the food?',
                'Where is the food?',
                'Who is the food?'
            ],
            explanation: 'kaif el akil = How is the food? (akil = food)',
            arabicScript: 'كيف الأكل؟',
            category: 'food'
        },
        {
            id: 'how_studies',
            arabizi: 'kaif el diraasa',
            correctAnswer: 'How are the studies?',
            options: [
                'How are the studies?',
                'What are the studies?',
                'Where are the studies?',
                'When are the studies?'
            ],
            explanation: 'kaif el diraasa = How are the studies? (diraasa = studies)',
            arabicScript: 'كيف الدراسة؟',
            category: 'education'
        },
        {
            id: 'how_situation',
            arabizi: 'kaif el wad3',
            correctAnswer: 'How is the situation?',
            options: [
                'How is the situation?',
                'What is the situation?',
                'Where is the situation?',
                'Why is the situation?'
            ],
            explanation: 'kaif el wad3 = How is the situation? (wad3 = situation/condition)',
            arabicScript: 'كيف الوضع؟',
            category: 'general'
        },
        {
            id: 'how_trip',
            arabizi: 'kaif el rehla',
            correctAnswer: 'How was the trip?',
            options: [
                'How was the trip?',
                'What was the trip?',
                'Where was the trip?',
                'When was the trip?'
            ],
            explanation: 'kaif el rehla = How was the trip? (rehla = trip/journey)',
            arabicScript: 'كيف الرحلة؟',
            category: 'travel'
        },
        {
            id: 'how_life',
            arabizi: 'kaif el 7ayat',
            correctAnswer: 'How is life?',
            options: [
                'How is life?',
                'What is life?',
                'Where is life?',
                'Who is life?'
            ],
            explanation: 'kaif el 7ayat = How is life? (7ayat = life)',
            arabicScript: 'كيف الحياة؟',
            category: 'general'
        }
    ];

    // Select random challenge
    const selectRandomChallenge = () => {
        const availableChallenges = challenges.filter(c => !usedChallenges.has(c.id));
        
        if (availableChallenges.length === 0) {
            setFeedback('🎉 Excellent! You mastered all "kaif" (how) questions!');
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
            setFeedback('✅ Fantastic! You understood the "kaif" question!');
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
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🤔 What's Kaif?</h1>
                <p className="text-center text-green-200 mb-6">Translate "kaif" (how) questions from Arabizi to English!</p>

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
                            <div className="text-3xl font-bold mb-3 text-yellow-300">{currentChallenge.arabizi}</div>
                            {currentChallenge.arabicScript && (
                                <div className="text-xl text-gray-300 mb-4" dir="rtl">{currentChallenge.arabicScript}</div>
                            )}
                            <div className="text-lg text-green-200 mb-4">What does this mean in English?</div>
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {currentChallenge.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className="p-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-lg transition-all transform hover:scale-102 text-left"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Explanation */}
                        {feedback.includes('Fantastic') && (
                            <div className="mt-4 p-4 bg-green-600/20 border border-green-400 rounded-lg">
                                <div className="font-bold mb-2">💡 Explanation:</div>
                                <div className="text-sm">{currentChallenge.explanation}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose the correct English translation!'}</div>
                </div>

                {/* New Game Button */}
                {!currentChallenge && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-3">💡 "Kaif" Tips:</h3>
                    <div className="text-sm space-y-2 text-gray-300">
                        <div>• <strong>kaif</strong> = how (asking about condition, manner, or state)</div>
                        <div>• <strong>kaif kaan</strong> = how was (past tense)</div>
                        <div>• Common pattern: kaif + [noun/person/situation]</div>
                        <div>• Used for asking about well-being, quality, or condition</div>
                        <div>• Examples: kaif 7aalik? (How are you?)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsKaifGame;