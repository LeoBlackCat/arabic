const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate remaining images for sentences 3, 4, and 5
const generateRemainingImages = async () => {
  const sentences = [
    { 
      id: 'sentence_3', 
      english: 'I have a car, but I don\'t have eggs',
      filename: 'sentence_3'
    },
    { 
      id: 'sentence_4', 
      english: 'My sister eats the sweet fruit',
      filename: 'sentence_4'
    },
    { 
      id: 'sentence_5', 
      english: 'My brother eats the yellow fish',
      filename: 'sentence_5'
    }
  ];

  console.log('🎨 Generating remaining images...');

  for (const sentence of sentences) {
    console.log(`\n🎯 Processing: ${sentence.english}`);
    
    // Check which images are missing
    const missingImages = [];
    for (let i = 1; i <= 4; i++) {
      const imagePath = path.join(__dirname, 'pictures', `${sentence.filename}_${i}.png`);
      if (!fs.existsSync(imagePath)) {
        missingImages.push(i);
      }
    }
    
    if (missingImages.length === 0) {
      console.log(`✅ All images for ${sentence.filename} already exist, skipping...`);
      continue;
    }

    console.log(`📝 Missing images for ${sentence.filename}: ${missingImages.join(', ')}`);

    // Generate missing images
    const prompts = [
      `${sentence.english} - realistic photo style`,
      `Person eating different colored food - realistic photo style`,
      `Family member with different colored object - realistic photo style`,
      `Person with different colored clothing - realistic photo style`
    ];
    
    for (const imageIndex of missingImages) {
      console.log(`🎨 Generating image ${imageIndex}/4 for ${sentence.filename}...`);
      
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompts[imageIndex - 1],
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        
        const imageUrl = response.data[0].url;
        console.log(`✅ Generated image ${imageIndex}/4`);
        
        // Download and save image
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imagePath = path.join(__dirname, 'pictures', `${sentence.filename}_${imageIndex}.png`);
        
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        console.log(`✅ Image ${imageIndex} saved to: ${imagePath}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error generating image ${imageIndex}:`, error);
      }
    }
    
    console.log(`✅ Completed images for ${sentence.filename}`);
  }
  
  console.log('\n🎉 Image generation complete!');
};

// Run the script
if (require.main === module) {
  generateRemainingImages();
}

module.exports = { generateRemainingImages };