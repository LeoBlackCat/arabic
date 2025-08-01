import React, { useState, useEffect } from 'react';

const DirectIndirectDetectiveGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [showExplanation, setShowExplanation] = useState(false);
    const [level, setLevel] = useState(1);
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // Challenge data based on the grammar conversation
    const challenges = [
        // Direct object examples (use suffixes -ik, -ich, -kum, etc.)
        {
            id: 'see_you',
            english: 'I see you',
            verbStem: 'ashoof',
            correct: 'direct',
            directForm: 'ashoofik',
            indirectForm: 'ashoof lik',
            explanation: 'You see the person directly - the action affects them directly',
            category: 'perception',
            level: 1
        },
        {
            id: 'she_hears_him',
            english: 'She hears him',
            verbStem: 'tisma3',
            correct: 'direct',
            directForm: 'tisma3ah',
            indirectForm: 'tisma3 lah',
            explanation: 'She hears him directly - the sound comes from him to her',
            category: 'perception',
            level: 1
        },
        {
            id: 'we_know_you',
            english: 'We know you',
            verbStem: 'na3aref',
            correct: 'direct',
            directForm: 'na3arefik',
            indirectForm: 'na3aref lik',
            explanation: 'We know you directly - knowledge about the person',
            category: 'basic',
            level: 1
        },
        {
            id: 'they_want_her',
            english: 'They want her',
            verbStem: 'yaboon',
            correct: 'direct',
            directForm: 'yaboonha',
            indirectForm: 'yaboon laha',
            explanation: 'They want her directly - desire is directed at the person',
            category: 'basic',
            level: 1
        },
        {
            id: 'he_forgets_us',
            english: 'He forgets us',
            verbStem: 'yansa',
            correct: 'direct',
            directForm: 'yansana',
            indirectForm: 'yansa lana',
            explanation: 'He forgets us directly from his memory',
            category: 'basic',
            level: 2
        },
        
        // Indirect object examples (use prepositions lik, lich, lihum, etc.)
        {
            id: 'make_coffee',
            english: 'I make coffee for you',
            verbStem: 'asawee',
            correct: 'indirect',
            directForm: 'asaweek',
            indirectForm: 'asawee lik gahwa',
            explanation: 'You\'re making coffee FOR them, not making them into coffee!',
            category: 'action',
            level: 1
        },
        {
            id: 'she_sends_message',
            english: 'She sends us a message',
            verbStem: 'tresh',
            correct: 'indirect',
            directForm: 'treshna',
            indirectForm: 'tresh lana risala',
            explanation: 'She sends TO us - communication verbs need prepositions',
            category: 'communication',
            level: 1
        },
        {
            id: 'they_cook_dinner',
            english: 'They cook dinner for him',
            verbStem: 'ytbakhoon',
            correct: 'indirect',
            directForm: 'ytbakhoonah',
            indirectForm: 'ytbakhoon lah akil',
            explanation: 'They cook FOR him, not cooking the person!',
            category: 'action',
            level: 1
        },
        {
            id: 'send_email',
            english: 'I send you an email',
            verbStem: 'ataresh',
            correct: 'indirect',
            directForm: 'atareshik',
            indirectForm: 'ataresh lik email',
            explanation: 'You send TO them - communication verbs need prepositions',
            category: 'communication',
            level: 1
        },
        {
            id: 'call_you',
            english: 'I call you',
            verbStem: 'atesel',
            correct: 'indirect',
            directForm: 'ateselik',
            indirectForm: 'atesel lik',
            explanation: 'You call TO them - communication through phone',
            category: 'communication',
            level: 1
        },
        {
            id: 'you_say_to_her',
            english: 'You say to her',
            verbStem: 'tgool',
            correct: 'indirect',
            directForm: 'tgoolinha',
            indirectForm: 'tgool laha',
            explanation: 'You speak TO her - communication verbs use prepositions',
            category: 'communication',
            level: 1
        },
        {
            id: 'he_buys_gift',
            english: 'He buys a gift for us',
            verbStem: 'yashteree',
            correct: 'indirect',
            directForm: 'yashtereena',
            indirectForm: 'yashteree lana hadhiya',
            explanation: 'He buys FOR us, not buying us as people!',
            category: 'transaction',
            level: 2
        },
        {
            id: 'we_pour_tea',
            english: 'We pour tea for you',
            verbStem: 'naseb',
            correct: 'indirect',
            directForm: 'nasebik',
            indirectForm: 'naseb lik chai',
            explanation: 'We pour FOR you, not pouring you like a drink!',
            category: 'action',
            level: 2
        },
        {
            id: 'cook_food',
            english: 'I cook for you',
            verbStem: 'atbakh',
            correct: 'indirect',
            directForm: 'atbakhik',
            indirectForm: 'atbakh lik',
            explanation: 'You cook FOR them, not cooking the person literally!',
            category: 'action',
            level: 2
        },
        {
            id: 'write_letter',
            english: 'I write to you',
            verbStem: 'akteb',
            correct: 'indirect',
            directForm: 'aktebik',
            indirectForm: 'akteb lik',
            explanation: 'You write TO them, not writing the person literally!',
            category: 'communication',
            level: 2
        }
    ];

    // Get challenges for current level
    const getCurrentLevelChallenges = () => {
        return challenges.filter(c => c.level <= level);
    };

    // Select random challenge
    const selectRandomChallenge = () => {
        const availableChallenges = getCurrentLevelChallenges().filter(c => !usedChallenges.has(c.id));
        
        if (availableChallenges.length === 0) {
            // Level complete!
            if (level < 2) {
                setLevel(level + 1);
                setUsedChallenges(new Set());
                setFeedback(`🎉 Level ${level} complete! Moving to Level ${level + 1}...`);
                setTimeout(() => selectRandomChallenge(), 2000);
            } else {
                setFeedback('🏆 Congratulations! You mastered direct vs indirect objects!');
                setCurrentChallenge(null);
            }
            return;
        }

        const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        setCurrentChallenge(randomChallenge);
        setFeedback('');
        setShowExplanation(false);
    };

    // Handle answer selection
    const handleAnswer = (selectedType) => {
        if (!currentChallenge) return;

        const isCorrect = selectedType === currentChallenge.correct;
        
        if (isCorrect) {
            // Play success sound and show animation
            new Audio('./sounds/success.wav').play().catch(() => {});
            setAnimationState('success');
            setScore(score + 1);
            setFeedback('✅ Correct! Great detective work!');
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            setTimeout(() => {
                setAnimationState('');
                selectRandomChallenge();
            }, 1500);
        } else {
            // Play error sound and show animation
            new Audio('./sounds/error.wav').play().catch(() => {});
            setAnimationState('error');
            setLives(lives - 1);
            setFeedback('❌ Not quite right. Let me explain...');
            setShowExplanation(true);
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            
            setTimeout(() => setAnimationState(''), 800);
            
            if (lives <= 1) {
                setTimeout(() => {
                    setFeedback('💔 Game Over! But you learned a lot about Arabic grammar!');
                    setCurrentChallenge(null);
                }, 3000);
            }
        }
    };

    // Start new game
    const startNewGame = () => {
        setScore(0);
        setLives(3);
        setUsedChallenges(new Set());
        setLevel(1);
        setShowExplanation(false);
        selectRandomChallenge();
    };

    // Initialize game
    useEffect(() => {
        selectRandomChallenge();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🕵️ Direct vs Indirect Detective</h1>
                <p className="text-center text-purple-200 mb-6">Solve the mystery: Does this need a suffix or preposition?</p>

                {/* Stats */}
                <div className="flex justify-between items-center mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <div className="text-yellow-300 font-bold">Score: {score}</div>
                    <div className="text-blue-300 font-bold">Level: {level}</div>
                    <div className="text-red-300 font-bold">Lives: {'❤️'.repeat(lives)}</div>
                </div>

                {/* Current Challenge */}
                {currentChallenge && (
                    <div className={`bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center transition-all duration-500 ${
                        animationState === 'success' ? 'animate-pulse bg-green-500/30 scale-105' :
                        animationState === 'error' ? 'animate-bounce bg-red-500/30' : ''
                    }`}>
                        <div className="mb-4">
                            <div className="text-2xl font-bold mb-2">{currentChallenge.english}</div>
                            <div className="text-lg text-gray-300">Verb stem: <span className="text-yellow-300">{currentChallenge.verbStem}</span></div>
                            <div className="text-sm text-purple-200 mt-2">Category: {currentChallenge.category}</div>
                        </div>

                        {/* Answer Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => handleAnswer('direct')}
                                className="p-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                            >
                                🎯 DIRECT<br/>
                                <span className="text-sm font-normal">Use suffix (-ik, -ich, -kum)</span><br/>
                                <span className="text-xs text-red-200">{currentChallenge.directForm}</span>
                            </button>
                            
                            <button
                                onClick={() => handleAnswer('indirect')}
                                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                            >
                                🎯 INDIRECT<br/>
                                <span className="text-sm font-normal">Use preposition (lik, lich, lihum)</span><br/>
                                <span className="text-xs text-blue-200">{currentChallenge.indirectForm}</span>
                            </button>
                        </div>

                        {/* Explanation */}
                        {showExplanation && (
                            <div className="bg-yellow-600/20 border border-yellow-400 rounded-lg p-4 mt-4">
                                <div className="font-bold mb-2">💡 Explanation:</div>
                                <div className="text-sm">{currentChallenge.explanation}</div>
                                <div className="mt-2 text-green-300 font-bold">
                                    Correct answer: {currentChallenge.correct === 'direct' ? currentChallenge.directForm : currentChallenge.indirectForm}
                                </div>
                                {lives > 1 && (
                                    <button
                                        onClick={() => selectRandomChallenge()}
                                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
                                    >
                                        Continue ➡️
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose whether this sentence needs direct or indirect construction!'}</div>
                </div>

                {/* New Game Button */}
                {(!currentChallenge || lives === 0) && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg"
                        >
                            🎮 {lives === 0 ? 'Try Again' : 'New Game'}
                        </button>
                    </div>
                )}

                {/* Grammar Tips */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-2">🧠 Detective Tips:</h3>
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li>• <strong>Direct:</strong> Action affects the person directly (see, hear, know, want)</li>
                        <li>• <strong>Indirect:</strong> Action is FOR/TO the person (make, send, call, say, buy)</li>
                        <li>• <strong>Think:</strong> "Can I do this TO the person literally?" If weird → Indirect!</li>
                        <li>• <strong>Example:</strong> "Make you coffee" = making person into coffee? → Use indirect!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DirectIndirectDetectiveGame;