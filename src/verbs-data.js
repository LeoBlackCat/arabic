// Hardcoded Arabic verbs data for direct import
// This bypasses any module system issues

const verbsData = [
  {
    path: "a7eb.png",
    url: "/pictures/a7eb.png",
    chat: "a7eb",
    ar: "أحب",
    eng: "I like/love"
  },
  {
    path: "aakel.png",
    url: "/pictures/aakel.png",
    chat: "aakel",
    ar: "آكل",
    eng: "I eat"
  },
  {
    path: "adfa3.png",
    url: "/pictures/adfa3.png",
    chat: "adfa3",
    ar: "أدفع",
    eng: "I pay"
  },
  {
    path: "afta7.png",
    url: "/pictures/afta7.png",
    chat: "afta7",
    ar: "أفتح",
    eng: "I open"
  },
  {
    path: "agdar.png",
    url: "/pictures/agdar.png",
    chat: "agdar",
    ar: "أقدر",
    eng: "I can"
  },
  {
    path: "agoum.png",
    url: "/pictures/agoum.png",
    chat: "agoum",
    ar: "أقوم",
    eng: "I stand"
  },
  {
    path: "agra.png",
    url: "/pictures/agra.png",
    chat: "agra",
    ar: "أقرأ", 
    eng: "I read"
  },
  {
    path: "akteb.png",
    url: "/pictures/akteb.png",
    chat: "akteb",
    ar: "أكتب",
    eng: "I write"
  },
  {
    path: "al3ab.png",
    url: "/pictures/al3ab.png",
    chat: "al3ab",
    ar: "ألعب",
    eng: "I play"
  },
  {
    path: "anaam.png", 
    url: "/pictures/anaam.png",
    chat: "anaam",
    ar: "أنام",
    eng: "I sleep"
  },
  {
    path: "ashoof.png",
    url: "/pictures/ashoof.png",
    chat: "ashoof",
    ar: "أشوف",
    eng: "I see"
  },
  {
    path: "ashrab.png",
    url: "/pictures/ashrab.png",
    chat: "ashrab",
    ar: "أشرب",
    eng: "I drink"
  },
  {
    path: "ashteghil.png",
    url: "/pictures/ashteghil.png",
    chat: "ashteghil",
    ar: "أشتغل",
    eng: "I work"
  },
  {
    path: "asma3.png",
    url: "/pictures/asma3.png",
    chat: "asma3",
    ar: "أسمع",
    eng: "I hear/listen"
  },
  {
    path: "asoog.png",
    url: "/pictures/asoog.png",
    chat: "asoog",
    ar: "أسوق",
    eng: "I drive"
  },
  {
    path: "atbakh.png",
    url: "/pictures/atbakh.png",
    chat: "atbakh",
    ar: "أطبخ",
    eng: "I cook"
  },
  {
    path: "attesel.png",
    url: "/pictures/attesel.png",
    chat: "attesel",
    ar: "أتصل",
    eng: "I call"
  }
];

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const arrayCopy = [...array]; // Create a copy to avoid modifying original
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
};

// Export both the original and a function to get shuffled verbs
export const verbs = verbsData;
export const getShuffledVerbs = () => shuffleArray(verbsData);

// For debugging
console.log('verbs-data.js loaded:', verbsData.length, 'verbs available');
