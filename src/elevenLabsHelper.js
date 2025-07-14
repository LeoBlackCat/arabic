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
  const voiceId = localStorage.getItem('elevenlabs-voice-id') || 'DANw8bnAVbjDEHwZIoYa';
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
        text: ` ${text}`, // Add space before text to help with initial audio cut-off
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
 * Add silent padding to the beginning of audio blob
 */
const addSilentPadding = async (audioBlob) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create new buffer with 1.0 seconds of silence at the beginning
    const silenceDuration = 1.0; // 1000ms of silence
    const silenceSamples = Math.floor(silenceDuration * audioContext.sampleRate);
    
    const newBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length + silenceSamples,
      audioContext.sampleRate
    );
    
    // Copy original audio data after the silence
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      
      // First part: silence (already zeros by default)
      // Second part: original audio
      newData.set(originalData, silenceSamples);
    }
    
    // Convert back to blob
    const offlineContext = new OfflineAudioContext(
      newBuffer.numberOfChannels,
      newBuffer.length,
      newBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = newBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV blob
    const wavBlob = await bufferToWav(renderedBuffer);
    return wavBlob;
  } catch (error) {
    console.warn('Failed to add silent padding, using original audio:', error);
    return audioBlob; // fallback to original if padding fails
  }
};

/**
 * Convert AudioBuffer to WAV blob
 */
const bufferToWav = (buffer) => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

/**
 * Play ElevenLabs generated speech
 */
export const playElevenLabsSpeech = async (text, filename = null, source = 'direct-play') => {
  try {
    const audioBlob = await generateElevenLabsSpeech(text, filename, source);
    const paddedBlob = await addSilentPadding(audioBlob);
    const audioUrl = URL.createObjectURL(paddedBlob);
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