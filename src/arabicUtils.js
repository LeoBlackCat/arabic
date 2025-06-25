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

module.exports = {
  normalizeArabic
};
