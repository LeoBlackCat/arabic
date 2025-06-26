import React, { useState, useEffect, useRef, useCallback } from 'react';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;

import { verbs, getShuffledVerbs } from './verbs-data';
import { normalizeArabic } from './arabicUtils';

/**
 * Mini Game 3 – 3×3 Picture Puzzle + Speech
 * -------------------------------------------------
 * 1. Nine random verb images are shown in a 3×3 grid.
 * 2. The user taps an image → the tile is highlighted & the correct Arabic is pronounced.
 * 3. Speech-recognition starts automatically. If the user pronounces the verb correctly
 *    (exact or partial match) the tile disappears. Otherwise it stays.
 * 4. When all tiles are removed the round ends & the user can play again.
 */
const PuzzleGame = () => {
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
   * Initialise first round (nine random verbs)
   * --------------------------------*/
  const initRound = useCallback(() => {
    const source = Array.isArray(verbs) && verbs.length ? [...verbs] : getShuffledVerbs();
    const shuffled = source.sort(() => Math.random() - 0.5).slice(0, 9);
    setTiles(shuffled.map(v => ({ verb: v, removed: false })));
    setActiveIdx(null);
    setStatusMsg(null);
  }, []);

  useEffect(() => {
    initRound();
  }, [initRound]);

  /** ----------------------------------
   * Helper: start speech-recognition for active tile
   * --------------------------------*/
  const startRecognition = useCallback((expectedVerb) => {
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
      console.error('Speech recognition error', e);
      setIsRecording(false);
    };

    rec.onresult = (event) => {
      const res = event.results[0][0].transcript.trim();
      console.log('[PuzzleGame] Heard:', res);
      const normRes = normalizeArabic(res);
      const normExp = normalizeArabic(expectedVerb.ar);

      const exact = normRes === normExp;
      const partial = !exact && (normRes.includes(normExp) || normExp.includes(normRes));

      console.log('[PuzzleGame] Exact match:', exact, ' Partial match:', partial);
      if (exact || partial) {
        // Mark tile removed
        setTiles(prev => prev.map(t => t.verb === expectedVerb ? { ...t, removed: true } : t));
        setStatusMsg('✅ Good job!');
        speakWord(expectedVerb.ar, expectedVerb.chat);
      } else {
        setStatusMsg('❌ Try again');
        speakWord(expectedVerb.ar, expectedVerb.chat);
      }

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

    // Start listening immediately without pronouncing first
    startRecognition(tile.verb);
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
        <img src={'.' + tile.verb.url} alt={tile.verb.eng} className="w-full h-auto" />
      </div>
    );
  };

  /** ----------------------------------
   * UI
   * --------------------------------*/
  return (
    <div className="max-w-3xl mx-auto p-4 text-center font-sans">
      <h2 className="text-2xl font-bold mb-4">Game 3: 3×3 Speak & Remove</h2>

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
          <div className="grid grid-cols-3 gap-3">
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
