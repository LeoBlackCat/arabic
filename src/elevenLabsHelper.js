/**
 * ElevenLabs TTS Helper
 * Provides functions to interact with ElevenLabs Text-to-Speech API
 */

import { logElevenLabsRequest, logUsageStats } from './firebaseLogger';

/**
 * Get ElevenLabs configuration from localStorage
 */
export const getElevenLabsConfig = () => {
  const apiKey = localStorage.getItem('elevenlabs-key');
  const voiceId = localStorage.getItem('elevenlabs-voice-id') || 'jAAHNNqlbAX9iWjJPEtE';
  const isEnabled = localStorage.getItem('elevenlabs-enabled') === 'true';
  
  return {
    apiKey,
    voiceId,
    isEnabled: isEnabled && apiKey && apiKey.length > 0
  };
};

/**
 * Check if ElevenLabs is available and configured
 */
export const isElevenLabsAvailable = () => {
  const config = getElevenLabsConfig();
  return config.isEnabled && config.apiKey;
};

/**
 * Generate speech using ElevenLabs API
 */
export const generateElevenLabsSpeech = async (text, filename = null, source = 'unknown') => {
  const config = getElevenLabsConfig();
  
  if (!config.isEnabled || !config.apiKey) {
    throw new Error('ElevenLabs is not configured or enabled');
  }

  const startTime = Date.now();
  let audioBlob = null;
  let error = null;

  try {
    console.log('ElevenLabs API request:', {
      url: `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
      voiceId: config.voiceId,
      apiKeyLength: config.apiKey?.length,
      text: text,
      filename: filename
    });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey
      },
      body: JSON.stringify({
        text: `<break time="0.5s" /> ${text}`, // Add space before text to help with initial audio cut-off
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 1,
          similarity_boost: 1,
          speed: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      error = `${response.status} ${response.statusText} - ${errorText}`;
      console.error('ElevenLabs API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    audioBlob = await response.blob();
    console.log('ElevenLabs TTS success:', { blobSize: audioBlob.size });

    // Log successful request to Firebase
    await logElevenLabsRequest({
      text: text,
      filename: filename || 'unknown',
      audioSize: audioBlob.size,
      success: true,
      source: source,
      duration: Date.now() - startTime
    });

    // Log usage stats
    await logUsageStats({
      requests: 1,
      characters: text.length,
      audioSize: audioBlob.size,
      source: source
    });

    return audioBlob;
  } catch (err) {
    error = err.message;
    console.error('ElevenLabs TTS error:', err);

    // Log failed request to Firebase
    await logElevenLabsRequest({
      text: text,
      filename: filename || 'unknown',
      audioSize: null,
      success: false,
      error: error,
      source: source,
      duration: Date.now() - startTime
    });

    throw new Error(`Failed to generate speech: ${error}`);
  }
};



/**
 * Play ElevenLabs generated speech
 */
export const playElevenLabsSpeech = async (text, filename = null, source = 'direct-play') => {
  try {
    const audioBlob = await generateElevenLabsSpeech(text, filename, source);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('Failed to play ElevenLabs speech:', error);
    throw error;
  }
};

/**
 * Test ElevenLabs configuration
 */
export const testElevenLabsConfig = async () => {
  try {
    const config = getElevenLabsConfig();
    
    if (!config.isEnabled || !config.apiKey) {
      throw new Error('ElevenLabs is not configured or enabled');
    }

    // Test with a simple Arabic phrase
    const testText = 'مرحبا';
    const audioBlob = await generateElevenLabsSpeech(testText, 'test_marhaba', 'config-test');
    
    if (audioBlob && audioBlob.size > 0) {
      return { success: true };
    } else {
      throw new Error('Generated audio is empty');
    }
  } catch (error) {
    console.error('ElevenLabs test error:', error);
    return { success: false, error: error.message };
  }
};