import React, { useState, useEffect } from 'react';

/**
 * Speech Configuration Component
 * Manages Azure Speech Service and ElevenLabs TTS settings
 */
const AzureSpeechConfig = ({ isOpen, onClose, onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState('eastus');
  const [isEnabled, setIsEnabled] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('jAAHNNqlbAX9iWjJPEtE');
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(false);
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseBucket, setFirebaseBucket] = useState('');
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('azure');
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('azure-speech-key');
    const savedRegion = localStorage.getItem('azure-speech-region') || 'eastus';
    const savedEnabled = localStorage.getItem('azure-speech-enabled') === 'true';
    const savedElevenLabsKey = localStorage.getItem('elevenlabs-key');
    const savedElevenLabsVoiceId = localStorage.getItem('elevenlabs-voice-id') || 'DANw8bnAVbjDEHwZIoYa';
    const savedElevenLabsEnabled = localStorage.getItem('elevenlabs-enabled') === 'true';
    const savedFirebaseProjectId = localStorage.getItem('firebase-project-id');
    const savedFirebaseBucket = localStorage.getItem('firebase-bucket');
    const savedFirebaseApiKey = localStorage.getItem('firebase-api-key');
    const savedFirebaseEnabled = localStorage.getItem('firebase-storage-enabled') === 'true';
    
    if (savedKey) setApiKey(savedKey);
    setRegion(savedRegion);
    setIsEnabled(savedEnabled);
    if (savedElevenLabsKey) setElevenLabsKey(savedElevenLabsKey);
    setElevenLabsVoiceId(savedElevenLabsVoiceId);
    setElevenLabsEnabled(savedElevenLabsEnabled);
    if (savedFirebaseProjectId) setFirebaseProjectId(savedFirebaseProjectId);
    if (savedFirebaseBucket) setFirebaseBucket(savedFirebaseBucket);
    if (savedFirebaseApiKey) setFirebaseApiKey(savedFirebaseApiKey);
    setFirebaseEnabled(savedFirebaseEnabled);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Save Azure settings
    if (apiKey.trim()) {
      localStorage.setItem('azure-speech-key', apiKey.trim());
    } else {
      localStorage.removeItem('azure-speech-key');
    }
    localStorage.setItem('azure-speech-region', region);
    localStorage.setItem('azure-speech-enabled', isEnabled.toString());
    
    // Save ElevenLabs settings
    if (elevenLabsKey.trim()) {
      localStorage.setItem('elevenlabs-key', elevenLabsKey.trim());
    } else {
      localStorage.removeItem('elevenlabs-key');
    }
    localStorage.setItem('elevenlabs-voice-id', elevenLabsVoiceId);
    localStorage.setItem('elevenlabs-enabled', elevenLabsEnabled.toString());
    
    // Save Firebase settings
    if (firebaseProjectId.trim()) {
      localStorage.setItem('firebase-project-id', firebaseProjectId.trim());
    } else {
      localStorage.removeItem('firebase-project-id');
    }
    if (firebaseBucket.trim()) {
      localStorage.setItem('firebase-bucket', firebaseBucket.trim());
    } else {
      localStorage.removeItem('firebase-bucket');
    }
    if (firebaseApiKey.trim()) {
      localStorage.setItem('firebase-api-key', firebaseApiKey.trim());
    } else {
      localStorage.removeItem('firebase-api-key');
    }
    localStorage.setItem('firebase-storage-enabled', firebaseEnabled.toString());
    
    // Notify parent component
    onConfigChange({
      azure: {
        apiKey: apiKey.trim(),
        region,
        isEnabled: isEnabled && apiKey.trim().length > 0
      },
      elevenlabs: {
        apiKey: elevenLabsKey.trim(),
        voiceId: elevenLabsVoiceId,
        isEnabled: elevenLabsEnabled && elevenLabsKey.trim().length > 0
      },
      firebase: {
        projectId: firebaseProjectId.trim(),
        bucket: firebaseBucket.trim(),
        apiKey: firebaseApiKey.trim(),
        isEnabled: firebaseEnabled && firebaseProjectId.trim().length > 0 && firebaseBucket.trim().length > 0
      }
    });
    
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  const handleTestAzure = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key first');
      return;
    }
    
    try {
      // Basic validation - try to create a speech config
      const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey.trim(), region);
      speechConfig.speechRecognitionLanguage = 'ar-SA';
      
      alert('API key appears to be valid! Click Save to enable Azure Speech.');
    } catch (error) {
      console.error('Azure Speech test failed:', error);
      alert('Failed to validate API key. Please check your key and region.');
    }
  };

  const handleTestElevenLabs = async () => {
    if (!elevenLabsKey.trim()) {
      alert('Please enter an ElevenLabs API key first');
      return;
    }
    
    try {
      // Test with a simple text-to-speech request
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey.trim()
        },
        body: JSON.stringify({
          text: 'مرحبا',
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 1,
            similarity_boost: 1,
            speed: 0.7
          }
        })
      });
      
      if (response.ok) {
        // Play the generated audio with padding
        const audioBlob = await response.blob();
        
        // Add silent padding to prevent audio cut-off
        try {
          const { playElevenLabsSpeech } = await import('./elevenLabsHelper');
          // Use the helper function which includes padding
          await playElevenLabsSpeech('مرحبا');
          alert('API key is valid! ElevenLabs TTS test successful. You should hear "مرحبا" (Hello).');
        } catch (playError) {
          console.error('Audio play error:', playError);
          
          // Fallback to direct play without padding
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.play().then(() => {
            alert('API key is valid! ElevenLabs TTS test successful.');
            URL.revokeObjectURL(audioUrl);
          }).catch(() => {
            alert('API key is valid, but failed to play audio. Check browser audio permissions.');
            URL.revokeObjectURL(audioUrl);
          });
        }
      } else {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        alert(`Failed to validate API key: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('ElevenLabs test failed:', error);
      alert('Failed to test ElevenLabs API. Please check your key and voice ID.');
    }
  };

  const handleTestFirebase = async () => {
    if (!firebaseProjectId.trim() || !firebaseBucket.trim()) {
      alert('Please enter Project ID and Bucket name first');
      return;
    }
    
    try {
      const { testFirebaseStorageConfig } = await import('./firebaseStorageHelper');
      
      // Temporarily save config for testing
      const originalEnabled = firebaseEnabled;
      setFirebaseEnabled(true);
      localStorage.setItem('firebase-project-id', firebaseProjectId.trim());
      localStorage.setItem('firebase-bucket', firebaseBucket.trim());
      localStorage.setItem('firebase-api-key', firebaseApiKey.trim());
      localStorage.setItem('firebase-storage-enabled', 'true');
      
      const result = await testFirebaseStorageConfig();
      
      // Restore original state
      setFirebaseEnabled(originalEnabled);
      
      if (result.success) {
        alert('Firebase Storage connection successful!');
      } else {
        alert(`Firebase Storage test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Firebase test failed:', error);
      alert('Failed to test Firebase Storage configuration.');
    }
  };

  const handleTestFirebaseUpload = async () => {
    if (!firebaseProjectId.trim() || !firebaseBucket.trim()) {
      alert('Please enter Project ID and Bucket name first');
      return;
    }
    
    try {
      const { testFirebaseStorageUpload } = await import('./firebaseStorageHelper');
      
      // Temporarily save config for testing
      const originalEnabled = firebaseEnabled;
      setFirebaseEnabled(true);
      localStorage.setItem('firebase-project-id', firebaseProjectId.trim());
      localStorage.setItem('firebase-bucket', firebaseBucket.trim());
      localStorage.setItem('firebase-api-key', firebaseApiKey.trim());
      localStorage.setItem('firebase-storage-enabled', 'true');
      
      const result = await testFirebaseStorageUpload();
      
      // Restore original state
      setFirebaseEnabled(originalEnabled);
      
      if (result.success) {
        alert('Firebase Storage upload test successful!');
      } else {
        alert(`Firebase Storage upload test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Firebase upload test failed:', error);
      alert('Failed to test Firebase Storage upload.');
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all speech settings?')) {
      setApiKey('');
      setRegion('eastus');
      setIsEnabled(false);
      setElevenLabsKey('');
      setElevenLabsVoiceId('DANw8bnAVbjDEHwZIoYa');
      setElevenLabsEnabled(false);
      setFirebaseProjectId('');
      setFirebaseBucket('');
      setFirebaseApiKey('');
      setFirebaseEnabled(false);
      
      localStorage.removeItem('azure-speech-key');
      localStorage.removeItem('azure-speech-region');
      localStorage.removeItem('azure-speech-enabled');
      localStorage.removeItem('elevenlabs-key');
      localStorage.removeItem('elevenlabs-voice-id');
      localStorage.removeItem('elevenlabs-enabled');
      localStorage.removeItem('firebase-project-id');
      localStorage.removeItem('firebase-bucket');
      localStorage.removeItem('firebase-api-key');
      localStorage.removeItem('firebase-storage-enabled');
      
      onConfigChange({ 
        azure: { apiKey: '', region: 'eastus', isEnabled: false },
        elevenlabs: { apiKey: '', voiceId: 'DANw8bnAVbjDEHwZIoYa', isEnabled: false },
        firebase: { projectId: '', bucket: '', apiKey: '', isEnabled: false }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Speech Configuration</h2>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('azure')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'azure'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Azure Speech
            </button>
            <button
              onClick={() => setActiveTab('elevenlabs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'elevenlabs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ElevenLabs TTS
            </button>
            <button
              onClick={() => setActiveTab('firebase')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'firebase'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Firebase Storage
            </button>
          </nav>
        </div>

        {/* Azure Tab */}
        {activeTab === 'azure' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="azure-enabled"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="azure-enabled" className="font-medium">
                Enable Azure Speech Recognition
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Azure Speech API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="eastus">East US</option>
                <option value="westus">West US</option>
                <option value="westus2">West US 2</option>
                <option value="eastus2">East US 2</option>
                <option value="centralus">Central US</option>
                <option value="westeurope">West Europe</option>
                <option value="northeurope">North Europe</option>
                <option value="southeastasia">Southeast Asia</option>
                <option value="eastasia">East Asia</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Azure Speech Recognition provides more accurate Arabic speech recognition.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleTestAzure}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>
          </div>
        )}

        {/* ElevenLabs Tab */}
        {activeTab === 'elevenlabs' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="elevenlabs-enabled"
                checked={elevenLabsEnabled}
                onChange={(e) => setElevenLabsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="elevenlabs-enabled" className="font-medium">
                Enable ElevenLabs TTS
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Voice ID</label>
              <input
                type="text"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                placeholder="DANw8bnAVbjDEHwZIoYa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">
                <strong>Note:</strong> ElevenLabs provides high-quality AI-generated voice synthesis for Arabic text.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleTestElevenLabs}
                disabled={!elevenLabsKey.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test
              </button>
              <button
                onClick={async () => {
                  if (!elevenLabsKey.trim()) {
                    alert('Please enter an API key first');
                    return;
                  }
                  
                  try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
                      method: 'POST',
                      headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': elevenLabsKey.trim()
                      },
                      body: JSON.stringify({
                        text: 'السلام عليكم',
                        model_id: 'eleven_flash_v2_5',
                        voice_settings: {
                          stability: 1,
                          similarity_boost: 1,
                          speed: 0.7
                        }
                      })
                    });
                    
                    if (response.ok) {
                      // Use the helper function with padding
                      try {
                        const { playElevenLabsSpeech } = await import('./elevenLabsHelper');
                        await playElevenLabsSpeech('السلام عليكم');
                        console.log('Playing "السلام عليكم" with padding');
                      } catch (playError) {
                        console.error('Audio play error:', playError);
                        
                        // Fallback to direct play
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        audio.play().then(() => {
                          console.log('Playing "السلام عليكم" (fallback)');
                          URL.revokeObjectURL(audioUrl);
                        }).catch(() => {
                          alert('Failed to play audio. Check browser audio permissions.');
                          URL.revokeObjectURL(audioUrl);
                        });
                      }
                    } else {
                      alert('Failed to generate audio. Check your API key.');
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to generate audio.');
                  }
                }}
                disabled={!elevenLabsKey.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Play "سلام عليكم"
              </button>
            </div>
          </div>
        )}

        {/* Firebase Tab */}
        {activeTab === 'firebase' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="firebase-enabled"
                checked={firebaseEnabled}
                onChange={(e) => setFirebaseEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="firebase-enabled" className="font-medium">
                Enable Firebase Storage Cache
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firebaseProjectId}
                onChange={(e) => setFirebaseProjectId(e.target.value)}
                placeholder="your-project-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Storage Bucket <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firebaseBucket}
                onChange={(e) => setFirebaseBucket(e.target.value)}
                placeholder="your-project-id.appspot.com or your-project-id.firebasestorage.app"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Web API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={firebaseApiKey}
                onChange={(e) => setFirebaseApiKey(e.target.value)}
                placeholder="Enter your Firebase Web API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm text-orange-700">
                <strong>Note:</strong> Firebase Storage will cache generated audio files in the cloud. 
                All users will benefit from shared cache, reducing API calls and improving performance.
                <br /><br />
                <strong>Logging:</strong> When configured, ElevenLabs API requests will be logged to Firebase Realtime Database for usage tracking and analytics.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleTestFirebase}
                disabled={!firebaseProjectId.trim() || !firebaseBucket.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test Connection
              </button>
              <button
                onClick={handleTestFirebaseUpload}
                disabled={!firebaseProjectId.trim() || !firebaseBucket.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test Upload
              </button>
              <button
                onClick={async () => {
                  if (!firebaseProjectId.trim()) {
                    alert('Please enter Project ID first');
                    return;
                  }
                  
                  try {
                    const { testFirebaseLogging } = await import('./firebaseLogger');
                    
                    // Temporarily save config for testing
                    const originalEnabled = firebaseEnabled;
                    setFirebaseEnabled(true);
                    localStorage.setItem('firebase-project-id', firebaseProjectId.trim());
                    localStorage.setItem('firebase-api-key', firebaseApiKey.trim());
                    
                    const result = await testFirebaseLogging();
                    
                    // Restore original state
                    setFirebaseEnabled(originalEnabled);
                    
                    if (result.success) {
                      alert('Firebase logging test successful!');
                    } else {
                      alert(`Firebase logging test failed: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('Firebase logging test failed:', error);
                    alert('Failed to test Firebase logging.');
                  }
                }}
                disabled={!firebaseProjectId.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test Logging
              </button>
            </div>
          </div>
        )}

        {/* Common Buttons */}
        <div className="flex space-x-2 pt-4 border-t border-gray-200 mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AzureSpeechConfig;