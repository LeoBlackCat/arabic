const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate missing images for sentences
const generateMissingImages = async () => {
  const sentences = [
    { 
      id: 'sentence_1', 
      english: 'They are talking with their children',
      filename: 'sentence_1752567730738_0'
    },
    { 
      id: 'sentence_2', 
      english: 'The coffee is not good',
      filename: 'sentence_1752567822896_1'
    },
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

  console.log('🎨 Generating missing images...');

  for (const sentence of sentences) {
    console.log(`\n🎯 Processing: ${sentence.english}`);
    
    // Check if all 4 images exist
    const imagePaths = [];
    let allExist = true;
    for (let i = 1; i <= 4; i++) {
      const imagePath = path.join(__dirname, 'pictures', `${sentence.filename}_${i}.png`);
      imagePaths.push(imagePath);
      if (!fs.existsSync(imagePath)) {
        allExist = false;
      }
    }
    
    if (allExist) {
      console.log(`✅ All images for ${sentence.filename} already exist, skipping...`);
      continue;
    }

    // Generate 4 images - 1 correct + 3 distractors
    const prompts = [
      `${sentence.english} - realistic photo style`,
      `Person eating different colored food - realistic photo style`,
      `Family member with different colored object - realistic photo style`,
      `Person with different colored clothing - realistic photo style`
    ];
    
    const imageUrls = [];
    
    for (let i = 0; i < 4; i++) {
      console.log(`🎨 Generating image ${i + 1}/4 for ${sentence.filename}...`);
      
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompts[i],
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        
        imageUrls.push(response.data[0].url);
        console.log(`✅ Generated image ${i + 1}/4`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error generating image ${i + 1}:`, error);
        continue;
      }
    }
    
    if (imageUrls.length === 0) {
      console.log(`❌ No images generated for ${sentence.filename}`);
      continue;
    }
    
    // Download and save images to pictures folder
    const picturesDir = path.join(__dirname, 'pictures');
    if (!fs.existsSync(picturesDir)) {
      fs.mkdirSync(picturesDir, { recursive: true });
    }
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageResponse = await fetch(imageUrls[i]);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imagePath = path.join(picturesDir, `${sentence.filename}_${i + 1}.png`);
        
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        console.log(`✅ Image ${i + 1} saved to: ${imagePath}`);
      } catch (error) {
        console.error(`❌ Error saving image ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Completed images for ${sentence.filename}`);
  }
  
  console.log('\n🎉 Image generation complete!');
};

// Run the script
if (require.main === module) {
  generateMissingImages();
}

module.exports = { generateMissingImages };