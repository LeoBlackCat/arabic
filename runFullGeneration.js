// Run full generation for all 53 verbs
// This will generate approximately 250+ sentences (5 per verb)

const { spawn } = require('child_process');

console.log('🚀 Starting full sentence generation for all 53 verbs...');
console.log('⏳ This will take about 1-2 minutes with rate limiting...');
console.log('📊 Expected output: ~250+ sentences (5 per verb × 53 verbs)');

const child = spawn('node', ['generateSentences.js'], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`\n✅ Generation complete! Exit code: ${code}`);
  console.log('📄 Check sentences.txt for the generated family conjugation sentences');
});

child.on('error', (err) => {
  console.error('❌ Error:', err);
});