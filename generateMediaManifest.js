/**
 * generateMediaManifest.js
 * 
 * Scans the pictures folder for .mp4 and .png files and creates a manifest
 * Matches against verbs and colors from logic.json to determine what's available
 */

const fs = require('fs');
const path = require('path');
const logicData = require('./logic.json');

const picturesDir = path.join(__dirname, 'pictures');
const manifestPath = path.join(__dirname, 'src', 'mediaManifest.json');

/**
 * Scan directory for media files
 */
function scanMediaFiles() {
  if (!fs.existsSync(picturesDir)) {
    console.error('Pictures directory not found:', picturesDir);
    return {};
  }

  const files = fs.readdirSync(picturesDir);
  const mediaFiles = {};

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const basename = path.basename(file, ext);
    
    if (ext === '.mp4' || ext === '.png') {
      if (!mediaFiles[basename]) {
        mediaFiles[basename] = {};
      }
      mediaFiles[basename][ext.substring(1)] = true; // Remove the dot from extension
    }
  });

  return mediaFiles;
}

/**
 * Get all items from logic.json that need media
 */
function getItemsNeedingMedia() {
  const items = [];
  
  // Get verbs (items with pos="verb")
  if (logicData.items) {
    const verbs = logicData.items.filter(item => item.pos === 'verb');
    
    // Create lookup map for base verbs that have alternates
    const baseVerbsWithAlternates = new Map();
    verbs.forEach(verb => {
      if (verb.alternate) {
        baseVerbsWithAlternates.set(verb.alternate, verb);
      }
    });
    
    verbs.forEach(verb => {
      const isAlternate = baseVerbsWithAlternates.has(verb.id);
      const baseVerb = isAlternate ? baseVerbsWithAlternates.get(verb.id) : null;
      
      items.push({
        id: verb.id,
        chat: verb.chat,
        ar: verb.ar,
        eng: verb.eng,
        type: 'verb',
        isAlternate,
        baseVerbChat: baseVerb ? baseVerb.chat : null
      });
    });
  }

  // Colors don't need media files (they use HTML colors)
  // But we can still track them for completeness
  if (logicData.items) {
    const colors = logicData.items.filter(item => item.type === 'colors');
    colors.forEach(color => {
      items.push({
        id: color.id,
        chat: color.chat,
        ar: color.ar,
        eng: color.eng,
        type: 'color'
      });
    });
  }

  return items;
}

/**
 * Generate the manifest
 */
function generateManifest() {
  console.log('🔍 Scanning pictures directory for media files...');
  
  const mediaFiles = scanMediaFiles();
  const items = getItemsNeedingMedia();
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalMediaFiles: Object.keys(mediaFiles).length,
    itemsChecked: items.length,
    items: {},
    stats: {
      hasVideo: 0,
      hasImage: 0,
      hasBoth: 0,
      hasNeither: 0,
      colorsTotal: 0
    }
  };

  console.log(`📁 Found ${manifest.totalMediaFiles} unique media file basenames`);
  console.log(`📝 Checking ${manifest.itemsChecked} items from logic.json`);

  items.forEach(item => {
    // For alternate verbs, check media availability using base verb's chat
    const chatForMedia = item.isAlternate && item.baseVerbChat ? item.baseVerbChat.toLowerCase() : item.chat.toLowerCase();
    const hasVideo = mediaFiles[chatForMedia]?.mp4 === true;
    const hasImage = mediaFiles[chatForMedia]?.png === true;
    
    manifest.items[item.chat] = {
      id: item.id,
      chat: item.chat,
      ar: item.ar,
      eng: item.eng,
      type: item.type,
      isAlternate: item.isAlternate || false,
      baseVerbChat: item.baseVerbChat || null,
      mediaBasedOn: item.isAlternate && item.baseVerbChat ? item.baseVerbChat : item.chat,
      hasVideo,
      hasImage,
      hasAnyMedia: hasVideo || hasImage,
      availableFormats: [
        ...(hasVideo ? ['mp4'] : []),
        ...(hasImage ? ['png'] : [])
      ]
    };

    // Update stats
    if (item.type === 'color') {
      manifest.stats.colorsTotal++;
    } else {
      if (hasVideo && hasImage) manifest.stats.hasBoth++;
      else if (hasVideo) manifest.stats.hasVideo++;
      else if (hasImage) manifest.stats.hasImage++;
      else manifest.stats.hasNeither++;
    }
  });

  // Calculate filtered counts
  const verbsWithMedia = Object.values(manifest.items)
    .filter(item => item.type === 'verb' && item.hasAnyMedia);
  
  const verbsWithoutMedia = Object.values(manifest.items)
    .filter(item => item.type === 'verb' && !item.hasAnyMedia);

  manifest.summary = {
    verbsWithMedia: verbsWithMedia.length,
    verbsWithoutMedia: verbsWithoutMedia.length,
    colorsTotal: manifest.stats.colorsTotal,
    recommendedForGames: verbsWithMedia.length + manifest.stats.colorsTotal
  };

  return manifest;
}

/**
 * Save manifest to file
 */
function saveManifest(manifest) {
  const manifestDir = path.dirname(manifestPath);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest saved to: ${manifestPath}`);
}

/**
 * Print summary report
 */
function printReport(manifest) {
  console.log('\n📊 MEDIA AVAILABILITY REPORT');
  console.log('═'.repeat(50));
  
  console.log(`\n🎮 GAME CONTENT:`);
  console.log(`  • Verbs with media: ${manifest.summary.verbsWithMedia}`);
  console.log(`  • Verbs without media: ${manifest.summary.verbsWithoutMedia}`);
  console.log(`  • Colors (always available): ${manifest.summary.colorsTotal}`);
  console.log(`  • Total recommended for games: ${manifest.summary.recommendedForGames}`);
  
  console.log(`\n📹 MEDIA BREAKDOWN (verbs only):`);
  console.log(`  • Has both video + image: ${manifest.stats.hasBoth}`);
  console.log(`  • Has video only: ${manifest.stats.hasVideo}`);
  console.log(`  • Has image only: ${manifest.stats.hasImage}`);
  console.log(`  • Has no media: ${manifest.stats.hasNeither}`);

  if (manifest.stats.hasNeither > 0) {
    console.log(`\n⚠️  VERBS WITHOUT MEDIA:`);
    Object.values(manifest.items)
      .filter(item => item.type === 'verb' && !item.hasAnyMedia)
      .forEach(item => {
        console.log(`     • ${item.chat} (${item.eng})`);
      });
  }

  console.log(`\n🎥 VERBS WITH VIDEO:`);
  Object.values(manifest.items)
    .filter(item => item.type === 'verb' && item.hasVideo)
    .forEach(item => {
      const altInfo = item.isAlternate ? ` [uses ${item.baseVerbChat}'s media]` : '';
      console.log(`     • ${item.chat} (${item.eng})${altInfo}`);
    });

  const alternateVerbs = Object.values(manifest.items)
    .filter(item => item.type === 'verb' && item.isAlternate);
  
  if (alternateVerbs.length > 0) {
    console.log(`\n🔄 ALTERNATE VERBS (using base verb media):`);
    alternateVerbs.forEach(item => {
      console.log(`     • ${item.chat} → uses ${item.baseVerbChat} media (${item.eng})`);
    });
  }
}

/**
 * Main function
 */
function main() {
  try {
    console.log('🚀 Generating media manifest...\n');
    
    const manifest = generateManifest();
    saveManifest(manifest);
    printReport(manifest);
    
    console.log('\n✨ Done! Manifest generated successfully.');
    console.log('\n💡 Use this manifest in your app to filter available content.');
    
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  generateManifest,
  scanMediaFiles,
  getItemsNeedingMedia
};

// Run if called directly
if (require.main === module) {
  main();
}