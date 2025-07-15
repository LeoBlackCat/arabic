const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate the final missing image
const generateFinalImage = async () => {
  const imagePath = path.join(__dirname, 'pictures', 'sentence_5_4.png');
  
  if (fs.existsSync(imagePath)) {
    console.log(`✅ sentence_5_4.png already exists!`);
    return;
  }

  console.log('🎨 Generating final image: sentence_5_4.png');
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: 'Person with different colored clothing - realistic photo style',
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const imageUrl = response.data[0].url;
    console.log(`✅ Generated sentence_5_4`);
    
    // Download and save image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
    console.log(`✅ sentence_5_4.png saved to: ${imagePath}`);
    
    console.log('\n🎉 All images are now complete!');
  } catch (error) {
    console.error(`❌ Error generating sentence_5_4.png:`, error);
  }
};

// Run the script
if (require.main === module) {
  generateFinalImage();
}

module.exports = { generateFinalImage };