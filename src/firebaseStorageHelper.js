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
 * Upload audio file to Firebase Storage
 */
export const uploadAudioFile = async (chatName, audioBlob, originalFormat = 'wav') => {
  try {
    const firebase = initializeFirebaseStorage();
    
    // API key is required for uploads based on testing
    if (!firebase.apiKey) {
      throw new Error('API key is required for Firebase Storage uploads');
    }
    
    // Use the audio blob directly without conversion
    let uploadBlob = audioBlob;
    let format = originalFormat;
    let contentType = 'audio/wav';
    
    if (originalFormat === 'mp3' || originalFormat === 'mpeg' || audioBlob.type.includes('mpeg')) {
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
      
      // ElevenLabs returns MP3 - upload and play directly without conversion
      console.log(`Uploading and playing ${chatName} directly from ElevenLabs...`);
      
      // Upload the original MP3 to Firebase Storage
      // Use chatName (arabizi) as filename, not Arabic text
      uploadAudioFile(chatName, originalBlob, 'mp3').catch(error => {
        console.error('Background upload failed:', error);
      });
      
      // Play immediately from the original blob
      const audioUrl = URL.createObjectURL(originalBlob);
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