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
    
    // Force Arabic script output (not Latin transliteration)
    speechConfig.setProperty(SDK.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, 'true');
    speechConfig.setProperty('Locale', 'ar-SA');
    speechConfig.setProperty('Language', 'ar-SA');
    
    console.log('[Azure Speech] Configuration:');
    console.log('  - Language:', speechConfig.speechRecognitionLanguage);
    console.log('  - Region:', config.region);
    console.log('  - Output Format:', speechConfig.outputFormat);
    
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
 * Check if text contains Arabic characters or Arabic transliteration
 */
const containsArabic = (text) => {
  if (!text) return false;
  
  console.log('[Azure Speech] Checking for Arabic in:', text);
  
  // Check for Arabic script first (preferred)
  if (/[\u0600-\u06FF]/.test(text)) {
    console.log('[Azure Speech] ✓ Arabic script detected');
    return true;
  }
  
  // Check for Arabic transliteration patterns (temporary workaround for Azure)
  const arabicTransliterationPatterns = [
    // Verb conjugations - various spellings Azure might use
    /\b(na7eb|ya7eb|ta7eb|a7eb|n7eb)\b/i, // love conjugations
    /\b(nalab|yalab|talab|alab|nlab)\b/i, // play conjugations  
    /\b(nagra|yagra|tagra|agra|ngra)\b/i, // read conjugations
    /\b(nafta|yafta|tafta|afta|nfta)\b/i, // open conjugations (نفتح)
    /\b(nadfa3|yadfa3|tadfa3|adfa3|ndfa3)\b/i, // pay conjugations (ندفع)
    /\b(nafta|yafta|tafta|afta)\b/i, // open variations
    
    // Time expressions - Azure variations
    /\b(kil|kul|ku)\s+(sob7|masa|jum3a|youm|juma)\b/i, // time expressions
    /\b(youm|yoom|yom)\s+(el\s*)?(a7ad|ethnain|thalatha|arba3a|khemees|jum3a|sabt)\b/i, // days
    /\b(kujuma|kiljuma|kiljum3a|kul\s*juma)\b/i, // Friday variations
    
    // Common Arabic patterns Azure might produce
    /\b(el|al|il)\s*[a-z]+/i, // definite articles
    /\b[a-z]*7[a-z]*|[a-z]*3[a-z]*|[a-z]*gh[a-z]*\b/i, // numbers in transliteration (7=ح, 3=ع)
    /\b(sa|ba|ma|wa|la|fa)\s*[a-z]+/i, // Arabic prefixes
    /\b[a-z]+\s*(oun|oon|een|at|ah|eh)\b/i, // Arabic suffixes
    /\b(min|max|fee|3ala|3and|ma3)\b/i, // common prepositions
    
    // Specific patterns seen in Azure logs
    /\b(nafta)\s*(ku|kil|kul)?\s*(juma|jum3a)\b/i, // "nafta kujuma" pattern
    
    // More permissive catch-all for Arabic-like words
    /\b[a-z]{3,}[aeiou][a-z]+\b/i // Words that look Arabic-ish
  ];
  
  // Check each pattern and log which one matches
  for (let i = 0; i < arabicTransliterationPatterns.length; i++) {
    const pattern = arabicTransliterationPatterns[i];
    if (pattern.test(text)) {
      console.log(`[Azure Speech] ✓ Transliteration pattern ${i + 1} matched:`, pattern.source);
      return true;
    }
  }
  
  console.log('[Azure Speech] ✗ No Arabic or transliteration patterns detected');
  return false;
};

/**
 * Convert Arabic transliteration to Arabic script (basic mapping)
 */
const transliterationToArabic = (text) => {
  // Expanded transliteration mapping for Azure Speech recognition
  const transliterationMap = {
    // Verb conjugations - play
    'nalab': 'نلعب',
    'yalab': 'يلعب', 
    'talab': 'تلعب',
    'alab': 'ألعب',
    'nlab': 'نلعب',
    'ylab': 'يلعب',
    'tlab': 'تلعب',
    'lab': 'ألعب',
    
    // Verb conjugations - open (نفتح)
    'nafta': 'نفتح',
    'yafta': 'يفتح',
    'tafta': 'تفتح', 
    'afta': 'أفتح',
    'nfta': 'نفتح',
    'yfta': 'يفتح',
    'tfta': 'تفتح',
    'fta': 'أفتح',
    
    // Verb conjugations - pay (ندفع)
    'nadfa3': 'ندفع',
    'yadfa3': 'يدفع',
    'tadfa3': 'تدفع',
    'adfa3': 'أدفع',
    'ndfa3': 'ندفع',
    'ydfa3': 'يدفع', 
    'tdfa3': 'تدفع',
    'dfa3': 'أدفع',
    
    // Verb conjugations - love
    'na7eb': 'نحب',
    'ya7eb': 'يحب',
    'ta7eb': 'تحب',
    'a7eb': 'أحب',
    'n7eb': 'نحب',
    'y7eb': 'يحب',
    't7eb': 'تحب',
    '7eb': 'أحب',
    
    // Verb conjugations - read
    'nagra': 'نقرأ',
    'yagra': 'يقرأ',
    'tagra': 'تقرأ',
    'agra': 'أقرأ',
    'nagara': 'نقرأ',
    'yagara': 'يقرأ',
    'tagara': 'تقرأ',
    'agara': 'أقرأ',
    
    // Time expressions - Azure variations
    'kiljuma': 'كل جمعة',
    'kil juma': 'كل جمعة',
    'kil jum3a': 'كل جمعة',
    'kiljum3a': 'كل جمعة',
    'kujuma': 'كل جمعة',  // Azure variation
    'ku juma': 'كل جمعة', // Azure variation
    'kul juma': 'كل جمعة',
    'kuljuma': 'كل جمعة',
    'kil sob7': 'كل صبح',
    'kilsob7': 'كل صبح',
    'kil masa': 'كل مسا',
    'kilmasa': 'كل مسا',
    
    // Days of the week
    'youm el a7ad': 'يوم الأحد',
    'youm ela7ad': 'يوم الأحد',
    'youm el ethnain': 'يوم الاثنين',
    'youm elethnain': 'يوم الاثنين',
    'youm el thalatha': 'يوم الثلاثاء',
    'youm elthalatha': 'يوم الثلاثاء',
    'youm el arba3a': 'يوم الأربعاء',
    'youm elarba3a': 'يوم الأربعاء',
    'youm el khemees': 'يوم الخميس',
    'youm elkhemees': 'يوم الخميس',
    'youm el sabt': 'يوم السبت',
    'youm elsabt': 'يوم السبت',
    
    // Common words
    'marhaba': 'مرحبا',
    'ahlan': 'أهلا',
    'shukran': 'شكرا',
    'min fadlak': 'من فضلك',
    'minfadlak': 'من فضلك',
    'inshallah': 'إن شاء الله',
    'alhamdulillah': 'الحمد لله',
    
    // Specific Azure patterns found in logs
    'nafta kujuma': 'نفتح كل جمعة',
    'nafta ku juma': 'نفتح كل جمعة',
    'naftakujuma': 'نفتح كل جمعة'
  };
  
  let result = text.toLowerCase();
  
  // Replace known patterns (try longest matches first to avoid partial replacements)
  const sortedEntries = Object.entries(transliterationMap)
    .sort(([a], [b]) => b.length - a.length); // Sort by length descending
    
  sortedEntries.forEach(([transliteration, arabic]) => {
    const regex = new RegExp('\\b' + transliteration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    result = result.replace(regex, arabic);
  });
  
  // Handle some special cases where Azure might return variations
  result = result
    // Fix common Azure variations for time expressions
    .replace(/\b(kil|ku|kul)\s+(juma|jum3a)\b/gi, 'كل جمعة')
    .replace(/\b(kujuma|kuljuma)\b/gi, 'كل جمعة')
    .replace(/\b(nafta)\s+(kujuma|kiljuma)\b/gi, 'نفتح كل جمعة')
    .replace(/\b(youm)\s+(el)\s+([a-z]+)/gi, (match, p1, p2, p3) => {
      const dayMap = {
        'a7ad': 'يوم الأحد',
        'ethnain': 'يوم الاثنين', 
        'thalatha': 'يوم الثلاثاء',
        'arba3a': 'يوم الأربعاء',
        'khemees': 'يوم الخميس',
        'sabt': 'يوم السبت'
      };
      return dayMap[p3.toLowerCase()] || match;
    })
    // Handle standalone verb+time combinations
    .replace(/\b(nafta|nfta)\b/gi, 'نفتح')
    .replace(/\b(nadfa3|ndfa3)\b/gi, 'ندفع');
  
  console.log('[Azure Speech] Transliteration conversion:');
  console.log('  - Input:', text);
  console.log('  - Output:', result);
  console.log('  - Changed:', text !== result);
  console.log('  - Contains Arabic after conversion:', /[\u0600-\u06FF]/.test(result));
  
  // If no conversion happened but we're in this function, try a more aggressive approach
  if (text === result && !/[\u0600-\u06FF]/.test(result)) {
    console.log('[Azure Speech] No conversion applied - attempting fallback...');
    // For very specific cases, try direct mapping of the whole phrase
    const commonPhrases = {
      'nafta kujuma': 'نفتح كل جمعة',
      'nafta ku juma': 'نفتح كل جمعة',
      'naftakujuma': 'نفتح كل جمعة'
    };
    
    const lowerText = text.toLowerCase().trim().replace(/[.,!?]/g, '');
    if (commonPhrases[lowerText]) {
      result = commonPhrases[lowerText];
      console.log('[Azure Speech] Applied fallback conversion:', result);
    }
  }
  return result;
};

/**
 * Clean and validate Arabic recognition result
 */
const processArabicResult = (text) => {
  if (!text) return null;
  
  // Remove common English artifacts and punctuation
  let cleaned = text
    .replace(/[.,"'?!]/g, '') // Remove punctuation
    .replace(/\b(the|at|so|and|or|in|on|to|of|a|an)\b/gi, '') // Remove common English words
    .trim();
  
  // Check if result contains Arabic after cleaning
  if (!containsArabic(cleaned)) {
    console.log('[Azure Speech] No Arabic detected in result:', text);
    return null;
  }
  
  // If it's transliteration, try to convert to Arabic script
  if (!/[\u0600-\u06FF]/.test(cleaned)) {
    cleaned = transliterationToArabic(cleaned);
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