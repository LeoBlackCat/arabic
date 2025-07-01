// Normalize Arabic text by:
// 1. Removing diacritics (tashkeel)
// 2. Normalizing alef variants
// 3. Removing RTL/LTR marks and spaces
const normalizeArabic = (text) => {
  return text
    // Remove diacritics
    .replace(/[\u064B-\u065F]/g, '')
    // Normalize alef variants (أ, إ, آ -> ا)
    .replace(/[أإآ]/g, 'ا')
    // Remove RTL/LTR marks and spaces
    .replace(/[\u200e\u200f\s]/g, '')
    // Additional normalizations can be added here
    .trim();
};

// Calculate similarity between two strings using Levenshtein distance
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

// Check pronunciation including alternate pronunciations and similarity
const checkPronunciation = (transcript, currentItem, allItems = [], similarityThreshold = 0.5) => {
  const normalizedTranscript = normalizeArabic(transcript);
  const normalizedExpected = normalizeArabic(currentItem.ar);
  
  // Check exact match with current item
  if (normalizedTranscript === normalizedExpected) {
    return { 
      isCorrect: true, 
      matchType: 'exact', 
      matchedItem: currentItem, 
      similarity: 1.0 
    };
  }
  
  // Check if current item has an alternate
  if (currentItem.alternate) {
    const alternateItem = allItems.find(item => item.id === currentItem.alternate);
    if (alternateItem) {
      const normalizedAlternate = normalizeArabic(alternateItem.ar);
      if (normalizedTranscript === normalizedAlternate) {
        return { 
          isCorrect: true, 
          matchType: 'alternate', 
          matchedItem: alternateItem, 
          similarity: 1.0 
        };
      }
    }
  }
  
  // Check if current item is an alternate for another item
  const primaryItem = allItems.find(item => item.alternate === currentItem.id);
  if (primaryItem) {
    const normalizedPrimary = normalizeArabic(primaryItem.ar);
    if (normalizedTranscript === normalizedPrimary) {
      return { 
        isCorrect: true, 
        matchType: 'alternate', 
        matchedItem: primaryItem, 
        similarity: 1.0 
      };
    }
  }
  
  // Check similarity with current item
  const similarity = calculateSimilarity(normalizedTranscript, normalizedExpected);
  
  if (similarity >= similarityThreshold) {
    return { 
      isCorrect: true, 
      matchType: 'similarity', 
      matchedItem: currentItem, 
      similarity 
    };
  }
  
  // Check similarity with alternate if exists
  if (currentItem.alternate) {
    const alternateItem = allItems.find(item => item.id === currentItem.alternate);
    if (alternateItem) {
      const normalizedAlternate = normalizeArabic(alternateItem.ar);
      const alternateSimilarity = calculateSimilarity(normalizedTranscript, normalizedAlternate);
      
      if (alternateSimilarity >= similarityThreshold) {
        return { 
          isCorrect: true, 
          matchType: 'similarity', 
          matchedItem: alternateItem, 
          similarity: alternateSimilarity 
        };
      }
    }
  }
  
  // Check partial matches with current item (legacy support)
  const isPartialMatch = normalizedTranscript !== normalizedExpected && 
    (normalizedTranscript.includes(normalizedExpected) || 
     normalizedExpected.includes(normalizedTranscript));
  
  if (isPartialMatch) {
    return { 
      isCorrect: false, 
      matchType: 'partial', 
      matchedItem: currentItem, 
      similarity 
    };
  }
  
  return { 
    isCorrect: false, 
    matchType: 'none', 
    matchedItem: null, 
    similarity 
  };
};

module.exports = {
  normalizeArabic,
  checkPronunciation
};
