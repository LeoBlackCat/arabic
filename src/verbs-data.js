// Hardcoded Arabic verbs data for direct import
// This bypasses any module system issues

const verbsData = [
  {
    path: "a7eb.png",
    url: "/pictures/a7eb.png",
    chat: "A7eb",
    ar: "أحب",
    eng: "I like/love"
  },
  {
    path: "aakel.png",
    url: "/pictures/aakel.png",
    chat: "Aakel",
    ar: "آكل",
    eng: "I eat"
  },
  {
    path: "adfa3.png",
    url: "/pictures/adfa3.png",
    chat: "Adfa3",
    ar: "أدفع",
    eng: "I pay"
  },
  {
    path: "afta7.png",
    url: "/pictures/afta7.png",
    chat: "Afta7",
    ar: "أفتح",
    eng: "I open"
  },
  {
    path: "agdar.png",
    url: "/pictures/agdar.png",
    chat: "Agdar",
    ar: "أقدر",
    eng: "I can"
  },
  {
    path: "agoum.png",
    url: "/pictures/agoum.png",
    chat: "Agoum",
    ar: "أقوم",
    eng: "I stand"
  },
  {
    path: "agra.png",
    url: "/pictures/agra.png",
    chat: "Agra",
    ar: "أقرأ", 
    eng: "I read"
  },
  {
    path: "akteb.png",
    url: "/pictures/akteb.png",
    chat: "Akteb",
    ar: "أكتب",
    eng: "I write"
  },
  {
    path: "al3ab.png",
    url: "/pictures/al3ab.png",
    chat: "Al3ab",
    ar: "ألعب",
    eng: "I play"
  },
  {
    path: "anaam.png", 
    url: "/pictures/anaam.png",
    chat: "Anaam",
    ar: "أنام",
    eng: "I sleep"
  },
  {
    path: "ashoof.png",
    url: "/pictures/ashoof.png",
    chat: "Ashoof",
    ar: "أشوف",
    eng: "I see"
  },
  {
    path: "ashrab.png",
    url: "/pictures/ashrab.png",
    chat: "Ashrab",
    ar: "أشرب",
    eng: "I drink"
  },
  {
    path: "ashteghil.png",
    url: "/pictures/ashteghil.png",
    chat: "Ashteghil",
    ar: "أشتغل",
    eng: "I work"
  },
  {
    path: "asma3.png",
    url: "/pictures/asma3.png",
    chat: "Asma3",
    ar: "أسمع",
    eng: "I hear/listen"
  },
  {
    path: "asoog.png",
    url: "/pictures/asoog.png",
    chat: "Asoog",
    ar: "أسوق",
    eng: "I drive"
  },
  {
    path: "atbakh.png",
    url: "/pictures/atbakh.png",
    chat: "Atbakh",
    ar: "أطبخ",
    eng: "I cook"
  },
  {
    path: "attesel.png",
    url: "/pictures/attesel.png",
    chat: "Attesel",
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
