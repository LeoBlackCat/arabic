/**
 * Firebase Logger for ElevenLabs API Usage
 * Logs API requests to Firebase Realtime Database for monitoring and analytics
 */

/**
 * Get Firebase configuration for logging
 */
const getFirebaseConfig = () => {
  const projectId = localStorage.getItem('firebase-project-id');
  const apiKey = localStorage.getItem('firebase-api-key');
  
  return {
    projectId,
    apiKey,
    isEnabled: projectId && apiKey,
    databaseUrl: `https://${projectId}-default-rtdb.firebaseio.com`
  };
};

/**
 * Check if Firebase logging is available
 */
export const isFirebaseLoggingAvailable = () => {
  const config = getFirebaseConfig();
  return config.isEnabled;
};

/**
 * Log ElevenLabs API request to Firebase Realtime Database
 */
export const logElevenLabsRequest = async (requestData) => {
  try {
    const config = getFirebaseConfig();
    
    if (!config.isEnabled) {
      console.warn('Firebase logging not configured, skipping log');
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestText: requestData.text,
      filename: requestData.filename,
      textLength: requestData.text.length,
      audioSize: requestData.audioSize || null,
      success: requestData.success,
      error: requestData.error || null,
      source: requestData.source || 'unknown', // 'main-app', 'grammar-game', etc.
      userAgent: navigator.userAgent,
      sessionId: getSessionId()
    };

    // Generate unique log ID using timestamp + random
    const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const url = `${config.databaseUrl}/elevenlabs_logs/${logId}.json`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      throw new Error(`Firebase logging failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Logged ElevenLabs request: ${requestData.filename} (${requestData.text.substring(0, 20)}...)`);
    
  } catch (error) {
    console.error('Failed to log ElevenLabs request:', error);
    // Don't throw - logging failure shouldn't break audio functionality
  }
};

/**
 * Get or create session ID for tracking user sessions
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('firebase-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('firebase-session-id', sessionId);
  }
  return sessionId;
};

/**
 * Log aggregated usage statistics
 */
export const logUsageStats = async (stats) => {
  try {
    const config = getFirebaseConfig();
    
    if (!config.isEnabled) {
      return;
    }

    const statsEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      ...stats
    };

    const dateKey = statsEntry.date.replace(/-/g, '_'); // Firebase key-safe
    const url = `${config.databaseUrl}/usage_stats/${dateKey}.json`;
    
    // Get existing stats for the day
    const existingResponse = await fetch(`${url}`);
    let existingStats = {};
    
    if (existingResponse.ok) {
      existingStats = await existingResponse.json() || {};
    }

    // Merge with existing stats
    const mergedStats = {
      ...existingStats,
      totalRequests: (existingStats.totalRequests || 0) + (stats.requests || 1),
      totalCharacters: (existingStats.totalCharacters || 0) + (stats.characters || 0),
      totalAudioSize: (existingStats.totalAudioSize || 0) + (stats.audioSize || 0),
      lastUpdated: statsEntry.timestamp,
      sources: {
        ...existingStats.sources,
        [stats.source || 'unknown']: (existingStats.sources?.[stats.source || 'unknown'] || 0) + 1
      }
    };

    await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mergedStats)
    });

  } catch (error) {
    console.error('Failed to log usage stats:', error);
  }
};

/**
 * Test Firebase logging configuration
 */
export const testFirebaseLogging = async () => {
  try {
    const config = getFirebaseConfig();
    
    if (!config.isEnabled) {
      return { success: false, error: 'Firebase logging not configured' };
    }

    const testEntry = {
      timestamp: new Date().toISOString(),
      test: true,
      message: 'Firebase logging test'
    };

    const url = `${config.databaseUrl}/test_logs/test_${Date.now()}.json`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEntry)
    });

    if (!response.ok) {
      throw new Error(`Test failed: ${response.status} ${response.statusText}`);
    }

    return { success: true, message: 'Firebase logging test successful' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};