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
    console.error(`❌ Error generating image for ${outputPath}:`, error);
    return false;
  }
}

async function fixSentence9Images() {
  console.log('🚀 Fixing sentence_9 images...');
  console.log('Arabic: أنا أروح المكتب بسرعة');
  console.log('English: I go to the office quickly');
  
  const basePrompt = "A realistic illustration showing";
  
  // Image 1: Correct - rushing to office
  const image1Prompt = `${basePrompt} a person rushing quickly to an office building, looking hurried and fast-paced, carrying a briefcase, modern office building in background`;
  
  // Image 2: Distractor - walking slowly to office
  const image2Prompt = `${basePrompt} a person walking slowly and calmly to an office building, taking their time, relaxed pace, modern office building in background`;
  
  // Image 3: Distractor - going to home quickly
  const image3Prompt = `${basePrompt} a person rushing quickly to a house/home, looking hurried and fast-paced, residential building in background`;
  
  // Image 4: Distractor - going to store quickly
  const image4Prompt = `${basePrompt} a person rushing quickly to a store/shop, looking hurried and fast-paced, retail store in background`;
  
  const images = [
    { prompt: image1Prompt, path: 'pictures/sentence_9_1.png', description: 'Correct: rushing to office' },
    { prompt: image2Prompt, path: 'pictures/sentence_9_2.png', description: 'Distractor: walking slowly to office' },
    { prompt: image3Prompt, path: 'pictures/sentence_9_3.png', description: 'Distractor: rushing to home' },
    { prompt: image4Prompt, path: 'pictures/sentence_9_4.png', description: 'Distractor: rushing to store' }
  ];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const outputPath = path.join(__dirname, image.path);
    
    console.log(`\n🎨 Generating image ${i + 1}/4: ${image.description}`);
    console.log(`Prompt: ${image.prompt}`);
    
    const success = await generateImage(image.prompt, outputPath);
    if (!success) {
      console.log(`❌ Failed to generate ${image.path}`);
      continue;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ All sentence_9 images have been regenerated!');
  console.log('🎯 Now only image 1 shows rushing to office, others are contextual distractors');
}

// Run the script
if (require.main === module) {
  fixSentence9Images().catch(console.error);
}

module.exports = { fixSentence9Images };