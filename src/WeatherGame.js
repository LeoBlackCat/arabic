import React, { useState, useEffect, useRef } from 'react';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const WeatherGame = () => {
    const [currentPhrase, setCurrentPhrase] = useState(null);
    const [gameMode, setGameMode] = useState('conversation'); // conversation, description, questions
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [weatherData, setWeatherData] = useState([]);
    const [usedItems, setUsedItems] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Weather-specific phrases and scenarios
    const weatherScenarios = [
        {
            id: 'weather1',
            situation: 'Someone asks about today\'s weather',
            expectedResponse: 'الجو حار اليوم',
            chat: 'eljaw 7aar el youm',
            eng: 'The weather is hot today'
        },
        {
            id: 'weather2', 
            situation: 'Describing cold weather',
            expectedResponse: 'الجو بارد',
            chat: 'eljaw baard',
            eng: 'The weather is cold'
        },
        {
            id: 'weather3',
            situation: 'Saying the weather is nice',
            expectedResponse: 'الجو حلو',
            chat: 'eljaw 7elo', 
            eng: 'The weather is nice'
        },
        {
            id: 'weather4',
            situation: 'Asking about the weather',
            expectedResponse: 'كيف الجو؟',
            chat: 'keif el jaw?',
            eng: 'How is the weather?'
        },
        {
            id: 'weather5',
            situation: 'Asking about last month\'s weather',
            expectedResponse: 'كيف كان الجو الشهر اللي طاف؟',
            chat: 'kaif kaan el jaw el shahar elle taaf?',
            eng: 'How was the weather last month?'
        }
    ];

    // Filter weather-related content
    useEffect(() => {
        const weatherItems = [
            ...logicData.items.filter(item => 
                item.type === 'weather' || 
                (item.type === 'phrase' && (
                    item.eng.includes('weather') || 
                    item.eng.includes('hot') || 
                    item.eng.includes('cold') ||
                    item.eng.includes('nice') ||
                    item.ar.includes('الجو') ||
                    item.ar.includes('حار') ||
                    item.ar.includes('بارد')
                ))
            ),
            ...weatherScenarios
        ];
        setWeatherData(weatherItems);
        selectRandomPhrase(weatherItems, new Set());
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

    const selectRandomPhrase = (items = weatherData, used = usedItems) => {
        let availableItems = items;
        
        if (gameMode === 'conversation') {
            availableItems = items.filter(item => 
                (item.situation || item.type === 'phrase') && !used.has(item.id)
            );
        } else if (gameMode === 'description') {
            availableItems = items.filter(item => 
                item.type === 'weather' && !used.has(item.id)
            );
        } else if (gameMode === 'questions') {
            availableItems = items.filter(item => 
                (item.eng && item.eng.includes('how')) && !used.has(item.id)
            );
        }
        
        if (availableItems.length === 0) {
            setCurrentPhrase(null);
            setFeedback('🎉 Great! You mastered weather conversations!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const phrase = availableItems[randomIndex];
        setCurrentPhrase(phrase);
        
        // Present the phrase based on game mode
        setTimeout(() => {
            if (phrase.situation) {
                setFeedback(`Situation: ${phrase.situation}`);
                speak(`How would you respond to: ${phrase.situation}`);
            } else if (gameMode === 'description') {
                speak(phrase.eng);
                setFeedback(`Say in Arabic: "${phrase.eng}"`);
            } else {
                speak(phrase.ar || phrase.expectedResponse);
                setFeedback(`What does this mean?`);
            }
        }, 500);
    };

    const speak = (text) => {
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const isArabic = /[\u0600-\u06FF]/.test(text);
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
    };

    const processAnswer = (userInput) => {
        if (!currentPhrase) return;

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        let isCorrect = false;
        let expectedText = '';

        if (currentPhrase.situation) {
            expectedText = currentPhrase.expectedResponse;
            const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
            isCorrect = normalizedInput.includes(normalizedExpected) || 
                       normalizedExpected.includes(normalizedInput);
        } else if (gameMode === 'questions') {
            expectedText = currentPhrase.eng;
            isCorrect = userInput.toLowerCase().includes(expectedText.toLowerCase()) ||
                       expectedText.toLowerCase().includes(userInput.toLowerCase());
        } else {
            expectedText = currentPhrase.ar;
            const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
            isCorrect = normalizedInput.includes(normalizedExpected) || 
                       normalizedExpected.includes(normalizedInput);
        }

        if (isCorrect) {
            setScore(score + 1);
            setFeedback('☀️ Excellent! Perfect weather response!');
            speak('ممتاز'); // Excellent
            
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
        selectRandomPhrase(weatherData, new Set());
    };

    const repeatPhrase = () => {
        if (currentPhrase) {
            if (currentPhrase.situation) {
                speak(`The situation is: ${currentPhrase.situation}`);
            } else if (gameMode === 'questions') {
                speak(currentPhrase.ar || currentPhrase.expectedResponse);
            } else {
                speak(currentPhrase.eng);
            }
        }
    };

    const getWeatherEmoji = () => {
        if (!currentPhrase) return '🌤️';
        if (currentPhrase.eng && currentPhrase.eng.includes('hot')) return '☀️';
        if (currentPhrase.eng && currentPhrase.eng.includes('cold')) return '❄️';
        if (currentPhrase.eng && currentPhrase.eng.includes('nice')) return '🌤️';
        return '🌤️';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-600 to-blue-800 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">🌤️ Weather Talk</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Game Mode:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="conversation">Weather Conversations</option>
                        <option value="description">Weather Descriptions</option>
                        <option value="questions">Weather Questions</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {weatherData.length - usedItems.size} weather expressions remaining
                    </div>
                </div>

                {/* Current Phrase Display */}
                {currentPhrase && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        <div className="text-6xl mb-4">{getWeatherEmoji()}</div>
                        
                        {currentPhrase.situation ? (
                            <div>
                                <div className="text-lg mb-2 text-yellow-200">Situation:</div>
                                <div className="text-xl mb-4">{currentPhrase.situation}</div>
                                <div className="text-sm text-gray-300">
                                    Expected: {currentPhrase.chat}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {gameMode === 'questions' ? (
                                    <div className="text-2xl font-arabic mb-2">
                                        {currentPhrase.ar}
                                    </div>
                                ) : (
                                    <div className="text-xl mb-2">
                                        {currentPhrase.eng}
                                    </div>
                                )}
                                
                                {gameMode !== 'questions' && (
                                    <div className="text-sm text-gray-300">
                                        ({currentPhrase.chat})
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a mode and start talking about the weather!'}</div>
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
                        {isListening ? '🎤 Listening...' : '🎤 Start Speaking'}
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
                    <p><strong>Conversations:</strong> Respond to weather situations</p>
                    <p><strong>Descriptions:</strong> Describe weather conditions</p>
                    <p><strong>Questions:</strong> Understand weather questions</p>
                </div>
            </div>
        </div>
    );
};

export default WeatherGame;