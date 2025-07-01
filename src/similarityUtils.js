/**
 * Text Similarity Utilities
 * Contains functions for comparing text similarity using various algorithms
 */

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score (0-1)
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Handle identical strings
  if (str1 === str2) return 1;
  
  const matrix = [];
  
  // Initialize first row and column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

/**
 * Clean Arabic text for better comparison
 * @param {string} text - Arabic text to clean
 * @returns {string} Cleaned text
 */
export const cleanArabicText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/[.،؟!]/g, '')    // Remove punctuation
    .trim()
    .toLowerCase();
};

/**
 * Enhanced similarity checking for Arabic pronunciation
 * @param {string} userInput - What the user said
 * @param {string} expectedText - Expected Arabic text
 * @param {number} threshold - Minimum similarity threshold (default: 0.5)
 * @returns {object} Result with similarity score and acceptance status
 */
export const checkPronunciationSimilarity = (userInput, expectedText, threshold = 0.5) => {
  // Clean both texts for comparison
  const cleanUser = cleanArabicText(userInput);
  const cleanExpected = cleanArabicText(expectedText);
  
  // Calculate similarity
  const similarity = calculateSimilarity(cleanUser, cleanExpected);
  
  // Determine acceptance level
  let acceptanceLevel = 'rejected';
  let message = '';
  
  if (similarity >= 0.9) {
    acceptanceLevel = 'perfect';
    message = '✅ Perfect!';
  } else if (similarity >= 0.75) {
    acceptanceLevel = 'excellent';
    message = '✅ Excellent!';
  } else if (similarity >= threshold) {
    acceptanceLevel = 'accepted';
    message = '👍 Good enough!';
  } else if (similarity >= 0.3) {
    acceptanceLevel = 'close';
    message = '🤔 Close, but try again';
  } else {
    acceptanceLevel = 'rejected';
    message = '❌ Try again';
  }
  
  return {
    similarity,
    isAccepted: similarity >= threshold,
    acceptanceLevel,
    message,
    cleanUser,
    cleanExpected
  };
};