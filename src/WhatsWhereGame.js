import React, { useState, useEffect } from 'react';

const WhatsWhereGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // Location-based challenges using "wain" (where)
    const challenges = [
        {
            id: 'daughter_location',
            question: 'Where is your daughter?',
            correctAnswer: 'wain bentik',
            options: [
                'wain bentik',
                'emnoo bentik', 
                'kaif bentik',
                'meta bentik'
            ],
            explanation: 'wain bentik = Where is your daughter? (wain = where)',
            arabicScript: 'وين بِنتِك؟',
            category: 'family'
        },
        {
            id: 'maryam_house',
            question: 'Where is Maryam\'s house?',
            correctAnswer: 'wain bayt Maryam',
            options: [
                'wain bayt Maryam',
                'shoo bayt Maryam',
                'kam bayt Maryam', 
                'laish bayt Maryam'
            ],
            explanation: 'wain bayt Maryam = Where is Maryam\'s house? (bayt = house)',
            arabicScript: 'وين بيت مريم؟',
            category: 'location'
        },
        {
            id: 'restaurant_location',
            question: 'Where is the restaurant?',
            correctAnswer: 'wain el mat3am',
            options: [
                'wain el mat3am',
                'meta el mat3am',
                'emnoo el mat3am',
                'shoo el mat3am'
            ],
            explanation: 'wain el mat3am = Where is the restaurant? (mat3am = restaurant)',
            arabicScript: 'وين المطعم؟',
            category: 'places'
        },
        {
            id: 'son_location',
            question: 'Where is your son?',
            correctAnswer: 'wain waladik',
            options: [
                'wain waladik',
                'kam waladik',
                'kaif waladik',
                'laish waladik'
            ],
            explanation: 'wain waladik = Where is your son? (walad = son/boy)',
            arabicScript: 'وين ولدك؟',
            category: 'family'
        },
        {
            id: 'car_location',
            question: 'Where is the car?',
            correctAnswer: 'wain el sayyara',
            options: [
                'wain el sayyara',
                'shoo el sayyara', 
                'emnoo el sayyara',
                'meta el sayyara'
            ],
            explanation: 'wain el sayyara = Where is the car? (sayyara = car)',
            arabicScript: 'وين السيارة؟',
            category: 'objects'
        },
        {
            id: 'office_location',
            question: 'Where is the office?',
            correctAnswer: 'wain el maktab',
            options: [
                'wain el maktab',
                'kaif el maktab',
                'kam el maktab',
                'laish el maktab'
            ],
            explanation: 'wain el maktab = Where is the office? (maktab = office)',
            arabicScript: 'وين المكتب؟',
            category: 'places'
        },
        {
            id: 'school_location',
            question: 'Where is the school?',
            correctAnswer: 'wain el madrasa',
            options: [
                'wain el madrasa',
                'meta el madrasa',
                'shoo el madrasa',
                'emnoo el madrasa'
            ],
            explanation: 'wain el madrasa = Where is the school? (madrasa = school)',
            arabicScript: 'وين المدرسة؟',
            category: 'places'
        },
        {
            id: 'friend_location',
            question: 'Where is your friend?',
            correctAnswer: 'wain sadeeqik',
            options: [
                'wain sadeeqik',
                'emnoo sadeeqik',
                'kaif sadeeqik', 
                'laish sadeeqik'
            ],
            explanation: 'wain sadeeqik = Where is your friend? (sadeeq = friend)',
            arabicScript: 'وين صديقك؟',
            category: 'people'
        },
        {
            id: 'hospital_location',
            question: 'Where is the hospital?',
            correctAnswer: 'wain el mustashfa',
            options: [
                'wain el mustashfa',
                'shoo el mustashfa',
                'kam el mustashfa',
                'meta el mustashfa'
            ],
            explanation: 'wain el mustashfa = Where is the hospital? (mustashfa = hospital)',
            arabicScript: 'وين المستشفى؟',
            category: 'places'
        },
        {
            id: 'mall_location',
            question: 'Where is the mall?',
            correctAnswer: 'wain el mall',
            options: [
                'wain el mall',
                'kaif el mall',
                'emnoo el mall',
                'laish el mall'
            ],
            explanation: 'wain el mall = Where is the mall? (mall = shopping center)',
            arabicScript: 'وين المول؟',
            category: 'places'
        },
        {
            id: 'keys_location',
            question: 'Where are the keys?',
            correctAnswer: 'wain el mafateeh',
            options: [
                'wain el mafateeh',
                'meta el mafateeh',
                'shoo el mafateeh',
                'kam el mafateeh'
            ],
            explanation: 'wain el mafateeh = Where are the keys? (mafateeh = keys)',
            arabicScript: 'وين المفاتيح؟',
            category: 'objects'
        },
        {
            id: 'phone_location',
            question: 'Where is the phone?',
            correctAnswer: 'wain el telifoon',
            options: [
                'wain el telifoon',
                'emnoo el telifoon',
                'laish el telifoon',
                'kaif el telifoon'
            ],
            explanation: 'wain el telifoon = Where is the phone? (telifoon = phone)',
            arabicScript: 'وين التلفون؟',
            category: 'objects'
        }
    ];

    // Select random challenge
    const selectRandomChallenge = () => {
        const availableChallenges = challenges.filter(c => !usedChallenges.has(c.id));
        
        if (availableChallenges.length === 0) {
            setFeedback('🎉 Amazing! You mastered all "wain" (where) questions!');
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
            setFeedback('✅ Perfect! You nailed the "wain" question!');
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
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-teal-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">📍 What's Where?</h1>
                <p className="text-center text-blue-200 mb-6">Master "wain" (where) questions in Arabizi!</p>

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
                            <div className="text-2xl font-bold mb-2 text-yellow-300">"{currentChallenge.question}"</div>
                            {currentChallenge.arabicScript && (
                                <div className="text-xl text-gray-300 mb-4" dir="rtl">{currentChallenge.arabicScript}</div>
                            )}
                            <div className="text-lg text-blue-200 mb-4">How do you ask this in Arabizi?</div>
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {currentChallenge.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className="p-4 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold text-lg transition-all transform hover:scale-102 text-left"
                                >
                                    {option}
                                </button>
                            ))}
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
                    <div className="text-lg">{feedback || 'Choose the correct Arabizi translation!'}</div>
                </div>

                {/* New Game Button */}
                {!currentChallenge && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-3">💡 "Wain" Tips:</h3>
                    <div className="text-sm space-y-2 text-gray-300">
                        <div>• <strong>wain</strong> = where (asking about location)</div>
                        <div>• Always starts with "wain" when asking "where"</div>
                        <div>• Common pattern: wain + [person/thing]</div>
                        <div>• Examples: wain Ahmed? (Where is Ahmed?)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsWhereGame;