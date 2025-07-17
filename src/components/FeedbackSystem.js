/**
 * Enhanced Feedback System Component
 * Provides beautiful animations and feedback for user interactions
 */
import React, { useState, useEffect, useRef } from 'react';
import { animateElement, createParticleEffect, animateProgress } from '../utils/animationUtils.js';
import { getThemeClass } from '../utils/themeUtils.js';

/**
 * Progress Ring Component
 * Animated circular progress indicator
 */
export const ProgressRing = ({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8, 
  className = "",
  showPercentage = true,
  animated = true
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const ringRef = useRef(null);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    if (animated) {
      // Animate progress change
      const startProgress = animatedProgress;
      const endProgress = progress;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
        const currentProgress = startProgress + (endProgress - startProgress) * easeOutCubic;
        
        setAnimatedProgress(currentProgress);
        
        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        ref={ringRef}
        className="progress-ring transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--neutral-200)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--theme-primary, var(--primary-500))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px var(--theme-primary, var(--primary-500)))'
          }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-neutral-800">
            {Math.round(animatedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Achievement Badge Component
 * Animated badge for achievements and milestones
 */
export const AchievementBadge = ({ 
  type = 'success', 
  title, 
  description, 
  icon = '🏆',
  visible = false,
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const badgeRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      if (badgeRef.current) {
        animateElement(badgeRef.current, 'scaleIn', { duration: 400 });
        createParticleEffect(badgeRef.current.parentElement, {
          particleCount: 20,
          colors: ['var(--success-500)', 'var(--secondary-500)', 'var(--accent-emerald-500)']
        });
      }
      
      if (autoClose) {
        setTimeout(() => {
          handleClose();
        }, duration);
      }
    }
  }, [visible, autoClose, duration]);

  const handleClose = () => {
    if (badgeRef.current) {
      animateElement(badgeRef.current, 'scaleOut', { duration: 300 });
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }
  };

  if (!isVisible) return null;

  const typeClasses = {
    success: 'bg-success-50 border-success-200 text-success-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    info: 'bg-info-50 border-info-200 text-info-700',
    celebration: 'bg-gradient-to-r from-secondary-50 to-primary-50 border-primary-200 text-primary-700'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <div 
        ref={badgeRef}
        className={`card p-4 border-2 max-w-sm ${typeClasses[type]} shadow-xl`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl animate-bounce">{icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Streak Counter Component
 * Animated streak counter with flame effect
 */
export const StreakCounter = ({ 
  streak = 0, 
  maxStreak = 0,
  className = "",
  animated = true
}) => {
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const streakRef = useRef(null);

  useEffect(() => {
    if (animated && streak !== animatedStreak) {
      // Animate streak change
      const startStreak = animatedStreak;
      const endStreak = streak;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        
        const easeOutBack = 1 + 2.7 * Math.pow(progressRatio - 1, 3) + 1.7 * Math.pow(progressRatio - 1, 2);
        const currentStreak = Math.round(startStreak + (endStreak - startStreak) * easeOutBack);
        
        setAnimatedStreak(currentStreak);
        
        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      
      // Add celebration effect for new streaks
      if (streak > animatedStreak && streakRef.current) {
        animateElement(streakRef.current, 'celebration', { duration: 600 });
      }
    } else if (!animated) {
      setAnimatedStreak(streak);
    }
  }, [streak, animated, animatedStreak]);

  const getFlameIntensity = () => {
    if (animatedStreak === 0) return 'text-neutral-400';
    if (animatedStreak < 3) return 'text-warning-500';
    if (animatedStreak < 7) return 'text-secondary-500';
    if (animatedStreak < 15) return 'text-error-500';
    return 'text-gradient animate-glow';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        ref={streakRef}
        className={`text-2xl transition-all duration-300 ${getFlameIntensity()}`}
      >
        {animatedStreak > 0 ? '🔥' : '⚪'}
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-neutral-800">
          {animatedStreak}
        </span>
        <span className="text-xs text-neutral-500">
          Best: {maxStreak}
        </span>
      </div>
    </div>
  );
};

/**
 * Animated Score Display
 * Shows score with smooth number animations
 */
export const AnimatedScore = ({ 
  score = 0, 
  label = "Score",
  className = "",
  size = "normal" // "small", "normal", "large"
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreRef = useRef(null);

  useEffect(() => {
    // Animate score change
    const startScore = animatedScore;
    const endScore = score;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
      const currentScore = Math.round(startScore + (endScore - startScore) * easeOutQuart);
      
      setAnimatedScore(currentScore);
      
      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    
    // Add celebration effect for score increases
    if (score > animatedScore && scoreRef.current) {
      animateElement(scoreRef.current, 'celebration', { duration: 400 });
    }
  }, [score]);

  const sizeClasses = {
    small: 'text-lg',
    normal: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className={`text-center ${className}`}>
      <div 
        ref={scoreRef}
        className={`font-bold text-primary ${sizeClasses[size]} transition-all duration-300`}
      >
        {animatedScore.toLocaleString()}
      </div>
      <div className="text-sm text-neutral-500 font-medium">
        {label}
      </div>
    </div>
  );
};

/**
 * Learning Progress Component
 * Shows overall learning progress with multiple metrics
 */
export const LearningProgress = ({ 
  wordsLearned = 0,
  totalWords = 100,
  accuracy = 0,
  streak = 0,
  maxStreak = 0,
  className = "",
  contentType = "verbs"
}) => {
  const progressPercentage = Math.round((wordsLearned / totalWords) * 100);

  return (
    <div className={`card p-6 ${getThemeClass(contentType)} ${className}`}>
      <h3 className="text-xl font-bold text-neutral-800 mb-4 text-center">
        Learning Progress
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Ring */}
        <div className="flex flex-col items-center">
          <ProgressRing 
            progress={progressPercentage}
            size={120}
            strokeWidth={8}
          />
          <div className="mt-2 text-center">
            <div className="text-sm font-medium text-neutral-600">
              {wordsLearned} / {totalWords} words
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Accuracy</span>
            <AnimatedScore 
              score={accuracy} 
              label="%" 
              size="small"
              className="text-right"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Current Streak</span>
            <StreakCounter 
              streak={streak}
              maxStreak={maxStreak}
              className="justify-end"
            />
          </div>
          
          <div className="progress-bar h-2">
            <div 
              className="progress-bar-fill transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Feedback Toast Component
 * Quick feedback messages with animations
 */
export const FeedbackToast = ({ 
  message,
  type = 'info',
  visible = false,
  onClose,
  duration = 2000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const toastRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      if (toastRef.current) {
        animateElement(toastRef.current, 'slideInRight', { duration: 300 });
      }
      
      setTimeout(() => {
        handleClose();
      }, duration);
    }
  }, [visible, duration]);

  const handleClose = () => {
    if (toastRef.current) {
      animateElement(toastRef.current, 'slideOutRight', { duration: 300 });
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }
  };

  if (!isVisible) return null;

  const typeClasses = {
    success: 'bg-success-500 text-white',
    error: 'bg-error-500 text-white',
    warning: 'bg-warning-500 text-white',
    info: 'bg-info-500 text-white'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        ref={toastRef}
        className={`px-4 py-3 rounded-lg shadow-lg ${typeClasses[type]} max-w-sm`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <button
            onClick={handleClose}
            className="ml-3 text-white hover:text-neutral-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};