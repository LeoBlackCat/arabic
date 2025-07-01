import React, { useState, useEffect } from 'react';

/**
 * Azure Speech Configuration Component
 * Manages Azure Speech Service settings and API key storage
 */
const AzureSpeechConfig = ({ isOpen, onClose, onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState('eastus');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('azure-speech-key');
    const savedRegion = localStorage.getItem('azure-speech-region') || 'eastus';
    const savedEnabled = localStorage.getItem('azure-speech-enabled') === 'true';
    
    if (savedKey) setApiKey(savedKey);
    setRegion(savedRegion);
    setIsEnabled(savedEnabled);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Save to localStorage
    if (apiKey.trim()) {
      localStorage.setItem('azure-speech-key', apiKey.trim());
    } else {
      localStorage.removeItem('azure-speech-key');
    }
    localStorage.setItem('azure-speech-region', region);
    localStorage.setItem('azure-speech-enabled', isEnabled.toString());
    
    // Notify parent component
    onConfigChange({
      apiKey: apiKey.trim(),
      region,
      isEnabled: isEnabled && apiKey.trim().length > 0
    });
    
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  const handleTest = async () => {
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

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all Azure Speech settings?')) {
      setApiKey('');
      setRegion('eastus');
      setIsEnabled(false);
      localStorage.removeItem('azure-speech-key');
      localStorage.removeItem('azure-speech-region');
      localStorage.removeItem('azure-speech-enabled');
      onConfigChange({ apiKey: '', region: 'eastus', isEnabled: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Azure Speech Configuration</h2>
        
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
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

          {/* API Key Input */}
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

          {/* Region Select */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Region
            </label>
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

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Azure Speech Recognition provides more accurate Arabic speech recognition. 
              Get your free API key from the Azure Portal.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleTest}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Test
            </button>
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
              Clear
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
    </div>
  );
};

export default AzureSpeechConfig;