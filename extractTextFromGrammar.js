#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extract text values from grammar_eng-2.json file
 * Only extracts the 'text' field from segments, ignoring words array
 */

const inputFile = 'grammar_eng-2.json';
const outputFile = 'grammar_text_lines.txt';

try {
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file '${inputFile}' not found in current directory`);
    process.exit(1);
  }

  // Read and parse JSON file
  console.log(`📖 Reading ${inputFile}...`);
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  // Extract text values from segments
  const textLines = [];
  
  if (jsonData.segments && Array.isArray(jsonData.segments)) {
    jsonData.segments.forEach((segment, index) => {
      if (segment.text && typeof segment.text === 'string') {
        // Clean up the text (trim whitespace, remove empty lines)
        const cleanText = segment.text.trim();
        if (cleanText.length > 0) {
          textLines.push(cleanText);
        }
      }
    });
  } else {
    console.error('❌ No segments array found in JSON file');
    process.exit(1);
  }

  // Write text lines to output file
  console.log(`💾 Writing ${textLines.length} text lines to ${outputFile}...`);
  const outputContent = textLines.join('\n');
  fs.writeFileSync(outputFile, outputContent, 'utf8');

  console.log(`✅ Successfully extracted ${textLines.length} text lines to ${outputFile}`);
  console.log(`📊 File size: ${fs.statSync(outputFile).size} bytes`);
  
  // Show first few lines as preview
  console.log('\n📝 Preview (first 5 lines):');
  textLines.slice(0, 5).forEach((line, index) => {
    console.log(`${index + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });

} catch (error) {
  console.error('❌ Error processing file:', error.message);
  process.exit(1);
}