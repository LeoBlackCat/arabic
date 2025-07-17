/**
 * OpenAI Image Generation Utility
 * Generates images using OpenAI DALL-E API for the Arabic learning app
 */

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

/**
 * Generate an image using OpenAI DALL-E
 * @param {string} prompt - The text prompt for image generation
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - URL of the generated image
 */
export const generateImage = async (prompt, options = {}) => {
  const {
    size = "1024x1024",
    quality = "standard",
    n = 1,
    style = "natural"
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: n,
        size: size,
        quality: quality,
        style: style
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

/**
 * Generate multiple images for the Arabic learning app onboarding
 * @returns {Promise<Object>} - Object containing image URLs for different sections
 */
export const generateOnboardingImages = async () => {
  const prompts = {
    hero: "A warm, welcoming illustration of diverse people learning Arabic together, with Arabic calligraphy in the background, modern flat design style, friendly and educational atmosphere",
    verbs: "Colorful illustration showing action words and Arabic verbs, with people performing various activities like reading, writing, speaking, modern educational illustration style",
    nouns: "Beautiful illustration of common Arabic nouns with their objects - book, chair, house, car, arranged in an artistic way with Arabic text, warm colors, educational design",
    colors: "Vibrant illustration showing different colors with Arabic color names, rainbow-like arrangement, modern flat design, perfect for language learning",
    phrases: "Illustration of people having conversations in Arabic, speech bubbles with Arabic text, friendly and communicative atmosphere, modern design style"
  };

  const images = {};
  
  try {
    // Generate images sequentially to avoid rate limiting
    for (const [key, prompt] of Object.entries(prompts)) {
      console.log(`Generating ${key} image...`);
      images[key] = await generateImage(prompt, {
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });
      
      // Add a small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return images;
  } catch (error) {
    console.error('Error generating onboarding images:', error);
    throw error;
  }
};

/**
 * Cache image URLs in localStorage to avoid regenerating on every visit
 * @param {Object} images - Object containing image URLs
 */
export const cacheImages = (images) => {
  try {
    const cacheData = {
      images,
      timestamp: Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };
    localStorage.setItem('onboarding_images', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching images:', error);
  }
};

/**
 * Retrieve cached images from localStorage
 * @returns {Object|null} - Cached images or null if not found/expired
 */
export const getCachedImages = () => {
  try {
    const cached = localStorage.getItem('onboarding_images');
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheData.timestamp > cacheData.expiresIn) {
      localStorage.removeItem('onboarding_images');
      return null;
    }
    
    return cacheData.images;
  } catch (error) {
    console.error('Error retrieving cached images:', error);
    return null;
  }
};