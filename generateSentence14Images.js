const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate missing images for sentence_14
const generateSentence14Images = async () => {
  const sentence = {
    id: 'sentence_14',
    english: 'We go to the big house',
    filename: 'sentence_14',
    correctPrompt: 'Family walking towards a big house - realistic photo style',
    distractorPrompts: [
      'Family walking towards a small house - realistic photo style',
      'Person walking towards a big house - realistic photo style',
      'Family walking towards a big building instead of house - realistic photo style'
    ]
  };

  console.log('🎨 Generating missing images for sentence_14...');
  console.log(`🎯 Processing: ${sentence.english}`);
  
  const allPrompts = [sentence.correctPrompt, ...sentence.distractorPrompts];
  
  for (let i = 0; i < 4; i++) {
    const imagePath = path.join(__dirname, 'pictures', `${sentence.filename}_${i + 1}.png`);
    
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
  
  console.log(`✅ Completed images for ${sentence.filename}`);
  console.log('\n🎉 Sentence_14 images generation complete!');
};

// Run the script
if (require.main === module) {
  generateSentence14Images();
}

module.exports = { generateSentence14Images };