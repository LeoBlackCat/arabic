import React, { useState, useEffect } from 'react';

const ContextClueMasterGame = () => {
    const [currentScenario, setCurrentScenario] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [usedScenarios, setUsedScenarios] = useState(new Set());
    const [showExplanation, setShowExplanation] = useState(false);
    const [category, setCategory] = useState('all');

    // Realistic scenarios based on the grammar conversation
    const scenarios = [
        // Kitchen/Food scenarios
        {
            id: 'coffee_for_friend',
            category: 'kitchen',
            situation: 'Your friend visits you at home. You want to make coffee for them.',
            question: 'How do you say "I make you coffee"?',
            options: [
                { text: 'asaweek gahwa', type: 'direct', explanation: 'This sounds like you\'re making your friend INTO coffee!' },
                { text: 'asawee lik gahwa', type: 'indirect', explanation: 'Perfect! You\'re making coffee FOR your friend.' }
            ],
            correct: 'indirect',
            culturalNote: 'In Emirati culture, offering coffee (gahwa) to guests is very important!',
            level: 'basic'
        },
        {
            id: 'pour_tea',
            category: 'kitchen',
            situation: 'You\'re having dinner with family. You want to pour tea for your sister.',
            question: 'How do you say "I pour you tea"?',
            options: [
                { text: 'asebich chai', type: 'direct', explanation: 'This sounds like you\'re pouring your sister like she\'s a drink!' },
                { text: 'aseb lich chai', type: 'indirect', explanation: 'Excellent! You\'re pouring tea FOR your sister.' }
            ],
            correct: 'indirect',
            culturalNote: 'Tea time is a social activity in Arab culture - always served TO people, not ON them!',
            level: 'basic'
        },
        {
            id: 'cook_dinner',
            category: 'kitchen',
            situation: 'Your mom asks if you can help in the kitchen tonight.',
            question: 'How do you say "I cook for you"?',
            options: [
                { text: 'atbakhich', type: 'direct', explanation: 'This sounds like you\'re cooking your mom as food!' },
                { text: 'atbakh lich', type: 'indirect', explanation: 'Perfect! You\'re cooking FOR your mom.' }
            ],
            correct: 'indirect',
            culturalNote: 'Cooking for family is showing love and care - you do it FOR them!',
            level: 'basic'
        },
        
        // Communication scenarios
        {
            id: 'call_mother',
            category: 'communication',
            situation: 'You\'re traveling and want to call your mother to check in.',
            question: 'How do you say "I call you"?',
            options: [
                { text: 'ateselik', type: 'direct', explanation: 'This doesn\'t work - you call TO someone, not ON them!' },
                { text: 'atesel lik', type: 'indirect', explanation: 'Correct! You call TO your mother through the phone.' }
            ],
            correct: 'indirect',
            culturalNote: 'Communication verbs always need prepositions - you communicate TO people!',
            level: 'basic'
        },
        {
            id: 'send_message',
            category: 'communication',
            situation: 'Your colleague is working from home. You need to send them an important document.',
            question: 'How do you say "I send you the document"?',
            options: [
                { text: 'atareshik el document', type: 'direct', explanation: 'This sounds like you\'re sending your colleague somewhere!' },
                { text: 'ataresh lik el document', type: 'indirect', explanation: 'Perfect! You\'re sending the document TO your colleague.' }
            ],
            correct: 'indirect',
            culturalNote: 'In business, clear communication is key - always send TO people!',
            level: 'intermediate'
        },
        {
            id: 'tell_secret',
            category: 'communication',
            situation: 'You have exciting news and want to share it with your best friend.',
            question: 'How do you say "I tell you everything"?',
            options: [
                { text: 'agoulik kil shai', type: 'direct', explanation: 'This is actually incorrect Arabic - you say TO someone!' },
                { text: 'agoul lik kil shai', type: 'indirect', explanation: 'Excellent! You tell everything TO your friend.' }
            ],
            correct: 'indirect',
            culturalNote: 'Sharing secrets shows trust - you speak TO your close friends!',
            level: 'intermediate'
        },
        
        // Daily activities
        {
            id: 'see_friend',
            category: 'daily',
            situation: 'You spot your friend across the street and want to get their attention.',
            question: 'How do you say "I see you"?',
            options: [
                { text: 'ashoofik', type: 'direct', explanation: 'Perfect! You see your friend directly with your eyes.' },
                { text: 'ashoof lik', type: 'indirect', explanation: 'This doesn\'t make sense - you can\'t see FOR someone!' }
            ],
            correct: 'direct',
            culturalNote: 'Seeing is direct perception - your eyes directly observe the person!',
            level: 'basic'
        },
        {
            id: 'know_neighbor',
            category: 'daily',
            situation: 'Someone asks if you\'re familiar with the new neighbor.',
            question: 'How do you say "I know them"?',
            options: [
                { text: 'a3arefhum', type: 'direct', explanation: 'Correct! You know them directly in your mind.' },
                { text: 'a3aref lihum', type: 'indirect', explanation: 'This doesn\'t work - knowledge is direct!' }
            ],
            correct: 'direct',
            culturalNote: 'Knowledge is personal and direct - you know people directly!',
            level: 'basic'
        },
        {
            id: 'hear_music',
            category: 'daily',
            situation: 'Your roommate is playing music loudly in the next room.',
            question: 'How do you say "I hear you"?',
            options: [
                { text: 'asma3ik', type: 'direct', explanation: 'Perfect! You hear them directly - sound reaches your ears.' },
                { text: 'asma3 lik', type: 'indirect', explanation: 'This doesn\'t make sense - hearing is direct perception!' }
            ],
            correct: 'direct',
            culturalNote: 'Hearing is direct sensory experience - sound comes directly from the source!',
            level: 'basic'
        },

        // Shopping/Business scenarios
        {
            id: 'buy_gift',
            category: 'shopping',
            situation: 'It\'s your friend\'s birthday and you want to get them something special.',
            question: 'How do you say "I buy you a gift"?',
            options: [
                { text: 'ashtereek hadhiya', type: 'direct', explanation: 'This sounds like you\'re buying your friend as a gift!' },
                { text: 'ashteree lik hadhiya', type: 'indirect', explanation: 'Perfect! You\'re buying a gift FOR your friend.' }
            ],
            correct: 'indirect',
            culturalNote: 'Gift-giving shows care - you buy things FOR people you love!',
            level: 'intermediate'
        },
        {
            id: 'pay_bill',
            category: 'shopping',
            situation: 'You\'re at a restaurant with friends and want to pay for everyone.',
            question: 'How do you say "I pay for you"?',
            options: [
                { text: 'adfa3ik', type: 'direct', explanation: 'This sounds like you\'re paying your friend as money!' },
                { text: 'adfa3 lik', type: 'indirect', explanation: 'Excellent! You\'re paying FOR your friend.' }
            ],
            correct: 'indirect',
            culturalNote: 'Treating friends to meals is generous - you pay FOR them!',
            level: 'intermediate'
        }
    ];

    // Filter scenarios by category
    const getFilteredScenarios = () => {
        if (category === 'all') return scenarios;
        return scenarios.filter(s => s.category === category);
    };

    // Select random scenario
    const selectRandomScenario = () => {
        const availableScenarios = getFilteredScenarios().filter(s => !usedScenarios.has(s.id));
        
        if (availableScenarios.length === 0) {
            setFeedback('🎉 You\'ve mastered all scenarios in this category! Choose another category or start over.');
            setCurrentScenario(null);
            return;
        }

        const randomScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
        setCurrentScenario(randomScenario);
        setFeedback('');
        setShowExplanation(false);
    };

    // Handle answer selection
    const handleAnswer = (selectedOption) => {
        if (!currentScenario) return;

        const isCorrect = selectedOption.type === currentScenario.correct;
        
        if (isCorrect) {
            setScore(score + 1);
            setStreak(streak + 1);
            if (streak + 1 > bestStreak) {
                setBestStreak(streak + 1);
            }
            setFeedback('✅ Excellent! You understood the context perfectly!');
            setUsedScenarios(prev => new Set([...prev, currentScenario.id]));
            setTimeout(() => selectRandomScenario(), 2000);
        } else {
            setStreak(0);
            setFeedback('❌ Not quite right. Let me explain the context...');
            setShowExplanation(true);
        }
    };

    // Start new game
    const startNewGame = () => {
        setScore(0);
        setStreak(0);
        setUsedScenarios(new Set());
        setShowExplanation(false);
        selectRandomScenario();
    };

    // Initialize game
    useEffect(() => {
        selectRandomScenario();
    }, [category]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-teal-900 text-white p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🎯 Context Clue Master</h1>
                <p className="text-center text-green-200 mb-6">Master Arabic grammar through real-life situations!</p>

                {/* Stats */}
                <div className="flex justify-between items-center mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <div className="text-yellow-300 font-bold">Score: {score}</div>
                    <div className="text-orange-300 font-bold">Streak: {streak} 🔥</div>
                    <div className="text-purple-300 font-bold">Best: {bestStreak}</div>
                </div>

                {/* Category Filter */}
                <div className="mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Choose Category:</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    >
                        <option value="all">All Categories</option>
                        <option value="kitchen">🍳 Kitchen & Food</option>
                        <option value="communication">📱 Communication</option>
                        <option value="daily">🏠 Daily Life</option>
                        <option value="shopping">🛒 Shopping & Business</option>
                    </select>
                </div>

                {/* Current Scenario */}
                {currentScenario && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6">
                        {/* Situation */}
                        <div className="mb-6 p-4 bg-blue-900/30 rounded-lg">
                            <h3 className="font-bold mb-2">📖 Situation:</h3>
                            <p className="text-blue-100">{currentScenario.situation}</p>
                        </div>

                        {/* Question */}
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-bold mb-2">{currentScenario.question}</h3>
                        </div>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {currentScenario.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className={`p-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                                        option.type === 'direct' 
                                            ? 'bg-red-600 hover:bg-red-700' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    <div className="text-lg mb-1">{option.text}</div>
                                    <div className="text-xs opacity-75">
                                        {option.type === 'direct' ? '(Direct Object)' : '(Indirect Object)'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Explanation */}
                        {showExplanation && (
                            <div className="bg-yellow-600/20 border border-yellow-400 rounded-lg p-4 mt-4">
                                <div className="font-bold mb-2">💡 Explanation:</div>
                                {currentScenario.options.map((option, index) => (
                                    <div key={index} className={`text-sm mb-2 ${option.type === currentScenario.correct ? 'text-green-300 font-bold' : 'text-red-300'}`}>
                                        <strong>{option.text}:</strong> {option.explanation}
                                    </div>
                                ))}
                                
                                {/* Cultural Note */}
                                <div className="mt-3 p-3 bg-purple-900/30 rounded">
                                    <div className="font-bold text-purple-200">🌟 Cultural Note:</div>
                                    <div className="text-sm text-purple-100">{currentScenario.culturalNote}</div>
                                </div>

                                <button
                                    onClick={() => selectRandomScenario()}
                                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
                                >
                                    Next Scenario ➡️
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Read the situation carefully and choose the correct Arabic construction!'}</div>
                </div>

                {/* New Game Button */}
                {!currentScenario && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Strategy Tips */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-2">🧠 Context Strategy:</h3>
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li>• <strong>Ask yourself:</strong> "Am I doing something TO the person or FOR the person?"</li>
                        <li>• <strong>Direct:</strong> The person IS the target (see them, hear them, know them)</li>
                        <li>• <strong>Indirect:</strong> You're doing something for their benefit (make FOR them, call TO them)</li>
                        <li>• <strong>Weird test:</strong> Does the direct version sound strange? "Make you coffee" = making person into coffee?</li>
                        <li>• <strong>Communication:</strong> Always use prepositions (call TO, send TO, say TO)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ContextClueMasterGame;