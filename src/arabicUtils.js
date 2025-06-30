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

// Check pronunciation including alternate pronunciations
const checkPronunciation = (transcript, currentItem, allItems = []) => {
  const normalizedTranscript = normalizeArabic(transcript);
  const normalizedExpected = normalizeArabic(currentItem.ar);
  
  // Check exact match with current item
  if (normalizedTranscript === normalizedExpected) {
    return { isCorrect: true, matchType: 'exact', matchedItem: currentItem };
  }
  
  // Check if current item has an alternate
  if (currentItem.alternate) {
    const alternateItem = allItems.find(item => item.id === currentItem.alternate);
    if (alternateItem) {
      const normalizedAlternate = normalizeArabic(alternateItem.ar);
      if (normalizedTranscript === normalizedAlternate) {
        return { isCorrect: true, matchType: 'alternate', matchedItem: alternateItem };
      }
    }
  }
  
  // Check if current item is an alternate for another item
  const primaryItem = allItems.find(item => item.alternate === currentItem.id);
  if (primaryItem) {
    const normalizedPrimary = normalizeArabic(primaryItem.ar);
    if (normalizedTranscript === normalizedPrimary) {
      return { isCorrect: true, matchType: 'alternate', matchedItem: primaryItem };
    }
  }
  
  // Check partial matches with current item
  const isPartialMatch = normalizedTranscript !== normalizedExpected && 
    (normalizedTranscript.includes(normalizedExpected) || 
     normalizedExpected.includes(normalizedTranscript));
  
  if (isPartialMatch) {
    return { isCorrect: false, matchType: 'partial', matchedItem: currentItem };
  }
  
  return { isCorrect: false, matchType: 'none', matchedItem: null };
};

module.exports = {
  normalizeArabic,
  checkPronunciation
};
