import React, { useState, useEffect } from 'react';
import { generateOnboardingImages, getCachedImages, cacheImages } from '../utils/openaiImageGenerator.js';
import { getThemeClass } from '../utils/themeUtils.js';
import { animateElement, staggerAnimation } from '../utils/animationUtils.js';
import TouchOptimizedButton from './TouchOptimizedButton.js';
import { SkeletonLoader } from './LoadingStates.js';

/**
 * OnboardingSplash Component
 * Shows a welcoming splash screen with OpenAI-generated images and menu options
 */
const OnboardingSplash = ({ onSelectContent, onSkip }) => {
  const [images, setImages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  // Content options for the Arabic learning app
  const contentOptions = [
    {
      id: 'verbs',
      title: 'Verbs',
      subtitle: 'Learn Arabic Action Words',
      description: 'Practice pronunciation of common Arabic verbs with interactive exercises',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      id: 'nouns',
      title: 'Nouns',
      subtitle: 'Everyday Objects & Things',
      description: 'Master Arabic nouns with visual learning and pronunciation practice',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      id: 'colors',
      title: 'Colors',
      subtitle: 'Vibrant Color Names',
      description: 'Learn Arabic color names with beautiful visual representations',
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    },
    {
      id: 'phrases',
      title: 'Phrases',
      subtitle: 'Common Expressions',
      description: 'Practice everyday Arabic phrases and conversational expressions',
      color: 'bg-orange-500',
      textColor: 'text-orange-700'
    }
  ];

  // Load images on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get cached images first
        const cachedImages = getCachedImages();
        if (cachedImages) {
          setImages(cachedImages);
          setIsLoading(false);
          return;
        }

        // Skip OpenAI image generation and use fallback design
        console.log('Using fallback images for onboarding...');
        setImages(null); // No images generated, will use fallback UI
        setIsLoading(false);
        
      } catch (err) {
        console.error('Failed to load onboarding images:', err);
        setError('Using fallback design. You can still use the app!');
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  // Handle content selection
  const handleContentSelect = (contentId) => {
    setSelectedOption(contentId);
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      onSelectContent(contentId);
    }, 300);
  };

  // Skip onboarding
  const handleSkip = () => {
    // Remember that user has seen onboarding
    localStorage.setItem('hasSeenOnboarding', 'true');
    onSkip();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 ${getThemeClass('general')}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            {isLoading && !images?.hero ? (
              <SkeletonLoader className="w-64 h-64 mx-auto rounded-full" />
            ) : images?.hero ? (
              <img 
                src={images.hero} 
                alt="Arabic Learning Welcome" 
                className="w-64 h-64 mx-auto rounded-full shadow-2xl object-cover animate-fade-in"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <span className="text-6xl">🌟</span>
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4 animate-fade-in-up">
            مرحبا بك
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2 animate-fade-in-up">
            Welcome to Arabic Learning
          </p>
          <p className="text-lg text-gray-500 animate-fade-in-up">
            Choose your learning path to start your Arabic journey
          </p>
        </div>

        {/* Content Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {contentOptions.map((option, index) => (
            <div 
              key={option.id}
              className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                selectedOption === option.id ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => handleContentSelect(option.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Image */}
              {isLoading && !images?.[option.id] ? (
                <SkeletonLoader className="w-full h-48" />
              ) : images?.[option.id] ? (
                <img 
                  src={images[option.id]} 
                  alt={option.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-full h-48 ${option.color} opacity-80`}></div>
              )}
              
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{option.title}</h3>
                <p className="text-lg mb-1 opacity-90">{option.subtitle}</p>
                <p className="text-sm opacity-80">{option.description}</p>
              </div>
              
              {/* Selection Indicator */}
              {selectedOption === option.id && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <TouchOptimizedButton
            onClick={handleSkip}
            variant="secondary"
            size="large"
            className="flex-1"
          >
            Skip & Browse All
          </TouchOptimizedButton>
          
          <TouchOptimizedButton
            onClick={() => handleContentSelect('verbs')}
            variant="primary"
            size="large"
            className="flex-1"
          >
            Start Learning
          </TouchOptimizedButton>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Interactive Arabic learning with speech recognition and AI-powered content
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSplash;