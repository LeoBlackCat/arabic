const fs = require('fs');
const path = require('path');

// Load logic.json
const logicData = require('./logic.json');

// Load existing media manifest
const mediaManifestPath = './src/mediaManifest.json';
const mediaManifest = JSON.parse(fs.readFileSync(mediaManifestPath, 'utf8'));

// Get all nouns from logic.json
const nouns = logicData.items.filter(item => item.pos === 'noun');

console.log(`Found ${nouns.length} nouns to add to media manifest`);

// Check for existing media files
const picturesDir = './pictures';
let addedCount = 0;

nouns.forEach(noun => {
  const chat = noun.chat.toLowerCase();
  const hasImage = fs.existsSync(path.join(picturesDir, `${chat}.png`));
  const hasVideo = fs.existsSync(path.join(picturesDir, `${chat}.mp4`));
  
  // Skip if already exists in manifest
  if (mediaManifest.items[noun.chat]) {
    console.log(`⏭️  Skipping ${noun.chat} - already in manifest`);
    return;
  }
  
  // Add to manifest
  mediaManifest.items[noun.chat] = {
    id: noun.id,
    chat: noun.chat,
    ar: noun.ar,
    eng: noun.eng,
    type: "noun",
    isAlternate: noun.alternate ? true : false,
    baseVerbChat: null,
    mediaBasedOn: noun.chat,
    hasVideo: hasVideo,
    hasImage: hasImage,
    hasAnyMedia: hasImage || hasVideo,
    availableFormats: [
      ...(hasImage ? ['png'] : []),
      ...(hasVideo ? ['mp4'] : [])
    ]
  };
  
  console.log(`✅ Added ${noun.chat} (${noun.eng}) - Image: ${hasImage}, Video: ${hasVideo}`);
  addedCount++;
});

// Update metadata
const totalItems = Object.keys(mediaManifest.items).length;
const nounsWithMedia = nouns.filter(noun => {
  const chat = noun.chat.toLowerCase();
  return fs.existsSync(path.join(picturesDir, `${chat}.png`)) || 
         fs.existsSync(path.join(picturesDir, `${chat}.mp4`));
}).length;

mediaManifest.generatedAt = new Date().toISOString();
mediaManifest.totalMediaFiles = mediaManifest.totalMediaFiles || 0;
mediaManifest.itemsChecked = totalItems;

// Update stats
const stats = {
  hasVideo: 0,
  hasImage: 0,
  hasBoth: 0,
  hasNeither: 0,
  colorsTotal: 0,
  nounsTotal: 0
};

Object.values(mediaManifest.items).forEach(item => {
  if (item.type === 'color') {
    stats.colorsTotal++;
  } else if (item.type === 'noun') {
    stats.nounsTotal++;
  }
  
  if (item.hasVideo && item.hasImage) {
    stats.hasBoth++;
  } else if (item.hasVideo) {
    stats.hasVideo++;
  } else if (item.hasImage) {
    stats.hasImage++;
  } else {
    stats.hasNeither++;
  }
});

mediaManifest.stats = stats;

// Update summary
mediaManifest.summary = {
  verbsWithMedia: Object.values(mediaManifest.items).filter(item => item.type === 'verb' && item.hasAnyMedia).length,
  verbsWithoutMedia: Object.values(mediaManifest.items).filter(item => item.type === 'verb' && !item.hasAnyMedia).length,
  nounsWithMedia: nounsWithMedia,
  nounsWithoutMedia: nouns.length - nounsWithMedia,
  colorsTotal: stats.colorsTotal,
  recommendedForGames: Object.values(mediaManifest.items).filter(item => item.hasAnyMedia || item.type === 'color').length
};

// Save updated manifest
fs.writeFileSync(mediaManifestPath, JSON.stringify(mediaManifest, null, 2));

console.log(`\n🎉 Updated media manifest:`);
console.log(`📝 Added ${addedCount} new nouns`);
console.log(`📊 Total items: ${totalItems}`);
console.log(`🖼️  Nouns with media: ${nounsWithMedia}/${nouns.length}`);
console.log(`💾 Saved to: ${mediaManifestPath}`);