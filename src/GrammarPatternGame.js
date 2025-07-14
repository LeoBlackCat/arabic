import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic } from './arabicUtils';
import { isElevenLabsAvailable, playElevenLabsSpeech } from './elevenLabsHelper';
import { isFirebaseStorageAvailable, playAudioWithFirebaseCache } from './firebaseStorageHelper';
import logicData from '../logic.json';

const GrammarPatternGame = ({ contentData, contentType }) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [patternType, setPatternType] = useState('gender_agreement');
  const [showExplanation, setShowExplanation] = useState(false);

  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(false);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);

  // Initialize voices and check ElevenLabs availability
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic'));
      setArabicVoice(arVoice || voices[0]);
    };
    speechSynthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Check ElevenLabs availability
    const checkElevenLabs = () => {
      const available = isElevenLabsAvailable();
      setElevenLabsEnabled(available);
      console.log('GrammarPatternGame: ElevenLabs TTS available:', available);
    };
    
    // Check Firebase Storage availability
    const checkFirebase = () => {
      const available = isFirebaseStorageAvailable();
      setFirebaseEnabled(available);
      console.log('GrammarPatternGame: Firebase Storage available:', available);
    };
    
    checkElevenLabs();
    checkFirebase();
    
    return () => {
      speechSynthRef.current.onvoiceschanged = null;
    };
  }, []);

  // Map Arabic -> chat for filename lookup (lazy-loaded on first use)
  let arToChatMap = null;
  const buildArMap = () => {
    if (arToChatMap) return arToChatMap;
    try {
      arToChatMap = {};
      [...logicData.items, ...(logicData.numerals || [])].forEach((it) => {
        if (it.ar && it.chat) arToChatMap[it.ar] = it.chat;
      });
    } catch (e) {
      console.warn('Unable to load logic.json for map:', e);
      arToChatMap = {};
    }
    return arToChatMap;
  };


  const speakWord = useCallback(async (text, chatOverride) => {
    if (!text) return;
    
    // Priority 0: Firebase Storage cache (if enabled)
    if (firebaseEnabled) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      
      try {
        console.log(`GrammarPatternGame: Using Firebase Storage cache for: "${text}" -> filename: "${chat}"`);
        await playAudioWithFirebaseCache(text, chat);
        return;
      } catch (error) {
        console.error('GrammarPatternGame: Firebase Storage failed, falling back:', error);
      }
    }
    
    // Priority 1: ElevenLabs TTS (if enabled)
    if (elevenLabsEnabled) {
      try {
        console.log('GrammarPatternGame: Using ElevenLabs TTS for:', text);
        await playElevenLabsSpeech(text);
        return;
      } catch (error) {
        console.error('GrammarPatternGame: ElevenLabs TTS failed, falling back:', error);
      }
    }

    // Priority 2: Pre-generated WAV files
    const PLAY_AUDIO_FILES = true; // Match the setting from App.js
    if (PLAY_AUDIO_FILES) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      const fileName = `${chat}.wav`;
      const audio = new Audio('.' + `/sounds/${encodeURIComponent(fileName)}`);
      
      try {
        await audio.play();
        console.log('GrammarPatternGame: Played audio file:', fileName);
        return;
      } catch (error) {
        console.error('GrammarPatternGame: Audio file play error:', error);
      }
    }

    // Priority 3: Browser TTS (fallback)
    try {
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthRef.current.speak(utterance);
      console.log('GrammarPatternGame: Using browser TTS for:', text);
    } catch (error) {
      console.error('GrammarPatternGame: Browser TTS synthesis error:', error);
    }
  }, [arabicVoice, elevenLabsEnabled, firebaseEnabled]);

  // Color mapping for visual display
  const COLOR_MAP = {
    'a7mar': '#FF0000', 'asfar': '#FFFF00', 'azrag': '#0000FF',
    'abyadh': '#FFFFFF', 'aswad': '#000000', 'akhdhar': '#00FF00',
    'rusasee': '#808080', 'wardee': '#FFC0CB', 'banafsajee': '#800080',
    'bonnee': '#8B4513', 'burtuqalee': '#FFA500', 'fedhee': '#C0C0C0',
    'thahabee': '#FFD700'
  };

  const generateGenderAgreementChallenge = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;

    // Get nouns and colors
    const nouns = contentData.filter(item => item.pos === 'noun' && item.gender);
    const colors = contentData.filter(item => item.type === 'colors' && item.ar_f);
    
    if (nouns.length === 0 || colors.length === 0) return null;

    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Generate options
    const correctFeminine = `${noun.ar} ${color.ar_f}`;
    const correctMasculine = `${noun.ar} ${color.ar}`;
    const incorrectFeminine = `${noun.ar} ${color.ar}`;
    const incorrectMasculine = `${noun.ar} ${color.ar_f}`;

    const correctFeminineChat = `${noun.chat} ${color.chat_f}`;
    const correctMasculineChat = `${noun.chat} ${color.chat}`;
    const incorrectFeminineChat = `${noun.chat} ${color.chat}`;
    const incorrectMasculineChat = `${noun.chat} ${color.chat_f}`;

    let correctAnswer, incorrectAnswer, correctAnswerChat, incorrectAnswerChat;
    if (noun.gender === 'f') {
      correctAnswer = correctFeminine;
      incorrectAnswer = incorrectFeminine;
      correctAnswerChat = correctFeminineChat;
      incorrectAnswerChat = incorrectFeminineChat;
    } else {
      correctAnswer = correctMasculine;
      incorrectAnswer = incorrectMasculine;
      correctAnswerChat = correctMasculineChat;
      incorrectAnswerChat = incorrectMasculineChat;
    }

    // Create 4 options with some additional variations
    const options = [
      {
        text: correctAnswer,
        chat: correctAnswerChat,
        isCorrect: true,
        explanation: `Correct: ${noun.ar} (${noun.chat}) is ${noun.gender === 'f' ? 'feminine' : 'masculine'}, so the color ${color.ar_f || color.ar} must agree.`
      },
      {
        text: incorrectAnswer,
        chat: incorrectAnswerChat,
        isCorrect: false,
        explanation: `Incorrect: Gender disagreement - ${noun.ar} (${noun.chat}) is ${noun.gender === 'f' ? 'feminine' : 'masculine'} but the color form doesn't match.`
      }
    ];

    // Add two more options with different nouns
    const otherNouns = nouns.filter(n => n.id !== noun.id).slice(0, 2);
    otherNouns.forEach(otherNoun => {
      const otherText = otherNoun.gender === 'f' ? 
        `${otherNoun.ar} ${color.ar_f}` : 
        `${otherNoun.ar} ${color.ar}`;
      const otherTextChat = otherNoun.gender === 'f' ? 
        `${otherNoun.chat} ${color.chat_f}` : 
        `${otherNoun.chat} ${color.chat}`;
      options.push({
        text: otherText,
        chat: otherTextChat,
        isCorrect: false,
        explanation: `Incorrect: While the gender agreement is correct, this uses a different noun (${otherNoun.ar}).`
      });
    });

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    return {
      type: 'gender_agreement',
      question: `Which phrase shows correct gender agreement?`,
      context: `The noun "${noun.ar}" (${noun.chat}) - ${noun.eng} is ${noun.gender === 'f' ? 'feminine' : 'masculine'}. The color "${color.eng}" should agree with it.`,
      options: shuffledOptions,
      noun: noun,
      color: color,
      correctAnswer: correctAnswer
    };
  }, [contentData]);

  const generateConjugationChallenge = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;

    const verbs = contentData.filter(item => item.pos === 'verb' && item.you_m && item.you_f);
    if (verbs.length === 0) return null;

    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const subjects = [
      { pronoun: 'enta', form: 'you_m', label: 'you (masculine)', arabicPronoun: 'أنت (م)' },
      { pronoun: 'entee', form: 'you_f', label: 'you (feminine)', arabicPronoun: 'أنت (ف)' },
      { pronoun: 'entoo', form: 'you_pl', label: 'you (plural)', arabicPronoun: 'أنتم' },
      { pronoun: 'hu', form: 'he', label: 'he', arabicPronoun: 'هو' },
      { pronoun: 'he', form: 'she', label: 'she', arabicPronoun: 'هي' },
      { pronoun: 'hum', form: 'they', label: 'they', arabicPronoun: 'هم' },
    ];

    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const correctForm = verb[subject.form];

    // Generate options
    const correctFormChat = verb[subject.form + '_chat'];
    const options = [
      {
        text: `${subject.arabicPronoun} ${correctForm}`,
        chat: `${subject.pronoun} ${correctFormChat}`,
        isCorrect: true,
        explanation: `Correct: "${subject.pronoun}" (${subject.label}) takes the form "${correctForm}" (${correctFormChat}).`
      }
    ];

    // Add incorrect options using other conjugations
    const otherForms = subjects.filter(s => s.form !== subject.form).slice(0, 3);
    otherForms.forEach(otherSubject => {
      const incorrectForm = verb[otherSubject.form];
      const incorrectFormChat = verb[otherSubject.form + '_chat'];
      options.push({
        text: `${subject.arabicPronoun} ${incorrectForm}`,
        chat: `${subject.pronoun} ${incorrectFormChat}`,
        isCorrect: false,
        explanation: `Incorrect: "${subject.pronoun}" should not use the form "${incorrectForm}" (${incorrectFormChat}) which is for ${otherSubject.label}.`
      });
    });

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    return {
      type: 'conjugation',
      question: `Which conjugation is correct?`,
      context: `The verb "${verb.ar}" (${verb.chat}) - ${verb.eng} needs to be conjugated for the subject "${subject.pronoun}" (${subject.label}).`,
      options: shuffledOptions,
      verb: verb,
      subject: subject,
      correctAnswer: `${subject.arabicPronoun} ${correctForm}`
    };
  }, [contentData]);

  const generatePossessiveChallenge = useCallback(() => {
    if (!contentData || contentData.length === 0) return null;

    const nouns = contentData.filter(item => item.pos === 'noun' && item.my && item.your_m);
    if (nouns.length === 0) return null;

    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const possessors = [
      { pronoun: 'My', form: 'my', label: 'my' },
      { pronoun: 'Your (m)', form: 'your_m', label: 'your (masculine)' },
      { pronoun: 'Your (f)', form: 'your_f', label: 'your (feminine)' },
      { pronoun: 'His', form: 'his', label: 'his' },
      { pronoun: 'Her', form: 'her', label: 'her' }
    ];

    const possessor = possessors[Math.floor(Math.random() * possessors.length)];
    const correctForm = noun[possessor.form];

    // Generate options
    const correctFormChat = noun[possessor.form + '_chat'];
    const options = [
      {
        text: correctForm,
        chat: correctFormChat,
        isCorrect: true,
        explanation: `Correct: "${correctForm}" (${correctFormChat}) is the correct possessive form for "${possessor.label} ${noun.eng}".`
      }
    ];

    // Add incorrect options
    const otherForms = possessors.filter(p => p.form !== possessor.form).slice(0, 3);
    otherForms.forEach(otherPossessor => {
      const incorrectForm = noun[otherPossessor.form];
      const incorrectFormChat = noun[otherPossessor.form + '_chat'];
      options.push({
        text: incorrectForm,
        chat: incorrectFormChat,
        isCorrect: false,
        explanation: `Incorrect: "${incorrectForm}" (${incorrectFormChat}) is the form for "${otherPossessor.label} ${noun.eng}", not "${possessor.label} ${noun.eng}".`
      });
    });

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    return {
      type: 'possessive',
      question: `Which possessive form is correct for "${possessor.label} ${noun.eng}"?`,
      context: `The noun "${noun.ar}" (${noun.chat}) - ${noun.eng} needs the correct possessive suffix.`,
      options: shuffledOptions,
      noun: noun,
      possessor: possessor,
      correctAnswer: correctForm
    };
  }, [contentData]);

  const generateChallenge = useCallback(() => {
    switch (patternType) {
      case 'gender_agreement':
        return generateGenderAgreementChallenge();
      case 'conjugation':
        return generateConjugationChallenge();
      case 'possessive':
        return generatePossessiveChallenge();
      default:
        return generateGenderAgreementChallenge();
    }
  }, [patternType, generateGenderAgreementChallenge, generateConjugationChallenge, generatePossessiveChallenge]);

  const startGame = () => {
    setGameStarted(true);
    setScore({ correct: 0, total: 0 });
    setSelectedOption(null);
    setStatusMsg(null);
    setShowExplanation(false);
    generateNewChallenge();
  };

  const generateNewChallenge = () => {
    const challenge = generateChallenge();
    setCurrentChallenge(challenge);
    setSelectedOption(null);
    setShowExplanation(false);
    setStatusMsg(null);
  };

  const checkAnswer = (optionIndex) => {
    if (!currentChallenge) return;

    setSelectedOption(optionIndex);
    const selectedAnswer = currentChallenge.options[optionIndex];
    const newScore = { ...score, total: score.total + 1 };

    if (selectedAnswer.isCorrect) {
      newScore.correct = score.correct + 1;
      setScore(newScore);
      setStatusMsg('✅ Correct! Well done!');
      
      // Speak the correct answer
      if (selectedAnswer.text) {
        speakWord(selectedAnswer.text, selectedAnswer.chat);
      }
    } else {
      setScore(newScore);
      setStatusMsg('❌ Not quite right. Check the explanation below.');
    }

    setShowExplanation(true);

    // Auto-advance after delay
    setTimeout(() => {
      generateNewChallenge();
    }, 4000);
  };

  const getPatternTypeLabel = () => {
    switch (patternType) {
      case 'gender_agreement':
        return 'Gender Agreement';
      case 'conjugation':
        return 'Verb Conjugation';
      case 'possessive':
        return 'Possessive Forms';
      default:
        return 'Grammar Pattern';
    }
  };

  const getColorForText = (text) => {
    // Try to extract color from text for visual display
    const colorWords = Object.keys(COLOR_MAP);
    for (const colorWord of colorWords) {
      if (text.includes(colorWord)) {
        return COLOR_MAP[colorWord];
      }
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Grammar Pattern Game
        </h2>
        {gameStarted && (
          <div className="text-lg font-semibold">
            Score: {score.correct}/{score.total}
            {score.total > 0 && (
              <span className="text-sm text-gray-600 ml-2">
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {!gameStarted ? (
        /* Start Screen */
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">How to play:</h3>
            <div className="text-left space-y-2">
              <p>🎯 <strong>Grammar Focus:</strong> Practice Arabic grammar patterns</p>
              <p>🔍 <strong>Pattern Recognition:</strong> Identify correct grammatical forms</p>
              <p>📚 <strong>Multiple Choice:</strong> Choose the correct option from 4 choices</p>
              <p>💡 <strong>Explanations:</strong> Learn why each answer is correct or incorrect</p>
            </div>
          </div>

          {/* Pattern Type Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Choose Grammar Pattern:</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <button
                onClick={() => setPatternType('gender_agreement')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  patternType === 'gender_agreement' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Gender Agreement</div>
                <div className="text-sm text-gray-600">Colors matching noun gender</div>
              </button>
              <button
                onClick={() => setPatternType('conjugation')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  patternType === 'conjugation' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Verb Conjugation</div>
                <div className="text-sm text-gray-600">Correct verb forms</div>
              </button>
              <button
                onClick={() => setPatternType('possessive')}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  patternType === 'possessive' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Possessive Forms</div>
                <div className="text-sm text-gray-600">Possessive pronouns</div>
              </button>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xl font-semibold"
          >
            🎯 Start Grammar Practice
          </button>
        </div>
      ) : (
        /* Game Screen */
        currentChallenge && (
          <div className="space-y-6">
            {/* Pattern Type Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-700">
                Pattern: {getPatternTypeLabel()}
              </div>
            </div>

            {/* Question */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">{currentChallenge.question}</h3>
              <div className="text-gray-600 mb-4">
                {currentChallenge.context}
              </div>
            </div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {currentChallenge.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(index)}
                  disabled={selectedOption !== null}
                  className={`px-4 py-6 rounded-lg border-2 transition text-xl font-semibold ${
                    selectedOption === null
                      ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      : selectedOption === index
                      ? option.isCorrect 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                      : option.isCorrect && showExplanation
                      ? 'border-green-500 bg-green-100'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  style={{direction: 'rtl'}}
                >
                  <div className="mb-2">
                    {option.text}
                  </div>
                  {option.chat && (
                    <div className="text-sm text-gray-600 mb-2" style={{direction: 'ltr'}}>
                      ({option.chat})
                    </div>
                  )}
                  {getColorForText(option.text) && (
                    <div 
                      className="w-6 h-6 rounded-full mx-auto border-2 border-gray-400"
                      style={{backgroundColor: getColorForText(option.text)}}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Status and Explanation */}
            {statusMsg && (
              <div className="bg-white border rounded-lg p-4">
                <p className="text-lg font-bold mb-2">{statusMsg}</p>
                {showExplanation && selectedOption !== null && (
                  <div className="text-left space-y-2">
                    <div className="font-semibold">Explanation:</div>
                    <div className="text-gray-700">
                      {currentChallenge.options[selectedOption].explanation}
                    </div>
                    {!currentChallenge.options[selectedOption].isCorrect && (
                      <div className="text-green-700">
                        <strong>Correct answer:</strong> {currentChallenge.options.find(opt => opt.isCorrect).text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={generateNewChallenge}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ⏭️ Skip
              </button>
              
              <button
                onClick={() => {
                  setGameStarted(false);
                  setCurrentChallenge(null);
                  setSelectedOption(null);
                  setStatusMsg(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default GrammarPatternGame;