import React, { useState, useEffect, useRef } from 'react';
import { verbs } from './verbs-data';
import logicData from '../logic.json';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import { getAzureSpeechConfig, startAzureSpeechRecognition } from './azureSpeechHelper';

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
    const currentChallengeRef = useRef(null);
    const challengesRef = useRef([]);

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

    // Convert verb to correct English form based on pronoun
    const getEnglishVerb = (verb, pronoun) => {
        const baseVerb = verb.eng.replace(/^i\s+/i, ''); // Remove "I " from beginning
        
        switch (pronoun) {
            case 'i':
            case 'you':
            case 'we':
            case 'they':
                return baseVerb; // "sleep", "play", "read", etc.
            case 'he':
            case 'she':
                // Add 's' for third person singular
                if (baseVerb.endsWith('y')) {
                    return baseVerb.replace(/y$/, 'ies'); // "study" -> "studies"
                } else if (baseVerb.endsWith('s') || baseVerb.endsWith('sh') || baseVerb.endsWith('ch') || baseVerb.endsWith('x') || baseVerb.endsWith('z')) {
                    return baseVerb + 'es'; // "wash" -> "washes"
                } else {
                    return baseVerb + 's'; // "sleep" -> "sleeps"
                }
            default:
                return baseVerb;
        }
    };

    // Get verbs with both conjugations and images
    const getVerbsWithConjugations = () => {
        const verbsWithImages = [];
        
        // Start with verbs that have images from verbs-data
        verbs.forEach(verbWithImage => {
            // Find the corresponding verb in logic.json to get conjugations
            const logicVerb = logicData.items.find(item => 
                item.pos === 'verb' && 
                item.chat === verbWithImage.chat &&
                item.we_chat // Has conjugation data
            );
            
            if (logicVerb) {
                // Combine image data from verbs-data with conjugation data from logic.json
                verbsWithImages.push({
                    ...logicVerb, // conjugations from logic.json
                    url: verbWithImage.url, // image from verbs-data  
                    path: verbWithImage.path // path from verbs-data
                });
            }
        });
        
        return verbsWithImages.slice(0, 15); // Limit for manageable practice
    };

    // Generate challenges combining verbs with time expressions
    useEffect(() => {
        const generatedChallenges = [];
        const verbsWithConjugations = getVerbsWithConjugations();
        
        verbsWithConjugations.forEach(verb => {
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
                        prompt: `Say "I ${getEnglishVerb(verb, 'i')}" with "${timeExp.eng}"`,
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
                // Diverse contextual scenarios with different pronouns and times
                const contextualScenarios = [
                    // First person (I) - أنا
                    {
                        question: `What do you do every morning? (answer: I ${getEnglishVerb(verb, 'i')})`,
                        expectedArabic: `${verb.ar} كل صبح`,
                        expectedChat: `${verb.chat} kil sob7`,
                        timeKey: 'morning_i'
                    },
                    {
                        question: `What do you do every evening? (answer: I ${getEnglishVerb(verb, 'i')})`,
                        expectedArabic: `${verb.ar} كل مسا`,
                        expectedChat: `${verb.chat} kil masa`,
                        timeKey: 'evening_i'
                    },
                    {
                        question: `What do you do on Sundays? (answer: I ${getEnglishVerb(verb, 'i')})`,
                        expectedArabic: `${verb.ar} يوم الأحد`,
                        expectedChat: `${verb.chat} youm el a7ad`,
                        timeKey: 'sunday_i'
                    },
                    // He - هو
                    {
                        question: `What does he do every morning? (answer: he ${getEnglishVerb(verb, 'he')})`,
                        expectedArabic: `${verb.he} كل صبح`,
                        expectedChat: `${verb.he_chat} kil sob7`,
                        timeKey: 'morning_he'
                    },
                    // Plural (they) - هم
                    {
                        question: `What do they do on weekends? (answer: they ${getEnglishVerb(verb, 'they')})`,
                        expectedArabic: `${verb.they} نهاية الأسبوع`,
                        expectedChat: `${verb.they_chat} nihayat el-esboo3`,
                        timeKey: 'weekend_they'
                    },
                    // We - نحن
                    {
                        question: `What do we do every Friday? (answer: we ${getEnglishVerb(verb, 'we')})`,
                        expectedArabic: `${verb.we} كل جمعة`,
                        expectedChat: `${verb.we_chat} kil jum3a`,
                        timeKey: 'friday_we'
                    },
                    // Monday
                    {
                        question: `What do you do on Mondays? (answer: I ${getEnglishVerb(verb, 'i')})`,
                        expectedArabic: `${verb.ar} يوم الاثنين`,
                        expectedChat: `${verb.chat} youm el ethnain`,
                        timeKey: 'monday_i'
                    },
                    // Tuesday
                    {
                        question: `What does he do on Tuesdays? (answer: he ${getEnglishVerb(verb, 'he')})`,
                        expectedArabic: `${verb.he} يوم الثلاثاء`,
                        expectedChat: `${verb.he_chat} youm el thalatha`,
                        timeKey: 'tuesday_he'
                    },
                    // Wednesday
                    {
                        question: `What do they do on Wednesdays? (answer: they ${getEnglishVerb(verb, 'they')})`,
                        expectedArabic: `${verb.they} يوم الأربعاء`,
                        expectedChat: `${verb.they_chat} youm el arba3a`,
                        timeKey: 'wednesday_they'
                    },
                    // Thursday
                    {
                        question: `What does she do on Thursdays? (answer: she ${getEnglishVerb(verb, 'she')})`,
                        expectedArabic: `${verb.she} يوم الخميس`,
                        expectedChat: `${verb.she_chat} youm el khemees`,
                        timeKey: 'thursday_she'
                    },
                    // Saturday
                    {
                        question: `What do we do on Saturdays? (answer: we ${getEnglishVerb(verb, 'we')})`,
                        expectedArabic: `${verb.we} يوم السبت`,
                        expectedChat: `${verb.we_chat} youm el sabt`,
                        timeKey: 'saturday_we'
                    },
                ];
                
                // Add 2-3 random scenarios per verb to keep it varied
                const selectedScenarios = contextualScenarios
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
                
                selectedScenarios.forEach((scenario, index) => {
                    generatedChallenges.push({
                        id: `context_${verb.chat}_${scenario.timeKey}_${index}`,
                        verb: verb,
                        tense: 'present',
                        scenario: scenario.question,
                        expectedArabic: scenario.expectedArabic,
                        expectedChat: scenario.expectedChat,
                        type: 'contextual'
                    });
                });
            }
        });

        setChallenges(generatedChallenges);
        challengesRef.current = generatedChallenges;
        selectRandomChallenge(generatedChallenges, new Set());
    }, [gameMode]);

    // Initialize speech recognition
    useEffect(() => {
        const azureConfig = getAzureSpeechConfig();
        
        if (azureConfig.isEnabled) {
            console.log('🎤 SPEECH-TO-TEXT ENGINE INFO:');
            console.log('  - Engine: Azure Speech Service');
            console.log('  - Region:', azureConfig.region);
            console.log('  - Language: ar-SA (Arabic Saudi Arabia)');
            console.log('  - API Key configured:', azureConfig.apiKey ? 'Yes' : 'No');
            console.log('  - Status: Azure Speech Service will be used for recognition');
            
            // Azure Speech Service will be initialized when needed in startListening()
        } else if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // Log which speech recognition engine is being used
            const engineName = window.SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition';
            const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                           navigator.userAgent.includes('Safari') ? 'Safari' :
                           navigator.userAgent.includes('Firefox') ? 'Firefox' :
                           navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown';
            
            console.log('🎤 SPEECH-TO-TEXT ENGINE INFO:');
            console.log('  - Engine:', engineName, '(Browser Native)');
            console.log('  - Browser:', browser);
            console.log('  - Language:', 'ar-SA (Arabic Saudi Arabia)');
            console.log('  - Platform:', navigator.platform);
            console.log('  - Status: Using browser speech recognition (Azure not configured)');
            
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
            setFeedback('🎉 Excellent! You mastered verb tenses with time!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const challenge = available[randomIndex];
        setCurrentChallenge(challenge);
        currentChallengeRef.current = challenge;
        
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

    const processAnswerWithChallenge = (userInput, challenge) => {
        const expectedText = challenge.expectedArabic;
        
        console.log('🎤 VERB TENSE GAME:');
        console.log('  - Challenge type:', challenge.type || challenge.tense);
        console.log('  - Prompt:', challenge.prompt || challenge.scenario);
        console.log('  - Expected Arabic:', expectedText);
        console.log('  - User said:', userInput);
        
        // Create a mock item for checkPronunciation function
        const mockItem = {
            ar: expectedText,
            eng: challenge.prompt || challenge.scenario
        };
        
        // Use checkPronunciation for similarity matching (70% threshold)
        const result = checkPronunciation(userInput, mockItem, [], 0.7);
        
        console.log('  - Similarity:', Math.round(result.similarity * 100) + '%');
        console.log('  - Match type:', result.matchType);
        console.log('  - Match result:', result.isCorrect);

        if (result.isCorrect) {
            const percentMatch = Math.round(result.similarity * 100);
            console.log(`✅ CORRECT answer (${percentMatch}% match) - playing audio:`, expectedText);
            
            setScore(score + 1);
            let feedbackMsg = '⏰ Perfect timing! Great verb conjugation!';
            
            // Give different feedback based on match quality
            if (result.similarity >= 0.95) {
                feedbackMsg = '⏰ Perfect pronunciation! Excellent verb conjugation!';
            } else if (result.similarity >= 0.8) {
                feedbackMsg = `⏰ Very good! ${percentMatch}% match - Great verb conjugation!`;
            } else {
                feedbackMsg = `⏰ Good effort! ${percentMatch}% match - Nice verb conjugation!`;
            }
            
            setFeedback(feedbackMsg);
            speak(expectedText);
            
            setUsedChallenges(prev => {
                const newUsedChallenges = new Set([...prev, challenge.id]);
                setTimeout(() => selectRandomChallenge(challengesRef.current, newUsedChallenges), 2000);
                return newUsedChallenges;
            });
        } else {
            const percentMatch = Math.round(result.similarity * 100);
            console.log(`❌ INCORRECT answer (${percentMatch}% match) - playing audio:`, expectedText);
            
            let feedbackMsg = `❌ Try again. Expected: "${expectedText}"`;
            if (result.similarity >= 0.5) {
                feedbackMsg = `❌ Close! ${percentMatch}% match. Expected: "${expectedText}"`;
            }
            
            setFeedback(feedbackMsg);
            speak(expectedText);
            
            // Move to next challenge even if incorrect
            setUsedChallenges(prev => {
                const newUsedChallenges = new Set([...prev, challenge.id]);
                setTimeout(() => selectRandomChallenge(challengesRef.current, newUsedChallenges), 3000); // 3 seconds to hear the correct answer
                return newUsedChallenges;
            });
        }
    };

    const processAnswer = (userInput) => {
        if (!currentChallenge) return;
        processAnswerWithChallenge(userInput, currentChallenge);
    };

    const startListening = async () => {
        if (!currentChallenge || isListening) return;
        
        const azureConfig = getAzureSpeechConfig();
        
        if (azureConfig.isEnabled) {
            console.log('🎤 Using Azure Speech Service for recognition...');
            setIsListening(true);
            setFeedback('🎤 Listening... (Azure)');
            
            try {
                const result = await startAzureSpeechRecognition();
                setIsListening(false);
                
                if (result.success && result.text) {
                    const challengeAtTime = currentChallengeRef.current;
                    if (challengeAtTime) {
                        processAnswerWithChallenge(result.text, challengeAtTime);
                    }
                } else {
                    setFeedback('❌ No speech detected. Try again.');
                }
            } catch (error) {
                console.error('Azure Speech error:', error);
                setIsListening(false);
                setFeedback(`❌ Speech recognition error: ${error.message}`);
            }
        } else if (recognitionRef.current) {
            console.log('🎤 Using browser speech recognition...');
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                setFeedback(`❌ Error starting recognition: ${error.message}`);
            }
        } else {
            setFeedback('❌ Speech recognition not available');
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
                                    src={`./pictures/${currentChallenge.verb.chat.toLowerCase()}.png`} 
                                    alt={currentChallenge.verb.eng}
                                    className="w-48 h-48 mx-auto rounded-lg object-cover"
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