import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import logicData from '../logic.json';
import MediaDisplay from './MediaDisplay';
import { isAzureSpeechAvailable, startAzureSpeechRecognition } from './azureSpeechHelper';
import { getWellKnownVerbs } from './puzzleStats';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;

// Similarity threshold for pronunciation acceptance (0.5 = 50% similar)
const SIMILARITY_THRESHOLD = 0.5;

/**
 * Conjugation Game Component
 * Shows images for well-known verbs and requires pronunciation of all 8 conjugated forms
 */
const ConjugationGame = () => {
  const [currentVerb, setCurrentVerb] = useState(null);
  const [currentConjugationIndex, setCurrentConjugationIndex] = useState(0);
  const [wellKnownVerbs, setWellKnownVerbs] = useState([]);
  const [completedConjugations, setCompletedConjugations] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  /** Speech-synthesis helpers */
  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  // Conjugation forms in order
  const conjugationForms = [
    { pronoun: 'ana', pronounEng: 'I', key: 'base' },
    { pronoun: 'enta', pronounEng: 'you (m)', key: 'you_m' },
    { pronoun: 'entee', pronounEng: 'you (f)', key: 'you_f' },
    { pronoun: 'entoo', pronounEng: 'you (pl)', key: 'you_pl' },
    { pronoun: 'ne7an', pronounEng: 'we', key: 'we' },
    { pronoun: 'hu', pronounEng: 'he', key: 'he' },
    { pronoun: 'he', pronounEng: 'she', key: 'she' },
    { pronoun: 'hum', pronounEng: 'they', key: 'they' }
  ];

  /* -------------------- Initialize voices ------------------- */
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic'));
      setArabicVoice(arVoice || voices[0]);
    };
    speechSynthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      speechSynthRef.current.onvoiceschanged = null;
    };
  }, []);

  /* -------------------- Load well-known verbs ------------------- */
  useEffect(() => {
    const knownVerbs = getWellKnownVerbs(20); // Get top 20 well-known verbs
    console.log('[ConjugationGame] Well-known verbs from stats:', knownVerbs);
    
    // Filter for verbs that have full conjugations and exist in logic data
    const verbsWithConjugations = knownVerbs.filter(statVerb => {
      const logicVerb = logicData.items.find(item => 
        item.pos === 'verb' && 
        item.chat === statVerb.verbChat &&
        item.you_m && item.you_f && item.you_pl && item.we && item.he && item.she && item.they
      );
      return logicVerb !== undefined;
    }).map(statVerb => {
      // Return the full logic data for the verb
      return logicData.items.find(item => 
        item.pos === 'verb' && item.chat === statVerb.verbChat
      );
    });

    console.log('[ConjugationGame] Verbs with full conjugations:', verbsWithConjugations);
    setWellKnownVerbs(verbsWithConjugations);
    
    // Start with first verb if available
    if (verbsWithConjugations.length > 0) {
      setCurrentVerb(verbsWithConjugations[0]);
      setCurrentConjugationIndex(0);
      setCompletedConjugations({});
    }
  }, []);

  /** ----------------------------------
   * Helper: speakWord (re-uses sound files when possible)
   * --------------------------------*/
  const speakWord = useCallback((text, chatOverride) => {
    if (!text) return;

    if (PLAY_AUDIO_FILES) {
      // Try to find audio file for this specific conjugation
      const chat = chatOverride || text;
      const audio = new Audio(`./sounds/${encodeURIComponent(chat)}.wav`);
      audio.play().catch(() => {
        // fallback to TTS
        speechSynthRef.current.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        if (arabicVoice) utt.voice = arabicVoice;
        utt.lang = 'ar-SA';
        utt.rate = 0.8;
        speechSynthRef.current.speak(utt);
      });
      return;
    }

    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    speechSynthRef.current.speak(utterance);
  }, [arabicVoice]);

  /** ----------------------------------
   * Get current conjugation info
   * --------------------------------*/
  const getCurrentConjugation = () => {
    if (!currentVerb) return null;
    
    const form = conjugationForms[currentConjugationIndex];
    let arabicText, chatText;
    
    if (form.key === 'base') {
      arabicText = currentVerb.ar;
      chatText = currentVerb.chat;
    } else {
      arabicText = currentVerb[form.key];
      chatText = currentVerb[`${form.key}_chat`];
    }
    
    return {
      ...form,
      arabicText,
      chatText,
      expectedPhrase: `${form.pronoun} ${chatText}`,
      expectedArabic: `${getPronounArabic(form.pronoun)} ${arabicText}`
    };
  };

  const getPronounArabic = (pronounChat) => {
    const pronounMap = {
      'ana': 'أنا',
      'enta': 'إنت', 
      'entee': 'إنتي',
      'entoo': 'إنتوا',
      'ne7an': 'نحن',
      'hu': 'هو',
      'he': 'هي',
      'hum': 'هم'
    };
    return pronounMap[pronounChat] || pronounChat;
  };

  /** ----------------------------------
   * Start speech recognition
   * --------------------------------*/
  const startRecognition = useCallback(() => {
    const currentConjugation = getCurrentConjugation();
    if (!currentConjugation) return;

    console.log(`[ConjugationGame] Expecting: "${currentConjugation.expectedPhrase}"`);
    
    // Check if Azure Speech is available and enabled
    const useAzureSpeech = isAzureSpeechAvailable();
    
    if (useAzureSpeech) {
      startAzureRecognition(currentConjugation);
    } else {
      startWebKitRecognition(currentConjugation);
    }
  }, [currentVerb, currentConjugationIndex]);

  /** ----------------------------------
   * Process recognition result (shared by both Azure and WebKit)
   * --------------------------------*/
  const processRecognitionResult = useCallback((recognizedText, expectedConjugation) => {
    console.log(`[ConjugationGame] Heard: "${recognizedText}", Expected: "${expectedConjugation.expectedPhrase}"`);
    
    // Create a mock object for pronunciation checking
    const mockVerb = {
      ar: expectedConjugation.expectedArabic,
      chat: expectedConjugation.expectedPhrase,
      eng: `${expectedConjugation.pronounEng} ${currentVerb.eng}`
    };
    
    const pronunciationResult = checkPronunciation(recognizedText, mockVerb, [], SIMILARITY_THRESHOLD);
    
    console.log('[ConjugationGame] Pronunciation result:', pronunciationResult);
    
    if (pronunciationResult.isCorrect || pronunciationResult.matchType === 'partial') {
      // Mark this conjugation as completed
      const verbKey = `${currentVerb.id}-${currentConjugationIndex}`;
      setCompletedConjugations(prev => ({ ...prev, [verbKey]: true }));
      
      // Provide feedback
      if (pronunciationResult.matchType === 'exact') {
        setStatusMsg('✅ Perfect!');
      } else if (pronunciationResult.matchType === 'similarity') {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`✅ Good enough! (${percentage}% similar)`);
      } else {
        setStatusMsg('✅ Good job!');
      }
      
      // Play the correct pronunciation
      speakWord(expectedConjugation.expectedArabic);
      
      // Move to next conjugation after a delay
      setTimeout(() => {
        moveToNextConjugation();
      }, 2000);
      
    } else {
      // Show similarity feedback for incorrect answers
      if (pronunciationResult.similarity && pronunciationResult.similarity > 0.2) {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`❌ Close (${percentage}% similar) - try again`);
      } else {
        setStatusMsg('❌ Try again');
      }
      
      // Play the correct pronunciation
      speakWord(expectedConjugation.expectedArabic);
    }
  }, [currentVerb, currentConjugationIndex]);

  /** ----------------------------------
   * Azure Speech Recognition
   * --------------------------------*/
  const startAzureRecognition = useCallback(async (expectedConjugation) => {
    setIsRecording(true);
    
    try {
      const result = await startAzureSpeechRecognition();
      
      if (result.success && result.text) {
        processRecognitionResult(result.text, expectedConjugation);
      } else {
        console.log('[Azure Speech] Recognition failed:', result.error);
        if (result.error === 'No Arabic speech detected') {
          setStatusMsg('❌ Please speak in Arabic. Try again.');
        } else {
          setStatusMsg('❌ No speech detected. Try again.');
        }
      }
    } catch (error) {
      console.error('[Azure Speech] Recognition failed:', error);
      setStatusMsg('❌ Speech recognition failed. Try again.');
    } finally {
      setIsRecording(false);
    }
  }, []);

  /** ----------------------------------
   * WebKit Speech Recognition (fallback)
   * --------------------------------*/
  const startWebKitRecognition = useCallback((expectedConjugation) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    // Stop previous instance if any
    if (recognition) {
      recognition.stop();
    }

    const rec = new window.webkitSpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'ar-SA';

    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);

    rec.onerror = (e) => {
      console.error('WebKit Speech recognition error', e);
      setIsRecording(false);
    };

    rec.onresult = (event) => {
      const res = event.results[0][0].transcript.trim();
      console.log('[WebKit Speech] Heard:', res);
      processRecognitionResult(res, expectedConjugation);
    };

    setRecognition(rec);
    try {
      rec.start();
    } catch (e) {
      console.error('Unable to start recognition', e);
    }
  }, [recognition]);

  /** ----------------------------------
   * Navigation functions
   * --------------------------------*/
  const moveToNextConjugation = () => {
    if (currentConjugationIndex < conjugationForms.length - 1) {
      // Move to next conjugation of same verb
      setCurrentConjugationIndex(prev => prev + 1);
      setStatusMsg(null);
    } else {
      // All conjugations completed for this verb
      setStatusMsg('🎉 All conjugations completed! Choose next verb.');
    }
  };

  const selectNextVerb = () => {
    if (wellKnownVerbs.length === 0) return;
    
    const currentIndex = wellKnownVerbs.findIndex(v => v.id === currentVerb?.id);
    const nextIndex = (currentIndex + 1) % wellKnownVerbs.length;
    
    setCurrentVerb(wellKnownVerbs[nextIndex]);
    setCurrentConjugationIndex(0);
    setCompletedConjugations({});
    setStatusMsg(null);
  };

  const skipCurrentConjugation = () => {
    moveToNextConjugation();
  };

  const playCurrentPronunciation = () => {
    const currentConjugation = getCurrentConjugation();
    if (currentConjugation) {
      speakWord(currentConjugation.expectedArabic);
    }
  };

  const restartCurrentVerb = () => {
    setCurrentConjugationIndex(0);
    setCompletedConjugations({});
    setStatusMsg(null);
  };

  // Get current conjugation info
  const currentConjugation = getCurrentConjugation();
  const isCompleted = currentConjugationIndex >= conjugationForms.length;
  const verbKey = currentVerb ? `${currentVerb.id}-${currentConjugationIndex}` : null;
  const isCurrentCompleted = verbKey && completedConjugations[verbKey];

  if (wellKnownVerbs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center font-sans">
        <h2 className="text-2xl font-bold mb-4">Conjugation Practice</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-lg text-yellow-800">
            📚 No well-known verbs found for conjugation practice!
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Please practice with the Puzzle Game first to build up your verb knowledge, 
            then return here to practice conjugations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 text-center font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Conjugation Practice
        </h2>
        <div className="flex gap-2">
          <button
            onClick={restartCurrentVerb}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm"
          >
            🔄 Restart Verb
          </button>
          <button
            onClick={selectNextVerb}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
          >
            ⏭️ Next Verb
          </button>
        </div>
      </div>

      {/* Current Verb Display */}
      {currentVerb && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Verb Image */}
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <MediaDisplay
                item={currentVerb}
                contentType="verbs"
                className="w-full h-full object-cover"
                autoPlay={false}
                loop={true}
                muted={true}
                enableHoverPlay={true}
              />
            </div>
          </div>

          {/* Current Conjugation Info */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">
                {currentVerb.eng} - Conjugation {currentConjugationIndex + 1}/8
              </h3>
              
              {!isCompleted && currentConjugation && (
                <div className="space-y-3">
                  <div className="text-xl">
                    <div className="text-gray-600">Say:</div>
                    <div className="font-bold text-blue-600 text-2xl">
                      {currentConjugation.expectedArabic}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({currentConjugation.expectedPhrase})
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={startRecognition}
                      disabled={isRecording}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        isRecording 
                          ? 'bg-red-500 text-white cursor-not-allowed' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isRecording ? '🎤 Listening...' : '🎤 Start Speaking'}
                    </button>
                    
                    <button
                      onClick={playCurrentPronunciation}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      🔊 Play
                    </button>
                    
                    <button
                      onClick={skipCurrentConjugation}
                      className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
                    >
                      ⏭️ Skip
                    </button>
                  </div>
                </div>
              )}
              
              {isCompleted && (
                <div className="text-center space-y-4">
                  <div className="text-xl font-bold text-green-600">
                    🎉 All conjugations completed!
                  </div>
                  <button
                    onClick={selectNextVerb}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Practice Next Verb
                  </button>
                </div>
              )}
            </div>

            {/* Status Message */}
            {statusMsg && (
              <div className="bg-white border rounded-lg p-3">
                <p className="text-lg font-bold">{statusMsg}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {currentVerb && !isCompleted && (
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-3">Conjugation Progress</h4>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {conjugationForms.map((form, index) => {
              const verbKey = `${currentVerb.id}-${index}`;
              const isCompleted = completedConjugations[verbKey];
              const isCurrent = index === currentConjugationIndex;
              
              return (
                <div
                  key={index}
                  className={`p-2 rounded text-center text-xs border ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{form.pronoun}</div>
                  <div className="text-gray-600">{form.pronounEng}</div>
                  {isCompleted && <div className="text-green-600">✓</div>}
                  {isCurrent && <div className="text-blue-600">👁️</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verb Selection */}
      {wellKnownVerbs.length > 1 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Available Well-Known Verbs ({wellKnownVerbs.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {wellKnownVerbs.map((verb) => (
              <button
                key={verb.id}
                onClick={() => {
                  setCurrentVerb(verb);
                  setCurrentConjugationIndex(0);
                  setCompletedConjugations({});
                  setStatusMsg(null);
                }}
                className={`p-2 rounded text-sm border transition ${
                  currentVerb?.id === verb.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{verb.eng}</div>
                <div className="text-xs text-gray-500">{verb.chat}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConjugationGame;