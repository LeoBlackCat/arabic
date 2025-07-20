import React, { useState, useEffect, useRef } from 'react';
import logicData from '../logic.json';
import sentencesData from '../sentences.json';
import { normalizeArabic } from './arabicUtils';

const VoiceApp = () => {
    const [isListening, setIsListening] = useState(false);
    const [currentGame, setCurrentGame] = useState('phrases');
    const [currentItem, setCurrentItem] = useState(null);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [gameItems, setGameItems] = useState([]);
    const [usedItems, setUsedItems] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    const gameTypes = {
        phrases: 'Arabic Phrases',
        sentences: 'Full Sentences', 
        vocabulary: 'Vocabulary Quiz',
        listening: 'Listening Practice'
    };

    useEffect(() => {
        initializeSpeechRecognition();
        loadGameData();
    }, [currentGame]);

    const initializeSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setFeedback('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 5;
        recognitionRef.current.lang = 'ar-SA';

        recognitionRef.current.onstart = () => {
            console.log('🎤 Speech recognition STARTED');
            setIsListening(true);
            setFeedback('🎤 Listening...');
        };

        recognitionRef.current.onresult = (event) => {
            console.log('🎤 Speech recognition RESULT received:', event);
            console.log('Results length:', event.results.length);
            console.log('Result index:', event.resultIndex);
            
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                console.log(`Result ${i}: isFinal=${result.isFinal}, transcript="${result[0].transcript}"`);
                
                if (result.isFinal) {
                    const transcript = result[0].transcript.trim();
                    console.log('🎤 Processing FINAL transcript:', transcript);
                    setIsListening(false);
                    processVoiceInput(transcript);
                    return;
                }
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.log('🎤 Speech recognition ERROR:', event.error);
            setFeedback(`❌ Recognition error: ${event.error}`);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            console.log('🎤 Speech recognition ENDED');
            setIsListening(false);
        };
    };

    const loadGameData = () => {
        let items = [];
        
        switch (currentGame) {
            case 'phrases':
                items = logicData.items.filter(item => item.type === 'phrase').slice(0, 50);
                break;
            case 'sentences':
                items = sentencesData.sentences.slice(0, 30);
                break;
            case 'vocabulary':
                items = logicData.items.filter(item => item.type !== 'phrase').slice(0, 40);
                break;
            case 'listening':
                items = [...logicData.items, ...sentencesData.sentences].slice(0, 60);
                break;
            default:
                items = logicData.items.slice(0, 50);
        }
        
        setGameItems(items);
        setUsedItems(new Set());
        setScore(0);
        selectNextItem(items, new Set());
    };

    const selectNextItem = (items = gameItems, used = usedItems) => {
        const availableItems = items.filter(item => !used.has(item.id));
        
        if (availableItems.length === 0) {
            setCurrentItem(null);
            setFeedback('🎉 Game completed! Great job!');
            return;
        }
        
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        setCurrentItem(randomItem);
        
        setTimeout(() => {
            presentItem(randomItem);
        }, 500);
    };

    const presentItem = (item) => {
        const arabicText = item.ar || item.arabic;
        const englishText = item.eng || item.english;
        
        switch (currentGame) {
            case 'phrases':
            case 'vocabulary':
                speak(englishText);
                setFeedback(`🎯 Say in Arabic: "${englishText}"`);
                break;
            case 'sentences':
                speak(arabicText);
                setFeedback(`🎯 Repeat: "${arabicText}"`);
                break;
            case 'listening':
                speak(arabicText);
                setFeedback(`🎯 What does this mean in English?`);
                break;
        }
    };

    const processVoiceInput = (userInput) => {
        console.log('🎤 processVoiceInput called with:', userInput);
        if (!currentItem) {
            console.log('🎤 No current item, ignoring input');
            return;
        }

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        console.log('🎤 Normalized input:', normalizedInput);
        let isCorrect = false;
        let expectedText = '';

        switch (currentGame) {
            case 'phrases':
            case 'vocabulary':
                expectedText = currentItem.ar || currentItem.arabic;
                const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
                isCorrect = normalizedInput.includes(normalizedExpected) || 
                           normalizedExpected.includes(normalizedInput);
                break;
            case 'sentences':
                expectedText = currentItem.ar || currentItem.arabic;
                const normalizedSentence = normalizeArabic(expectedText.toLowerCase());
                isCorrect = calculateSimilarity(normalizedInput, normalizedSentence) > 0.7;
                break;
            case 'listening':
                expectedText = currentItem.eng || currentItem.english;
                isCorrect = userInput.toLowerCase().includes(expectedText.toLowerCase()) ||
                           expectedText.toLowerCase().includes(userInput.toLowerCase());
                break;
        }

        if (isCorrect) {
            setScore(score + 1);
            setFeedback('✅ Correct! Well done!');
            speak('أحسنت'); // "Well done" in Arabic
            
            setUsedItems(prev => new Set([...prev, currentItem.id]));
            setTimeout(() => selectNextItem(), 2000);
        } else {
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const calculateSimilarity = (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    };

    const levenshteinDistance = (str1, str2) => {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    };

    const speak = (text) => {
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Detect if text is Arabic
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

    const startListening = () => {
        console.log('🎤 startListening called, isListening:', isListening);
        if (recognitionRef.current && !isListening) {
            console.log('🎤 Starting speech recognition...');
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('🎤 Error starting recognition:', error);
                setFeedback(`❌ Error starting recognition: ${error.message}`);
            }
        } else {
            console.log('🎤 Recognition not started - already listening or no recognition available');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const resetGame = () => {
        loadGameData();
        setFeedback('');
        stopListening();
    };

    const skipItem = () => {
        if (currentItem) {
            setUsedItems(prev => new Set([...prev, currentItem.id]));
            selectNextItem();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">🎙️ Arabic Voice Games</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Game Mode:</label>
                    <select 
                        value={currentGame} 
                        onChange={(e) => setCurrentGame(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        {Object.entries(gameTypes).map(([key, name]) => (
                            <option key={key} value={key}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-green-400">Score: {score}</div>
                    <div className="text-sm text-gray-400">
                        {gameItems.length - usedItems.size} items remaining
                    </div>
                </div>

                {/* Current Item Display */}
                {currentItem && (
                    <div className="bg-gray-800 p-6 rounded-lg mb-6 text-center">
                        <div className="text-lg mb-4">
                            {currentGame === 'listening' ? (
                                <div className="text-2xl font-arabic">
                                    {currentItem.ar || currentItem.arabic}
                                </div>
                            ) : currentGame === 'sentences' ? (
                                <div className="text-2xl font-arabic">
                                    {currentItem.ar || currentItem.arabic}
                                </div>
                            ) : (
                                <div className="text-xl">
                                    {currentItem.eng || currentItem.english}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Select a game mode and start speaking!'}</div>
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
                        {isListening ? '🎤 Listening...' : '🎤 Start Speaking'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipItem}
                            disabled={!currentItem}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={() => currentItem && presentItem(currentItem)}
                            disabled={!currentItem}
                            className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                    <p>Perfect for gym, commute, or hands-free practice!</p>
                    <p className="mt-2">
                        <strong>Phrases/Vocabulary:</strong> Hear English, say Arabic<br/>
                        <strong>Sentences:</strong> Repeat the Arabic sentence<br/>
                        <strong>Listening:</strong> Hear Arabic, say English meaning
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoiceApp;