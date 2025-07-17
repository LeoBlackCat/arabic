import React, { useState, useEffect, useRef } from 'react';
import { animateElement, createRippleEffect } from './utils/animationUtils.js';
import { getThemeClass } from './utils/themeUtils.js';
import { ArabicText, ArabiziText } from './components/LanguageText.js';
import { optimizeTouchTarget, createHapticFeedback } from './utils/touchUtils.js';

/**
 * MediaDisplay Component
 * 
 * Displays content in this priority order:
 * 1. Video (.mp4) if available
 * 2. Image (.png) if video fails or doesn't exist  
 * 3. Text card with English/Arabic/Chat if both media files fail
 * For colors, always shows colored square instead
 */
const MediaDisplay = ({ 
  item, 
  contentType, 
  className = "", 
  onClick = null,
  autoPlay = true,
  loop = true,
  muted = true,
  style = {},
  enableHoverPlay = false
}) => {
  const [mediaType, setMediaType] = useState('loading'); // 'loading', 'video', 'image', 'color', 'text'
  const [hasError, setHasError] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for animations
  const containerRef = useRef(null);
  const mediaRef = useRef(null);

  // Reset state when item changes
  useEffect(() => {
    console.log('🖼️ MediaDisplay: Item changed to:', item?.chat || 'null');
    setHasError(false);
    setVideoRef(null);
    setIsHovered(false);
    setIsLoading(true);
  }, [item]);

  // Animate container when media loads
  useEffect(() => {
    if (containerRef.current && mediaType !== 'loading' && isLoading) {
      animateElement(containerRef.current, 'fadeInUp', { duration: 300 });
      setIsLoading(false);
    }
  }, [mediaType, isLoading]);

  // Determine media type based on available data
  useEffect(() => {
    if (contentType === 'colors') {
      setMediaType('color');
      return;
    }

    // Use manifest data if available, otherwise try detection
    if (item.hasVideo) {
      console.log('📹 MediaDisplay: Setting media type to video for:', item.chat);
      setMediaType('video');
    } else if (item.hasImage || item.url) {
      console.log('🖼️ MediaDisplay: Setting media type to image for:', item.chat);
      setMediaType('image');
    } else {
      // Fallback: Try to detect video first
      setMediaType('loading');
      setHasError(false);
      
      const videoPath = `./pictures/${item.chat.toLowerCase()}.mp4`;
      const video = document.createElement('video');
      
      video.onloadeddata = () => {
        setMediaType('video');
      };
      
      video.onerror = () => {
        // Video failed, fall back to image
        setMediaType('image');
      };
      
      video.src = videoPath;
    }
  }, [item, contentType]);

  const handleVideoError = () => {
    console.log(`Video failed for ${item.chat}, falling back to image`);
    // Only fallback to image if we know it exists
    if (item.hasImage) {
      setMediaType('image');
    } else {
      setMediaType('text');
    }
    setHasError(true);
  };

  const handleImageError = (e) => {
    console.log(`Image failed for ${item.chat}, falling back to text:`, e);
    setMediaType('text');
    setHasError(true);
  };

  // Enhanced click handler with ripple effect and haptic feedback
  const handleClick = (event) => {
    if (containerRef.current) {
      createRippleEffect(containerRef.current, event);
    }
    
    // Add haptic feedback for touch devices
    createHapticFeedback('light');
    
    if (onClick) {
      onClick(event);
    }
  };

  // Touch optimization effect
  useEffect(() => {
    if (containerRef.current) {
      optimizeTouchTarget(containerRef.current, 44);
    }
  }, [mediaType]);

  // Hover handlers for video and subtitle
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (enableHoverPlay && videoRef && mediaType === 'video') {
      videoRef.play().catch(e => console.log('Video play failed:', e));
    }
    
    // Add hover animation
    if (mediaRef.current) {
      animateElement(mediaRef.current, 'hoverLift', { duration: 200 });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (enableHoverPlay && videoRef && mediaType === 'video') {
      videoRef.pause();
      videoRef.currentTime = 0; // Reset to beginning
    }
  };

  // Render based on media type
  if (contentType === 'colors' || mediaType === 'color') {
    return (
      <div 
        ref={containerRef}
        className={`w-64 h-64 rounded-xl shadow-lg border-2 border-neutral-200 flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${className} ${getThemeClass(contentType)}`}
        style={{ backgroundColor: item.color || '#CCCCCC', ...style }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-center">
          <div 
            className="text-2xl font-bold mb-2 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300"
            style={{ 
              color: item.color === '#FFFFFF' || item.color === '#FFFF00' ? '#000000' : '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          >
            {item.eng}
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'loading') {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-neutral-100 rounded-xl shadow-md ${className}`} 
        style={style}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner-lg"></div>
          <div className="text-neutral-500 text-sm font-medium">Loading media...</div>
        </div>
      </div>
    );
  }

  if (mediaType === 'text') {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border-2 border-neutral-200 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${className} ${getThemeClass(contentType)}`}
        style={{ minHeight: '120px', ...style }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-center p-6">
          <div className="text-xl font-bold text-neutral-800 mb-2">
            {item.eng}
          </div>
          {item.ar && (
            <ArabicText size="lg" className="text-primary font-medium">
              {item.ar}
            </ArabicText>
          )}
          {item.chat && (
            <ArabiziText size="sm" className="text-neutral-500 mt-1">
              ({item.chat})
            </ArabiziText>
          )}
        </div>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div 
        ref={containerRef}
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={(el) => {
            setVideoRef(el);
            mediaRef.current = el;
          }}
          className={`rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${className}`}
          style={style}
          onClick={handleClick}
          onError={handleVideoError}
          autoPlay={enableHoverPlay ? false : autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          controls={false}
        >
          <source src={`./pictures/${item.chat.toLowerCase()}.mp4?v=${item.id}`} type="video/mp4" />
          {/* Text fallback for unsupported browsers */}
          Your browser does not support the video tag.
        </video>
        
        {/* Modern overlay with glassmorphism */}
        <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isHovered ? 'bg-black bg-opacity-10' : 'bg-transparent'}`}>
          {/* Play indicator */}
          {!autoPlay && !enableHoverPlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                <div className="w-0 h-0 border-l-6 border-l-primary-500 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced subtitle overlay */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 glass-strong text-white text-center py-3 px-4 rounded-b-xl animate-fade-in-up">
            <span className="text-sm font-medium">{item.eng}</span>
            {item.ar && (
              <ArabicText size="xs" className="text-neutral-200 mt-1">
                {item.ar}
              </ArabicText>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default to image
  return (
    <div 
      ref={containerRef}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        ref={mediaRef}
        src={`./pictures/${item.chat.toLowerCase()}.png?v=${item.id}`}
        alt={item.eng}
        className={`rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${className}`}
        style={style}
        onClick={handleClick}
        onError={handleImageError}
        onLoad={() => setIsLoading(false)}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-100 rounded-xl flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Enhanced subtitle overlay with glassmorphism */}
      {isHovered && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 glass-strong text-white text-center py-3 px-4 rounded-b-xl animate-fade-in-up">
          <span className="text-sm font-medium">{item.eng}</span>
          {item.ar && (
            <ArabicText size="xs" className="text-neutral-200 mt-1">
              {item.ar}
            </ArabicText>
          )}
          {item.chat && (
            <ArabiziText size="xs" className="text-neutral-300 mt-1">
              ({item.chat})
            </ArabiziText>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;