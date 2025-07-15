const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate contextually similar but incorrect images
const generateContextualImages = async () => {
  const sentences = [
    {
      id: 'sentence_3',
      english: 'I have a car, but I don\'t have money',
      filename: 'sentence_3',
      correctPrompt: 'Person standing next to a car looking sad, holding empty wallet or pockets turned out - realistic photo style',
      distractorPrompts: [
        'Person standing next to a motorcycle looking sad, holding empty wallet - realistic photo style',
        'Person wanting to buy a car but showing no money in wallet at car dealership - realistic photo style', 
        'Person with a bicycle looking at money/cash in hand happily - realistic photo style'
      ]
    },
    {
      id: 'sentence_4',
      english: 'My sister eats the sweet fruit',
      filename: 'sentence_4',
      correctPrompt: 'Young woman happily eating sweet colorful fruit like grapes or berries - realistic photo style',
      distractorPrompts: [
        'Young woman eating sour fruit making disgusted face - realistic photo style',
        'Young man eating sweet fruit happily - realistic photo style',
        'Young woman eating vegetables instead of fruit - realistic photo style'
      ]
    },
    {
      id: 'sentence_5',
      english: 'My brother eats the yellow fish',
      filename: 'sentence_5',
      correctPrompt: 'Young man eating yellow/golden fish dish at table - realistic photo style',
      distractorPrompts: [
        'Young man eating red fish dish at table - realistic photo style',
        'Young woman eating yellow fish dish at table - realistic photo style',
        'Young man eating yellow chicken instead of fish - realistic photo style'
      ]
    }
  ];

  console.log('🎨 Generating contextually similar but incorrect images...');

  for (const sentence of sentences) {
    console.log(`\n🎯 Processing: ${sentence.english}`);
    
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
    
    console.log(`✅ Completed contextual images for ${sentence.filename}`);
  }
  
  console.log('\n🎉 Contextual image generation complete!');
};

// Run the script
if (require.main === module) {
  generateContextualImages();
}

module.exports = { generateContextualImages };