import React, { useState, useEffect, useRef } from 'react';
import { verbs } from './verbs-data';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const DailyVerbGame = () => {
    const [currentActivity, setCurrentActivity] = useState(null);
    const [gameMode, setGameMode] = useState('daily_routine'); // daily_routine, frequency, sequence, mixed
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [activities, setActivities] = useState([]);
    const [usedActivities, setUsedActivities] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const currentActivityRef = useRef(null);
    const activitiesRef = useRef([]);

    // Daily routine patterns and phrases
    const dailyPatterns = {
        morning: {
            time: 'الصبح',
            timeChat: 'el sob7',
            activities: [
                { verbChat: 'ashrab', complement: 'قهوة', complementChat: 'gahwa', eng: 'drink coffee' },
                { verbChat: 'aakel', complement: 'فطور', complementChat: 'fatoor', eng: 'eat breakfast' },
                { verbChat: 'agra', complement: 'الجريدة', complementChat: 'el jareeda', eng: 'read the newspaper' },
                { verbChat: 'aseer', complement: 'الدوام', complementChat: 'el dawaam', eng: 'go to work' }
            ],
            icon: '🌅'
        },
        evening: {
            time: 'المسا',
            timeChat: 'el mesa',
            activities: [
                { verbChat: 'atbakh', complement: 'عشا', complementChat: '3asha', eng: 'cook dinner' },
                { verbChat: 'ashoof', complement: 'تلفزيون', complementChat: 'televizion', eng: 'watch TV' },
                { verbChat: 'al3ab', complement: 'مع الأطفال', complementChat: 'ma3 el atfaal', eng: 'play with children' },
                { verbChat: 'anaam', complement: 'بدري', complementChat: 'badree', eng: 'sleep early' }
            ],
            icon: '🌆'
        },
        weekend: {
            time: 'الويك إند',
            timeChat: 'el weekend',
            activities: [
                { verbChat: 'aseer', complement: 'المول', complementChat: 'el mall', eng: 'go to the mall' },
                { verbChat: 'al3ab', complement: 'رياضة', complementChat: 'riyadha', eng: 'play sports' },
                { verbChat: 'ashoof', complement: 'الأصدقاء', complementChat: 'el asdiqaa', eng: 'see friends' },
                { verbChat: 'artaa7', complement: 'في البيت', complementChat: 'fee el bait', eng: 'rest at home' }
            ],
            icon: '🎉'
        }
    };

    // Frequency expressions
    const frequencyExpressions = [
        { ar: 'كل يوم', chat: 'kil youm', eng: 'every day' },
        { ar: 'أحياناً', chat: 'a7yanan', eng: 'sometimes' },
        { ar: 'دائماً', chat: 'daiman', eng: 'always' },
        { ar: 'عادة', chat: '3aada', eng: 'usually' },
        { ar: 'نادراً', chat: 'nadiran', eng: 'rarely' }
    ];

    // Generate daily activity challenges
    useEffect(() => {
        const generatedActivities = [];
        
        if (gameMode === 'daily_routine' || gameMode === 'mixed') {
            // Daily routine activities
            Object.keys(dailyPatterns).forEach(timeOfDay => {
                const pattern = dailyPatterns[timeOfDay];
                pattern.activities.forEach(activity => {
                    const verb = verbs.find(v => v.chat === activity.verbChat);
                    if (verb) {
                        generatedActivities.push({
                            id: `routine_${timeOfDay}_${activity.verbChat}`,
                            type: 'daily_routine',
                            timeOfDay: timeOfDay,
                            timePattern: pattern,
                            verb: verb,
                            complement: activity.complement,
                            complementChat: activity.complementChat,
                            prompt: `What do you do in the ${timeOfDay === 'morning' ? 'morning' : timeOfDay === 'evening' ? 'evening' : 'weekend'}? (${activity.eng})`,
                            expectedArabic: `${verb.ar} ${activity.complement} ${pattern.time}`,
                            expectedChat: `${verb.chat} ${activity.complementChat} ${pattern.timeChat}`,
                            icon: pattern.icon
                        });
                    }
                });
            });
        }

        if (gameMode === 'frequency' || gameMode === 'mixed') {
            // Frequency-based activities
            verbs.forEach(verb => {
                frequencyExpressions.forEach(freq => {
                    generatedActivities.push({
                        id: `freq_${verb.chat}_${freq.chat}`,
                        type: 'frequency',
                        verb: verb,
                        frequency: freq,
                        prompt: `How often do you ${verb.eng.replace('I ', '')}? Use "${freq.eng}"`,
                        expectedArabic: `${freq.ar} ${verb.ar}`,
                        expectedChat: `${freq.chat} ${verb.chat}`,
                        icon: '🔄'
                    });
                });
            });
        }

        if (gameMode === 'sequence' || gameMode === 'mixed') {
            // Sequence of daily activities
            const sequences = [
                {
                    description: 'Morning routine sequence',
                    actions: ['أقوم', 'أشرب قهوة', 'آكل فطور', 'أسير الدوام'],
                    chats: ['agoum', 'ashrab gahwa', 'aakel fatoor', 'aseer el dawaam'],
                    eng: ['wake up', 'drink coffee', 'eat breakfast', 'go to work']
                },
                {
                    description: 'Evening routine sequence', 
                    actions: ['أرجع البيت', 'أطبخ عشا', 'أشوف تلفزيون', 'أنام'],
                    chats: ['arja3 el bait', 'atbakh 3asha', 'ashoof televizion', 'anaam'],
                    eng: ['return home', 'cook dinner', 'watch TV', 'sleep']
                }
            ];

            sequences.forEach((sequence, seqIndex) => {
                sequence.actions.forEach((action, actionIndex) => {
                    generatedActivities.push({
                        id: `seq_${seqIndex}_${actionIndex}`,
                        type: 'sequence',
                        sequence: sequence,
                        actionIndex: actionIndex,
                        prompt: `${sequence.description}: Step ${actionIndex + 1}`,
                        expectedArabic: action,
                        expectedChat: sequence.chats[actionIndex],
                        icon: '🔢'
                    });
                });
            });
        }

        setActivities(generatedActivities);
        activitiesRef.current = generatedActivities;
        selectRandomActivity(generatedActivities, new Set());
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
                        const activityAtTime = currentActivityRef.current;
                        setIsListening(false);
                        
                        if (activityAtTime) {
                            processAnswerWithActivity(transcript, activityAtTime);
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

    const selectRandomActivity = (activityList = activities, used = usedActivities) => {
        const available = activityList.filter(activity => !used.has(activity.id));
        
        if (available.length === 0) {
            setCurrentActivity(null);
            setFeedback('🎉 Fantastic! You mastered daily activities in Arabic!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const activity = available[randomIndex];
        setCurrentActivity(activity);
        currentActivityRef.current = activity;
        
        // Present the activity
        setTimeout(() => {
            speak(activity.prompt);
            setFeedback(activity.prompt);
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

    const processAnswerWithActivity = (userInput, activity) => {
        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        const expectedText = activity.expectedArabic;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        // For daily routine, check if verb and key components are present
        let isCorrect = false;
        
        if (activity.verb) {
            const verbArabic = normalizeArabic(activity.verb.ar.toLowerCase());
            const containsVerb = normalizedInput.includes(verbArabic);
            
            if (activity.complement) {
                const complementArabic = normalizeArabic(activity.complement.toLowerCase());
                const containsComplement = normalizedInput.includes(complementArabic);
                isCorrect = containsVerb && containsComplement;
            } else {
                isCorrect = containsVerb;
            }
        } else {
            // For sequences, check main verb
            isCorrect = normalizedInput.includes(normalizedExpected) || 
                       normalizedExpected.includes(normalizedInput);
        }

        if (isCorrect) {
            console.log('✅ CORRECT answer - playing audio:', 'روتين ممتاز');
            setScore(score + 1);
            setFeedback('📅 Excellent daily routine! Perfect activity!');
            speak('روتين ممتاز'); // Excellent routine
            
            setUsedActivities(prev => {
                const newUsedActivities = new Set([...prev, activity.id]);
                setTimeout(() => selectRandomActivity(activitiesRef.current, newUsedActivities), 2000);
                return newUsedActivities;
            });
        } else {
            console.log('❌ INCORRECT answer - playing audio:', expectedText);
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const processAnswer = (userInput) => {
        if (!currentActivity) return;
        processAnswerWithActivity(userInput, currentActivity);
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentActivity) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                setFeedback(`❌ Error starting recognition: ${error.message}`);
            }
        }
    };

    const skipActivity = () => {
        if (currentActivity) {
            setUsedActivities(prev => new Set([...prev, currentActivity.id]));
            selectRandomActivity(activitiesRef.current, usedActivities);
        }
    };

    const resetGame = () => {
        setUsedActivities(new Set());
        setScore(0);
        setFeedback('');
        selectRandomActivity(activitiesRef.current, new Set());
    };

    const repeatActivity = () => {
        if (currentActivity) {
            speak(currentActivity.prompt);
        }
    };

    const getActivityColor = () => {
        if (!currentActivity) return 'bg-gray-600';
        switch (currentActivity.type) {
            case 'daily_routine': return 'bg-green-600';
            case 'frequency': return 'bg-blue-600';
            case 'sequence': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-800 to-blue-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">📅 Daily Verbs</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Activity Type:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="daily_routine">Daily Routines</option>
                        <option value="frequency">Activity Frequency</option>
                        <option value="sequence">Action Sequences</option>
                        <option value="mixed">Mixed Activities</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {activities.length - usedActivities.size} activities remaining
                    </div>
                </div>

                {/* Current Activity Display */}
                {currentActivity && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        {/* Activity Type Badge */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getActivityColor()}`}>
                            {currentActivity.icon} {currentActivity.type.replace('_', ' ').toUpperCase()}
                        </div>
                        
                        {/* Verb Image if available */}
                        {currentActivity.verb && (
                            <div className="mb-4">
                                <img 
                                    src={currentActivity.verb.url} 
                                    alt={currentActivity.verb.eng}
                                    className="w-24 h-24 mx-auto rounded-lg object-cover"
                                />
                                <div className="text-sm text-gray-300 mt-2">
                                    {currentActivity.verb.eng}
                                </div>
                            </div>
                        )}
                        
                        {/* Activity Prompt */}
                        <div className="text-lg mb-4 text-cyan-200">
                            {currentActivity.prompt}
                        </div>
                        
                        {/* Context Information */}
                        {currentActivity.timeOfDay && (
                            <div className="text-sm text-blue-300 mb-2">
                                ⏰ Time: {currentActivity.timeOfDay}
                            </div>
                        )}
                        
                        {currentActivity.frequency && (
                            <div className="text-sm text-green-300 mb-2">
                                🔄 Frequency: {currentActivity.frequency.eng}
                            </div>
                        )}
                        
                        {currentActivity.sequence && (
                            <div className="text-sm text-purple-300 mb-2">
                                🔢 Step {currentActivity.actionIndex + 1} of {currentActivity.sequence.actions.length}
                            </div>
                        )}
                        
                        <div className="text-sm text-gray-400">
                            Expected: {currentActivity.expectedChat}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose an activity type and practice daily verbs!'}</div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={startListening}
                        disabled={!currentActivity || isListening}
                        className={`w-full p-4 rounded-lg font-bold text-lg ${
                            isListening 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {isListening ? '🎤 Listening...' : '🎤 Describe Activity'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipActivity}
                            disabled={!currentActivity}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={repeatActivity}
                            disabled={!currentActivity}
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

                {/* Activity Type Legend */}
                <div className="mt-8 text-sm text-gray-300 text-center">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                            <span>📅 Routine</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                            <span>🔄 Frequency</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                            <span>🔢 Sequence</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                            <span>🎯 Mixed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyVerbGame;