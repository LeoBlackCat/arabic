const fs = require('fs');
const path = require('path');

// Create a simple sentences.json file with the generated data
const createSentencesJson = () => {
  const sentencesData = {
    sentences: [
      {
        id: 'sentence_1',
        arabic: 'Hum yakallemoon ma3 3yaalhum',
        chat: 'Hum yakallemoon ma3 3yaalhum',
        english: 'They are talking with their children',
        audioPath: '/sounds/sentence_1752567730738_0.mp3',
        images: [
          '/pictures/sentence_1752567730738_0_1.png',
          '/pictures/sentence_1752567730738_0_2.png',
          '/pictures/sentence_1752567730738_0_3.png',
          '/pictures/sentence_1752567730738_0_4.png'
        ],
        correctImageIndex: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sentence_2',
        arabic: 'el kakaw mob zain',
        chat: 'el kakaw mob zain',
        english: 'The coffee is not good',
        audioPath: '/sounds/sentence_1752567822896_1.mp3',
        images: [
          '/pictures/sentence_1752567822896_1_1.png',
          '/pictures/sentence_1752567822896_1_2.png',
          '/pictures/sentence_1752567822896_1_3.png',
          '/pictures/sentence_1752567822896_1_4.png'
        ],
        correctImageIndex: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sentence_3',
        arabic: 'ana 3endy sayyaarah, bas ma 3endy baizaat',
        chat: 'ana 3endy sayyaarah, bas ma 3endy baizaat',
        english: 'I have a car, but I don\'t have eggs',
        audioPath: '/sounds/sentence_3.mp3',
        images: [
          '/pictures/sentence_3_1.png',
          '/pictures/sentence_3_2.png',
          '/pictures/sentence_3_3.png',
          '/pictures/sentence_3_4.png'
        ],
        correctImageIndex: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sentence_4',
        arabic: 'ekhtee taakel el fawakeh el 7elwah',
        chat: 'ekhtee taakel el fawakeh el 7elwah',
        english: 'My sister eats the sweet fruit',
        audioPath: '/sounds/sentence_4.mp3',
        images: [
          '/pictures/sentence_4_1.png',
          '/pictures/sentence_4_2.png',
          '/pictures/sentence_4_3.png',
          '/pictures/sentence_4_4.png'
        ],
        correctImageIndex: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sentence_5',
        arabic: 'ukhooy yaakel el semach el asfar',
        chat: 'ukhooy yaakel el semach el asfar',
        english: 'My brother eats the yellow fish',
        audioPath: '/sounds/sentence_5.mp3',
        images: [
          '/pictures/sentence_5_1.png',
          '/pictures/sentence_5_2.png',
          '/pictures/sentence_5_3.png',
          '/pictures/sentence_5_4.png'
        ],
        correctImageIndex: 0,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // Save to file
  const sentencesJsonPath = path.join(__dirname, 'sentences.json');
  fs.writeFileSync(sentencesJsonPath, JSON.stringify(sentencesData, null, 2));
  console.log(`✅ Created sentences.json with ${sentencesData.sentences.length} sentences`);
  
  return sentencesData;
};

// Run the script
if (require.main === module) {
  createSentencesJson();
}

module.exports = { createSentencesJson };