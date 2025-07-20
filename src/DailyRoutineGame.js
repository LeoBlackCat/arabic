import React, { useState, useEffect, useRef } from 'react';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const DailyRoutineGame = () => {
    const [currentPhrase, setCurrentPhrase] = useState(null);
    const [gameMode, setGameMode] = useState('morning'); // morning, evening, schedule, mixed
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [routineData, setRoutineData] = useState([]);
    const [usedItems, setUsedItems] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Daily routine scenarios
    const routineScenarios = [
        {
            id: 'routine1',
            time: 'morning',
            situation: 'You drink coffee every morning',
            arabicPhrase: 'أشرب قهوة كل صبح',
            chat: 'ashrab gahwa kil sob7',
            eng: 'I drink coffee every morning'
        },
        {
            id: 'routine2',
            time: 'morning', 
            situation: 'You go for a walk every morning',
            arabicPhrase: 'أمشي كل صبح',
            chat: 'amshee kil sob7',
            eng: 'I walk every morning'
        },
        {
            id: 'routine3',
            time: 'evening',
            situation: 'You like to rest in the evening',
            arabicPhrase: 'أحب أرتاح المسا',
            chat: 'a7eb artaa7 elmasa',
            eng: 'I like to rest in the evening'
        },
        {
            id: 'routine4',
            time: 'evening',
            situation: 'You watch TV every evening',
            arabicPhrase: 'أشوف تلفزيون كل مسا',
            chat: 'ashoof televizioun kil mesa',
            eng: 'I watch TV every evening'
        },
        {
            id: 'routine5',
            time: 'schedule',
            situation: 'You have a meeting tomorrow morning',
            arabicPhrase: 'عندي اجتماع باكر الصبح',
            chat: '3endee ejtimaa3 baacher el sob7',
            eng: 'I have a meeting tomorrow morning'
        },
        {
            id: 'routine6',
            time: 'schedule',
            situation: 'You are busy every Monday',
            arabicPhrase: 'أنا مشغول كل اثنين',
            chat: 'ana mashgool kil ethnain',
            eng: 'I am busy every Monday'
        },
        {
            id: 'routine7',
            time: 'schedule',
            situation: 'You want to go to the mall today',
            arabicPhrase: 'أبا أسير المول اليوم',
            chat: 'aba aseer el mall el youm',
            eng: 'I want to go to the mall today'
        },
        {
            id: 'routine8',
            time: 'schedule',
            situation: 'You can\'t go to work tomorrow',
            arabicPhrase: 'ما أقدر أسير الدوام باكر',
            chat: 'ma agdar aseer el dawaam baacher',
            eng: 'I can\'t go to work tomorrow'
        }
    ];

    // Filter routine-related content
    useEffect(() => {
        let filteredData = [];
        
        if (gameMode === 'mixed') {
            filteredData = [
                ...logicData.items.filter(item => 
                    item.type === 'phrase' && (
                        item.eng.includes('morning') || 
                        item.eng.includes('evening') || 
                        item.eng.includes('every') ||
                        item.eng.includes('tomorrow') ||
                        item.eng.includes('today') ||
                        item.eng.includes('busy') ||
                        item.eng.includes('meeting') ||
                        item.eng.includes('work')
                    )
                ),
                ...routineScenarios
            ];
        } else {
            filteredData = [
                ...logicData.items.filter(item => 
                    item.type === 'phrase' && 
                    item.eng.toLowerCase().includes(gameMode === 'schedule' ? 'meeting' : gameMode)
                ),
                ...routineScenarios.filter(s => s.time === gameMode)
            ];
        }
        
        setRoutineData(filteredData);
        selectRandomPhrase(filteredData, new Set());
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

    const selectRandomPhrase = (items = routineData, used = usedItems) => {
        const availableItems = items.filter(item => !used.has(item.id));
        
        if (availableItems.length === 0) {
            setCurrentPhrase(null);
            setFeedback('🎉 Perfect! You mastered daily routine expressions!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const phrase = availableItems[randomIndex];
        setCurrentPhrase(phrase);
        
        // Present the phrase
        setTimeout(() => {
            if (phrase.situation) {
                speak(phrase.situation);
                setFeedback(`How would you say: "${phrase.situation}"`);
            } else {
                speak(phrase.eng);
                setFeedback(`Say in Arabic: "${phrase.eng}"`);
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
                const fileName = `${chat}.wav`;
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
        if (!currentPhrase) return;

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        const expectedText = currentPhrase.arabicPhrase || currentPhrase.ar;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        const isCorrect = normalizedInput.includes(normalizedExpected) || 
                         normalizedExpected.includes(normalizedInput);

        if (isCorrect) {
            setScore(score + 1);
            setFeedback('⏰ Excellent routine! Well expressed!');
            speak('ممتاز جداً'); // Very excellent
            
            setUsedItems(prev => new Set([...prev, currentPhrase.id]));
            setTimeout(() => selectRandomPhrase(), 2000);
        } else {
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentPhrase) {
            recognitionRef.current.start();
        }
    };

    const skipPhrase = () => {
        if (currentPhrase) {
            setUsedItems(prev => new Set([...prev, currentPhrase.id]));
            selectRandomPhrase();
        }
    };

    const resetGame = () => {
        setUsedItems(new Set());
        setScore(0);
        setFeedback('');
        selectRandomPhrase(routineData, new Set());
    };

    const repeatPhrase = () => {
        if (currentPhrase) {
            const text = currentPhrase.situation || currentPhrase.eng;
            speak(text);
        }
    };

    const getTimeIcon = () => {
        if (!currentPhrase) return '⏰';
        const time = currentPhrase.time || gameMode;
        if (time === 'morning') return '🌅';
        if (time === 'evening') return '🌆';
        if (time === 'schedule') return '📅';
        return '⏰';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-600 to-red-600 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">⏰ Daily Routine</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Routine Type:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="morning">Morning Routines</option>
                        <option value="evening">Evening Routines</option>
                        <option value="schedule">Schedules & Plans</option>
                        <option value="mixed">Mixed Routines</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {routineData.length - usedItems.size} routines remaining
                    </div>
                </div>

                {/* Current Phrase Display */}
                {currentPhrase && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        <div className="text-6xl mb-4">{getTimeIcon()}</div>
                        
                        <div className="text-xl mb-4">
                            {currentPhrase.situation || currentPhrase.eng}
                        </div>
                        
                        <div className="text-sm text-gray-300">
                            Expected: {currentPhrase.chat}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a routine type and start practicing!'}</div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={startListening}
                        disabled={!currentPhrase || isListening}
                        className={`w-full p-4 rounded-lg font-bold text-lg ${
                            isListening 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {isListening ? '🎤 Listening...' : '🎤 Describe Routine'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipPhrase}
                            disabled={!currentPhrase}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={repeatPhrase}
                            disabled={!currentPhrase}
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
                    <p><strong>🌅 Morning:</strong> Morning activities and habits</p>
                    <p><strong>🌆 Evening:</strong> Evening routines and preferences</p>
                    <p><strong>📅 Schedule:</strong> Plans, meetings, and appointments</p>
                    <p><strong>🎯 Mixed:</strong> All daily routine expressions</p>
                </div>
            </div>
        </div>
    );
};

export default DailyRoutineGame;