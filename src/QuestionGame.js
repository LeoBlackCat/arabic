import React, { useState, useEffect, useRef } from 'react';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const QuestionGame = () => {
    const [currentItem, setCurrentItem] = useState(null);
    const [gameMode, setGameMode] = useState('where'); // where, who, which, how, mixed
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [questionData, setQuestionData] = useState([]);
    const [usedItems, setUsedItems] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Question patterns with expected responses
    const questionPatterns = [
        {
            id: 'q1',
            question: 'Where is the bathroom?',
            arabicQuestion: 'وين الحمام؟',
            chat: 'wain el7ammam?',
            type: 'where'
        },
        {
            id: 'q2', 
            question: 'Where is Ahmed?',
            arabicQuestion: 'وين أحمد؟',
            chat: 'wain A7med?',
            type: 'where'
        },
        {
            id: 'q3',
            question: 'Who is this?',
            arabicQuestion: 'منو هذا؟',
            chat: 'emnoo hadha?',
            type: 'who'
        },
        {
            id: 'q4',
            question: 'Who wants coffee?',
            arabicQuestion: 'منو يبا قهوة؟',
            chat: 'emnoo yaba gahwa?',
            type: 'who'
        },
        {
            id: 'q5',
            question: 'Which day is today?',
            arabicQuestion: 'أي يوم اليوم؟',
            chat: 'ay youm el youm?',
            type: 'which'
        },
        {
            id: 'q6',
            question: 'Which color do you like?',
            arabicQuestion: 'أي لون تحب؟',
            chat: 'ay loan t7eb?',
            type: 'which'
        },
        {
            id: 'q7',
            question: 'How is the weather?',
            arabicQuestion: 'كيف الجو؟',
            chat: 'keif el jaw?',
            type: 'how'
        },
        {
            id: 'q8',
            question: 'How was your day?',
            arabicQuestion: 'كيف كان يومك؟',
            chat: 'keif kaan youmik?',
            type: 'how'
        }
    ];

    // Filter question-related content
    useEffect(() => {
        let filteredData = [];
        
        if (gameMode === 'mixed') {
            filteredData = [
                ...logicData.items.filter(item => item.type === 'question'),
                ...logicData.items.filter(item => 
                    item.type === 'phrase' && (
                        item.eng.includes('where') || 
                        item.eng.includes('who') || 
                        item.eng.includes('which') || 
                        item.eng.includes('how')
                    )
                ),
                ...questionPatterns
            ];
        } else {
            filteredData = [
                ...logicData.items.filter(item => 
                    item.type === 'question' && 
                    item.eng.toLowerCase().includes(gameMode)
                ),
                ...logicData.items.filter(item => 
                    item.type === 'phrase' && 
                    item.eng.toLowerCase().includes(gameMode)
                ),
                ...questionPatterns.filter(q => q.type === gameMode)
            ];
        }
        
        setQuestionData(filteredData);
        selectRandomItem(filteredData, new Set());
    }, [gameMode]);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ar-SA';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setFeedback('🎤 Listening...');
            };

            recognitionRef.current.onresult = (event) => {
                const result = event.results[event.resultIndex];
                if (result.isFinal) {
                    const transcript = result[0].transcript.trim();
                    setIsListening(false);
                    processAnswer(transcript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                setIsListening(false);
                setFeedback(`❌ Recognition error: ${event.error}`);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const selectRandomItem = (items = questionData, used = usedItems) => {
        const availableItems = items.filter(item => !used.has(item.id));
        
        if (availableItems.length === 0) {
            setCurrentItem(null);
            setFeedback('🎉 Amazing! You mastered all the questions!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const item = availableItems[randomIndex];
        setCurrentItem(item);
        
        // Present the item
        setTimeout(() => {
            if (item.question) {
                speak(item.question);
                setFeedback(`Say in Arabic: "${item.question}"`);
            } else {
                speak(item.eng);
                setFeedback(`Say in Arabic: "${item.eng}"`);
            }
        }, 500);
    };

    const speak = async (text) => {
        const isArabic = /[\u0600-\u06FF]/.test(text);
        
        // Try to play WAV file first for Arabic text
        if (isArabic) {
            // Build a map from Arabic to chat representation
            const arToChatMap = {};
            logicData.items.forEach(item => {
                if (item.ar && item.chat) {
                    arToChatMap[item.ar] = item.chat;
                }
            });
            
            const chat = arToChatMap[text];
            if (chat) {
                // Sanitize filename: replace illegal characters with dash (same as audio generation script)
                const sanitizedChat = chat.replace(/[\\/:"*?<>|]/g, '-').trim();
                const fileName = `${sanitizedChat}.wav`;
                const audio = new Audio(`./sounds/${encodeURIComponent(fileName)}`);
                
                try {
                    await audio.play();
                    console.log('🎵 Played WAV file:', fileName);
                    return;
                } catch (error) {
                    console.log('⚠️ WAV file not found, falling back to TTS:', fileName);
                }
            }
        }
        
        // Fallback to browser TTS
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isArabic ? 'ar-SA' : 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;

        const voices = synthRef.current.getVoices();
        if (isArabic) {
            const arabicVoice = voices.find(voice => 
                voice.lang.includes('ar') || voice.name.includes('Arabic')
            );
            if (arabicVoice) utterance.voice = arabicVoice;
        }

        synthRef.current.speak(utterance);
        console.log('🔊 Using browser TTS for:', text);
    };

    const processAnswer = (userInput) => {
        if (!currentItem) return;

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        let expectedText = currentItem.arabicQuestion || currentItem.ar;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        const isCorrect = normalizedInput.includes(normalizedExpected) || 
                         normalizedExpected.includes(normalizedInput);

        if (isCorrect) {
            setScore(score + 1);
            setFeedback('❓ Perfect question! Well asked!');
            speak('سؤال ممتاز'); // Excellent question
            
            setUsedItems(prev => new Set([...prev, currentItem.id]));
            setTimeout(() => selectRandomItem(), 2000);
        } else {
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentItem) {
            recognitionRef.current.start();
        }
    };

    const skipItem = () => {
        if (currentItem) {
            setUsedItems(prev => new Set([...prev, currentItem.id]));
            selectRandomItem();
        }
    };

    const resetGame = () => {
        setUsedItems(new Set());
        setScore(0);
        setFeedback('');
        selectRandomItem(questionData, new Set());
    };

    const repeatItem = () => {
        if (currentItem) {
            const text = currentItem.question || currentItem.eng;
            speak(text);
        }
    };

    const getQuestionIcon = () => {
        if (!currentItem) return '❓';
        const text = currentItem.question || currentItem.eng || '';
        if (text.toLowerCase().includes('where')) return '📍';
        if (text.toLowerCase().includes('who')) return '👤';
        if (text.toLowerCase().includes('which')) return '🤔';
        if (text.toLowerCase().includes('how')) return '💭';
        return '❓';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-600 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">❓ Question Practice</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Question Type:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="where">Where Questions (وين)</option>
                        <option value="who">Who Questions (منو)</option>
                        <option value="which">Which Questions (أي)</option>
                        <option value="how">How Questions (كيف)</option>
                        <option value="mixed">Mixed Questions</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {questionData.length - usedItems.size} questions remaining
                    </div>
                </div>

                {/* Current Item Display */}
                {currentItem && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        <div className="text-6xl mb-4">{getQuestionIcon()}</div>
                        
                        <div className="text-xl mb-4">
                            {currentItem.question || currentItem.eng}
                        </div>
                        
                        <div className="text-sm text-gray-300">
                            Expected: {currentItem.chat || 'Practice asking this question'}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a question type and start practicing!'}</div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={startListening}
                        disabled={!currentItem || isListening}
                        className={`w-full p-4 rounded-lg font-bold text-lg ${
                            isListening 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {isListening ? '🎤 Listening...' : '🎤 Ask the Question'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipItem}
                            disabled={!currentItem}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={repeatItem}
                            disabled={!currentItem}
                            className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            🔄 Repeat
                        </button>
                        
                        <button
                            onClick={resetGame}
                            className="flex-1 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
                        >
                            🎮 Reset
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 text-sm text-gray-300 text-center">
                    <p><strong>📍 Where:</strong> Location questions (وين الحمام؟)</p>
                    <p><strong>👤 Who:</strong> Identity questions (منو هذا؟)</p>
                    <p><strong>🤔 Which:</strong> Selection questions (أي لون؟)</p>
                    <p><strong>💭 How:</strong> Method/condition questions (كيف الجو؟)</p>
                </div>
            </div>
        </div>
    );
};

export default QuestionGame;