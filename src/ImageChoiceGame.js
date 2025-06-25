import React, { useEffect, useState, useRef, useCallback } from 'react';

// Toggle: if true, play pre-generated WAV files instead of browser TTS
const PLAY_AUDIO_FILES = true;
import { verbs, getShuffledVerbs } from './verbs-data';

// Game 2: The app speaks an Arabic verb, user selects the matching image
const ImageChoiceGame = () => {
  const [options, setOptions] = useState([]);
  const [correct, setCorrect] = useState(null);
  const [result, setResult] = useState(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  // Load available voices and pick an Arabic one if present
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesisRef.current.getVoices();
      const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic'));
      setArabicVoice(arVoice || voices[0]);
    };
    speechSynthesisRef.current.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      speechSynthesisRef.current.onvoiceschanged = null;
    };
  }, []);

  // Speak a given Arabic text
  // Map Arabic -> chat (lazy cached)
let arToChat = null;
const buildMap = () => {
  if (arToChat) return arToChat;
  try {
    const logic = require('../logic.json');
    arToChat = {};
    [...logic.items, ...(logic.numerals || [])].forEach((it) => {
      if (it.ar && it.chat) arToChat[it.ar] = it.chat;
    });
  } catch (e) {
    arToChat = {};
  }
  return arToChat;
};

const speakWord = useCallback((text, chatOverride) => {
    if (!text) return;
    try {
      if (PLAY_AUDIO_FILES) {
      const map = buildMap();
      const chat = chatOverride || map[text] || text;
      const audio = new Audio('.' + `/sounds/${encodeURIComponent(chat)}.wav`);
      audio.play().catch(e => {
        console.error('Audio play error:', e);
        // fallback to TTS
        speechSynthesisRef.current.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        if (arabicVoice) utt.voice = arabicVoice;
        utt.lang = 'ar-SA';
        utt.rate = 0.8;
        speechSynthesisRef.current.speak(utt);
      });
      return;
    }
    speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthesisRef.current.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  }, [arabicVoice]);

  // Generate a new round with 4 random options
  const generateRound = useCallback(() => {
    const source = Array.isArray(verbs) && verbs.length ? [...verbs] : getShuffledVerbs();
    const shuffled = source.sort(() => Math.random() - 0.5);
    const opts = shuffled.slice(0, 4);
    const corr = opts[Math.floor(Math.random() * opts.length)];
    setOptions(opts);
    setCorrect(corr);
    setResult(null);
    // Speak after short delay for better UX
    setTimeout(() => speakWord(corr.ar, corr.chat), 300);
  }, [speakWord]);

  // Setup first round
  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const handleSelect = (img) => {
    const isCorrect = img === correct;
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      // Proceed to next round after a short pause
      setTimeout(generateRound, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 text-center font-sans">
      <h2 className="text-2xl font-bold mb-4">Choose the picture that matches the spoken word</h2>
      <div className="grid grid-cols-2 gap-4">
        {options.map(img => (
          <div
            key={img.path}
            className="cursor-pointer border rounded-lg p-2 hover:shadow-lg"
            onClick={() => handleSelect(img)}
          >
            <img src={'.' + img.url} alt={img.eng} className="w-full h-auto rounded" />
          </div>
        ))}
      </div>
      {result && (
        <p className={`text-xl font-bold mt-6 ${result === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {result === 'correct' ? '✅ Correct!' : '❌ Try again'}
        </p>
      )}
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => speakWord(correct?.ar, correct?.chat)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          🔊 Repeat Word
        </button>
        <button
          onClick={generateRound}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          🔄 Next Word
        </button>
      </div>
    </div>
  );
};

export default ImageChoiceGame;
