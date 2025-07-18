import React, { useState, useEffect, useCallback, useRef } from 'react';
import SkipLink from './components/SkipLink.js';
import LiveRegion from './components/LiveRegion.js';
import FocusManager from './components/FocusManager.js';
import { announceToScreenReader, prefersReducedMotion } from './utils/accessibilityUtils.js';

// Toggle: if true, play pre-generated WAV files located in /sounds; otherwise use browser TTS
const PLAY_AUDIO_FILES = true;
import { verbs, getShuffledVerbs } from './verbs-data';
import { normalizeArabic, checkPronunciation } from './arabicUtils';
import logicData from '../logic.json';
import MediaDisplay from './MediaDisplay';
import { isElevenLabsAvailable, playElevenLabsSpeech } from './elevenLabsHelper';
import { isFirebaseStorageAvailable, playAudioWithFirebaseCache } from './firebaseStorageHelper';
import { getThemeClass, applyTheme } from './utils/themeUtils.js';
import { animateElement, staggerAnimation, createParticleEffect, triggerCelebration } from './utils/animationUtils.js';
import PerformanceMonitor from './components/PerformanceMonitor.js';
import { memoryManager } from './utils/performanceUtils.js';
import { initializeFonts } from './utils/fontLoader.js';
import CompatibilityChecker from './components/CompatibilityChecker.js';
import { recordAttempt, getLearningStats, getPendingNotifications } from './utils/progressUtils.js';
import { AchievementBadge, FeedbackToast, StreakCounter, AnimatedScore } from './components/FeedbackSystem.js';
import SwipeableContent from './components/SwipeableContent.js';
import TouchOptimizedButton from './components/TouchOptimizedButton.js';
import BottomSheet from './components/BottomSheet.js';
import { handleOrientationChange, isTouchDevice } from './utils/touchUtils.js';
import ThemeProvider from './components/ThemeProvider.js';
import ThemedCard from './components/ThemedCard.js';
import ThemedButton from './components/ThemedButton.js';
import { SkeletonLoader, LoadingDots, Spinner, ProgressBar, CardSkeleton } from './components/LoadingStates.js';
import PageTransition from './components/PageTransition.js';

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
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(false);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const nextImageTimeoutRef = useRef(null);
  
  // Refs for animations and theming
  const appContainerRef = useRef(null);
  const mediaCardRef = useRef(null);
  const resultCardRef = useRef(null);
  const controlsRef = useRef(null);

  // Enhanced feedback and progress state
  const [learningStats, setLearningStats] = useState({
    wordsLearned: 0,
    accuracy: 0,
    currentStreak: 0,
    maxStreak: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [feedbackToast, setFeedbackToast] = useState({ visible: false, message: '', type: 'info' });
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  // Mobile-specific state
  const [orientation, setOrientation] = useState('portrait');
  const [isTouch, setIsTouch] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // Initialize voices and check ElevenLabs availability
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

    // Check ElevenLabs availability
    const checkElevenLabs = () => {
      const available = isElevenLabsAvailable();
      setElevenLabsEnabled(available);
      console.log('ElevenLabs TTS available:', available);
    };
    
    // Check Firebase Storage availability
    const checkFirebase = () => {
      const available = isFirebaseStorageAvailable();
      setFirebaseEnabled(available);
      console.log('Firebase Storage available:', available);
    };
    
    checkElevenLabs();
    checkFirebase();

    return () => {
      speechSynthesis.current.onvoiceschanged = null;
      // Cleanup timeout on unmount
      if (nextImageTimeoutRef.current) {
        clearTimeout(nextImageTimeoutRef.current);
      }
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

const speakWord = useCallback(async (text, chatOverride) => {
    // Priority 0: Firebase Storage cache (if enabled)
    if (firebaseEnabled) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      
      try {
        console.log('Using Firebase Storage cache for:', text);
        await playAudioWithFirebaseCache(text, chat);
        return;
      } catch (error) {
        console.error('Firebase Storage failed, falling back:', error);
      }
    }

    // Priority 1: ElevenLabs TTS (if enabled)
    if (elevenLabsEnabled) {
      try {
        console.log('Using ElevenLabs TTS for:', text);
        await playElevenLabsSpeech(text);
        return;
      } catch (error) {
        console.error('ElevenLabs TTS failed, falling back:', error);
      }
    }

    // Priority 2: Pre-generated WAV files (if PLAY_AUDIO_FILES is true)
    if (PLAY_AUDIO_FILES) {
      const map = buildArMap();
      const chat = chatOverride || map[text] || text;
      const fileName = `${chat}.wav`;
      const audio = new Audio('.' + `/sounds/${encodeURIComponent(fileName)}`);
      
      try {
        await audio.play();
        console.log('Played audio file:', fileName);
        return;
      } catch (error) {
        console.error('Audio file play error:', error);
      }
    }

    // Priority 3: Browser TTS (fallback)
    try {
      speechSynthesis.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      
      utterance.onstart = () => console.log('Started browser TTS:', text);
      utterance.onend = () => console.log('Finished browser TTS:', text);
      utterance.onerror = (e) => console.error('Browser TTS error:', e);

      speechSynthesis.current.speak(utterance);
    } catch (error) {
      console.error('Browser TTS synthesis error:', error);
    }
  }, [arabicVoice, elevenLabsEnabled, firebaseEnabled]);

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
        
        // Only reset currentImage if we don't have one, or if the current one is not in the new data
        if (!currentImage || !shuffled.some(item => 
          item.id === currentImage.id && item.chat === currentImage.chat
        )) {
          console.log('Setting currentImage to first item because no current image or not found in new data');
          setCurrentImage(shuffled[0]);
        } else {
          console.log('Keeping existing currentImage as it exists in new data');
        }
        
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

          // Find the current item in logic data to check for alternates
          const currentLogicItem = logicData.items.find(item => 
            item.ar === currentImage.ar && item.chat === currentImage.chat
          );
          
          console.log('Current logic item:', currentLogicItem);
          console.log('Expected Arabic:', currentImage.ar);

          // Use the new pronunciation checking function
          const pronunciationResult = checkPronunciation(transcript, currentLogicItem || currentImage, logicData.items);
          
          console.log('Pronunciation check result:', pronunciationResult);
          
          const isCorrect = pronunciationResult.isCorrect;
          const isPartialMatch = pronunciationResult.matchType === 'partial';
          const matchType = pronunciationResult.matchType;
          
          console.log('Is correct?', isCorrect, 'Match type:', matchType);

          // Record attempt and update progress
          const progressUpdate = recordAttempt(currentImage.id, isCorrect, contentType);
          
          // Update learning stats
          setLearningStats({
            wordsLearned: progressUpdate.progressData ? Object.keys(progressUpdate.progressData.wordsLearned).length : 0,
            accuracy: progressUpdate.accuracy,
            currentStreak: progressUpdate.streakData.currentStreak,
            maxStreak: progressUpdate.streakData.maxStreak
          });

          // Handle new achievements
          if (progressUpdate.newAchievements && progressUpdate.newAchievements.length > 0) {
            const achievement = progressUpdate.newAchievements[0];
            setCurrentAchievement(achievement);
            setShowAchievement(true);
          }

          // Show feedback toast
          if (isCorrect) {
            setFeedbackToast({
              visible: true,
              message: result.matchType === 'alternate' ? 'Excellent! Alternative pronunciation!' : 'Perfect!',
              type: 'success'
            });
          } else if (isPartialMatch) {
            setFeedbackToast({
              visible: true,
              message: 'Close! Different form of the same word',
              type: 'info'
            });
          } else {
            setFeedbackToast({
              visible: true,
              message: 'Try again - you can do it!',
              type: 'warning'
            });
          }

          // Play feedback sound
          if (isCorrect) {
            new Audio('./sounds/success.wav').play().catch(() => {});
          } else if (!isPartialMatch) {
            new Audio('./sounds/error.wav').play().catch(() => {});
          }

          setResult({
            transcript,
            expected: currentImage.ar,
            isCorrect,
            isPartialMatch,
            matchType,
            matchedItem: pronunciationResult.matchedItem
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

          // Clear any existing timeout
          if (nextImageTimeoutRef.current) {
            clearTimeout(nextImageTimeoutRef.current);
          }
          
          // Switch to the next image after 3 seconds
          nextImageTimeoutRef.current = setTimeout(() => {
            console.log('Timeout triggered, calling nextImage...');
            nextImage();
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
    // Clear any pending next image timeout
    if (nextImageTimeoutRef.current) {
      clearTimeout(nextImageTimeoutRef.current);
      nextImageTimeoutRef.current = null;
    }
    
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
    console.log('Current image:', currentImage);
    
    // Cancel any ongoing speech when changing images
    speechSynthesis.current.cancel();
    
    if (!currentImage || !images.length) {
      console.log('No current image or no images available');
      return;
    }
    
    // Find current index by comparing unique properties instead of object reference
    const currentIndex = images.findIndex(img => 
      img && currentImage && 
      img.id === currentImage.id && 
      img.chat === currentImage.chat
    );
    
    console.log('Current index found:', currentIndex);
    
    if (currentIndex === -1) {
      console.log('Current image not found in images array, using first image');
      setCurrentImage(images[0]);
      setResult(null);
      return;
    }
    
    const nextIndex = (currentIndex + 1) % images.length;
    console.log('Next index:', nextIndex, 'Next image:', images[nextIndex]);
    
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

  // Debug effect to track currentImage changes
  useEffect(() => {
    console.log('🖼️ currentImage changed to:', currentImage?.chat || 'null');
  }, [currentImage]);

  // Apply theme to app container when content type changes
  useEffect(() => {
    if (appContainerRef.current && contentType) {
      applyTheme(appContainerRef.current, contentType);
    }
  }, [contentType]);

  // Animate media card when current image changes
  useEffect(() => {
    if (mediaCardRef.current && currentImage && !loadingState.isLoading) {
      animateElement(mediaCardRef.current, 'fadeInUp', { duration: 400 });
    }
  }, [currentImage, loadingState.isLoading]);

  // Animate result card when result appears
  useEffect(() => {
    if (resultCardRef.current && result) {
      animateElement(resultCardRef.current, 'scaleIn', { duration: 300 });
      
      // Trigger celebration animation for correct answers
      if (result.isCorrect && mediaCardRef.current) {
        triggerCelebration(mediaCardRef.current, 'celebration');
        createParticleEffect(appContainerRef.current, {
          particleCount: 15,
          colors: ['var(--theme-primary)', 'var(--theme-accent)', 'var(--success-500)']
        });
      }
    }
  }, [result]);

  // Audio priming effect (must be inside component)
  useEffect(() => {
    const handler = () => {
      if (!window.__audioPrimed) primeAudio();
    };
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  // Mobile initialization
  useEffect(() => {
    setIsTouch(isTouchDevice());
    
    const cleanupOrientation = handleOrientationChange((newOrientation, dimensions) => {
      setOrientation(newOrientation);
      console.log('Orientation changed:', newOrientation, dimensions);
    });

    return cleanupOrientation;
  }, []);

  // Performance and font initialization
  useEffect(() => {
    // Initialize fonts for better performance
    initializeFonts().then(result => {
      console.log('Font initialization complete:', result);
    }).catch(error => {
      console.error('Font initialization failed:', error);
    });

    // Setup memory management
    const debouncedResize = memoryManager.debounce(() => {
      console.log('Window resized, checking performance');
    }, 250);

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  // Show loading state
  if (loadingState.isLoading || !currentImage) {
    return (
      <ThemeProvider contentType={contentType}>
        <div className={`container mx-auto p-6 text-center ${getThemeClass(contentType)}`}>
          <ThemedCard variant="elevated" className="animate-fade-in-up flex flex-col items-center p-8 max-w-md mx-auto">
            <div className="text-2xl text-neutral-700 text-center mb-4 font-bold">
              {loadingState.error ? 
                `Error: ${loadingState.error}` : 
                `Loading ${contentType}...`}
            </div>
            
            {!loadingState.error && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Spinner size="medium" color="primary" />
                  <span className="text-base text-neutral-600">{loadingState.stage}</span>
                </div>
                
                <ProgressBar 
                  progress={loadingState.progress}
                  variant="themed"
                  size="medium"
                  showLabel={true}
                  label="Loading Progress"
                  className="w-full mb-4"
                />
                
                {loadingState.itemsFound > 0 && (
                  <div className="text-base text-neutral-500 mb-4 animate-fade-in">
                    Found {loadingState.itemsFound} {contentType}
                  </div>
                )}
              </>
            )}
            
            {loadingState.error && (
              <ThemedButton 
                onClick={() => window.location.reload()}
                variant="primary"
                size="large"
                className="mt-4"
              >
                Retry
              </ThemedButton>
            )}
          </ThemedCard>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <CompatibilityChecker 
      autoRun={true}
      showResults={false}
      onResults={(results) => {
        // Handle compatibility results
        if (results.overall.score < 60) {
          console.warn('Poor compatibility detected:', results);
        }
      }}
    >
      <ThemeProvider contentType={contentType}>
        <SkipLink href="#main-content" />
        <LiveRegion 
          message={feedbackToast.visible ? feedbackToast.message : ''} 
          priority={feedbackToast.type === 'error' ? 'assertive' : 'polite'} 
        />
      
      <main 
        id="main-content"
        ref={appContainerRef} 
        className={`container mx-auto safe-area-all text-center ${getThemeClass(contentType)} ${orientation === 'landscape' ? 'landscape-layout' : 'portrait-layout'}`}
        role="main"
        aria-label={`Arabic learning app - ${contentType} practice`}
      >
      {currentImage && (
        <SwipeableContent
          onSwipeLeft={nextImage}
          onSwipeRight={() => {
            // Go to previous image
            const currentIndex = images.findIndex(img => 
              img && currentImage && 
              img.id === currentImage.id && 
              img.chat === currentImage.chat
            );
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            setCurrentImage(images[prevIndex]);
            setResult(null);
          }}
          enableSwipe={!isRecording}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Media Card */}
          <div ref={mediaCardRef} className="card-elevated p-4 sm:p-6 hover-lift touch-feedback">
            <div className="flex justify-center mb-4">
              <MediaDisplay
                key={`${currentImage.id}-${currentImage.chat}`}
                item={currentImage}
                contentType={contentType}
                className="max-w-sm w-full h-auto rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => speakWord(currentImage.ar, currentImage.chat)}
                autoPlay={true}
                loop={true}
                muted={true}
              />
            </div>
            
            {/* Content Information */}
            {result && (
              <div className="space-y-3 animate-fade-in-up">
                <h2 className="text-xl sm:text-2xl md:text-3xl text-neutral-800 font-bold">
                  {currentImage.eng}
                </h2>
                <div 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 cursor-pointer arabic text-primary hover:text-accent transition-colors duration-300" 
                  style={{direction: 'rtl'}} 
                  onClick={() => speakWord(currentImage.ar, currentImage.chat)}
                >
                  {currentImage.ar}
                </div>
                <p className="text-lg text-neutral-500 arabizi font-medium">
                  ({currentImage.chat})
                </p>
              </div>
            )}
            
            {/* Pronunciation Button or Hint */}
            {result ? (
              <button
                onClick={() => speakWord(currentImage.ar, currentImage.chat)}
                className="btn btn-success mt-4 hover:scale-105 transition-transform duration-200"
              >
                <span role="img" aria-label="pronounce">🔊</span> 
                Pronounce Again
              </button>
            ) : (
              <p className="text-sm text-neutral-500 italic mt-4 animate-pulse">
                Tap the image to hear pronunciation
              </p>
            )}
          </div>

          {/* Result Card */}
          {result && (
            <div ref={resultCardRef} className="card p-6 animate-scale-in">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-neutral-600">You said:</span>
                  <span className="font-bold text-neutral-800 arabic text-lg" style={{direction: 'rtl'}}>
                    {result.transcript}
                  </span>
                </div>
                
                <div className={`text-center p-4 rounded-xl font-bold text-xl transition-all duration-300 ${
                  result.isCorrect
                    ? "bg-success-50 text-success-700 border border-success-200"
                    : result.isPartialMatch
                    ? "bg-info-50 text-info-700 border border-info-200"
                    : "bg-error-50 text-error-700 border border-error-200"
                }`}>
                  {result.isCorrect ? 
                    (result.matchType === 'alternate' ? 
                      '✅ Excellent! (Alternative pronunciation)' : 
                      '✅ Perfect!') : 
                   result.isPartialMatch ? 
                     '🔵 Close! Different form of the same word' : 
                     '❌ Try again - you can do it!'}
                </div>
                
                {result.isCorrect && result.matchType === 'alternate' && result.matchedItem && (
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <p className="text-sm text-neutral-600">
                      You said: 
                      <span className="font-semibold arabic ml-2" style={{direction: 'rtl'}}>
                        {result.matchedItem.ar}
                      </span> 
                      <span className="text-neutral-500">({result.matchedItem.eng})</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls Card */}
          <div ref={controlsRef} className="card p-6">
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
              <TouchOptimizedButton 
                onClick={toggleRecording}
                variant={isRecording ? 'danger' : 'primary'}
                size="large"
                className={`flex-1 sm:flex-none sm:min-w-48 text-lg font-semibold ${
                  isRecording ? 'animate-pulse' : ''
                }`}
                disabled={!currentImage}
                hapticFeedback={true}
                ariaLabel={isRecording ? 'Stop recording speech' : 'Start recording speech'}
                aria-describedby="recording-help"
              >
                {isRecording ? (
                  <>
                    <span className="animate-bounce" aria-hidden="true">🎤</span> 
                    Recording...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">🎤</span> Start Recording
                  </>
                )}
              </TouchOptimizedButton>
              
              <TouchOptimizedButton 
                onClick={nextImage}
                variant="secondary"
                size="large"
                className="flex-1 sm:flex-none sm:min-w-48 text-lg font-semibold"
                hapticFeedback={true}
              >
                ⏭️ Skip to Next
              </TouchOptimizedButton>
            </div>
          </div>

          {/* Progress Stats Card */}
          <div className="card p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <AnimatedScore 
                  score={learningStats.wordsLearned} 
                  label="Words Learned"
                  size="small"
                />
                <AnimatedScore 
                  score={learningStats.accuracy} 
                  label="Accuracy %"
                  size="small"
                />
              </div>
              <StreakCounter 
                streak={learningStats.currentStreak}
                maxStreak={learningStats.maxStreak}
              />
            </div>
          </div>
        </SwipeableContent>
      )}

      {/* Achievement Badge */}
      <AchievementBadge
        visible={showAchievement}
        title={currentAchievement?.title}
        description={currentAchievement?.description}
        icon={currentAchievement?.icon}
        type="celebration"
        onClose={() => {
          setShowAchievement(false);
          setCurrentAchievement(null);
        }}
      />

      {/* Feedback Toast */}
      <FeedbackToast
        visible={feedbackToast.visible}
        message={feedbackToast.message}
        type={feedbackToast.type}
        onClose={() => setFeedbackToast({ visible: false, message: '', type: 'info' })}
      />
      </main>
    </ThemeProvider>
    </CompatibilityChecker>
  );
};

export default App;
