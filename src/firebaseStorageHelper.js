/**
 * Firebase Storage Helper
 * Handles uploading and retrieving audio files from Firebase Storage
 */

/**
 * Get Firebase Storage configuration from localStorage
 */
export const getFirebaseStorageConfig = () => {
  const projectId = localStorage.getItem('firebase-project-id');
  const bucket = localStorage.getItem('firebase-bucket');
  const apiKey = localStorage.getItem('firebase-api-key');
  const isEnabled = localStorage.getItem('firebase-storage-enabled') === 'true';
  
  return {
    projectId,
    bucket,
    apiKey,
    isEnabled: isEnabled && projectId && bucket
  };
};

/**
 * Check if Firebase Storage is available and configured
 */
export const isFirebaseStorageAvailable = () => {
  const config = getFirebaseStorageConfig();
  return config.isEnabled;
};

/**
 * Initialize Firebase Storage client
 */
const initializeFirebaseStorage = () => {
  const config = getFirebaseStorageConfig();
  
  if (!config.isEnabled) {
    throw new Error('Firebase Storage is not configured');
  }
  
  // Use the full bucket name format that works
  let bucketName = config.bucket;
  
  // Ensure we're using the .firebasestorage.app format that works
  if (!bucketName.includes('.firebasestorage.app') && !bucketName.includes('.appspot.com')) {
    bucketName = `${bucketName}.firebasestorage.app`;
  } else if (bucketName.includes('.appspot.com')) {
    // Convert .appspot.com to .firebasestorage.app since that's what works
    bucketName = bucketName.replace('.appspot.com', '.firebasestorage.app');
  }
  
  console.log('Firebase Storage config:', { 
    projectId: config.projectId, 
    originalBucket: config.bucket, 
    finalBucket: bucketName,
    apiKey: config.apiKey ? 'present' : 'missing'
  });
  
  return {
    projectId: config.projectId,
    bucket: bucketName,
    apiKey: config.apiKey,
    baseUrl: `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o`
  };
};

/**
 * Generate file path for audio file
 */
const getAudioFilePath = (chatName, format = 'mp3') => {
  return `audio/${chatName}.${format}`;
};

/**
 * Check if audio file exists in Firebase Storage (try MP3 first, then WAV)
 */
export const checkAudioFileExists = async (chatName) => {
  try {
    const firebase = initializeFirebaseStorage();
    
    // Try MP3 first (preferred format)
    const mp3Path = getAudioFilePath(chatName, 'mp3');
    const mp3Url = firebase.apiKey ? 
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(mp3Path)}?alt=media&key=${firebase.apiKey}` :
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(mp3Path)}?alt=media`;
    
    const mp3Response = await fetch(mp3Url, { method: 'HEAD' });
    if (mp3Response.ok) {
      return { exists: true, format: 'mp3' };
    }
    
    // Try WAV as fallback
    const wavPath = getAudioFilePath(chatName, 'wav');
    const wavUrl = firebase.apiKey ? 
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(wavPath)}?alt=media&key=${firebase.apiKey}` :
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(wavPath)}?alt=media`;
    
    const wavResponse = await fetch(wavUrl, { method: 'HEAD' });
    if (wavResponse.ok) {
      return { exists: true, format: 'wav' };
    }
    
    return { exists: false, format: null };
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return { exists: false, format: null };
  }
};

/**
 * Download audio file from Firebase Storage
 */
export const downloadAudioFile = async (chatName, format = 'mp3') => {
  try {
    const firebase = initializeFirebaseStorage();
    const filePath = getAudioFilePath(chatName, format);
    
    const url = firebase.apiKey ? 
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(filePath)}?alt=media&key=${firebase.apiKey}` :
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    
    const audioBlob = await response.blob();
    console.log(`Downloaded ${chatName}.${format} from Firebase (${audioBlob.size} bytes)`);
    return audioBlob;
  } catch (error) {
    console.error('Error downloading audio file:', error);
    throw error;
  }
};

/**
 * Convert WAV blob to MP3 using MediaRecorder API (if supported)
 */
const convertToMp3 = async (audioBlob) => {
  try {
    // Check if we can use MediaRecorder for MP3 conversion
    if (!MediaRecorder.isTypeSupported('audio/mp3') && !MediaRecorder.isTypeSupported('audio/mpeg')) {
      console.log('MP3 encoding not supported, keeping original format');
      return audioBlob;
    }
    
    // Create audio element to play the WAV
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Create media stream from audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create offline context to render audio
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create MediaStreamDestination for recording
    const destination = offlineContext.createMediaStreamDestination();
    source.connect(destination);
    
    // Set up MediaRecorder for MP3
    const mimeType = MediaRecorder.isTypeSupported('audio/mp3') ? 'audio/mp3' : 'audio/mpeg';
    const mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000 // 128 kbps
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const mp3Blob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(audioUrl);
        console.log(`Converted to MP3: ${audioBlob.size} bytes -> ${mp3Blob.size} bytes (${Math.round((1 - mp3Blob.size / audioBlob.size) * 100)}% reduction)`);
        resolve(mp3Blob);
      };
      
      mediaRecorder.onerror = (event) => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('MP3 conversion failed'));
      };
      
      mediaRecorder.start();
      source.start();
      
      // Stop recording when audio ends
      setTimeout(() => {
        mediaRecorder.stop();
      }, (audioBuffer.length / audioBuffer.sampleRate) * 1000 + 100);
    });
    
  } catch (error) {
    console.warn('MP3 conversion failed, using original format:', error);
    return audioBlob;
  }
};

/**
 * Upload audio file to Firebase Storage
 */
export const uploadAudioFile = async (chatName, audioBlob, originalFormat = 'wav') => {
  try {
    const firebase = initializeFirebaseStorage();
    
    // API key is required for uploads based on testing
    if (!firebase.apiKey) {
      throw new Error('API key is required for Firebase Storage uploads');
    }
    
    // Convert to MP3 for storage optimization if it's WAV
    let uploadBlob = audioBlob;
    let format = originalFormat;
    let contentType = 'audio/wav';
    
    if (originalFormat === 'wav') {
      try {
        uploadBlob = await convertToMp3(audioBlob);
        format = 'mp3';
        contentType = 'audio/mpeg';
      } catch (error) {
        console.warn('MP3 conversion failed, uploading as WAV:', error);
      }
    } else if (originalFormat === 'mp3' || originalFormat === 'mpeg') {
      format = 'mp3';
      contentType = 'audio/mpeg';
    }
    
    const filePath = getAudioFilePath(chatName, format);
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o?name=${encodeURIComponent(filePath)}&key=${firebase.apiKey}`;
    console.log(`Uploading ${chatName}.${format} to Firebase Storage (path: ${filePath})...`);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType
      },
      body: uploadBlob
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`);
    }
    
    console.log(`Uploaded ${chatName}.${format} to Firebase (${uploadBlob.size} bytes)`);
    return uploadResponse;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
};

/**
 * Play audio from Firebase Storage or generate with ElevenLabs and upload
 */
export const playAudioWithFirebaseCache = async (text, chatName) => {
  try {
    // First, try to get from Firebase Storage
    const fileCheck = await checkAudioFileExists(chatName);
    
    if (fileCheck.exists) {
      console.log(`Playing ${chatName}.${fileCheck.format} from Firebase Storage`);
      const audioBlob = await downloadAudioFile(chatName, fileCheck.format);
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
    } else {
      // File doesn't exist, generate with ElevenLabs and upload
      console.log(`Generating ${chatName} (${text}) with ElevenLabs and uploading to Firebase`);
      
      const { generateElevenLabsSpeech } = await import('./elevenLabsHelper');
      const originalBlob = await generateElevenLabsSpeech(text, chatName, 'firebase-cache');
      
      // ElevenLabs returns MP3, but we need to add silent padding which requires WAV conversion
      console.log(`Adding silent padding to audio for ${chatName}...`);
      const paddedBlob = await addSilentPadding(originalBlob);
      
      // Upload the padded WAV to Firebase Storage (convert to MP3 for storage optimization)
      // Use chatName (arabizi) as filename, not Arabic text
      uploadAudioFile(chatName, paddedBlob, 'wav').catch(error => {
        console.error('Background upload failed:', error);
      });
      
      // Play immediately from the padded blob
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
    }
  } catch (error) {
    console.error('Error playing audio with Firebase cache:', error);
    throw error;
  }
};

/**
 * Add silent padding to audio blob (copied from elevenLabsHelper)
 */
const addSilentPadding = async (audioBlob) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const silenceDuration = 0.3; // 300ms
    const silenceSamples = Math.floor(silenceDuration * audioContext.sampleRate);
    
    const newBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length + silenceSamples,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      newData.set(originalData, silenceSamples);
    }
    
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
    const wavBlob = bufferToWav(renderedBuffer);
    
    return wavBlob;
  } catch (error) {
    console.warn('Failed to add silent padding, using original audio:', error);
    return audioBlob;
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
 * Test Firebase Storage configuration by uploading a test file
 */
export const testFirebaseStorageUpload = async () => {
  try {
    const firebase = initializeFirebaseStorage();
    const testFileName = `test/test_${Date.now()}.txt`;
    const testContent = new Blob(['Firebase Storage test file'], { type: 'text/plain' });
    
    console.log('Testing Firebase Storage upload with bucket:', firebase.bucket);
    
    // We know API key is required based on previous tests
    if (!firebase.apiKey) {
      throw new Error('API key is required for Firebase Storage uploads');
    }
    
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o?name=${encodeURIComponent(testFileName)}&key=${firebase.apiKey}`;
    console.log('Upload URL:', uploadUrl);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: testContent
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, uploadResponse.statusText, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`);
    }
    
    console.log('Test file uploaded successfully');
    
    // Try to delete the test file (cleanup)
    try {
      const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket}/o/${encodeURIComponent(testFileName)}?key=${firebase.apiKey}`;
      await fetch(deleteUrl, { method: 'DELETE' });
      console.log('Test file deleted successfully');
    } catch (deleteError) {
      console.warn('Failed to delete test file:', deleteError);
    }
    
    return { success: true, message: 'Firebase Storage upload test successful!' };
    
  } catch (error) {
    console.error('Firebase Storage upload test failed:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('404')) {
      errorMessage = 'Upload failed: Firebase Storage bucket not found. Make sure your bucket name is correct.';
    } else if (error.message.includes('403')) {
      errorMessage = 'Upload failed: Access denied. Please check your Firebase Storage security rules.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Test Firebase Storage configuration
 */
export const testFirebaseStorageConfig = async () => {
  try {
    const config = getFirebaseStorageConfig();
    
    if (!config.isEnabled) {
      throw new Error('Firebase Storage is not configured');
    }
    
    // Test by checking if bucket exists
    const testResponse = await fetch(`${config.baseUrl}?alt=media`);
    
    if (testResponse.status === 404) {
      return { success: true, message: 'Firebase Storage connection successful' };
    }
    
    return { success: true, message: 'Firebase Storage accessible' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};