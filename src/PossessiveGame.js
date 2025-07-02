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
 * Possessive Game Component
 * Shows images for well-known nouns and requires pronunciation of all 8 possessive forms
 */
const PossessiveGame = () => {
  const [currentNoun, setCurrentNoun] = useState(null);
  const [currentPossessiveIndex, setCurrentPossessiveIndex] = useState(0);
  const [wellKnownNouns, setWellKnownNouns] = useState([]);
  const [completedPossessives, setCompletedPossessives] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(false); // Auto mode for all 8 forms
  const [autoModeResults, setAutoModeResults] = useState([]); // Track results in auto mode

  /** Speech-synthesis helpers */
  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);
  const startRecognitionRef = useRef(null);

  // Possessive forms in order
  const possessiveForms = [
    { pronoun: 'base', pronounEng: 'the', key: 'base' },
    { pronoun: 'my', pronounEng: 'my', key: 'my' },
    { pronoun: 'your (m)', pronounEng: 'your (m)', key: 'your_m' },
    { pronoun: 'your (f)', pronounEng: 'your (f)', key: 'your_f' },
    { pronoun: 'your (pl)', pronounEng: 'your (pl)', key: 'your_pl' },
    { pronoun: 'our', pronounEng: 'our', key: 'our' },
    { pronoun: 'his', pronounEng: 'his', key: 'his' },
    { pronoun: 'her', pronounEng: 'her', key: 'her' },
    { pronoun: 'their', pronounEng: 'their', key: 'their' }
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

  /* -------------------- Load well-known nouns ------------------- */
  useEffect(() => {
    // Get all nouns that have possessive forms
    const allNouns = logicData.items.filter(item => 
      item.pos === 'noun' && 
      item.my && item.your_m && item.your_f && item.your_pl && 
      item.our && item.his && item.her && item.their
    );
    
    console.log('[PossessiveGame] Found nouns with possessives:', allNouns);
    
    // Filter out alternate nouns - only keep nouns that don't have an 'alternate' field pointing TO them
    const alternateNounIds = new Set();
    allNouns.forEach(noun => {
      if (noun.alternate) {
        alternateNounIds.add(noun.alternate);
      }
    });
    
    const nounsWithPossessives = allNouns.filter(noun => 
      !alternateNounIds.has(noun.id)
    );

    console.log('[PossessiveGame] Nouns with full possessives (no alternates):', nounsWithPossessives);
    setWellKnownNouns(nounsWithPossessives);
    
    // Start with first noun if available
    if (nounsWithPossessives.length > 0) {
      setCurrentNoun(nounsWithPossessives[0]);
      setCurrentPossessiveIndex(0);
      setCompletedPossessives({});
    }
  }, []);

  /** ----------------------------------
   * Helper: speakWord (re-uses sound files when possible)
   * --------------------------------*/
  const speakWord = useCallback((text, chatOverride) => {
    if (!text) return;

    if (PLAY_AUDIO_FILES) {
      // Try to find audio file for this specific possessive
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
   * Get current possessive info
   * --------------------------------*/
  const getCurrentPossessive = () => {
    if (!currentNoun) return null;
    
    const form = possessiveForms[currentPossessiveIndex];
    let arabicText, chatText;
    
    if (form.key === 'base') {
      arabicText = currentNoun.ar;
      chatText = currentNoun.chat;
    } else {
      arabicText = currentNoun[form.key];
      chatText = currentNoun[`${form.key}_chat`];
    }
    
    return {
      ...form,
      arabicText,
      chatText,
      expectedPhrase: chatText,
      expectedArabic: arabicText
    };
  };

  /** ----------------------------------
   * Start speech recognition
   * --------------------------------*/
  const startRecognition = useCallback(() => {
    const currentPossessive = getCurrentPossessive();
    if (!currentPossessive) {
      console.error('[PossessiveGame] No current possessive available');
      return;
    }

    console.log(`[PossessiveGame] Starting recognition for possessive ${currentPossessiveIndex + 1}/9`);
    console.log(`[PossessiveGame] Expecting Arabic: "${currentPossessive.expectedArabic}" (${currentPossessive.expectedPhrase})`);
    console.log(`[PossessiveGame] Auto mode: ${isAutoMode}`);
    
    // Check if Azure Speech is available and enabled
    const useAzureSpeech = isAzureSpeechAvailable();
    
    if (useAzureSpeech) {
      startAzureRecognition(currentPossessive);
    } else {
      startWebKitRecognition(currentPossessive);
    }
  }, [currentNoun, currentPossessiveIndex, isAutoMode]);
  
  // Update the ref whenever startRecognition changes
  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  /** ----------------------------------
   * Process recognition result (shared by both Azure and WebKit)
   * --------------------------------*/
  const processRecognitionResult = useCallback((recognizedText, expectedPossessive) => {
    if (!currentNoun) {
      console.error('[PossessiveGame] No current noun set');
      return;
    }
    
    console.log(`[PossessiveGame] Heard: "${recognizedText}", Expected Arabic: "${expectedPossessive.expectedArabic}" (${expectedPossessive.expectedPhrase})`);
    
    // Create a mock object for pronunciation checking
    const mockNoun = {
      ar: expectedPossessive.expectedArabic,
      chat: expectedPossessive.expectedPhrase,
      eng: `${expectedPossessive.pronounEng} ${currentNoun.eng}`
    };
    
    // Check pronunciation
    const pronunciationResult = checkPronunciation(recognizedText, mockNoun, [], SIMILARITY_THRESHOLD);
    
    console.log('[PossessiveGame] Pronunciation result:', pronunciationResult);
    console.log('[PossessiveGame] Comparison details:', {
      heard: recognizedText,
      expectedArabic: expectedPossessive.expectedArabic,
      expectedChat: expectedPossessive.expectedPhrase
    });
    
    if (pronunciationResult.isCorrect || pronunciationResult.matchType === 'partial') {
      // Mark this possessive as completed
      const nounKey = `${currentNoun.id}-${currentPossessiveIndex}`;
      setCompletedPossessives(prev => ({ ...prev, [nounKey]: true }));
      
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
      speakWord(expectedPossessive.expectedArabic, expectedPossessive.expectedPhrase);
      
      if (isAutoMode) {
        // In auto mode, record result and move to next automatically
        setAutoModeResults(prev => [...prev, {
          possessiveIndex: currentPossessiveIndex,
          success: true,
          similarity: pronunciationResult.similarity || 1,
          matchType: pronunciationResult.matchType
        }]);
        
        // Move to next possessive after pronunciation
        setTimeout(() => {
          if (currentPossessiveIndex < possessiveForms.length - 1) {
            setCurrentPossessiveIndex(prev => {
              const newIndex = prev + 1;
              console.log(`[PossessiveGame] Auto mode: moving from possessive ${prev + 1} to ${newIndex + 1}`);
              
              // Start next recognition after state updates
              setTimeout(() => {
                console.log(`[PossessiveGame] Auto mode: starting recognition for possessive ${newIndex + 1}`);
                if (startRecognitionRef.current) {
                  startRecognitionRef.current();
                } else {
                  console.error('[PossessiveGame] startRecognitionRef.current is null!');
                }
              }, 1000);
              
              return newIndex;
            });
            setStatusMsg(null);
          } else {
            setTimeout(() => {
              setAutoModeResults(prev => {
                const allResults = [...prev, {
                  possessiveIndex: currentPossessiveIndex,
                  success: true,
                  similarity: pronunciationResult.similarity || 1,
                  matchType: pronunciationResult.matchType
                }];
                
                const successCount = allResults.filter(r => r.success).length;
                const totalCount = allResults.length;
                const averageScore = totalCount > 0 
                  ? (allResults.reduce((sum, r) => sum + r.similarity, 0) / totalCount * 100).toFixed(1)
                  : 0;
                
                setIsAutoMode(false);
                setStatusMsg(`🎯 Auto mode complete! Score: ${successCount}/${totalCount} (${averageScore}% avg similarity)`);
                
                return allResults;
              });
            }, 100);
          }
        }, 2000);
      } else {
        // Normal mode - move to next after delay
        setTimeout(() => {
          if (currentPossessiveIndex < possessiveForms.length - 1) {
            setCurrentPossessiveIndex(prev => prev + 1);
            setStatusMsg(null);
          } else {
            setStatusMsg('🎉 All possessives completed! Choose next noun.');
          }
        }, 2000);
      }
      
    } else {
      // Show similarity feedback for incorrect answers
      if (pronunciationResult.similarity && pronunciationResult.similarity > 0.2) {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`❌ Close (${percentage}% similar) - try again`);
      } else {
        setStatusMsg('❌ Try again');
      }
      
      // Play the correct pronunciation
      speakWord(expectedPossessive.expectedArabic, expectedPossessive.expectedPhrase);
      
      if (isAutoMode) {
        // In auto mode, record failed result but continue
        setAutoModeResults(prev => [...prev, {
          possessiveIndex: currentPossessiveIndex,
          success: false,
          similarity: pronunciationResult.similarity || 0,
          matchType: 'failed'
        }]);
        
        // Wait for pronunciation to finish, then continue to next
        setTimeout(() => {
          if (currentPossessiveIndex < possessiveForms.length - 1) {
            setCurrentPossessiveIndex(prev => {
              const newIndex = prev + 1;
              console.log(`[PossessiveGame] Auto mode (failed): moving from possessive ${prev + 1} to ${newIndex + 1}`);
              
              // Start next recognition after state updates
              setTimeout(() => {
                console.log(`[PossessiveGame] Auto mode (failed): starting recognition for possessive ${newIndex + 1}`);
                if (startRecognitionRef.current) {
                  startRecognitionRef.current();
                } else {
                  console.error('[PossessiveGame] startRecognitionRef.current is null!');
                }
              }, 1000);
              
              return newIndex;
            });
            setStatusMsg(null);
          } else {
            setTimeout(() => {
              setAutoModeResults(prev => {
                const allResults = [...prev, {
                  possessiveIndex: currentPossessiveIndex,
                  success: false,
                  similarity: pronunciationResult.similarity || 0,
                  matchType: 'failed'
                }];
                
                const successCount = allResults.filter(r => r.success).length;
                const totalCount = allResults.length;
                const averageScore = totalCount > 0 
                  ? (allResults.reduce((sum, r) => sum + r.similarity, 0) / totalCount * 100).toFixed(1)
                  : 0;
                
                setIsAutoMode(false);
                setStatusMsg(`🎯 Auto mode complete! Score: ${successCount}/${totalCount} (${averageScore}% avg similarity)`);
                
                return allResults;
              });
            }, 100);
          }
        }, 2500);
      }
    }
  }, [currentNoun, currentPossessiveIndex, isAutoMode, autoModeResults]);

  /** ----------------------------------
   * Azure Speech Recognition
   * --------------------------------*/
  const startAzureRecognition = useCallback(async (expectedPossessive) => {
    if (!currentNoun) {
      console.error('[PossessiveGame] No current noun for Azure recognition');
      return;
    }
    
    setIsRecording(true);
    
    try {
      const result = await startAzureSpeechRecognition();
      
      if (result.success && result.text) {
        processRecognitionResult(result.text, expectedPossessive);
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
  }, [currentNoun, processRecognitionResult]);

  /** ----------------------------------
   * WebKit Speech Recognition (fallback)
   * --------------------------------*/
  const startWebKitRecognition = useCallback((expectedPossessive) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    
    if (!currentNoun) {
      console.error('[PossessiveGame] No current noun for WebKit recognition');
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
      processRecognitionResult(res, expectedPossessive);
    };

    setRecognition(rec);
    try {
      rec.start();
    } catch (e) {
      console.error('Unable to start recognition', e);
    }
  }, [recognition, currentNoun, processRecognitionResult]);

  /** ----------------------------------
   * Navigation functions
   * --------------------------------*/
  const selectNextNoun = () => {
    if (wellKnownNouns.length === 0) return;
    
    const currentIndex = wellKnownNouns.findIndex(v => v.id === currentNoun?.id);
    const nextIndex = (currentIndex + 1) % wellKnownNouns.length;
    
    setCurrentNoun(wellKnownNouns[nextIndex]);
    setCurrentPossessiveIndex(0);
    setCompletedPossessives({});
    setStatusMsg(null);
  };

  const skipCurrentPossessive = () => {
    if (currentPossessiveIndex < possessiveForms.length - 1) {
      setCurrentPossessiveIndex(prev => prev + 1);
      setStatusMsg(null);
    } else {
      setStatusMsg('🎉 All possessives completed! Choose next noun.');
    }
  };

  const playCurrentPronunciation = () => {
    const currentPossessive = getCurrentPossessive();
    if (currentPossessive) {
      speakWord(currentPossessive.expectedArabic, currentPossessive.expectedPhrase);
    }
  };

  const restartCurrentNoun = () => {
    setCurrentPossessiveIndex(0);
    setCompletedPossessives({});
    setStatusMsg(null);
    setIsAutoMode(false);
    setAutoModeResults([]);
  };
  
  const startAutoMode = () => {
    if (!currentNoun) return;
    
    console.log('[PossessiveGame] Starting auto mode...');
    
    // Reset everything for auto mode
    setCurrentPossessiveIndex(0);
    setCompletedPossessives({});
    setAutoModeResults([]);
    setIsAutoMode(true);
    setStatusMsg('🚀 Auto mode started! Speak each possessive when prompted.');
    
    // Start with first possessive after a brief delay
    setTimeout(() => {
      console.log('[PossessiveGame] Auto mode: triggering first recognition');
      if (startRecognitionRef.current) {
        startRecognitionRef.current();
      } else {
        console.error('[PossessiveGame] startRecognitionRef.current is null in startAutoMode!');
      }
    }, 1500);
  };

  // Get current possessive info
  const currentPossessive = getCurrentPossessive();
  const isCompleted = currentPossessiveIndex >= possessiveForms.length;
  const nounKey = currentNoun ? `${currentNoun.id}-${currentPossessiveIndex}` : null;
  const isCurrentCompleted = nounKey && completedPossessives[nounKey];

  if (wellKnownNouns.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center font-sans">
        <h2 className="text-2xl font-bold mb-4">Possessive Practice</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-lg text-yellow-800">
            📚 No nouns with possessive forms found!
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Please make sure nouns in logic.json have possessive fields (my, your_m, your_f, etc.)
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
          Possessive Practice
        </h2>
        <div className="flex gap-2">
          <button
            onClick={restartCurrentNoun}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm"
          >
            🔄 Restart Noun
          </button>
          <button
            onClick={selectNextNoun}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
          >
            ⏭️ Next Noun
          </button>
        </div>
      </div>

      {/* Current Noun Display */}
      {currentNoun && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Noun Image */}
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <MediaDisplay
                item={currentNoun}
                contentType="verbs"
                className="w-full h-full object-cover"
                autoPlay={false}
                loop={true}
                muted={true}
                enableHoverPlay={true}
              />
            </div>
          </div>

          {/* Current Possessive Info */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">
                {currentNoun.eng} - Possessive {currentPossessiveIndex + 1}/9
              </h3>
              
              {!isCompleted && currentPossessive && (
                <div className="space-y-3">
                  <div className="text-xl">
                    <div className="text-gray-600">Say:</div>
                    <div className="font-bold text-blue-600 text-2xl">
                      {currentPossessive.expectedArabic}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({currentPossessive.expectedPhrase}) - {currentPossessive.pronounEng}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-center flex-wrap">
                    {!isAutoMode ? (
                      <>
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
                          onClick={startAutoMode}
                          disabled={isRecording}
                          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition font-semibold"
                        >
                          🚀 Speak'em All
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded font-semibold">
                        {isRecording ? '🎤 Auto Mode - Listening...' : `🚀 Auto Mode - Possessive ${currentPossessiveIndex + 1}/9`}
                      </div>
                    )}
                    
                    {!isAutoMode && (
                      <>
                        <button
                          onClick={playCurrentPronunciation}
                          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          🔊 Play
                        </button>
                        
                        <button
                          onClick={skipCurrentPossessive}
                          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
                        >
                          ⏭️ Skip
                        </button>
                      </>
                    )}
                    
                    {isAutoMode && (
                      <button
                        onClick={() => {
                          setIsAutoMode(false);
                          setStatusMsg('Auto mode cancelled.');
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                      >
                        ❌ Stop Auto
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {isCompleted && (
                <div className="text-center space-y-4">
                  <div className="text-xl font-bold text-green-600">
                    🎉 All possessives completed!
                  </div>
                  <button
                    onClick={selectNextNoun}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Practice Next Noun
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
      {currentNoun && !isCompleted && (
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-3">Possessive Progress</h4>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
            {possessiveForms.map((form, index) => {
              const nounKey = `${currentNoun.id}-${index}`;
              const isCompleted = completedPossessives[nounKey];
              const isCurrent = index === currentPossessiveIndex;
              
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

      {/* Noun Selection */}
      {wellKnownNouns.length > 1 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Available Nouns ({wellKnownNouns.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {wellKnownNouns.map((noun) => (
              <button
                key={noun.id}
                onClick={() => {
                  setCurrentNoun(noun);
                  setCurrentPossessiveIndex(0);
                  setCompletedPossessives({});
                  setStatusMsg(null);
                }}
                className={`p-2 rounded text-sm border transition ${
                  currentNoun?.id === noun.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{noun.eng}</div>
                <div className="text-xs text-gray-500">{noun.chat}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PossessiveGame;