import React, { useState, useEffect } from 'react';

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
  style = {}
}) => {
  const [mediaType, setMediaType] = useState('loading'); // 'loading', 'video', 'image', 'color', 'text'
  const [hasError, setHasError] = useState(false);

  // For colors, always show color square
  useEffect(() => {
    if (contentType === 'colors') {
      setMediaType('color');
      return;
    }

    // For verbs, check if video exists
    setMediaType('loading');
    setHasError(false);
    
    // Try to load video first
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
  }, [item, contentType]);

  const handleVideoError = () => {
    console.log(`Video failed for ${item.chat}, falling back to image`);
    setMediaType('image');
    setHasError(true);
  };

  const handleImageError = (e) => {
    console.log(`Image failed for ${item.chat}, falling back to text:`, e);
    setMediaType('text');
    setHasError(true);
  };

  // Render based on media type
  if (contentType === 'colors' || mediaType === 'color') {
    return (
      <div 
        className={`w-64 h-64 rounded-lg shadow-lg border-2 border-gray-300 flex items-center justify-center cursor-pointer ${className}`}
        style={{ backgroundColor: item.color || '#CCCCCC', ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <div 
            className="text-2xl font-bold mb-2 px-3 py-1 rounded"
            style={{ 
              color: item.color === '#FFFFFF' || item.color === '#FFFF00' ? '#000000' : '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.1)'
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
      <div className={`flex items-center justify-center bg-gray-200 rounded-lg ${className}`} style={style}>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (mediaType === 'text') {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300 cursor-pointer ${className}`}
        style={{ minHeight: '120px', ...style }}
        onClick={onClick}
      >
        <div className="text-center p-4">
          <div className="text-lg font-bold text-blue-900 mb-2">
            {item.eng}
          </div>
          <div className="text-sm text-blue-700 font-medium" style={{direction: 'rtl'}}>
            {item.ar}
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <video
        className={`rounded-lg shadow-lg cursor-pointer ${className}`}
        style={style}
        onClick={onClick}
        onError={handleVideoError}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        controls={false}
      >
        <source src={`./pictures/${item.chat.toLowerCase()}.mp4`} type="video/mp4" />
        {/* Fallback if video element isn't supported */}
        <img 
          src={`./pictures/${item.chat.toLowerCase()}.png`}
          alt={item.eng}
          className={className}
          style={style}
          onClick={onClick}
          onError={handleImageError}
        />
      </video>
    );
  }

  // Default to image
  return (
    <img 
      src={`./pictures/${item.chat.toLowerCase()}.png`}
      alt={item.eng}
      className={`rounded-lg shadow-lg cursor-pointer ${className}`}
      style={style}
      onClick={onClick}
      onError={handleImageError}
    />
  );
};

export default MediaDisplay;