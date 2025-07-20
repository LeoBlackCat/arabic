import React, { useState, useEffect, useRef } from 'react';
import { verbs } from './verbs-data';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const VerbTenseGame = () => {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [gameMode, setGameMode] = useState('past_present'); // past_present, future, mixed, contextual
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [challenges, setChallenges] = useState([]);
    const [usedChallenges, setUsedChallenges] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Get time expressions from logic data
    const timeExpressions = logicData.items.filter(item => item.type === 'time');

    // Verb conjugation patterns (simplified Gulf Arabic)
    const conjugateVerb = (verb, tense, timeContext = null) => {
        const baseChat = verb.chat;
        const baseAr = verb.ar;
        
        switch (tense) {
            case 'past':
                // Convert "I verb" to "I verbed" 
                if (baseChat === 'a7eb') return { ar: 'حبيت', chat: '7abait', eng: 'I loved' };
                if (baseChat === 'aakel') return { ar: 'أكلت', chat: 'akalt', eng: 'I ate' };
                if (baseChat === 'ashrab') return { ar: 'شربت', chat: 'sharabt', eng: 'I drank' };
                if (baseChat === 'aseer') return { ar: 'سرت', chart: 'sirt', eng: 'I went' };
                if (baseChat === 'ashoof') return { ar: 'شفت', chat: 'shuft', eng: 'I saw' };
                if (baseChat === 'anaam') return { ar: 'نمت', chat: 'nimt', eng: 'I slept' };
                if (baseChat === 'al3ab') return { ar: 'لعبت', chat: 'la3abt', eng: 'I played' };
                // Default pattern: remove "a" prefix, add "t" suffix
                return { ar: baseAr + 'ت', chat: baseChat.replace(/^a/, '') + 't', eng: verb.eng.replace('I ', 'I ') + 'ed' };
                
            case 'future':
                // Add "ba" prefix for future
                return { ar: 'با' + baseAr, chat: 'ba' + baseChat, eng: 'I will ' + verb.eng.replace('I ', '') };
                
            case 'present':
            default:
                return { ar: baseAr, chat: baseChat, eng: verb.eng };
        }
    };

    // Generate challenges combining verbs with time expressions
    useEffect(() => {
        const generatedChallenges = [];
        
        verbs.forEach(verb => {
            if (gameMode === 'past_present' || gameMode === 'mixed') {
                // Past tense with yesterday/last week
                timeExpressions.filter(time => 
                    time.eng.includes('yesterday') || time.eng.includes('last')
                ).forEach(timeExp => {
                    const pastVerb = conjugateVerb(verb, 'past');
                    generatedChallenges.push({
                        id: `past_${verb.chat}_${timeExp.id}`,
                        verb: verb,
                        tense: 'past',
                        timeExpression: timeExp,
                        prompt: `Say "${pastVerb.eng}" with "${timeExp.eng}"`,
                        expectedArabic: `${pastVerb.ar} ${timeExp.ar}`,
                        expectedChat: `${pastVerb.chat} ${timeExp.chat}`,
                        type: 'past_context'
                    });
                });

                // Present tense with today/every day
                timeExpressions.filter(time => 
                    time.eng.includes('today') || time.eng.includes('every') || time.eng.includes('morning') || time.eng.includes('evening')
                ).forEach(timeExp => {
                    generatedChallenges.push({
                        id: `present_${verb.chat}_${timeExp.id}`,
                        verb: verb,
                        tense: 'present',
                        timeExpression: timeExp,
                        prompt: `Say "${verb.eng}" with "${timeExp.eng}"`,
                        expectedArabic: `${verb.ar} ${timeExp.ar}`,
                        expectedChat: `${verb.chat} ${timeExp.chat}`,
                        type: 'present_context'
                    });
                });
            }

            if (gameMode === 'future' || gameMode === 'mixed') {
                // Future tense with tomorrow/next week
                timeExpressions.filter(time => 
                    time.eng.includes('tomorrow') || time.eng.includes('next')
                ).forEach(timeExp => {
                    const futureVerb = conjugateVerb(verb, 'future');
                    generatedChallenges.push({
                        id: `future_${verb.chat}_${timeExp.id}`,
                        verb: verb,
                        tense: 'future',
                        timeExpression: timeExp,
                        prompt: `Say "${futureVerb.eng}" with "${timeExp.eng}"`,
                        expectedArabic: `${futureVerb.ar} ${timeExp.ar}`,
                        expectedChat: `${futureVerb.chat} ${timeExp.chat}`,
                        type: 'future_context'
                    });
                });
            }

            if (gameMode === 'contextual' || gameMode === 'mixed') {
                // Contextual scenarios
                generatedChallenges.push({
                    id: `context_${verb.chat}_morning`,
                    verb: verb,
                    tense: 'present',
                    scenario: `What do you do every morning? (use: ${verb.eng})`,
                    expectedArabic: `${verb.ar} كل صبح`,
                    expectedChat: `${verb.chat} kil sob7`,
                    type: 'contextual'
                });
            }
        });

        setChallenges(generatedChallenges);
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

    const selectRandomChallenge = (challengeList = challenges, used = usedChallenges) => {
        const available = challengeList.filter(challenge => !used.has(challenge.id));
        
        if (available.length === 0) {
            setCurrentChallenge(null);
            setFeedback('🎉 Excellent! You mastered verb tenses with time!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const challenge = available[randomIndex];
        setCurrentChallenge(challenge);
        
        // Present the challenge
        setTimeout(() => {
            if (challenge.scenario) {
                speak(challenge.scenario);
                setFeedback(challenge.scenario);
            } else {
                speak(challenge.prompt);
                setFeedback(challenge.prompt);
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
        if (!currentChallenge) return;

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        const expectedText = currentChallenge.expectedArabic;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        // Check if input contains expected conjugated verb and time expression
        const isCorrect = normalizedInput.includes(normalizedExpected) || 
                         normalizedExpected.includes(normalizedInput);

        if (isCorrect) {
            setScore(score + 1);
            setFeedback('⏰ Perfect timing! Great verb conjugation!');
            speak('ممتاز جداً');
            
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            setTimeout(() => selectRandomChallenge(), 2000);
        } else {
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentChallenge) {
            recognitionRef.current.start();
        }
    };

    const skipChallenge = () => {
        if (currentChallenge) {
            setUsedChallenges(prev => new Set([...prev, currentChallenge.id]));
            selectRandomChallenge();
        }
    };

    const resetGame = () => {
        setUsedChallenges(new Set());
        setScore(0);
        setFeedback('');
        selectRandomChallenge(challenges, new Set());
    };

    const repeatChallenge = () => {
        if (currentChallenge) {
            const text = currentChallenge.scenario || currentChallenge.prompt;
            speak(text);
        }
    };

    const getTenseColor = () => {
        if (!currentChallenge) return 'bg-gray-600';
        switch (currentChallenge.tense) {
            case 'past': return 'bg-red-600';
            case 'present': return 'bg-green-600';
            case 'future': return 'bg-blue-600';
            default: return 'bg-purple-600';
        }
    };

    const getTenseIcon = () => {
        if (!currentChallenge) return '⏰';
        switch (currentChallenge.tense) {
            case 'past': return '⬅️';
            case 'present': return '🔄';
            case 'future': return '➡️';
            default: return '⏰';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">⏰ Verb Tenses</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Tense Mode:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="past_present">Past & Present</option>
                        <option value="future">Future Tense</option>
                        <option value="contextual">Daily Context</option>
                        <option value="mixed">Mixed Tenses</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {challenges.length - usedChallenges.size} challenges remaining
                    </div>
                </div>

                {/* Current Challenge Display */}
                {currentChallenge && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        {/* Tense Indicator */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getTenseColor()}`}>
                            {getTenseIcon()} {currentChallenge.tense.toUpperCase()}
                        </div>
                        
                        {/* Verb Image */}
                        {currentChallenge.verb && (
                            <div className="mb-4">
                                <img 
                                    src={currentChallenge.verb.url} 
                                    alt={currentChallenge.verb.eng}
                                    className="w-20 h-20 mx-auto rounded-lg object-cover"
                                />
                                <div className="text-sm text-gray-300 mt-2">
                                    {currentChallenge.verb.eng}
                                </div>
                            </div>
                        )}
                        
                        {/* Challenge Text */}
                        <div className="text-lg mb-4">
                            {currentChallenge.scenario || currentChallenge.prompt}
                        </div>
                        
                        {/* Time Expression Context */}
                        {currentChallenge.timeExpression && (
                            <div className="text-sm text-blue-300 mb-2">
                                Time: {currentChallenge.timeExpression.eng}
                            </div>
                        )}
                        
                        <div className="text-sm text-gray-400">
                            Expected: {currentChallenge.expectedChat}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a tense mode and practice verb conjugations!'}</div>
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
                        {isListening ? '🎤 Listening...' : '🎤 Conjugate Verb'}
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

                {/* Tense Legend */}
                <div className="mt-8 text-sm text-gray-300 text-center">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                            <span>⬅️ Past</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                            <span>🔄 Present</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                            <span>➡️ Future</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerbTenseGame;