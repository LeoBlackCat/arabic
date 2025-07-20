import React, { useState, useEffect, useRef } from 'react';
import { verbs } from './verbs-data';
import logicData from '../logic.json';
import { normalizeArabic } from './arabicUtils';

const VerbScenarioGame = () => {
    const [currentScenario, setCurrentScenario] = useState(null);
    const [gameMode, setGameMode] = useState('weather_activities'); // weather_activities, daily_schedule, situational, mixed
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [scenarios, setScenarios] = useState([]);
    const [usedScenarios, setUsedScenarios] = useState(new Set());
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Weather and time context data
    const weatherItems = logicData.items.filter(item => item.type === 'weather');
    const timeItems = logicData.items.filter(item => item.type === 'time');

    // Generate contextual scenarios combining verbs with weather/time
    useEffect(() => {
        const generatedScenarios = [];
        
        if (gameMode === 'weather_activities' || gameMode === 'mixed') {
            // Weather-based scenarios
            const weatherScenarios = [
                {
                    weather: 'hot',
                    activities: ['ashrab', 'anaam', 'agra'], // drink, sleep, read
                    situation: 'It\'s very hot today',
                    arabicWeather: 'الجو حار اليوم'
                },
                {
                    weather: 'cold', 
                    activities: ['ashrab', 'atbakh', 'anaam'], // drink (hot), cook, sleep
                    situation: 'It\'s cold outside',
                    arabicWeather: 'الجو بارد'
                },
                {
                    weather: 'nice',
                    activities: ['aseer', 'al3ab', 'ashoof'], // go, play, see
                    situation: 'The weather is nice',
                    arabicWeather: 'الجو حلو'
                }
            ];

            weatherScenarios.forEach(weatherScenario => {
                weatherScenario.activities.forEach(activityChat => {
                    const verb = verbs.find(v => v.chat === activityChat);
                    if (verb) {
                        generatedScenarios.push({
                            id: `weather_${weatherScenario.weather}_${verb.chat}`,
                            type: 'weather_context',
                            situation: weatherScenario.situation,
                            arabicContext: weatherScenario.arabicWeather,
                            verb: verb,
                            prompt: `${weatherScenario.situation}. What do you do? (use: ${verb.eng})`,
                            expectedArabic: `${weatherScenario.arabicWeather}، ${verb.ar}`,
                            expectedChat: `eljaw ${weatherScenario.weather}, ${verb.chat}`,
                            icon: weatherScenario.weather === 'hot' ? '☀️' : weatherScenario.weather === 'cold' ? '❄️' : '🌤️'
                        });
                    }
                });
            });
        }

        if (gameMode === 'daily_schedule' || gameMode === 'mixed') {
            // Time-based daily activities
            const timeScenarios = [
                {
                    time: 'morning',
                    timeArabic: 'الصبح',
                    activities: ['ashrab', 'aakel', 'agra'], // drink coffee, eat, read
                    icon: '🌅'
                },
                {
                    time: 'evening', 
                    timeArabic: 'المسا',
                    activities: ['atbakh', 'ashoof', 'anaam'], // cook, watch, sleep
                    icon: '🌆'
                },
                {
                    time: 'today',
                    timeArabic: 'اليوم', 
                    activities: ['aseer', 'asoog', 'atel'], // go, drive, call
                    icon: '📅'
                }
            ];

            timeScenarios.forEach(timeScenario => {
                timeScenario.activities.forEach(activityChat => {
                    const verb = verbs.find(v => v.chat === activityChat);
                    if (verb) {
                        generatedScenarios.push({
                            id: `time_${timeScenario.time}_${verb.chat}`,
                            type: 'time_context',
                            situation: `In the ${timeScenario.time}`,
                            arabicContext: timeScenario.timeArabic,
                            verb: verb,
                            prompt: `What do you do in the ${timeScenario.time}? (use: ${verb.eng})`,
                            expectedArabic: `${verb.ar} ${timeScenario.timeArabic}`,
                            expectedChat: `${verb.chat} ${timeScenario.time === 'today' ? 'el youm' : timeScenario.time}`,
                            icon: timeScenario.icon
                        });
                    }
                });
            });
        }

        if (gameMode === 'situational' || gameMode === 'mixed') {
            // Situational contexts
            const situations = [
                {
                    context: 'when you\'re hungry',
                    activities: ['aakel', 'atbakh'], // eat, cook
                    icon: '🍽️'
                },
                {
                    context: 'when you\'re tired',
                    activities: ['anaam', 'artaa7'], // sleep, rest (if available)
                    icon: '😴'
                },
                {
                    context: 'when you have free time',
                    activities: ['al3ab', 'agra', 'ashoof'], // play, read, watch
                    icon: '🎮'
                },
                {
                    context: 'when you need to go somewhere',
                    activities: ['aseer', 'asoog'], // go, drive
                    icon: '🚗'
                }
            ];

            situations.forEach(situation => {
                situation.activities.forEach(activityChat => {
                    const verb = verbs.find(v => v.chat === activityChat);
                    if (verb) {
                        generatedScenarios.push({
                            id: `situation_${activityChat}`,
                            type: 'situational',
                            situation: situation.context,
                            verb: verb,
                            prompt: `What do you do ${situation.context}?`,
                            expectedArabic: verb.ar,
                            expectedChat: verb.chat,
                            icon: situation.icon
                        });
                    }
                });
            });
        }

        setScenarios(generatedScenarios);
        selectRandomScenario(generatedScenarios, new Set());
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

    const selectRandomScenario = (scenarioList = scenarios, used = usedScenarios) => {
        const available = scenarioList.filter(scenario => !used.has(scenario.id));
        
        if (available.length === 0) {
            setCurrentScenario(null);
            setFeedback('🎉 Amazing! You mastered contextual verb usage!');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const scenario = available[randomIndex];
        setCurrentScenario(scenario);
        
        // Present the scenario
        setTimeout(() => {
            speak(scenario.prompt);
            setFeedback(scenario.prompt);
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
        if (!currentScenario) return;

        const normalizedInput = normalizeArabic(userInput.toLowerCase());
        const expectedText = currentScenario.expectedArabic;
        const normalizedExpected = normalizeArabic(expectedText.toLowerCase());
        
        // Check if the verb is mentioned correctly in context
        const verbArabic = normalizeArabic(currentScenario.verb.ar.toLowerCase());
        const containsVerb = normalizedInput.includes(verbArabic);
        const matchesExpected = normalizedInput.includes(normalizedExpected) || 
                               normalizedExpected.includes(normalizedInput);

        if (containsVerb || matchesExpected) {
            setScore(score + 1);
            setFeedback('🎯 Perfect context! Great situational response!');
            speak('إجابة ممتازة'); // Excellent answer
            
            setUsedScenarios(prev => new Set([...prev, currentScenario.id]));
            setTimeout(() => selectRandomScenario(), 2000);
        } else {
            setFeedback(`❌ Try again. Expected: "${expectedText}"`);
            speak(expectedText);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && currentScenario) {
            recognitionRef.current.start();
        }
    };

    const skipScenario = () => {
        if (currentScenario) {
            setUsedScenarios(prev => new Set([...prev, currentScenario.id]));
            selectRandomScenario();
        }
    };

    const resetGame = () => {
        setUsedScenarios(new Set());
        setScore(0);
        setFeedback('');
        selectRandomScenario(scenarios, new Set());
    };

    const repeatScenario = () => {
        if (currentScenario) {
            speak(currentScenario.prompt);
        }
    };

    const getScenarioColor = () => {
        if (!currentScenario) return 'bg-gray-600';
        switch (currentScenario.type) {
            case 'weather_context': return 'bg-blue-600';
            case 'time_context': return 'bg-green-600';
            case 'situational': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">🎭 Verb Scenarios</h1>
                
                {/* Game Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Scenario Type:</label>
                    <select 
                        value={gameMode} 
                        onChange={(e) => setGameMode(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                    >
                        <option value="weather_activities">Weather Activities</option>
                        <option value="daily_schedule">Daily Schedule</option>
                        <option value="situational">Situational Context</option>
                        <option value="mixed">Mixed Scenarios</option>
                    </select>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-yellow-300">Score: {score}</div>
                    <div className="text-sm text-gray-300">
                        {scenarios.length - usedScenarios.size} scenarios remaining
                    </div>
                </div>

                {/* Current Scenario Display */}
                {currentScenario && (
                    <div className="bg-white/10 backdrop-blur p-6 rounded-lg mb-6 text-center">
                        {/* Scenario Type Badge */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getScenarioColor()}`}>
                            {currentScenario.icon} {currentScenario.type.replace('_', ' ').toUpperCase()}
                        </div>
                        
                        {/* Verb Image */}
                        <div className="mb-4">
                            <img 
                                src={currentScenario.verb.url} 
                                alt={currentScenario.verb.eng}
                                className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <div className="text-sm text-gray-300 mt-2">
                                Action: {currentScenario.verb.eng}
                            </div>
                        </div>
                        
                        {/* Scenario Context */}
                        <div className="text-lg mb-4 text-cyan-200">
                            {currentScenario.situation}
                        </div>
                        
                        {/* Expected Response */}
                        <div className="text-sm text-gray-400 mb-2">
                            Expected: {currentScenario.expectedChat}
                        </div>
                        
                        {/* Arabic Context if available */}
                        {currentScenario.arabicContext && (
                            <div className="text-sm text-blue-300">
                                Context: {currentScenario.arabicContext}
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback */}
                <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-center min-h-[60px] flex items-center justify-center">
                    <div className="text-lg">{feedback || 'Choose a scenario type and practice contextual verbs!'}</div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={startListening}
                        disabled={!currentScenario || isListening}
                        className={`w-full p-4 rounded-lg font-bold text-lg ${
                            isListening 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {isListening ? '🎤 Listening...' : '🎤 Respond to Scenario'}
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={skipScenario}
                            disabled={!currentScenario}
                            className="flex-1 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:bg-gray-600"
                        >
                            ⏭️ Skip
                        </button>
                        
                        <button
                            onClick={repeatScenario}
                            disabled={!currentScenario}
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

                {/* Scenario Legend */}
                <div className="mt-8 text-sm text-gray-300 text-center">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                            <span>🌤️ Weather</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                            <span>⏰ Time</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                            <span>🎯 Situation</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                            <span>🎭 Mixed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerbScenarioGame;