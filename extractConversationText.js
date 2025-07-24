#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extract conversation text from grammar_eng-3.json file
 * Tutor messages: plain text
 * Student messages: prefixed with ">"
 * Ignores words array, only extracts text field from segments
 */

const inputFile = 'grammar_eng-3.json';
const outputFile = 'grammar_conversation_lines.txt';

try {
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file '${inputFile}' not found in current directory`);
    process.exit(1);
  }

  // Read and parse JSON file
  console.log(`📖 Reading ${inputFile}...`);
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  // Extract text values from segments with speaker identification
  const textLines = [];
  let tutorCount = 0;
  let studentCount = 0;
  
  if (jsonData.segments && Array.isArray(jsonData.segments)) {
    jsonData.segments.forEach((segment, index) => {
      if (segment.text && typeof segment.text === 'string') {
        // Clean up the text (trim whitespace, remove empty lines)
        const cleanText = segment.text.trim();
        if (cleanText.length > 0) {
          // Check speaker and format accordingly
          const speakerName = segment.speaker?.name || 'unknown';
          
          if (speakerName === 'student') {
            // Add ">" prefix for student messages
            textLines.push(`> ${cleanText}`);
            studentCount++;
          } else if (speakerName === 'tutor') {
            // Plain text for tutor messages
            textLines.push(cleanText);
            tutorCount++;
          } else {
            // Handle unknown speakers (fallback to plain text)
            textLines.push(`[${speakerName}] ${cleanText}`);
            console.warn(`⚠️  Unknown speaker at segment ${index + 1}: ${speakerName}`);
          }
        }
      }
    });
  } else {
    console.error('❌ No segments array found in JSON file');
    process.exit(1);
  }

  // Write text lines to output file
  console.log(`💾 Writing ${textLines.length} conversation lines to ${outputFile}...`);
  const outputContent = textLines.join('\n');
  fs.writeFileSync(outputFile, outputContent, 'utf8');

  console.log(`✅ Successfully extracted ${textLines.length} conversation lines to ${outputFile}`);
  console.log(`👨‍🏫 Tutor messages: ${tutorCount}`);
  console.log(`🎓 Student messages: ${studentCount}`);
  console.log(`📊 File size: ${fs.statSync(outputFile).size} bytes`);
  
  // Show first few lines as preview
  console.log('\n📝 Preview (first 8 lines):');
  textLines.slice(0, 8).forEach((line, index) => {
    const displayLine = line.length > 100 ? line.substring(0, 100) + '...' : line;
    console.log(`${index + 1}: ${displayLine}`);
  });

  // Show conversation breakdown
  const tutorPercentage = ((tutorCount / (tutorCount + studentCount)) * 100).toFixed(1);
  const studentPercentage = ((studentCount / (tutorCount + studentCount)) * 100).toFixed(1);
  console.log(`\n📈 Conversation breakdown:`);
  console.log(`   Tutor: ${tutorPercentage}% (${tutorCount} messages)`);
  console.log(`   Student: ${studentPercentage}% (${studentCount} messages)`);

} catch (error) {
  console.error('❌ Error processing file:', error.message);
  process.exit(1);
}