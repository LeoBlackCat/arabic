const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate missing sentence_11_4.png
const generateSentence11_4 = async () => {
  console.log('🎨 Generating missing sentence_11_4.png...');
  
  const imagePath = path.join(__dirname, 'pictures', 'sentence_11_4.png');
  const prompt = 'Young boy playing with a red toy car instead of ball - realistic photo style';
  
  console.log(`📝 Prompt: ${prompt}`);
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const imageUrl = response.data[0].url;
    console.log(`✅ Generated sentence_11_4.png`);
    
    // Download and save image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
    console.log(`✅ Image saved to: ${imagePath}`);
    
    console.log('\n🎉 sentence_11_4.png generation complete!');
  } catch (error) {
    console.error(`❌ Error generating sentence_11_4.png:`, error);
  }
};

// Run the script
if (require.main === module) {
  generateSentence11_4();
}

module.exports = { generateSentence11_4 };