const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt, outputPath) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    fs.writeFileSync(outputPath, Buffer.from(imageBuffer));
    console.log(`✅ Generated image: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generating image:`, error);
    return false;
  }
}

async function fixMissingImage() {
  // Generate a safe alternative distractor for "I love you, mom"
  const prompt = "A realistic illustration showing: A person saying goodbye to their mom, waving hands, family scene, warm and appropriate";
  const outputPath = path.join(__dirname, 'pictures', 'sentence_24_3.png');
  
  console.log('🎨 Generating missing image 3 for sentence 24...');
  console.log('Prompt:', prompt);
  
  await generateImage(prompt, outputPath);
}

// Run the script
if (require.main === module) {
  fixMissingImage().catch(console.error);
}