import React, { useState, useEffect } from 'react';

const GrammarPatternPuzzleGame = () => {
    const [currentVerb, setCurrentVerb] = useState(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedVerbs, setUsedVerbs] = useState(new Set());
    const [showLogicTree, setShowLogicTree] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [achievements, setAchievements] = useState(new Set());
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // Verb categorization data based on the grammar conversation
    const verbCategories = {
        alwaysDirect: {
            title: "Always Direct",
            description: "These verbs affect the person directly - the person IS the target",
            color: "bg-red-600",
            verbs: [
                {
                    verb: 'ashoof',
                    english: 'I see',
                    example: 'ashoofik (I see you)',
                    explanation: 'Your eyes directly observe the person',
                    whyDirect: 'Vision is direct perception - you see the actual person'
                },
                {
                    verb: 'asma3',
                    english: 'I hear',
                    example: 'asma3ik (I hear you)',
                    explanation: 'Sound comes directly from the person to your ears',
                    whyDirect: 'Hearing is direct perception - sound travels from them to you'
                },
                {
                    verb: 'a3aref',
                    english: 'I know',
                    example: 'a3arefik (I know you)',
                    explanation: 'Knowledge about the person exists directly in your mind',
                    whyDirect: 'Knowledge is personal and direct - you know the person themselves'
                },
                {
                    verb: 'aba',
                    english: 'I want',
                    example: 'abak (I want you)',
                    explanation: 'Your desire is directed at the person',
                    whyDirect: 'Want targets the person directly - not doing something for them'
                },
                {
                    verb: 'ansa',
                    english: 'I forget',
                    example: 'ansak (I forget you)',
                    explanation: 'You forget the person directly from your memory',
                    whyDirect: 'Forgetting affects your direct memory of the person'
                }
            ]
        },
        alwaysIndirect: {
            title: "Always Indirect",
            description: "These verbs require prepositions - you do something FOR/TO the person",
            color: "bg-blue-600",
            verbs: [
                {
                    verb: 'ataresh',
                    english: 'I send',
                    example: 'ataresh lik (I send to you)',
                    explanation: 'You send something TO them, not sending the person',
                    whyIndirect: 'Communication verb - you send messages/items TO people'
                },
                {
                    verb: 'atesel',
                    english: 'I call',
                    example: 'atesel lik (I call you)',
                    explanation: 'You call TO them through phone/communication',
                    whyIndirect: 'Communication verb - you communicate TO people'
                },
                {
                    verb: 'agoul',
                    english: 'I say',
                    example: 'agoul lik (I say to you)',
                    explanation: 'You speak TO them, not saying the person',
                    whyIndirect: 'Communication verb - you direct speech TO people'
                },
                {
                    verb: 'asawee',
                    english: 'I make',
                    example: 'asawee lik gahwa (I make coffee for you)',
                    explanation: 'You make things FOR them, not making the person',
                    whyIndirect: 'Creating things for someone\'s benefit'
                },
                {
                    verb: 'aseb',
                    english: 'I pour',
                    example: 'aseb lik chai (I pour tea for you)',
                    explanation: 'You pour drinks FOR them, not pouring the person',
                    whyIndirect: 'Serving someone - doing FOR their benefit'
                }
            ]
        },
        contextDependent: {
            title: "Context Dependent",
            description: "These can be direct OR indirect depending on the situation",
            color: "bg-purple-600",
            verbs: [
                {
                    verb: 'agra',
                    english: 'I read',
                    directExample: 'agrak (I read you - understand you deeply)',
                    indirectExample: 'agra lik kitab (I read a book to you)',
                    explanation: 'Direct: understanding someone; Indirect: reading for someone',
                    whyBoth: 'Can mean understanding a person OR reading something for them'
                },
                {
                    verb: 'amsik',
                    english: 'I hold',
                    directExample: 'amsikik (I hold you)',
                    indirectExample: 'amsik lik el baby (I hold the baby for you)',
                    explanation: 'Direct: holding the person; Indirect: holding something for them',
                    whyBoth: 'Can hold the person OR hold something for their benefit'
                },
                {
                    verb: 'ayeeb',
                    english: 'I bring',
                    directExample: 'ayeebik (I bring you here - bring the person)',
                    indirectExample: 'ayeeb lik shai (I bring something for you)',
                    explanation: 'Direct: bringing the person; Indirect: bringing something to them',
                    whyBoth: 'Can bring the person themselves OR bring items for them'
                }
            ]
        }
    };

    // Get all verbs from all categories
    const getAllVerbs = () => {
        const allVerbs = [];
        Object.entries(verbCategories).forEach(([categoryKey, category]) => {
            category.verbs.forEach(verb => {
                allVerbs.push({
                    ...verb,
                    correctCategory: categoryKey,
                    categoryTitle: category.title,
                    categoryColor: category.color
                });
            });
        });
        return allVerbs;
    };

    // Select random verb
    const selectRandomVerb = () => {
        const availableVerbs = getAllVerbs().filter(v => !usedVerbs.has(v.verb));
        
        if (availableVerbs.length === 0) {
            setFeedback('🏆 Congratulations! You\'ve mastered Arabic verb patterns!');
            setCurrentVerb(null);
            return;
        }

        const randomVerb = availableVerbs[Math.floor(Math.random() * availableVerbs.length)];
        setCurrentVerb(randomVerb);
        setFeedback('');
        setSelectedCategory(null);
        setShowLogicTree(false);
    };

    // Handle category selection
    const handleCategorySelection = (selectedCategoryKey) => {
        if (!currentVerb) return;

        setSelectedCategory(selectedCategoryKey);
        const isCorrect = selectedCategoryKey === currentVerb.correctCategory;
        
        if (isCorrect) {
            // Play success sound and show animation
            new Audio('./sounds/success.wav').play().catch(() => {});
            setAnimationState('success');
            setScore(score + 1);
            setFeedback('✅ Excellent! You understood the pattern correctly!');
            
            // Check for achievements
            const newAchievements = new Set(achievements);
            if (score + 1 === 5) newAchievements.add('first_5');
            if (score + 1 === 10) newAchievements.add('pattern_master');
            if (score + 1 === 15) newAchievements.add('grammar_expert');
            setAchievements(newAchievements);
            
            setUsedVerbs(prev => new Set([...prev, currentVerb.verb]));
            setTimeout(() => {
                setAnimationState('');
                setRound(round + 1);
                selectRandomVerb();
            }, 3000);
        } else {
            // Play error sound and show animation
            new Audio('./sounds/error.wav').play().catch(() => {});
            setAnimationState('error');
            setFeedback('❌ Not quite right. Let me show you the logic...');
            setShowLogicTree(true);
            setTimeout(() => setAnimationState(''), 800);
        }
    };

    // Logic tree questions
    const getLogicTreeQuestions = (verb) => {
        return [
            {
                question: "Can I do this TO the person directly?",
                hint: "Think: Does the action affect the person themselves?"
            },
            {
                question: "Am I communicating WITH/TO them?",
                hint: "Communication verbs (call, send, say) always use prepositions"
            },
            {
                question: "Am I doing something FOR their benefit?",
                hint: "Making, cooking, buying things FOR people uses prepositions"
            },
            {
                question: "Does the direct version sound weird?",
                hint: "If 'I make you coffee' = making person into coffee, use indirect!"
            }
        ];
    };

    // Start new game
    const startNewGame = () => {
        setScore(0);
        setRound(1);
        setUsedVerbs(new Set());
        setSelectedCategory(null);
        setShowLogicTree(false);
        selectRandomVerb();
    };

    // Initialize game
    useEffect(() => {
        selectRandomVerb();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🧩 Grammar Pattern Puzzle</h1>
                <p className="text-center text-purple-200 mb-6">Discover the logic behind Arabic verb patterns!</p>

                {/* Stats */}
                <div className="flex justify-between items-center mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <div className="text-yellow-300 font-bold">Score: {score}</div>
                    <div className="text-blue-300 font-bold">Round: {round}</div>
                    <div className="text-green-300 font-bold">Achievements: {achievements.size}</div>
                </div>

                {/* Current Verb Challenge */}
                {currentVerb && (
                    <div className={`bg-white/10 backdrop-blur p-6 rounded-lg mb-6 transition-all duration-500 ${
                        animationState === 'success' ? 'animate-pulse bg-green-500/30 scale-105' :
                        animationState === 'error' ? 'animate-bounce bg-red-500/30' : ''
                    }`}>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2">{currentVerb.verb}</h2>
                            <p className="text-xl text-gray-300 mb-4">{currentVerb.english}</p>
                            <p className="text-lg text-yellow-300">Which pattern does this verb follow?</p>
                        </div>

                        {/* Category Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {Object.entries(verbCategories).map(([categoryKey, category]) => (
                                <button
                                    key={categoryKey}
                                    onClick={() => handleCategorySelection(categoryKey)}
                                    className={`p-4 ${category.color} hover:opacity-80 rounded-lg font-bold transition-all transform hover:scale-105 ${
                                        selectedCategory === categoryKey ? 'ring-4 ring-white' : ''
                                    }`}
                                >
                                    <div className="text-lg mb-2">{category.title}</div>
                                    <div className="text-xs opacity-75">{category.description}</div>
                                </button>
                            ))}
                        </div>

                        {/* Logic Tree */}
                        {showLogicTree && (
                            <div className="bg-yellow-600/20 border border-yellow-400 rounded-lg p-4 mt-4">
                                <div className="font-bold mb-4">🧠 Let's think through this step by step:</div>
                                
                                <div className="space-y-3 mb-4">
                                    {getLogicTreeQuestions(currentVerb).map((q, index) => (
                                        <div key={index} className="p-3 bg-gray-800/50 rounded">
                                            <div className="font-medium text-yellow-200">{q.question}</div>
                                            <div className="text-sm text-gray-300 mt-1">{q.hint}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Correct Answer Explanation */}
                                <div className="p-4 bg-green-900/30 rounded-lg">
                                    <div className="font-bold text-green-300 mb-2">
                                        ✅ Correct Category: {currentVerb.categoryTitle}
                                    </div>
                                    <div className="text-sm mb-2">
                                        <strong>Example:</strong> {currentVerb.example || currentVerb.directExample}
                                    </div>
                                    <div className="text-sm">
                                        <strong>Why:</strong> {currentVerb.whyDirect || currentVerb.whyIndirect || currentVerb.whyBoth}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setRound(round + 1);
                                        selectRandomVerb();
                                    }}
                                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
                                >
                                    Continue Learning ➡️
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Analyze the verb and categorize it based on its pattern!'}</div>
                </div>

                {/* Pattern Reference */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(verbCategories).map(([categoryKey, category]) => (
                        <div key={categoryKey} className={`${category.color}/20 border border-white/30 rounded-lg p-4`}>
                            <h3 className="font-bold mb-2">{category.title}</h3>
                            <p className="text-sm text-gray-300 mb-3">{category.description}</p>
                            <div className="space-y-1">
                                {category.verbs.slice(0, 2).map((verb, index) => (
                                    <div key={index} className="text-xs">
                                        <strong>{verb.verb}:</strong> {verb.example || verb.directExample}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* New Game Button */}
                {!currentVerb && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Achievements */}
                {achievements.size > 0 && (
                    <div className="mt-6 bg-white/5 backdrop-blur p-4 rounded-lg">
                        <h3 className="font-bold mb-2">🏆 Achievements Unlocked:</h3>
                        <div className="space-y-1 text-sm">
                            {achievements.has('first_5') && <div>⭐ Pattern Learner - Categorized 5 verbs correctly!</div>}
                            {achievements.has('pattern_master') && <div>🌟 Pattern Master - Categorized 10 verbs correctly!</div>}
                            {achievements.has('grammar_expert') && <div>🏆 Grammar Expert - Categorized 15 verbs correctly!</div>}
                        </div>
                    </div>
                )}

                {/* Learning Strategy */}
                <div className="mt-6 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-2">🎯 Pattern Recognition Strategy:</h3>
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li>• <strong>Always Direct:</strong> Perception (see, hear), knowledge, emotions directed at person</li>
                        <li>• <strong>Always Indirect:</strong> Communication (call, send, say), making things FOR people</li>
                        <li>• <strong>Context Dependent:</strong> Can be either - think about what makes sense!</li>
                        <li>• <strong>Weird Test:</strong> If direct sounds strange ("make you coffee"), use indirect!</li>
                        <li>• <strong>Arabic Logic:</strong> Arabic is very literal - speak as if to children, be specific!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GrammarPatternPuzzleGame;