const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate the last few missing images
const generateLastImages = async () => {
  const imagesToGenerate = [
    { filename: 'sentence_4_4', prompt: 'Person with different colored clothing - realistic photo style' },
    { filename: 'sentence_5_1', prompt: 'My brother eats the yellow fish - realistic photo style' },
    { filename: 'sentence_5_2', prompt: 'Person eating different colored food - realistic photo style' },
    { filename: 'sentence_5_3', prompt: 'Family member with different colored object - realistic photo style' },
    { filename: 'sentence_5_4', prompt: 'Person with different colored clothing - realistic photo style' }
  ];

  console.log('🎨 Generating last missing images...');

  for (const image of imagesToGenerate) {
    const imagePath = path.join(__dirname, 'pictures', `${image.filename}.png`);
    
    if (fs.existsSync(imagePath)) {
      console.log(`✅ ${image.filename}.png already exists, skipping...`);
      continue;
    }

    console.log(`🎨 Generating ${image.filename}...`);
    
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: image.prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      
      const imageUrl = response.data[0].url;
      console.log(`✅ Generated ${image.filename}`);
      
      // Download and save image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      console.log(`✅ ${image.filename} saved to: ${imagePath}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Error generating ${image.filename}:`, error);
    }
  }
  
  console.log('\n🎉 Final image generation complete!');
};

// Run the script
if (require.main === module) {
  generateLastImages();
}

module.exports = { generateLastImages };