/**
 * Azure Speech Recognition Helper
 * Provides functions to interact with Azure Speech Services
 */

let SpeechSDK = null;

// Lazy load the Speech SDK
const loadSpeechSDK = async () => {
  if (!SpeechSDK) {
    SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');
  }
  return SpeechSDK;
};

/**
 * Get Azure Speech configuration from localStorage
 */
export const getAzureSpeechConfig = () => {
  const apiKey = localStorage.getItem('azure-speech-key');
  const region = localStorage.getItem('azure-speech-region') || 'eastus';
  const isEnabled = localStorage.getItem('azure-speech-enabled') === 'true';
  
  return {
    apiKey,
    region,
    isEnabled: isEnabled && apiKey && apiKey.length > 0
  };
};

/**
 * Check if Azure Speech is available and configured
 */
export const isAzureSpeechAvailable = () => {
  const config = getAzureSpeechConfig();
  return config.isEnabled && config.apiKey;
};

/**
 * Create Azure Speech Recognizer with Arabic-only configuration
 */
export const createAzureSpeechRecognizer = async () => {
  const config = getAzureSpeechConfig();
  
  if (!config.isEnabled || !config.apiKey) {
    throw new Error('Azure Speech is not configured or enabled');
  }

  try {
    const SDK = await loadSpeechSDK();
    
    // Create speech config with Arabic-specific settings
    const speechConfig = SDK.SpeechConfig.fromSubscription(config.apiKey, config.region);
    speechConfig.speechRecognitionLanguage = 'ar-SA'; // Arabic (Saudi Arabia)
    
    // Set additional Arabic-specific properties
    speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_RecoLanguage, 'ar-SA');
    speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, '5000');
    speechConfig.setProperty(SDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, '1000');
    
    // Enable detailed result to get confidence scores
    speechConfig.outputFormat = SDK.OutputFormat.Detailed;
    
    // Create audio config (use default microphone)
    const audioConfig = SDK.AudioConfig.fromDefaultMicrophoneInput();
    
    // Create recognizer
    const recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);
    
    return { recognizer, SDK };
  } catch (error) {
    console.error('Failed to create Azure Speech recognizer:', error);
    throw new Error('Failed to initialize Azure Speech Recognition');
  }
};

/**
 * Check if text contains Arabic characters
 */
const containsArabic = (text) => {
  if (!text) return false;
  // Arabic Unicode range: \u0600-\u06FF
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Clean and validate Arabic recognition result
 */
const processArabicResult = (text) => {
  if (!text) return null;
  
  // Remove common English artifacts and punctuation
  const cleaned = text
    .replace(/[.,"'?!]/g, '') // Remove punctuation
    .replace(/\b(the|at|so|and|or|in|on|to|of|a|an)\b/gi, '') // Remove common English words
    .trim();
  
  // Check if result contains Arabic after cleaning
  if (!containsArabic(cleaned)) {
    console.log('[Azure Speech] No Arabic detected in result:', text);
    return null;
  }
  
  return cleaned;
};

/**
 * Start Azure Speech Recognition with Arabic validation
 * Returns a promise that resolves with the recognized text
 */
export const startAzureSpeechRecognition = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const { recognizer, SDK } = await createAzureSpeechRecognizer();
      
      // Set up event handlers
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          
          if (result.reason === SDK.ResultReason.RecognizedSpeech) {
            console.log('[Azure Speech] Raw result:', result.text);
            
            // Process and validate the result
            const processedText = processArabicResult(result.text);
            
            if (processedText) {
              console.log('[Azure Speech] Processed Arabic result:', processedText);
              resolve({
                success: true,
                text: processedText,
                confidence: result.properties?.getProperty(SDK.PropertyId.SpeechServiceResponse_JsonResult),
                rawText: result.text
              });
            } else {
              console.log('[Azure Speech] Result rejected - no valid Arabic content');
              resolve({
                success: false,
                text: '',
                error: 'No Arabic speech detected',
                rawText: result.text
              });
            }
          } else if (result.reason === SDK.ResultReason.NoMatch) {
            console.log('[Azure Speech] No speech could be recognized');
            resolve({
              success: false,
              text: '',
              error: 'No speech recognized'
            });
          } else {
            console.log('[Azure Speech] Recognition failed:', result.reason);
            reject(new Error(`Recognition failed: ${result.reason}`));
          }
        },
        (error) => {
          console.error('[Azure Speech] Recognition error:', error);
          recognizer.close();
          reject(new Error(`Azure Speech error: ${error}`));
        }
      );
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Test Azure Speech configuration
 */
export const testAzureSpeechConfig = async () => {
  try {
    const { recognizer } = await createAzureSpeechRecognizer();
    recognizer.close(); // Just test creation, don't actually recognize
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};