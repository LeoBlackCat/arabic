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
  style = {},
  enableHoverPlay = false
}) => {
  const [mediaType, setMediaType] = useState('loading'); // 'loading', 'video', 'image', 'color', 'text'
  const [hasError, setHasError] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    console.log('🖼️ MediaDisplay: Item changed to:', item?.chat || 'null');
    setHasError(false);
    setVideoRef(null);
    setIsHovered(false);
  }, [item]);

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

  // Hover handlers for video and subtitle
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (enableHoverPlay && videoRef && mediaType === 'video') {
      videoRef.play().catch(e => console.log('Video play failed:', e));
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
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 cursor-pointer ${className}`}
        style={{ minHeight: '120px', ...style }}
        onClick={onClick}
      >
        <div className="text-center p-4">
          <div className="text-xl font-bold text-gray-800">
            {item.eng}
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={setVideoRef}
          className={`rounded-lg shadow-lg cursor-pointer ${className}`}
          style={style}
          onClick={onClick}
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
        {/* Subtitle overlay */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 text-white text-center py-2 px-3 rounded-b-lg">
            <span className="text-sm font-medium">{item.eng}</span>
          </div>
        )}
      </div>
    );
  }

  // Default to image
  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        src={`./pictures/${item.chat.toLowerCase()}.png?v=${item.id}`}
        alt={item.eng}
        className={`rounded-lg shadow-lg cursor-pointer ${className}`}
        style={style}
        onClick={onClick}
        onError={handleImageError}
      />
      {/* Subtitle overlay */}
      {isHovered && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 text-white text-center py-2 px-3 rounded-b-lg">
          <span className="text-sm font-medium">{item.eng}</span>
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;