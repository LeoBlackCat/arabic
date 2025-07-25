import React, { useState, useEffect, useRef } from 'react';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const TimeGame = () => {
    const [currentPhrase, setCurrentPhrase] = useState(null);
    const [gameMode, setGameMode] = useState('vocabulary'); // vocabulary, phrases, listening
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [timeData, setTimeData] = useState([]);
    const [usedItems, setUsedItems] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const currentPhraseRef = useRef(null);
    const timeDataRef = useRef([]);

    // Filter time-related content
    useEffect(() => {
        const timeItems = logicData.items.filter(item => 
            item.type === 'time' || 
            (item.type === 'phrase' && (
                item.eng.includes('morning') || 
                item.eng.includes('evening') || 
                item.eng.includes('today') || 
                item.eng.includes('tomorrow') || 
                item.eng.includes('yesterday') || 
                item.eng.includes('week') || 
                item.eng.includes('month') || 
                item.eng.includes('year') ||
                item.eng.includes('Monday') ||
                item.eng.includes('Tuesday') ||
                item.eng.includes('Wednesday') ||
                item.eng.includes('Thursday') ||
                item.eng.includes('Friday') ||
                item.eng.includes('Saturday') ||
                item.eng.includes('Sunday') ||
                item.eng.includes('next') ||
                item.eng.includes('last')
            ))
        );
        
        setTimeData(timeItems);
        timeDataRef.current = timeItems;
        selectRandomPhrase(timeItems, new Set());
    }, [gameMode]);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            // Set language based on game mode: English for listening practice, Arabic for others
            recognitionRef.current.lang = gameMode === 'listening' ? 'en-US' : 'ar-SA';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setFeedback('🎤 Listening...');
            };

            recognitionRef.current.onresult = (event) => {
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    
                    if (result.isFinal) {
                        const transcript = result[0].transcript.trim();
                        const phraseAtTime = currentPhraseRef.current;
                        setIsListening(false);
                        
                        if (phraseAtTime) {
                            processAnswerWithPhrase(transcript, phraseAtTime);
                        }
                        return;
                    }
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
    }, [gameMode]); // Reinitialize when game mode changes

    const selectRandomPhrase = (items = timeData, used = usedItems) => {
        let availableItems = items;
        
        if (gameMode === 'vocabulary') {
            availableItems = items.filter(item => item.type === 'time' && !used.has(item.id));
        } else if (gameMode === 'phrases') {
            availableItems = items.filter(item => item.type === 'phrase' && !used.has(item.id));
        } else {
            availableItems = items.filter(item => !used.has(item.id));
        }
        
        if (availableItems.length === 0) {
            setCurrentPhrase(null);
            currentPhraseRef.current = null;
            setFeedback('🎉 Excellent! You completed all time expressions!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const phrase = availableItems[randomIndex];
        setCurrentPhrase(phrase);
        currentPhraseRef.current = phrase;
        
        // Present the phrase based on game mode
        setTimeout(() => {
            if (gameMode === 'vocabulary' || gameMode === 'phrases') {
                speak(phrase.eng);
                setFeedback(`Say in Arabic: "${phrase.eng}"`);
            } else if (gameMode === 'listening') {
                speak(phrase.ar);
                setFeedback(`What does this mean in English?`);
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

    const processAnswerWithPhrase = (userInput, phrase) => {
        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        let isCorrect = false;
        let expectedText = '';

        if (gameMode === 'listening') {
            // LISTENING PRACTICE MODE: User speaks English, we check against English text
            expectedText = phrase.eng;
            const userInputLower = userInput.toLowerCase().trim();
            
            // Clean expected text: remove text in parentheses like "(response)" 
            const expectedCleaned = expectedText.replace(/\s*\([^)]*\)/g, '').toLowerCase().trim();
            
            console.log('🎧 LISTENING PRACTICE MODE:');
            console.log('  - Arabic played:', phrase.ar);
            console.log('  - Expected English (original):', expectedText);
            console.log('  - Expected English (cleaned):', expectedCleaned);
            console.log('  - User said (English):', userInput);
            console.log('  - User input normalized:', userInputLower);
            
            // Check if user's English response matches expected English (cleaned)
            isCorrect = userInputLower.includes(expectedCleaned) ||
                       expectedCleaned.includes(userInputLower) ||
                       userInputLower === expectedCleaned;
                       
            console.log('  - Match result:', isCorrect);
        } else {
            // VOCABULARY/PHRASES MODE: User speaks Arabic, we check against Arabic text
            expectedText = phrase.ar;
            const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
            isCorrect = normalizedInput.includes(normalizedExpected) || 
                       normalizedExpected.includes(normalizedInput);
            
            console.log('🗣️ ARABIC PRACTICE MODE:');
            console.log('  - Expected Arabic:', expectedText);
            console.log('  - User said (Arabic):', userInput);
            console.log('  - Match result:', isCorrect);
        }

        if (isCorrect) {
            console.log('✅ CORRECT answer - playing audio:', expectedText);
            setScore(score + 1);
            setFeedback('✅ Perfect! Well done!');
            speak(expectedText);
            
            setUsedItems(prev => {
                const newUsedItems = new Set([...prev, phrase.id]);
                setTimeout(() => selectRandomPhrase(timeDataRef.current, newUsedItems), 2000);
                return newUsedItems;
            });
        } else {
            console.log('❌ INCORRECT answer - playing audio:', expectedText);
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const processAnswer = (userInput) => {
        if (!currentPhrase) {
            return;
        }
        processAnswerWithPhrase(userInput, currentPhrase);
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentPhrase) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('🎤 TimeGame: Error starting recognition:', error);
                setFeedback(`❌ Error starting recognition: ${error.message}`);
            }
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
        selectRandomPhrase(timeData, new Set());
    };

    const repeatPhrase = () => {
        if (currentPhrase) {
            if (gameMode === 'listening') {
                speak(currentPhrase.ar);
            } else {
                speak(currentPhrase.eng);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">⏰ Time & Dates</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Game Mode:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="vocabulary">Time Vocabulary</option>
                        <option value="phrases">Time Phrases</option>
                        <option value="listening">Listening Practice</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-green-400">Score: {score}</div>
                    <div className="text-sm text-gray-400">
                        {timeData.length - usedItems.size} expressions remaining
                    </div>
                </div>

                {/* Current Phrase Display */}
                {currentPhrase && (
                    <div className="bg-gray-800 p-6 rounded-lg mb-6 text-center">
                        <div className="text-lg mb-4">
                            {gameMode === 'listening' ? (
                                <div className="text-2xl font-arabic mb-2">
                                    {currentPhrase.ar}
                                </div>
                            ) : (
                                <div className="text-xl mb-2">
                                    {currentPhrase.eng}
                                </div>
                            )}
                            
                            {/* Show romanization for learning */}
                            {gameMode !== 'listening' && (
                                <div className="text-sm text-gray-400">
                                    ({currentPhrase.chat})
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a mode and start practicing time expressions!'}</div>
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
                <div className="mt-8 text-sm text-gray-400 text-center">
                    <p><strong>Time Vocabulary:</strong> Learn individual time words</p>
                    <p><strong>Time Phrases:</strong> Practice time-related sentences</p>
                    <p><strong>Listening:</strong> Understand Arabic time expressions</p>
                </div>
            </div>
        </div>
    );
};

export default TimeGame;