const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fix sentence_2 images to show chocolate instead of coffee
const fixSentence2Images = async () => {
  const sentence = {
    id: 'sentence_2',
    english: 'The chocolate is not good',
    filename: 'sentence_1752567822896_1',
    correctPrompt: 'Person tasting chocolate and making disgusted face, showing displeasure - realistic photo style',
    distractorPrompts: [
      'Person tasting chocolate and smiling happily, showing satisfaction - realistic photo style',
      'Person tasting coffee and making disgusted face, showing displeasure - realistic photo style',
      'Person tasting candy/sweets and making disgusted face, showing displeasure - realistic photo style'
    ]
  };

  console.log('🎨 Fixing sentence_2 images to show chocolate instead of coffee...');
  console.log(`🎯 Processing: ${sentence.english}`);
  
  // Generate all 4 images (1 correct + 3 contextually similar distractors)
  const allPrompts = [sentence.correctPrompt, ...sentence.distractorPrompts];
  
  for (let i = 0; i < 4; i++) {
    const imagePath = path.join(__dirname, 'pictures', `${sentence.filename}_${i + 1}.png`);
    
    // Remove existing image to regenerate
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`🗑️  Removed existing ${sentence.filename}_${i + 1}.png`);
    }

    console.log(`🎨 Generating image ${i + 1}/4 for ${sentence.filename}...`);
    console.log(`📝 Prompt: ${allPrompts[i]}`);
    
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: allPrompts[i],
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      
      const imageUrl = response.data[0].url;
      console.log(`✅ Generated image ${i + 1}/4`);
      
      // Download and save image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      console.log(`✅ Image ${i + 1} saved to: ${imagePath}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Error generating image ${i + 1}:`, error);
    }
  }
  
  console.log(`✅ Completed fixing images for ${sentence.filename}`);
  
  // Update public/sentences.json
  const publicSentencesPath = path.join(__dirname, 'public', 'sentences.json');
  const sentencesPath = path.join(__dirname, 'sentences.json');
  
  if (fs.existsSync(sentencesPath)) {
    const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
    fs.writeFileSync(publicSentencesPath, JSON.stringify(sentencesData, null, 2));
    console.log(`✅ Updated public/sentences.json with chocolate translation`);
  }
  
  console.log('\n🎉 Sentence_2 image fix complete!');
  console.log('🍫 Now correctly shows chocolate instead of coffee');
};

// Run the script
if (require.main === module) {
  fixSentence2Images();
}

module.exports = { fixSentence2Images };