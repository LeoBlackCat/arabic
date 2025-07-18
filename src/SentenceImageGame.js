import React, { useState, useEffect } from 'react';

const SentenceImageGame = ({ onGameComplete }) => {
  const [sentences, setSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Load sentences data on component mount
  useEffect(() => {
    loadSentencesData();
  }, []);

  const loadSentencesData = async () => {
    try {
      // Load sentences from sentences.json
      const response = await fetch('sentences.json');
      if (!response.ok) {
        throw new Error(`Failed to load sentences.json: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Randomize image order for each sentence
      const processedSentences = data.sentences.map(sentence => {
        const images = [...sentence.images];
        const correctImage = images[sentence.correctImageIndex];
        
        // Shuffle the images array
        for (let i = images.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [images[i], images[j]] = [images[j], images[i]];
        }
        
        // Find the new position of the correct image
        const newCorrectIndex = images.indexOf(correctImage);
        
        return {
          ...sentence,
          images: images,
          correctImageIndex: newCorrectIndex
        };
      });
      
      // Randomize the sentence order as well
      const randomizedSentences = [...processedSentences];
      for (let i = randomizedSentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomizedSentences[i], randomizedSentences[j]] = [randomizedSentences[j], randomizedSentences[i]];
      }
      
      setSentences(randomizedSentences);
      if (randomizedSentences.length > 0) {
        setCurrentSentence(randomizedSentences[0]);
      }
    } catch (error) {
      console.error('Error loading sentences data:', error);
      // Fallback to mock data if file doesn't exist
      const mockSentences = [
        {
          id: 'sentence_1',
          arabic: 'Hum yakallemoon ma3 3yaalhum',
          chat: 'Hum yakallemoon ma3 3yaalhum',
          english: 'They are talking with their children',
          audioPath: 'sounds/sentence_1752567730738_0.mp3',
          images: [
            'pictures/sentence_1752567730738_0_1.png',
            'pictures/sentence_1752567730738_0_2.png',
            'pictures/sentence_1752567730738_0_3.png',
            'pictures/sentence_1752567730738_0_4.png'
          ],
          correctImageIndex: 0
        },
        {
          id: 'sentence_2',
          arabic: 'el kakaw mob zain',
          chat: 'el kakaw mob zain',
          english: 'The chocolate is not good',
          audioPath: 'sounds/sentence_1752567822896_1.mp3',
          images: [
            'pictures/sentence_1752567822896_1_1.png',
            'pictures/sentence_1752567822896_1_2.png',
            'pictures/sentence_1752567822896_1_3.png',
            'pictures/sentence_1752567822896_1_4.png'
          ],
          correctImageIndex: 0
        }
      ];
      
      // Randomize mock sentences too
      const processedMockSentences = mockSentences.map(sentence => {
        const images = [...sentence.images];
        const correctImage = images[sentence.correctImageIndex];
        
        // Shuffle the images array
        for (let i = images.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [images[i], images[j]] = [images[j], images[i]];
        }
        
        // Find the new position of the correct image
        const newCorrectIndex = images.indexOf(correctImage);
        
        return {
          ...sentence,
          images: images,
          correctImageIndex: newCorrectIndex
        };
      });
      
      // Randomize the mock sentence order as well
      const randomizedMockSentences = [...processedMockSentences];
      for (let i = randomizedMockSentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomizedMockSentences[i], randomizedMockSentences[j]] = [randomizedMockSentences[j], randomizedMockSentences[i]];
      }
      
      setSentences(randomizedMockSentences);
      if (randomizedMockSentences.length > 0) {
        setCurrentSentence(randomizedMockSentences[0]);
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentSentenceIndex(0);
    setScore(0);
    setGameCompleted(false);
    setShowResult(false);
    setSelectedImage(null);
    if (sentences.length > 0) {
      setCurrentSentence(sentences[0]);
    }
  };

  const playAudio = async () => {
    if (!currentSentence || audioPlaying) return;

    setAudioPlaying(true);
    try {
      const audio = new Audio(currentSentence.audioPath);
      audio.onended = () => setAudioPlaying(false);
      audio.onerror = () => {
        setAudioPlaying(false);
        console.error('Audio playback failed');
      };
      await audio.play();
    } catch (error) {
      setAudioPlaying(false);
      console.error('Error playing audio:', error);
    }
  };

  const handleImageSelect = (imageIndex) => {
    if (showResult) return;
    
    setSelectedImage(imageIndex);
    setShowResult(true);
    
    const isCorrect = imageIndex === currentSentence.correctImageIndex;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      nextSentence();
    }, 2000);
  };

  const nextSentence = () => {
    const nextIndex = currentSentenceIndex + 1;
    
    if (nextIndex >= sentences.length) {
      // Game completed
      setGameCompleted(true);
      if (onGameComplete) {
        onGameComplete({
          score,
          totalQuestions: sentences.length,
          gameType: 'sentence-image'
        });
      }
    } else {
      setCurrentSentenceIndex(nextIndex);
      setCurrentSentence(sentences[nextIndex]);
      setSelectedImage(null);
      setShowResult(false);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentSentenceIndex(0);
    setScore(0);
    setGameCompleted(false);
    setShowResult(false);
    setSelectedImage(null);
    if (sentences.length > 0) {
      setCurrentSentence(sentences[0]);
    }
  };

  if (!gameStarted) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          🎵 Sentence Image Game
        </h2>
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600 mb-4">
            Listen to the Arabic sentence and choose the correct image!
          </p>
          <p className="text-sm text-gray-500">
            • Click the play button to hear the sentence
          </p>
          <p className="text-sm text-gray-500">
            • Select the image that matches the sentence
          </p>
          <p className="text-sm text-gray-500">
            • Score points for correct answers
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={startGame}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          🎉 Game Complete!
        </h2>
        <div className="text-center mb-8">
          <p className="text-2xl font-semibold text-green-600 mb-4">
            Final Score: {score}/{sentences.length}
          </p>
          <p className="text-lg text-gray-600">
            {score === sentences.length ? 
              "Perfect! You got all sentences correct!" :
              score >= sentences.length * 0.8 ?
              "Great job! You did very well!" :
              "Good effort! Keep practicing!"}
          </p>
        </div>
        <div className="text-center space-x-4">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Play Again
          </button>
          <button
            onClick={onGameComplete}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading sentences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎵 Sentence Image Game
        </h2>
        <p className="text-lg text-gray-600">
          Question {currentSentenceIndex + 1} of {sentences.length}
        </p>
        <p className="text-sm text-gray-500">
          Score: {score}/{sentences.length}
        </p>
      </div>

      {/* Audio Play Button */}
      <div className="text-center mb-8">
        <button
          onClick={playAudio}
          disabled={audioPlaying}
          className={`px-8 py-4 rounded-full text-white font-semibold text-lg transition-colors ${
            audioPlaying 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {audioPlaying ? '🔊 Playing...' : '▶️ Play Audio'}
        </button>
      </div>

      {/* Sentence Display */}
      <div className="text-center mb-8">
        <div className="bg-gray-50 rounded-lg p-6 mb-4">
          <p className="text-2xl font-bold text-gray-800 mb-2" dir="rtl">
            {currentSentence.arabic}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            {currentSentence.chat}
          </p>
          {showResult && (
            <p className="text-lg text-blue-600 font-semibold">
              "{currentSentence.english}"
            </p>
          )}
        </div>
      </div>

      {/* Image Options */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {currentSentence.images.map((imagePath, index) => (
          <div
            key={index}
            onClick={() => handleImageSelect(index)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
              selectedImage === index
                ? index === currentSentence.correctImageIndex
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-blue-300'
            } ${showResult ? 'pointer-events-none' : ''}`}
          >
            <img
              src={imagePath}
              alt={`Option ${index + 1}`}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = 'pictures/kitaab.png'; // Fallback image
              }}
            />
            {showResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <span className="text-white text-4xl">
                  {index === currentSentence.correctImageIndex ? '✅' : '❌'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Result Display */}
      {showResult && (
        <div className="text-center">
          <p className={`text-xl font-semibold ${
            selectedImage === currentSentence.correctImageIndex
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {selectedImage === currentSentence.correctImageIndex
              ? '✅ Correct!'
              : '❌ Incorrect'}
          </p>
          <p className="text-gray-600 mt-2">
            {currentSentenceIndex + 1 < sentences.length
              ? 'Next question coming up...'
              : 'Game complete!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SentenceImageGame;