import React, { useState, useEffect, useRef } from 'react';
import { verbs } from './verbs-data';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const VerbQuestionGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [gameMode, setGameMode] = useState('what_doing'); // what_doing, where_going, when_action, mixed
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [challenges, setChallenges] = useState([]);
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const currentChallengeRef = useRef(null);
    const challengesRef = useRef([]);

    // Question words from logic data
    const questionWords = logicData.items.filter(item => item.type === 'question');

    // Generate question-answer challenges with verbs
    useEffect(() => {
        const generatedChallenges = [];
        
        if (gameMode === 'what_doing' || gameMode === 'mixed') {
            // "What are you doing?" type questions
            verbs.forEach(verb => {
                generatedChallenges.push({
                    id: `what_${verb.chat}`,
                    type: 'what_doing',
                    questionType: 'what',
                    questionArabic: 'شو تسوي؟',
                    questionChat: 'sho tsawee?',
                    questionEnglish: 'What are you doing?',
                    verb: verb,
                    expectedArabic: verb.ar,
                    expectedChat: verb.chat,
                    icon: '🤔'
                });
            });
        }

        if (gameMode === 'where_going' || gameMode === 'mixed') {
            // "Where are you going?" with movement verbs
            const movementVerbs = verbs.filter(verb => 
                verb.eng.includes('go') || verb.eng.includes('drive') || verb.chat === 'aseer' || verb.chat === 'asoog'
            );
            
            movementVerbs.forEach(verb => {
                const locations = ['المول', 'البيت', 'الدوام', 'المطعم']; // mall, home, work, restaurant
                const locationChats = ['el mall', 'el bait', 'el dawaam', 'el mat3am'];
                const locationEnglish = ['the mall', 'home', 'work', 'the restaurant'];
                
                locations.forEach((location, index) => {
                    generatedChallenges.push({
                        id: `where_${verb.chat}_${index}`,
                        type: 'where_going',
                        questionType: 'where',
                        questionArabic: 'وين رايح؟',
                        questionChat: 'wain rayi7?',
                        questionEnglish: 'Where are you going?',
                        verb: verb,
                        location: location,
                        locationChat: locationChats[index],
                        locationEnglish: locationEnglish[index],
                        expectedArabic: `${verb.ar} ${location}`,
                        expectedChat: `${verb.chat} ${locationChats[index]}`,
                        icon: '📍'
                    });
                });
            });
        }

        if (gameMode === 'when_action' || gameMode === 'mixed') {
            // "When do you...?" with time expressions
            const timeExpressions = logicData.items.filter(item => 
                item.type === 'time' && (
                    item.eng.includes('morning') || 
                    item.eng.includes('evening') || 
                    item.eng.includes('today') ||
                    item.eng.includes('every')
                )
            );

            verbs.forEach(verb => {
                timeExpressions.forEach(timeExp => {
                    generatedChallenges.push({
                        id: `when_${verb.chat}_${timeExp.id}`,
                        type: 'when_action',
                        questionType: 'when',
                        questionArabic: `متى ${verb.ar}؟`,
                        questionChat: `mata ${verb.chat}?`,
                        questionEnglish: `When do you ${verb.eng.replace('I ', '')}?`,
                        verb: verb,
                        timeExpression: timeExp,
                        expectedArabic: `${verb.ar} ${timeExp.ar}`,
                        expectedChat: `${verb.chat} ${timeExp.chat}`,
                        icon: '⏰'
                    });
                });
            });
        }

        setChallenges(generatedChallenges);
        challengesRef.current = generatedChallenges;
        selectRandomChallenge(generatedChallenges, new Set());
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
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    
                    if (result.isFinal) {
                        const transcript = result[0].transcript.trim();
                        const challengeAtTime = currentChallengeRef.current;
                        setIsListening(false);
                        
                        if (challengeAtTime) {
                            processAnswerWithChallenge(transcript, challengeAtTime);
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
    }, []);

    const selectRandomChallenge = (challengeList = challenges, used = usedChallenges) => {
        const available = challengeList.filter(challenge => !used.has(challenge.id));
        
        if (available.length === 0) {
            setCurrentChallenge(null);
            setFeedback('🎉 Outstanding! You mastered verb questions and answers!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const challenge = available[randomIndex];
        setCurrentChallenge(challenge);
        currentChallengeRef.current = challenge;
        
        // Present the challenge
        setTimeout(() => {
            speak(challenge.questionEnglish);
            setFeedback(`Answer the question: "${challenge.questionEnglish}"`);
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

    const processAnswerWithChallenge = (userInput, challenge) => {
        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        const expectedText = challenge.expectedArabic;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        // Check if the answer contains the verb and context (if applicable)
        const verbArabic = normalizeArabic(challenge.verb.ar.toLowerCase());
        const containsVerb = normalizedInput.includes(verbArabic);
        
        let containsContext = true;
        if (challenge.location) {
            const locationArabic = normalizeArabic(challenge.location.toLowerCase());
            containsContext = normalizedInput.includes(locationArabic);
        } else if (challenge.timeExpression) {
            const timeArabic = normalizeArabic(challenge.timeExpression.ar.toLowerCase());
            containsContext = normalizedInput.includes(timeArabic);
        }

        const isCorrect = (containsVerb && containsContext) || 
                         normalizedInput.includes(normalizedExpected) || 
                         normalizedExpected.includes(normalizedInput);

        if (isCorrect) {
            console.log('✅ CORRECT answer - playing audio:', 'جواب ممتاز');
            setScore(score + 1);
            setFeedback('❓ Perfect answer! Great question response!');
            speak('جواب ممتاز'); // Excellent answer
            
            setUsedChallenges(prev => {
                const newUsedChallenges = new Set([...prev, challenge.id]);
                setTimeout(() => selectRandomChallenge(challengesRef.current, newUsedChallenges), 2000);
                return newUsedChallenges;
            });
        } else {
            console.log('❌ INCORRECT answer - playing audio:', expectedText);
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const processAnswer = (userInput) => {
        if (!currentChallenge) return;
        processAnswerWithChallenge(userInput, currentChallenge);
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentChallenge) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                setFeedback(`❌ Error starting recognition: ${error.message}`);
            }
        }
    };

    const skipChallenge = () => {
        if (currentChallenge) {
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            selectRandomChallenge(challengesRef.current, usedChallenges);
        }
    };

    const resetGame = () => {
        setUsedChallenges(new Set());
        setScore(0);
        setFeedback('');
        selectRandomChallenge(challengesRef.current, new Set());
    };

    const repeatChallenge = () => {
        if (currentChallenge) {
            speak(currentChallenge.questionEnglish);
        }
    };

    const getQuestionColor = () => {
        if (!currentChallenge) return 'bg-gray-600';
        switch (currentChallenge.questionType) {
            case 'what': return 'bg-blue-600';
            case 'where': return 'bg-green-600';
            case 'when': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-800 to-red-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">❓ Verb Q&A</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Question Type:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="what_doing">What are you doing?</option>
                        <option value="where_going">Where are you going?</option>
                        <option value="when_action">When do you...?</option>
                        <option value="mixed">Mixed Questions</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {challenges.length - usedChallenges.size} questions remaining
                    </div>
                </div>

                {/* Current Challenge Display */}
                {currentChallenge && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        {/* Question Type Badge */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getQuestionColor()}`}>
                            {currentChallenge.icon} {currentChallenge.questionType.toUpperCase()}
                        </div>
                        
                        {/* Verb Image */}
                        <div className="mb-4">
                            <img 
                                src={currentChallenge.verb.url} 
                                alt={currentChallenge.verb.eng}
                                className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <div className="text-sm text-gray-300 mt-2">
                                Action: {currentChallenge.verb.eng}
                            </div>
                        </div>
                        
                        {/* Question in both languages */}
                        <div className="mb-4">
                            <div className="text-lg text-yellow-200 mb-2">
                                {currentChallenge.questionEnglish}
                            </div>
                            <div className="text-xl font-arabic">
                                {currentChallenge.questionArabic}
                            </div>
                        </div>
                        
                        {/* Context hints */}
                        {currentChallenge.locationEnglish && (
                            <div className="text-sm text-blue-300 mb-2">
                                💡 Mention a location like: {currentChallenge.locationEnglish}
                            </div>
                        )}
                        
                        {currentChallenge.timeExpression && (
                            <div className="text-sm text-green-300 mb-2">
                                💡 Include time: {currentChallenge.timeExpression.eng}
                            </div>
                        )}
                        
                        <div className="text-sm text-gray-400">
                            Expected: {currentChallenge.expectedChat}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a question type and practice verb responses!'}</div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={startListening}
                        disabled={!currentChallenge || isListening}
                        className={`w-full p-4 rounded-lg font-bold text-lg ${
                            isListening 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {isListening ? '🎤 Listening...' : '🎤 Answer Question'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipChallenge}
                            disabled={!currentChallenge}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={repeatChallenge}
                            disabled={!currentChallenge}
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

                {/* Question Type Legend */}
                <div className="mt-8 text-sm text-gray-300 text-center">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                            <span>🤔 What</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                            <span>📍 Where</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                            <span>⏰ When</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerbQuestionGame;