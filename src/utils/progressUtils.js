/**
 * Progress Tracking Utilities
 * Manages learning progress, streaks, and achievements
 */

// Local storage keys
const STORAGE_KEYS = {
  PROGRESS: 'arabic_learning_progress',
  STREAKS: 'arabic_learning_streaks',
  ACHIEVEMENTS: 'arabic_learning_achievements',
  STATS: 'arabic_learning_stats'
};

/**
 * Get user progress data from localStorage
 */
export const getProgressData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {
      wordsLearned: {},
      totalAttempts: 0,
      correctAttempts: 0,
      lastStudyDate: null,
      studyDays: 0
    };
  } catch (error) {
    console.error('Error loading progress data:', error);
    return {
      wordsLearned: {},
      totalAttempts: 0,
      correctAttempts: 0,
      lastStudyDate: null,
      studyDays: 0
    };
  }
};

/**
 * Save user progress data to localStorage
 */
export const saveProgressData = (progressData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
  } catch (error) {
    console.error('Error saving progress data:', error);
  }
};

/**
 * Get streak data from localStorage
 */
export const getStreakData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STREAKS);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      maxStreak: 0,
      lastStreakDate: null,
      streakHistory: []
    };
  } catch (error) {
    console.error('Error loading streak data:', error);
    return {
      currentStreak: 0,
      maxStreak: 0,
      lastStreakDate: null,
      streakHistory: []
    };
  }
};

/**
 * Save streak data to localStorage
 */
export const saveStreakData = (streakData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streakData));
  } catch (error) {
    console.error('Error saving streak data:', error);
  }
};

/**
 * Get achievements data from localStorage
 */
export const getAchievements = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : {
      unlocked: [],
      notifications: []
    };
  } catch (error) {
    console.error('Error loading achievements:', error);
    return {
      unlocked: [],
      notifications: []
    };
  }
};

/**
 * Save achievements data to localStorage
 */
export const saveAchievements = (achievements) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

/**
 * Record a learning attempt
 */
export const recordAttempt = (wordId, isCorrect, contentType = 'verbs') => {
  const progressData = getProgressData();
  const streakData = getStreakData();
  const today = new Date().toDateString();
  
  // Update progress
  progressData.totalAttempts++;
  if (isCorrect) {
    progressData.correctAttempts++;
    
    // Mark word as learned (if not already)
    if (!progressData.wordsLearned[wordId]) {
      progressData.wordsLearned[wordId] = {
        firstLearnedDate: new Date().toISOString(),
        contentType,
        attempts: 1,
        correctAttempts: 1
      };
    } else {
      progressData.wordsLearned[wordId].attempts++;
      progressData.wordsLearned[wordId].correctAttempts++;
    }
  } else {
    // Update word attempts even for incorrect answers
    if (progressData.wordsLearned[wordId]) {
      progressData.wordsLearned[wordId].attempts++;
    }
  }
  
  // Update study tracking
  if (progressData.lastStudyDate !== today) {
    progressData.studyDays++;
    progressData.lastStudyDate = today;
  }
  
  // Update streaks
  updateStreaks(streakData, isCorrect, today);
  
  // Save data
  saveProgressData(progressData);
  saveStreakData(streakData);
  
  // Check for new achievements
  const newAchievements = checkAchievements(progressData, streakData);
  
  return {
    progressData,
    streakData,
    newAchievements,
    accuracy: progressData.totalAttempts > 0 ? Math.round((progressData.correctAttempts / progressData.totalAttempts) * 100) : 0
  };
};

/**
 * Update streak data based on attempt result
 */
const updateStreaks = (streakData, isCorrect, today) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  if (isCorrect) {
    // Check if this continues a streak
    if (streakData.lastStreakDate === yesterdayString || streakData.lastStreakDate === today) {
      if (streakData.lastStreakDate !== today) {
        streakData.currentStreak++;
      }
    } else if (streakData.lastStreakDate !== today) {
      // New streak starts
      streakData.currentStreak = 1;
    }
    
    streakData.lastStreakDate = today;
    
    // Update max streak
    if (streakData.currentStreak > streakData.maxStreak) {
      streakData.maxStreak = streakData.currentStreak;
    }
    
    // Record in history
    streakData.streakHistory.push({
      date: today,
      streak: streakData.currentStreak
    });
    
    // Keep only last 30 days of history
    if (streakData.streakHistory.length > 30) {
      streakData.streakHistory = streakData.streakHistory.slice(-30);
    }
  }
  // Note: We don't break streaks on incorrect answers, only on missed days
};

/**
 * Check for new achievements
 */
const checkAchievements = (progressData, streakData) => {
  const achievements = getAchievements();
  const newAchievements = [];
  
  const achievementDefinitions = [
    {
      id: 'first_word',
      title: 'First Steps',
      description: 'Learned your first word!',
      icon: '🌟',
      condition: () => Object.keys(progressData.wordsLearned).length >= 1
    },
    {
      id: 'ten_words',
      title: 'Building Vocabulary',
      description: 'Learned 10 words!',
      icon: '📚',
      condition: () => Object.keys(progressData.wordsLearned).length >= 10
    },
    {
      id: 'fifty_words',
      title: 'Word Master',
      description: 'Learned 50 words!',
      icon: '🏆',
      condition: () => Object.keys(progressData.wordsLearned).length >= 50
    },
    {
      id: 'hundred_words',
      title: 'Vocabulary Expert',
      description: 'Learned 100 words!',
      icon: '🎓',
      condition: () => Object.keys(progressData.wordsLearned).length >= 100
    },
    {
      id: 'streak_3',
      title: 'Getting Consistent',
      description: '3-day learning streak!',
      icon: '🔥',
      condition: () => streakData.currentStreak >= 3
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: '7-day learning streak!',
      icon: '⚡',
      condition: () => streakData.currentStreak >= 7
    },
    {
      id: 'streak_30',
      title: 'Dedication Master',
      description: '30-day learning streak!',
      icon: '👑',
      condition: () => streakData.currentStreak >= 30
    },
    {
      id: 'accuracy_90',
      title: 'Precision Learner',
      description: '90% accuracy achieved!',
      icon: '🎯',
      condition: () => {
        const accuracy = progressData.totalAttempts > 0 ? (progressData.correctAttempts / progressData.totalAttempts) * 100 : 0;
        return accuracy >= 90 && progressData.totalAttempts >= 20;
      }
    },
    {
      id: 'study_days_7',
      title: 'Weekly Learner',
      description: 'Studied for 7 different days!',
      icon: '📅',
      condition: () => progressData.studyDays >= 7
    },
    {
      id: 'study_days_30',
      title: 'Monthly Dedication',
      description: 'Studied for 30 different days!',
      icon: '🗓️',
      condition: () => progressData.studyDays >= 30
    }
  ];
  
  // Check each achievement
  achievementDefinitions.forEach(achievement => {
    if (!achievements.unlocked.includes(achievement.id) && achievement.condition()) {
      achievements.unlocked.push(achievement.id);
      achievements.notifications.push({
        ...achievement,
        unlockedAt: new Date().toISOString()
      });
      newAchievements.push(achievement);
    }
  });
  
  // Save updated achievements
  if (newAchievements.length > 0) {
    saveAchievements(achievements);
  }
  
  return newAchievements;
};

/**
 * Get learning statistics
 */
export const getLearningStats = (contentType = null) => {
  const progressData = getProgressData();
  const streakData = getStreakData();
  
  let wordsLearned = Object.keys(progressData.wordsLearned);
  
  // Filter by content type if specified
  if (contentType) {
    wordsLearned = wordsLearned.filter(wordId => 
      progressData.wordsLearned[wordId].contentType === contentType
    );
  }
  
  const accuracy = progressData.totalAttempts > 0 ? 
    Math.round((progressData.correctAttempts / progressData.totalAttempts) * 100) : 0;
  
  return {
    wordsLearned: wordsLearned.length,
    totalAttempts: progressData.totalAttempts,
    correctAttempts: progressData.correctAttempts,
    accuracy,
    currentStreak: streakData.currentStreak,
    maxStreak: streakData.maxStreak,
    studyDays: progressData.studyDays,
    lastStudyDate: progressData.lastStudyDate
  };
};

/**
 * Get pending achievement notifications
 */
export const getPendingNotifications = () => {
  const achievements = getAchievements();
  const pending = achievements.notifications.filter(notification => !notification.shown);
  
  // Mark as shown
  achievements.notifications = achievements.notifications.map(notification => ({
    ...notification,
    shown: true
  }));
  saveAchievements(achievements);
  
  return pending;
};

/**
 * Reset all progress (for testing or user request)
 */
export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.STREAKS);
  localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
  localStorage.removeItem(STORAGE_KEYS.STATS);
};

/**
 * Export progress data for backup
 */
export const exportProgress = () => {
  return {
    progress: getProgressData(),
    streaks: getStreakData(),
    achievements: getAchievements(),
    exportDate: new Date().toISOString()
  };
};

/**
 * Import progress data from backup
 */
export const importProgress = (data) => {
  try {
    if (data.progress) saveProgressData(data.progress);
    if (data.streaks) saveStreakData(data.streaks);
    if (data.achievements) saveAchievements(data.achievements);
    return true;
  } catch (error) {
    console.error('Error importing progress:', error);
    return false;
  }
};