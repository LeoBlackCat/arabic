import React, { useState, useEffect, useRef, useCallback } from 'react';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;

// Toggle: if true, show all available verbs in a large grid; if false, show 3x3 grid
// Change this to false to return to 3x3 mode
const SHOW_ALL_VERBS = false;

// Similarity threshold for pronunciation acceptance (0.5 = 50% similar)
// Lower values are more lenient, higher values are stricter
const SIMILARITY_THRESHOLD = 0.5;

import { verbs, getShuffledVerbs } from './verbs-data';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import logicData from '../logic.json';
import MediaDisplay from './MediaDisplay';
import { isAzureSpeechAvailable, startAzureSpeechRecognition } from './azureSpeechHelper';

/**
 * Mini Game 3 – 3×3 Picture/Color Puzzle + Speech
 * -------------------------------------------------
 * 1. Nine random items are shown in a 3×3 grid.
 * 2. The user taps an item → the tile is highlighted & the correct Arabic is pronounced.
 * 3. Speech-recognition starts automatically. If the user pronounces correctly
 *    (exact or partial match) the tile disappears. Otherwise it stays.
 * 4. When all tiles are removed the round ends & the user can play again.
 */
const PuzzleGame = ({ contentData = [], contentType = 'verbs', colorMap = {} }) => {
  /** ----------------------------------
   * State
   * --------------------------------*/
  const [tiles, setTiles] = useState([]); // {verb, removed:bool}
  const [activeIdx, setActiveIdx] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  /** Speech-synthesis helpers */
  const speechSynthRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  /* -------------------- initialise voices ------------------- */
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

  /** ----------------------------------
   * Helper: speakWord (re-uses sound files when possible)
   * --------------------------------*/
  // Lazy cached Arabic→chat map for wav filenames
  let arToChat = null;
  const buildMap = () => {
    if (arToChat) return arToChat;
    try {
      const logic = require('../logic.json');
      arToChat = {};
      [...logic.items, ...(logic.numerals || [])].forEach(it => {
        if (it.ar && it.chat) arToChat[it.ar] = it.chat;
      });
    } catch (e) {
      arToChat = {};
    }
    return arToChat;
  };

  const speakWord = useCallback((text, chatOverride) => {
    if (!text) return;

    if (PLAY_AUDIO_FILES) {
      const map = buildMap();
      const chat = chatOverride || map[text] || text;
      const audio = new Audio('.' + `/sounds/${encodeURIComponent(chat)}.wav`);
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
   * Initialise first round (configurable grid size)
   * --------------------------------*/
  const initRound = useCallback(() => {
    let source;
    
    // Always filter out alternates, whether using contentData or logic.json
    const allVerbs = (contentData && contentData.length > 0) ? 
      contentData : 
      logicData.items.filter(item => item.pos === 'verb');
    
    // Filter out alternate verbs - only keep verbs that don't have an 'alternate' field pointing TO them
    // In other words, if verb A has alternate: B, then we show A but not B
    const alternateVerbIds = new Set();
    
    allVerbs.forEach(verb => {
      if (verb.alternate) {
        // This verb points to an alternate, so mark the alternate for removal
        alternateVerbIds.add(verb.alternate);
      }
    });
    
    // Show: only verbs that are not alternates
    source = allVerbs.filter(verb => 
      !alternateVerbIds.has(verb.id) // Don't show alternate verbs
    );
    
    console.log(`[PuzzleGame] Filtered ${allVerbs.length} verbs to ${source.length} (removed ${alternateVerbIds.size} alternates)`);
    console.log('[PuzzleGame] Alternate verb IDs removed:', Array.from(alternateVerbIds));
    
    let selectedItems;
    if (SHOW_ALL_VERBS) {
      // Show all available verbs/items (excluding alternates)
      selectedItems = source;
    } else {
      // Traditional 3x3 grid with 9 random items
      selectedItems = source.sort(() => Math.random() - 0.5).slice(0, 9);
    }
    
    setTiles(selectedItems.map(v => ({ verb: v, removed: false })));
    setActiveIdx(null);
    setStatusMsg(null);
  }, [contentData]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  /** ----------------------------------
   * Helper: start speech-recognition for active tile
   * --------------------------------*/
  const startRecognition = useCallback((expectedVerb, pronunciationVerb = null) => {
    // Don't pronounce - just start listening
    const verbToPronounce = pronunciationVerb || expectedVerb;
    
    // Check if Azure Speech is available and enabled
    const useAzureSpeech = isAzureSpeechAvailable();
    
    if (useAzureSpeech) {
      startAzureRecognition(expectedVerb, verbToPronounce);
    } else {
      startWebKitRecognition(expectedVerb, verbToPronounce);
    }
  }, [recognition]);

  /** ----------------------------------
   * Process recognition result (shared by both Azure and WebKit)
   * --------------------------------*/
  const processRecognitionResult = useCallback((recognizedText, expectedVerb, verbToPronounce) => {
    // Find the current item in logic data to check for alternates
    const currentLogicItem = logicData.items.find(item => 
      item.ar === expectedVerb.ar && item.chat === expectedVerb.chat
    );
    
    // Use the new pronunciation checking function with configurable similarity threshold
    const pronunciationResult = checkPronunciation(recognizedText, currentLogicItem || expectedVerb, logicData.items, SIMILARITY_THRESHOLD);
    
    console.log('[PuzzleGame] Pronunciation result:', pronunciationResult);
    
    if (pronunciationResult.isCorrect || pronunciationResult.matchType === 'partial') {
      // Mark tile removed
      setTiles(prev => prev.map(t => t.verb === expectedVerb ? { ...t, removed: true } : t));
      
      // Provide feedback based on match type
      if (pronunciationResult.matchType === 'exact') {
        setStatusMsg('✅ Perfect!');
      } else if (pronunciationResult.matchType === 'alternate') {
        setStatusMsg('✅ Good job! (Alternate pronunciation)');
      } else if (pronunciationResult.matchType === 'similarity') {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`✅ Good enough! (${percentage}% similar)`);
      } else {
        setStatusMsg('✅ Good job!');
      }
      
      // For verbs with alternates, pronounce both versions
      const allVerbs = logicData.items.filter(item => item.pos === 'verb');
      const baseVerb = expectedVerb;
      const alternateVerb = baseVerb.alternate ? 
        allVerbs.find(verb => verb.id === baseVerb.alternate) : 
        null;
      
      if (alternateVerb) {
        // Pronounce both: base first, then alternate after a delay
        speakWord(baseVerb.ar, baseVerb.chat);
        setTimeout(() => {
          speakWord(alternateVerb.ar, alternateVerb.chat);
        }, 1500); // 1.5 second delay between pronunciations
      } else {
        // Single pronunciation for verbs without alternates
        speakWord(baseVerb.ar, baseVerb.chat);
      }
    } else {
      // Show similarity feedback even for incorrect answers
      if (pronunciationResult.similarity && pronunciationResult.similarity > 0.2) {
        const percentage = Math.round(pronunciationResult.similarity * 100);
        setStatusMsg(`❌ Close (${percentage}% similar) - try again`);
      } else {
        setStatusMsg('❌ Try again');
      }
      
      // For incorrect answers, also pronounce both if alternate exists
      const allVerbs = logicData.items.filter(item => item.pos === 'verb');
      const baseVerb = expectedVerb;
      const alternateVerb = baseVerb.alternate ? 
        allVerbs.find(verb => verb.id === baseVerb.alternate) : 
        null;
      
      if (alternateVerb) {
        speakWord(baseVerb.ar, baseVerb.chat);
        setTimeout(() => {
          speakWord(alternateVerb.ar, alternateVerb.chat);
        }, 1500);
      } else {
        speakWord(baseVerb.ar, baseVerb.chat);
      }
    }
  }, []);

  /** ----------------------------------
   * Azure Speech Recognition
   * --------------------------------*/
  const startAzureRecognition = useCallback(async (expectedVerb, verbToPronounce) => {
    setIsRecording(true);
    
    try {
      const result = await startAzureSpeechRecognition();
      
      if (result.success && result.text) {
        processRecognitionResult(result.text, expectedVerb, verbToPronounce);
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
      setTimeout(() => setActiveIdx(null), 500);
    }
  }, []);

  /** ----------------------------------
   * WebKit Speech Recognition (fallback)
   * --------------------------------*/
  const startWebKitRecognition = useCallback((expectedVerb, verbToPronounce) => {
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
    rec.onend   = () => setIsRecording(false);

    rec.onerror = (e) => {
      console.error('WebKit Speech recognition error', e);
      setIsRecording(false);
    };

    rec.onresult = (event) => {
      const res = event.results[0][0].transcript.trim();
      console.log('[WebKit Speech] Heard:', res);
      processRecognitionResult(res, expectedVerb, verbToPronounce);
      
      // Clean up state after answer
      setTimeout(() => {
        setIsRecording(false);
        setActiveIdx(null);
      }, 500);
    };

    setRecognition(rec);
    try {
      rec.start();
    } catch (e) {
      console.error('Unable to start recognition', e);
    }
  }, [recognition]);

  /** ----------------------------------
   * Effect: when all removed show restart
   * --------------------------------*/
  const allGone = tiles.length && tiles.every(t => t.removed);

  /** ----------------------------------
   * Event-handlers
   * --------------------------------*/
  const handleTileClick = (idx) => {
    const tile = tiles[idx];
    if (!tile || tile.removed) return;

    setActiveIdx(idx);
    setStatusMsg(null);

    // Find if this verb has an alternate version
    const allVerbs = logicData.items.filter(item => item.pos === 'verb');
    const baseVerb = tile.verb;
    
    // If this base verb has an alternate field, find the alternate verb
    const alternateVerb = baseVerb.alternate ? 
      allVerbs.find(verb => verb.id === baseVerb.alternate) : 
      null;

    // Randomly choose between base and alternate for pronunciation (50/50 chance)
    const useAlternate = alternateVerb && Math.random() < 0.5;
    const verbToPronounce = useAlternate ? alternateVerb : baseVerb;

    console.log(`[PuzzleGame] Clicked ${baseVerb.chat}, will pronounce: ${verbToPronounce.chat} (${useAlternate ? 'alternate' : 'base'})`);

    // Start listening immediately after choosing pronunciation variant
    startRecognition(baseVerb, verbToPronounce);
  };

  /** ----------------------------------
   * Render helpers
   * --------------------------------*/
  const renderTile = (tile, idx) => {
    if (tile.removed) {
      return (
        <div key={idx} className="w-full h-0 pb-[100%] bg-gray-200 rounded-lg" />
      );
    }
    return (
      <div
        key={idx}
        onClick={() => handleTileClick(idx)}
        className={`relative cursor-pointer border rounded-lg overflow-hidden transition-shadow ${idx === activeIdx ? 'ring-4 ring-blue-500' : 'hover:shadow-lg'}`}
      >
        <MediaDisplay
          item={tile.verb}
          contentType={contentType}
          className="w-full h-auto"
          style={contentType === 'colors' ? { width: '120px', height: '120px' } : {}}
          autoPlay={false}
          loop={true}
          muted={true}
          enableHoverPlay={true}
        />
      </div>
    );
  };

  /** ----------------------------------
   * UI
   * --------------------------------*/
  return (
    <div className={`${SHOW_ALL_VERBS ? 'max-w-6xl' : 'max-w-3xl'} mx-auto p-4 text-center font-sans`}>
      <h2 className="text-2xl font-bold mb-4">
        Game 3: {SHOW_ALL_VERBS ? 'All Verbs' : '3×3'} Speak & Remove ({contentType})
      </h2>

      {allGone ? (
        <div className="my-6">
          <p className="text-xl font-bold text-green-600 mb-4">🎉 All done!</p>
          <button
            onClick={initRound}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            🔄 Play Again
          </button>
        </div>
      ) : (
        <>
          <div className={`grid gap-3 ${SHOW_ALL_VERBS ? 'grid-cols-7 lg:grid-cols-8 xl:grid-cols-10' : 'grid-cols-3'}`}>
            {tiles.map((tile, idx) => renderTile(tile, idx))}
          </div>
          <div className="mt-4 min-h-[32px]">
            {isRecording && <p className="text-red-600 font-semibold">🎤 Listening...</p>}
            {statusMsg && <p className="text-lg font-bold">{statusMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default PuzzleGame;
