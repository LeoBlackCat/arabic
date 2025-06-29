import React, { useState, useEffect, useCallback, useRef } from 'react';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;
import { verbs, getShuffledVerbs } from './verbs-data';
import { normalizeArabic } from './arabicUtils';
import MediaDisplay from './MediaDisplay';

// Audio priming to unlock playback after first user gesture
const primeAudio = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(1, 1, 22050);
  source.connect(ctx.destination);
  source.start(0);
  setTimeout(() => ctx.close(), 100);
  window.__audioPrimed = true;
};

const App = ({ contentData = [], contentType = 'verbs', colorMap = {} }) => {
  console.log('App component rendering with:', { contentData, contentType });
  const [isRecording, setIsRecording] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    stage: 'initializing',
    progress: 0,
    error: null,
    itemsFound: 0
  });

  const [recognition, setRecognition] = useState(null);
  const speechSynthesis = useRef(window.speechSynthesis);
  const [arabicVoice, setArabicVoice] = useState(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.current.getVoices();
      const arabic = voices.find(voice => 
        voice.lang.includes('ar') || // matches 'ar', 'ar-SA', etc.
        voice.name.toLowerCase().includes('arabic')
      );
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      console.log('Selected Arabic voice:', arabic ? `${arabic.name} (${arabic.lang})` : 'None');
      setArabicVoice(arabic || voices[0]); // fallback to first available voice if no Arabic
    };

    // Chrome requires this event for voices to be loaded
    speechSynthesis.current.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load attempt

    return () => {
      speechSynthesis.current.onvoiceschanged = null;
    };
  }, []);

  // Map Arabic -> chat for filename lookup (lazy-loaded on first use)
let arToChatMap = null;
const buildArMap = () => {
  if (arToChatMap) return arToChatMap;
  try {
    const logic = require('../logic.json');
    arToChatMap = {};
    [...logic.items, ...(logic.numerals || [])].forEach((it) => {
      if (it.ar && it.chat) arToChatMap[it.ar] = it.chat;
    });
  } catch (e) {
    console.warn('Unable to load logic.json for map:', e);
    arToChatMap = {};
  }
  return arToChatMap;
};

const speakWord = useCallback((text, chatOverride) => {
      if (PLAY_AUDIO_FILES) {
    const map = buildArMap();
    const chat = chatOverride || map[text] || text;
    const fileName = `${chat}.wav`;
    const audio = new Audio('.' + `/sounds/${encodeURIComponent(fileName)}`);
    audio.play().catch((e) => {
      console.error('Audio play error:', e);
      // Fallback to browser TTS
      speechSynthesis.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthesis.current.speak(utterance);
    });
    return;
  }

  try {
      // Cancel any ongoing speech
      speechSynthesis.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice and fallback options
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8; // Slightly slower for better clarity
      
      // Add event handlers for debugging
      utterance.onstart = () => console.log('Started speaking:', text);
      utterance.onend = () => console.log('Finished speaking:', text);
      utterance.onerror = (e) => console.error('Speech error:', e);

      speechSynthesis.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, [arabicVoice]);

  // Initialize content data
  useEffect(() => {
    console.log('Loading content data:', contentData);
    setLoadingState(prev => ({ ...prev, stage: `loading ${contentType} data`, progress: 10 }));
    
    try {
      if (Array.isArray(contentData) && contentData.length > 0) {
        console.log(`Using ${contentType} data:`, contentData);
        setLoadingState(prev => ({ 
          ...prev, 
          stage: `using ${contentType} data`, 
          progress: 40,
          itemsFound: contentData.length
        }));
        
        const shuffled = [...contentData].sort(() => Math.random() - 0.5);
        setImages(shuffled);
        setCurrentImage(shuffled[0]);
        setLoadingState(prev => ({ 
          ...prev, 
          isLoading: false, 
          stage: 'complete', 
          progress: 100 
        }));
        return;
      }
      
      // If no contentData provided, fallback to legacy verbs
      if (contentType === 'verbs') {
        setLoadingState(prev => ({ ...prev, stage: 'getting shuffled verbs', progress: 30 }));
        
        console.log('Calling getShuffledVerbs()');
        const imageList = getShuffledVerbs();
        console.log('Got image list:', imageList);
        
        if (Array.isArray(imageList) && imageList.length > 0) {
          setImages(imageList);
          setCurrentImage(imageList[0]);
          setLoadingState(prev => ({ 
            ...prev, 
            isLoading: false, 
            stage: 'complete', 
            progress: 100,
            itemsFound: imageList.length
          }));
          return;
        }
      }
      
      const error = `No ${contentType} data available`;
      console.error(error);
      setLoadingState(prev => ({ ...prev, error, stage: 'error' }));
    } catch (error) {
      console.error('Error loading content:', error);
      setLoadingState(prev => ({ 
        ...prev, 
        error: error.message || 'Unknown error loading content', 
        stage: 'error' 
      }));
    }
  }, [contentData, contentType]);

  // Initialize speech recognition after images are loaded
  useEffect(() => {
    if (!currentImage) {
      console.log('Waiting for images to load before initializing speech recognition...');
      return;
    }
    console.log('Initializing speech recognition...');
    if ('webkitSpeechRecognition' in window) {
      console.log('Speech recognition is available');
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognition.lang = 'ar-SA';
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        // Only set recording to false if we're currently recording
        // This prevents state mismatch when we stop intentionally
        if (isRecording) {
          setIsRecording(false);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Always set to false on error
        setIsRecording(false);
        
        // If it's an invalid state error, try to recover
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Microphone permission denied or not available
          alert('Please allow microphone access to use speech recognition.');
        }
      };
      
      recognition.onnomatch = (event) => {
        console.log('No speech was recognized', event);
        setResult({
          transcript: 'No speech detected',
          expected: currentImage.chat.toLowerCase(),
          isCorrect: false
        });
      };

      recognition.onaudiostart = () => {
        console.log('Audio capturing started');
      };

      recognition.onaudioend = () => {
        console.log('Audio capturing ended');
      };

      recognition.onsoundstart = () => {
        console.log('Sound detected');
      };

      recognition.onsoundend = () => {
        console.log('Sound ended');
      };

      recognition.onspeechstart = () => {
        console.log('Speech started');
      };

      recognition.onspeechend = () => {
        console.log('Speech ended');
        recognition.stop();
      };
      
      const handleResult = (event) => {
        if (!currentImage) {
          console.error('No current image in result handler');
          recognition.stop();
          return;
        }
        console.log('Got speech recognition result event:', event);

        // Get the latest result
        const result = event.results[event.results.length - 1];

        // Check if it's final
        if (result.isFinal) {
          // Safety check for currentImage
          if (!currentImage) {
            console.error('No current image available');
            recognition.stop();
            return;
          }

          console.log('Final results:', result);
          const transcript = result[0].transcript.trim();
          console.log('Best transcription:', transcript);
          console.log('Confidence:', result[0].confidence);

          // Compare with the current image's Arabic text using normalization
          const expected = currentImage.ar;
          console.log('Expected Arabic:', expected);

          // Normalize both the transcript and expected text
          const normalizedTranscript = normalizeArabic(transcript);
          const normalizedExpected = normalizeArabic(expected);

          console.log('Normalized transcript:', normalizedTranscript);
          console.log('Normalized expected:', normalizedExpected);

          const isCorrect = normalizedTranscript === normalizedExpected;

          // If not exact match but roots are similar, show as partially correct
          const isPartialMatch = !isCorrect && 
            (normalizedTranscript.includes(normalizedExpected) || 
             normalizedExpected.includes(normalizedTranscript));
          console.log('Is correct?', isCorrect);

          // Play feedback sound
          if (isCorrect) {
            new Audio('./sounds/success.wav').play().catch(() => {});
          } else if (!isPartialMatch) {
            new Audio('./sounds/error.wav').play().catch(() => {});
          }

          setResult({
            transcript,
            expected,
            isCorrect,
            isPartialMatch
          });

          // Stop recording after getting final result
          recognition.stop();
          setIsRecording(false);

          // Pronounce the correct word after a short delay
          setTimeout(() => {
            if (currentImage && currentImage.ar) {
              speakWord(currentImage.ar, currentImage.chat);
            }
          }, 1000); // Wait 1 second after showing the result

          // Switch to the next image after 3 seconds
          setTimeout(() => {
            if (typeof nextImage === 'function') {
              nextImage();
            }
          }, 3000);
        }
      };
      
      recognition.onresult = handleResult;
      setRecognition(recognition);
    } else {
      console.error('Speech recognition not supported');
    }
  }, [currentImage]);

  const toggleRecording = useCallback(() => {
    if (!currentImage) {
      console.error('No image loaded, cannot start recording');
      return;
    }
    console.log('Toggle recording with current image:', currentImage);
    if (!recognition) return;

    try {
      if (isRecording) {
        recognition.stop();
      } else {
        // Make sure we're in a stopped state before starting
        recognition.stop();
        setTimeout(() => {
          try {
            recognition.start();
            setIsRecording(true);
          } catch (error) {
            console.error('Error starting recognition:', error);
            setIsRecording(false);
          }
        }, 100);
        return; // Don't set isRecording here, wait for actual start
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Error toggling recognition:', error);
      setIsRecording(false);
    }
  }, [recognition, isRecording, currentImage]);

  const stopRecording = useCallback(() => {
    if (recognition) {
      console.log('Stopping recording...');
      recognition.stop();
      setIsRecording(false);
    } else {
      console.log('No recognition instance to stop');
    }
  }, [recognition]);

  const nextImage = useCallback(() => {
    console.log('Next image called. Current images:', images);
    // Cancel any ongoing speech when changing images
    speechSynthesis.current.cancel();
    const currentIndex = images.findIndex(img => img === currentImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentImage(images[nextIndex]);
    setResult(null); // Clear previous result
  }, [images, currentImage]);

  const shuffleImages = useCallback(() => {
    console.log('Shuffle images called');
    // Cancel any ongoing speech when shuffling
    speechSynthesis.current.cancel();
    
    if (contentData.length > 0) {
      const shuffled = [...contentData].sort(() => Math.random() - 0.5);
      setImages(shuffled);
      setCurrentImage(shuffled[0]);
    } else {
      // Fallback for verbs
      const shuffledImages = getShuffledVerbs();
      setImages(shuffledImages);
      setCurrentImage(shuffledImages[0]);
    }
    setResult(null);
  }, [contentData]);

  console.log('Rendering with currentImage:', currentImage);

  // Audio priming effect (must be inside component)
  useEffect(() => {
    const handler = () => {
      if (!window.__audioPrimed) primeAudio();
    };
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  // Show loading state
  if (loadingState.isLoading || !currentImage) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center font-sans">
        <div className="flex flex-col items-center my-8 p-6 bg-gray-100 rounded-md">
          <div className="text-2xl text-gray-600 text-center my-2 font-bold">
            {loadingState.error ? 
              `Error: ${loadingState.error}` : 
              `Loading ${contentType}... (${loadingState.stage})`}
          </div>
          <div className="w-4/5 h-2 bg-gray-300 rounded my-2 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${loadingState.progress}%` }}
            />
          </div>
          {loadingState.itemsFound > 0 && (
            <div className="text-base text-gray-500 my-2">
              Found {loadingState.itemsFound} {contentType}
            </div>
          )}
          {loadingState.error && (
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded mt-4 text-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 text-center font-sans">
      {currentImage && (
        <div className="mb-6 flex flex-col items-center px-2 sm:px-4">
          <div className="w-full flex justify-center">
            <MediaDisplay
              item={currentImage}
              contentType={contentType}
              className="max-w-[90vw] w-full h-auto mb-3"
              onClick={() => speakWord(currentImage.ar, currentImage.chat)}
              autoPlay={true}
              loop={true}
              muted={true}
            />
          </div>
          {result && (
            <>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-800 my-2 font-bold">{currentImage.eng}</p>
              <p className="text-2xl sm:text-3xl md:text-4xl text-blue-900 font-bold mb-1 cursor-pointer rtl font-sans" style={{direction: 'rtl'}} onClick={() => speakWord(currentImage.ar, currentImage.chat)}>{currentImage.ar}</p>
              <p className="text-base sm:text-lg text-gray-500 italic mb-4">({currentImage.chat})</p>
            </>
          )}
          {result ? (
            <button
              onClick={() => speakWord(currentImage.ar, currentImage.chat)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded mb-4 inline-flex items-center gap-2 hover:bg-green-700 transition text-sm sm:text-base"
            >
              <span role="img" aria-label="pronounce">🔊</span> Pronounce
            </button>
          ) : (
            <p className="text-sm text-gray-500 italic mb-4">Tap the picture to hear pronunciation</p>
          )}
          {result && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50">
              <p>You said: <span className="font-bold text-gray-800 rtl inline-block" style={{direction: 'rtl'}}>{result.transcript}</span></p>
              <p className={
                result.isCorrect
                  ? "text-green-600 font-bold text-xl my-2"
                  : result.isPartialMatch
                  ? "text-blue-500 font-bold text-xl my-2"
                  : "text-red-600 font-bold text-xl my-2"
              }>
                {result.isCorrect ? '✅ Correct!' : 
                 result.isPartialMatch ? '🔵 Close! Different form of the same word' : 
                 '❌ Try again'}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 w-full px-2">
        <button 
          onClick={toggleRecording}
          className={`w-full sm:w-auto px-4 py-2 text-base sm:text-lg rounded font-semibold transition-all duration-300 focus:outline-none ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {isRecording ? '🎤 Recording...' : 'Start Recording'}
        </button>
        <button 
          onClick={nextImage}
          className="w-full sm:w-auto px-4 py-2 text-base sm:text-lg rounded font-semibold transition-all duration-300 focus:outline-none bg-gray-600 hover:bg-gray-700 text-white"
        >
          ⏭️ Skip to Next
        </button>
      </div>
    </div>
  );
};

export default App;
