import React, { useState, useEffect } from 'react';

const ArabicConjugationBuilderGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [selectedPieces, setSelectedPieces] = useState([]);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [feedback, setFeedback] = useState('');
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    const [showHint, setShowHint] = useState(false);
    const [gamePhase, setGamePhase] = useState('building'); // 'building', 'checking', 'complete'
    const [animationState, setAnimationState] = useState(''); // 'success', 'error', or ''

    // Drag and drop challenges with piece components
    const challenges = [
        // Direct object challenges
        {
            id: 'see_friend',
            english: 'I see my friend',
            arabic: 'أشوف صديقي',
            type: 'direct',
            correctPieces: ['ashoof', 'sadeeqi'],
            wrongPieces: ['lik', 'laha', 'lihum'],
            hint: 'You see your friend directly - no preposition needed!',
            explanation: 'Vision is direct perception, so we connect the verb directly to the object.',
            category: 'perception'
        },
        {
            id: 'hear_music',
            english: 'I hear you clearly',
            arabic: 'أسمعك واضح',
            type: 'direct',
            correctPieces: ['asma3', 'ik', 'wadhih'],
            wrongPieces: ['lik', 'laha', 'lihum'],
            hint: 'Hearing is direct - sound comes from the person to you!',
            explanation: 'Hearing uses direct object suffixes because you hear the person directly.',
            category: 'perception'
        },
        {
            id: 'know_neighbor',
            english: 'I know them well',
            arabic: 'أعرفهم زين',
            type: 'direct',
            correctPieces: ['a3aref', 'hum', 'zain'],
            wrongPieces: ['lihum', 'lik', 'laha'],
            hint: 'Knowledge is direct - you know the people themselves!',
            explanation: 'Knowledge verbs take direct objects because you know the person directly.',
            category: 'knowledge'
        },

        {
            id: 'she_sees_him',
            english: 'She sees him',
            arabic: 'تشوفه',
            type: 'direct',
            correctPieces: ['tshoof', 'ah'],
            wrongPieces: ['lah', 'lik', 'laha'],
            hint: 'She sees him directly - no preposition needed!',
            explanation: 'Vision is direct perception, so we connect the verb directly to the object.',
            category: 'perception'
        },
        {
            id: 'we_know_you',
            english: 'We know you',
            arabic: 'نعرفك',
            type: 'direct',
            correctPieces: ['na3aref', 'ik'],
            wrongPieces: ['lik', 'laha', 'lihum'],
            hint: 'We know you directly - knowledge about the person!',
            explanation: 'Knowledge verbs take direct objects because we know the person directly.',
            category: 'knowledge'
        },

        // Indirect object challenges
        {
            id: 'make_coffee',
            english: 'I make coffee for her',
            arabic: 'أسوي لها قهوة',
            type: 'indirect',
            correctPieces: ['asawee', 'laha', 'gahwa'],
            wrongPieces: ['asaweha', 'ich', 'ik'],
            hint: 'You make coffee FOR someone, not making them into coffee!',
            explanation: 'Making things requires prepositions because you create something for someone\'s benefit.',
            category: 'creation'
        },
        {
            id: 'send_message',
            english: 'I send you a message',
            arabic: 'أترش لك رسالة',
            type: 'indirect',
            correctPieces: ['ataresh', 'lik', 'risala'],
            wrongPieces: ['atareshik', 'hum', 'laha'],
            hint: 'Communication verbs always need prepositions - you send TO someone!',
            explanation: 'Communication verbs use prepositions because you communicate TO people.',
            category: 'communication'
        },
        {
            id: 'she_makes_coffee',
            english: 'She makes coffee for him',
            arabic: 'تسوي له قهوة',
            type: 'indirect',
            correctPieces: ['tsawee', 'lah', 'gahwa'],
            wrongPieces: ['tsaweeh', 'ik', 'laha'],
            hint: 'She makes coffee FOR him, not making him into coffee!',
            explanation: 'Making things requires prepositions because you create something for someone\'s benefit.',
            category: 'creation'
        },
        {
            id: 'call_mom',
            english: 'I call my mother',
            arabic: 'أتصل لأمي',
            type: 'indirect',
            correctPieces: ['atesel', 'li', 'ummee'],
            wrongPieces: ['ateselik', 'ummee-ich', 'hum'],
            hint: 'You call TO your mother through the phone!',
            explanation: 'Calling uses prepositions because you communicate TO someone through a device.',
            category: 'communication'
        },
        {
            id: 'cook_dinner',
            english: 'I cook for you all',
            arabic: 'أطبخ لكم عشا',
            type: 'indirect',
            correctPieces: ['atbakh', 'likum', '3asha'],
            wrongPieces: ['atbakhkum', 'ik', 'laha'],
            hint: 'You cook FOR people, not cooking the people themselves!',
            explanation: 'Cooking uses prepositions because you prepare food for someone\'s benefit.',
            category: 'creation'
        },
        {
            id: 'buy_gift',
            english: 'I buy a gift for him',
            arabic: 'أشتري له هدية',
            type: 'indirect',
            correctPieces: ['ashteree', 'lah', 'hadhiya'],
            wrongPieces: ['ashtereeh', 'ik', 'lihum'],
            hint: 'You buy things FOR people, not buying the person!',
            explanation: 'Shopping verbs use prepositions because you purchase items for someone.',
            category: 'transaction'
        },

        // Context-dependent challenges
        {
            id: 'read_book',
            english: 'I read a book to you',
            arabic: 'أقرأ لك كتاب',
            type: 'indirect',
            correctPieces: ['agra', 'lik', 'kitab'],
            wrongPieces: ['agrak', 'kitab-ik', 'laha'],
            hint: 'Reading TO someone means you\'re reading for their benefit!',
            explanation: 'When reading TO someone, use prepositions. When reading/understanding someone, use direct.',
            category: 'context'
        },
        {
            id: 'hold_baby',
            english: 'I hold the baby for you',
            arabic: 'أمسك لك البيبي',
            type: 'indirect',
            correctPieces: ['amsik', 'lik', 'el-baby'],
            wrongPieces: ['amsikik', 'baby-ich', 'lihum'],
            hint: 'You hold the baby FOR someone else\'s benefit!',
            explanation: 'Holding something for someone uses prepositions, but holding the person directly doesn\'t.',
            category: 'context'
        }
    ];

    // Available pieces for drag and drop
    const availablePieces = [
        // Verb stems
        { id: 'ashoof', text: 'أشوف', type: 'verb', meaning: 'I see' },
        { id: 'tshoof', text: 'تشوف', type: 'verb', meaning: 'she sees' },
        { id: 'asma3', text: 'أسمع', type: 'verb', meaning: 'I hear' },
        { id: 'a3aref', text: 'أعرف', type: 'verb', meaning: 'I know' },
        { id: 'na3aref', text: 'نعرف', type: 'verb', meaning: 'we know' },
        { id: 'asawee', text: 'أسوي', type: 'verb', meaning: 'I make' },
        { id: 'tsawee', text: 'تسوي', type: 'verb', meaning: 'she makes' },
        { id: 'ataresh', text: 'أترش', type: 'verb', meaning: 'I send' },
        { id: 'atesel', text: 'أتصل', type: 'verb', meaning: 'I call' },
        { id: 'atbakh', text: 'أطبخ', type: 'verb', meaning: 'I cook' },
        { id: 'ashteree', text: 'أشتري', type: 'verb', meaning: 'I buy' },
        { id: 'agra', text: 'أقرأ', type: 'verb', meaning: 'I read' },
        { id: 'amsik', text: 'أمسك', type: 'verb', meaning: 'I hold' },

        // Direct object suffixes
        { id: 'ik', text: 'ـك', type: 'direct_suffix', meaning: 'you (m)' },
        { id: 'ich', text: 'ـش', type: 'direct_suffix', meaning: 'you (f)' },
        { id: 'kum', text: 'ـكم', type: 'direct_suffix', meaning: 'you all' },
        { id: 'hum', text: 'ـهم', type: 'direct_suffix', meaning: 'them' },
        { id: 'ha', text: 'ـها', type: 'direct_suffix', meaning: 'her' },
        { id: 'ah', text: 'ـه', type: 'direct_suffix', meaning: 'him' },

        // Indirect prepositions
        { id: 'lik', text: 'لك', type: 'preposition', meaning: 'to/for you (m)' },
        { id: 'lich', text: 'لش', type: 'preposition', meaning: 'to/for you (f)' },
        { id: 'likum', text: 'لكم', type: 'preposition', meaning: 'to/for you all' },
        { id: 'lihum', text: 'لهم', type: 'preposition', meaning: 'to/for them' },
        { id: 'laha', text: 'لها', type: 'preposition', meaning: 'to/for her' },
        { id: 'lah', text: 'له', type: 'preposition', meaning: 'to/for him' },
        { id: 'li', text: 'لـ', type: 'preposition', meaning: 'to/for' },

        // Objects and nouns
        { id: 'gahwa', text: 'قهوة', type: 'noun', meaning: 'coffee' },
        { id: 'risala', text: 'رسالة', type: 'noun', meaning: 'message' },
        { id: 'kitab', text: 'كتاب', type: 'noun', meaning: 'book' },
        { id: 'hadhiya', text: 'هدية', type: 'noun', meaning: 'gift' },
        { id: 'sadeeqi', text: 'صديقي', type: 'noun', meaning: 'my friend' },
        { id: 'ummee', text: 'أمي', type: 'noun', meaning: 'my mother' },
        { id: 'el-baby', text: 'البيبي', type: 'noun', meaning: 'the baby' },
        { id: '3asha', text: 'عشا', type: 'noun', meaning: 'dinner' },
        { id: 'wadhih', text: 'واضح', type: 'adjective', meaning: 'clearly' },
        { id: 'zain', text: 'زين', type: 'adjective', meaning: 'well' }
    ];

    // Select random challenge
    const selectRandomChallenge = () => {
        const available = challenges.filter(c => !usedChallenges.has(c.id));
        if (available.length === 0) {
            setFeedback('🏆 Congratulations! You mastered Arabic sentence building!');
            setCurrentChallenge(null);
            return;
        }

        const challenge = available[Math.floor(Math.random() * available.length)];
        setCurrentChallenge(challenge);
        setSelectedPieces([]);
        setGamePhase('building');
        setShowHint(false);
        setFeedback('');
    };

    // Handle piece selection
    const handlePieceClick = (piece) => {
        if (gamePhase !== 'building') return;

        const isAlreadySelected = selectedPieces.find(p => p.id === piece.id);
        if (isAlreadySelected) {
            // Remove piece
            setSelectedPieces(selectedPieces.filter(p => p.id !== piece.id));
        } else {
            // Add piece
            setSelectedPieces([...selectedPieces, piece]);
        }
    };

    // Check if sentence is correct
    const checkSentence = () => {
        if (!currentChallenge || selectedPieces.length === 0) return;

        const selectedIds = selectedPieces.map(p => p.id);
        const correctIds = currentChallenge.correctPieces;
        const wrongIds = currentChallenge.wrongPieces;

        // Check if all correct pieces are selected
        const hasAllCorrect = correctIds.every(id => selectedIds.includes(id));
        
        // Check if any wrong pieces are selected
        const hasWrongPieces = wrongIds.some(id => selectedIds.includes(id));

        if (hasAllCorrect && !hasWrongPieces && selectedIds.length === correctIds.length) {
            // Correct!
            new Audio('./sounds/success.wav').play().catch(() => {});
            setAnimationState('success');
            setScore(score + 1);
            setFeedback('✅ Perfect! Your sentence is grammatically correct!');
            setGamePhase('complete');
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            
            // Auto-advance after delay
            setTimeout(() => {
                setAnimationState('');
                setRound(round + 1);
                selectRandomChallenge();
            }, 3000);
        } else {
            // Incorrect
            new Audio('./sounds/error.wav').play().catch(() => {});
            setAnimationState('error');
            setFeedback('❌ Not quite right. Check your construction!');
            setGamePhase('checking');
            setShowHint(true);
            setTimeout(() => setAnimationState(''), 800);
        }
    };

    // Get pieces by type for organized display
    const getPiecesByType = (type) => {
        return availablePieces.filter(p => p.type === type);
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
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">🧩 Arabic Conjugation Builder</h1>
                <p className="text-center text-green-200 mb-6">Drag and drop pieces to build correct Arabic sentences!</p>

                {/* Stats */}
                <div className="flex justify-between items-center mb-6 bg-white/10 backdrop-blur p-4 rounded-lg">
                    <div className="text-yellow-300 font-bold">Score: {score}</div>
                    <div className="text-blue-300 font-bold">Round: {round}</div>
                    <div className="text-green-300 font-bold">Phase: {gamePhase}</div>
                </div>

                {/* Current Challenge */}
                {currentChallenge && (
                    <div className={`bg-white/10 backdrop-blur p-6 rounded-lg mb-6 transition-all duration-500 ${
                        animationState === 'success' ? 'animate-pulse bg-green-500/30 scale-105' :
                        animationState === 'error' ? 'animate-bounce bg-red-500/30' : ''
                    }`}>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2">{currentChallenge.english}</h2>
                            <p className="text-lg text-gray-300 mb-4">Target: {currentChallenge.arabic}</p>
                            <div className="text-sm text-purple-200">
                                Type: {currentChallenge.type} | Category: {currentChallenge.category}
                            </div>
                        </div>

                        {/* Construction Area */}
                        <div className="bg-gray-800/50 p-6 rounded-lg mb-6 min-h-[120px]">
                            <h3 className="text-lg font-bold mb-4 text-center">🏗️ Your Sentence Construction:</h3>
                            <div className="flex flex-wrap justify-center gap-2 min-h-[60px] items-center">
                                {selectedPieces.length === 0 ? (
                                    <div className="text-gray-400 text-center">
                                        Click pieces below to build your sentence...
                                    </div>
                                ) : (
                                    selectedPieces.map((piece, index) => (
                                        <div
                                            key={`selected-${piece.id}-${index}`}
                                            onClick={() => handlePieceClick(piece)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-all transform hover:scale-105"
                                        >
                                            <div className="text-lg font-bold">{piece.text}</div>
                                            <div className="text-xs opacity-75">{piece.meaning}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4 mb-6">
                            <button
                                onClick={checkSentence}
                                disabled={selectedPieces.length === 0 || gamePhase !== 'building'}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold transition-all"
                            >
                                ✅ Check Sentence
                            </button>
                            
                            <button
                                onClick={() => setSelectedPieces([])}
                                disabled={gamePhase !== 'building'}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold transition-all"
                            >
                                🗑️ Clear All
                            </button>

                            <button
                                onClick={() => setShowHint(!showHint)}
                                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-all"
                            >
                                💡 {showHint ? 'Hide' : 'Show'} Hint
                            </button>
                        </div>

                        {/* Hint */}
                        {showHint && (
                            <div className="bg-yellow-600/20 border border-yellow-400 rounded-lg p-4 mb-6">
                                <div className="font-bold mb-2">💡 Hint:</div>
                                <div className="text-sm mb-2">{currentChallenge.hint}</div>
                                <div className="text-xs text-yellow-200">
                                    <strong>Explanation:</strong> {currentChallenge.explanation}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Available Pieces */}
                {currentChallenge && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Verbs */}
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 text-purple-300">🎯 Verbs</h3>
                            <div className="space-y-2">
                                {getPiecesByType('verb').map(piece => (
                                    <div
                                        key={piece.id}
                                        onClick={() => handlePieceClick(piece)}
                                        className={`p-2 rounded cursor-pointer transition-all transform hover:scale-105 ${
                                            selectedPieces.find(p => p.id === piece.id)
                                                ? 'bg-blue-600 ring-2 ring-white'
                                                : 'bg-purple-600 hover:bg-purple-700'
                                        }`}
                                    >
                                        <div className="font-bold">{piece.text}</div>
                                        <div className="text-xs opacity-75">{piece.meaning}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Direct Suffixes */}
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 text-red-300">🎯 Direct Suffixes</h3>
                            <div className="space-y-2">
                                {getPiecesByType('direct_suffix').map(piece => (
                                    <div
                                        key={piece.id}
                                        onClick={() => handlePieceClick(piece)}
                                        className={`p-2 rounded cursor-pointer transition-all transform hover:scale-105 ${
                                            selectedPieces.find(p => p.id === piece.id)
                                                ? 'bg-blue-600 ring-2 ring-white'
                                                : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    >
                                        <div className="font-bold">{piece.text}</div>
                                        <div className="text-xs opacity-75">{piece.meaning}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prepositions */}
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 text-blue-300">🎯 Prepositions</h3>
                            <div className="space-y-2">
                                {getPiecesByType('preposition').map(piece => (
                                    <div
                                        key={piece.id}
                                        onClick={() => handlePieceClick(piece)}
                                        className={`p-2 rounded cursor-pointer transition-all transform hover:scale-105 ${
                                            selectedPieces.find(p => p.id === piece.id)
                                                ? 'bg-blue-600 ring-2 ring-white'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        <div className="font-bold">{piece.text}</div>
                                        <div className="text-xs opacity-75">{piece.meaning}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Objects & Nouns */}
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h3 className="font-bold mb-3 text-green-300">🎯 Objects & Words</h3>
                            <div className="space-y-2">
                                {[...getPiecesByType('noun'), ...getPiecesByType('adjective')].map(piece => (
                                    <div
                                        key={piece.id}
                                        onClick={() => handlePieceClick(piece)}
                                        className={`p-2 rounded cursor-pointer transition-all transform hover:scale-105 ${
                                            selectedPieces.find(p => p.id === piece.id)
                                                ? 'bg-blue-600 ring-2 ring-white'
                                                : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    >
                                        <div className="font-bold">{piece.text}</div>
                                        <div className="text-xs opacity-75">{piece.meaning}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg my-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Build the Arabic sentence by clicking on the pieces above!'}</div>
                </div>

                {/* New Game Button */}
                {!currentChallenge && (
                    <div className="text-center">
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg"
                        >
                            🎮 New Game
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-white/5 backdrop-blur p-4 rounded-lg">
                    <h3 className="font-bold mb-2">🎯 How to Play:</h3>
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li>• <strong>Click pieces</strong> to add them to your sentence construction</li>
                        <li>• <strong>Red pieces</strong> = Direct suffixes (attach to verbs: -ik, -ich, -kum)</li>
                        <li>• <strong>Blue pieces</strong> = Prepositions (separate words: lik, laha, lihum)</li>
                        <li>• <strong>Direct:</strong> I see you = ashoof + ik = ashoofik</li>
                        <li>• <strong>Indirect:</strong> I make coffee for you = asawee + lik + gahwa</li>
                        <li>• Click selected pieces to remove them from your construction</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ArabicConjugationBuilderGame;