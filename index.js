const fs = require('fs');
const path = require('path');
const say = require('say');
const inquirer = require('inquirer');
const { nodewhisper } = require('nodejs-whisper');
const mic = require('mic');
const { exec } = require('child_process');

// Constants
const MODEL_PATH = path.join(__dirname, 'models', 'ggml-base.bin');
const OUTPUT_WAV = path.join(__dirname, 'output.wav');
const TEMP_RAW = path.join(__dirname, 'temp.raw');
const WHISPER_WAV = path.join(__dirname, 'whisper_input.wav');

// Ensure models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
}

// Copy model if it's in root but not in models/
if (fs.existsSync(path.join(__dirname, 'ggml-base.bin')) && !fs.existsSync(MODEL_PATH)) {
    fs.copyFileSync(path.join(__dirname, 'ggml-base.bin'), MODEL_PATH);
}

// Load and parse the logic.json file
let logic;
let currentPhrase;
try {
    const logicContent = fs.readFileSync(path.join(__dirname, 'logic.json'), 'utf8');
    logic = JSON.parse(logicContent);
    if (!logic || !logic.items) {
        throw new Error('Invalid logic.json format: missing items array');
    }
} catch (error) {
    console.error('Error loading logic.json:', error);
    process.exit(1);
}

// --- Helper Functions ---

// Record and transcribe speech
const recordAndTranscribe = async () => {
    return new Promise((resolve, reject) => {
        const micInstance = mic({ 
            rate: '16000', 
            channels: '1', 
            debug: false, 
            exitOnSilence: 6 
        });

        const micInputStream = micInstance.getAudioStream();
        const outputStream = fs.createWriteStream(TEMP_RAW);
        micInputStream.pipe(outputStream);

        console.log('Ready to record? Press Enter to start...');
        
        // Wait for user to press Enter before starting
        process.stdin.resume();
        process.stdin.once('data', () => {
            console.log('Recording... Press Enter when done speaking.');
            micInstance.start();

            // Handle Enter key press to stop recording
            process.stdin.once('data', async () => {
                micInstance.stop();
                process.stdin.pause();
                console.log('\nProcessing...');

                // Wait for file to be written
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Convert raw audio to WAV using SoX (same as main game)
                await new Promise((resolve, reject) => {
                    const cmd = `sox -t raw -r 16000 -b 16 -c 1 -L -e signed-integer ${TEMP_RAW} ${WHISPER_WAV}`;
                    exec(cmd, (error) => {
                        if (error) {
                            console.log('Debug - sox error:', error.message);
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });

                console.log('Transcribing...');

                try {
                    // Try using raw Whisper CLI command to force Arabic
                    const whisperCmd = `"${path.join(__dirname, 'node_modules/nodejs-whisper/cpp/whisper.cpp/build/bin/whisper-cli')}" -l ar -m "${MODEL_PATH}" -f "${WHISPER_WAV}"`;
                    
                    const result = await new Promise((resolve, reject) => {
                        exec(whisperCmd, (error, stdout, stderr) => {
                            if (error) {
                                console.log('Debug - Whisper CLI error:', error.message);
                                reject(error);
                            } else {
                                resolve({ stdout, stderr });
                            }
                        });
                    });

                    let transcription = '';
                    if (result && result.stdout) {
                        transcription = result.stdout;
                    } else if (result && result.stderr) {
                        transcription = result.stderr;
                    } else if (result && typeof result === 'string') {
                        transcription = result;
                    } else if (result && result.text) {
                        transcription = result.text;
                    }
                    
                    // Parse the transcription properly
                    let transcribedText = '';
                    if (transcription) {
                        const lines = transcription.trim().split('\n');
                        
                        for (const line of lines) {
                            // Look for lines with timestamps and Arabic text
                            if (line.includes('[') && line.includes(']') && /[\u0600-\u06FF]/.test(line)) {
                                const textMatch = line.match(/\]\s*(.+?)\s*$/);
                                if (textMatch && textMatch[1]) {
                                    transcribedText = textMatch[1].replace(/[.،؟!]$/, '').trim();
                                    break;
                                }
                            }
                            // Also check for lines that just contain Arabic text without timestamps
                            else if (/[\u0600-\u06FF]/.test(line)) {
                                transcribedText = line.trim();
                                break;
                            }
                        }
                    }
                    
                    // Clean up temporary files
                    fs.unlinkSync(TEMP_RAW);
                    fs.unlinkSync(WHISPER_WAV);
     
                    resolve(transcribedText);
                } catch (error) {
                    console.log('Debug - Error during transcription:', error.message);
                    reject(error);
                }
            });
        });
    });
};


// Get a random item from the list
const getRandomItem = () => {
    const items = logic.items;
    return items[Math.floor(Math.random() * items.length)];
};

// Shuffle an array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Pronounce text in Arabic
const speak = (text) => {
    say.speak(text, 'Majed', 1.0, (err) => {
        if (err) {
            console.error('Error trying to use Arabic voice:', err);
            console.log('Falling back to default system voice.');
            say.speak(text, null, 1.0);
        }
    });
};

// Generate random phone number from numerals
const generateRandomPhoneNumber = (length = 4) => {
    const numbers = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * logic.numerals.length);
        numbers.push(logic.numerals[randomIndex]);
    }
    return numbers;
};

// --- Game Modes ---

// 1. Flash Cards Game
const flashCardsGame = async () => {
    console.clear();
    console.log('--- 🃏 Flash Cards ---');
    const item = getRandomItem();
    console.log(`\nArabic: ${item.ar} (${item.chat})`);
    speak(item.ar);

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to reveal the meaning...' }]);
    console.log(`English: ${item.eng}\n`);

    promptForNextAction(flashCardsGame);
};

// 2. Guess the Meaning Game
const guessTheMeaningGame = async () => {
    console.clear();
    console.log('--- 🤔 Guess the Meaning ---');
    const correctAnswer = getRandomItem();
    speak(correctAnswer.ar);
    console.log(`\nListen...`);

    const incorrectOptions = [];
    while (incorrectOptions.length < 3) {
        const option = getRandomItem();
        if (option.id !== correctAnswer.id && !incorrectOptions.some(o => o.id === option.id)) {
            incorrectOptions.push(option);
        }
    }

    const choices = shuffleArray([correctAnswer.eng, ...incorrectOptions.map(o => o.eng)]);

    const { guess } = await inquirer.prompt([{ type: 'list', name: 'guess', message: 'What is the meaning?', choices: choices }]);

    if (guess === correctAnswer.eng) {
        console.log(`\nCorrect! ✅ ${correctAnswer.ar} = ${correctAnswer.eng}`);
    } else {
        console.log(`\nIncorrect. ❌ The correct answer was: \"${correctAnswer.eng}\"`);
    }
    
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    promptForNextAction(guessTheMeaningGame);
};

// 3. Speak the Phrase Game
const speakThePhraseGame = async () => {
    try {
        // Select a random phrase for practice
        const phrases = logic.items.filter(p => p.initial);
        currentPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        // Verify model exists first
        if (!fs.existsSync(MODEL_PATH)) {
            console.error('Error: Whisper model not found at', MODEL_PATH);
            console.log('Please download the model first.');
            return promptForNextAction(speakThePhraseGame);
        }

        console.clear();
        console.log('--- 🗣️ Speak the Phrase ---');
        console.log(`Arabic:          ${currentPhrase.ar}`);
        console.log(`English:         ${currentPhrase.eng}`);
        console.log(`Transliteration: ${currentPhrase.chat}`);
        console.log();
        console.log('Press Enter to start recording, then Enter again to stop.');
        
        await inquirer.prompt([{ 
            type: 'input', 
            name: 'ready', 
            message: 'Ready to record? Press Enter to start...'
        }]);

        // Clean up any existing files silently
        [TEMP_RAW, OUTPUT_WAV, WHISPER_WAV].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });

        // Set up microphone
        const micInstance = mic({ rate: '16000', channels: '1', debug: false, exitOnSilence: 6 });
        const micInputStream = micInstance.getAudioStream();
        const outputStream = fs.createWriteStream(TEMP_RAW);
        micInputStream.pipe(outputStream);

        // Start recording
        micInstance.start();
        console.clear();
        console.log('Recording... Press Enter when done.');
        console.log(`Say this phrase: ${currentPhrase.ar}`);

        await new Promise(resolve => {
            process.stdin.resume();
            process.stdin.once('data', () => {
                micInstance.stop();
                process.stdin.pause();
                resolve();
            });
        });

        // Wait for file to be written
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify recording
        if (!fs.existsSync(TEMP_RAW) || fs.statSync(TEMP_RAW).size === 0) {
            throw new Error('No audio was recorded');
        }

        // Convert to WAV
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
            exec(`sox -t raw -r 16000 -b 16 -c 1 -L -e signed-integer ${TEMP_RAW} ${OUTPUT_WAV}`, (error) => {
                if (error) reject(new Error('Failed to convert audio'));
                else resolve();
            });
        });

        // Verify WAV file
        if (!fs.existsSync(OUTPUT_WAV) || fs.statSync(OUTPUT_WAV).size === 0) {
            throw new Error('Failed to create WAV file');
        }

        // Prepare for transcription
        fs.copyFileSync(OUTPUT_WAV, WHISPER_WAV);
        console.log('\nTranscribing...');
        
        // Debug: Check if WAV file exists and has content
        console.log('Debug - WAV file exists:', fs.existsSync(WHISPER_WAV));
        if (fs.existsSync(WHISPER_WAV)) {
            console.log('Debug - WAV file size:', fs.statSync(WHISPER_WAV).size, 'bytes');
        }
        
        // Transcribe with debug logging
        try {
            console.log('Debug - About to call nodewhisper...');
            
            // Suppress Whisper's verbose output
            const originalStdout = process.stdout.write;
            const originalStderr = process.stderr.write;
            
            // Temporarily suppress all output during transcription
            process.stdout.write = () => true;
            process.stderr.write = () => true;
            
            const result = await nodewhisper(WHISPER_WAV, {
                modelName: 'base',
                modelPath: MODEL_PATH,
                language: 'ar',
                task: 'transcribe',
                verbose: false,
                prompt: 'This is Arabic speech. Transcribe in Arabic script: واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية تسعة عشرة'
            });
            
            // Restore output
            process.stdout.write = originalStdout;
            process.stderr.write = originalStderr;
            
            console.log('Debug - nodewhisper completed, result:', result);
            console.log('Debug - result type:', typeof result);
            console.log('Debug - result keys:', result ? Object.keys(result) : 'null');
            
            console.clear();
            console.log('--- 🎯 Results ---');
            
            // Try different ways to get the transcription
            let transcriptionOutput = '';
            
            if (result && result.stdout) {
                transcriptionOutput = result.stdout;
            } else if (result && result.stderr) {
                // Sometimes the transcription is in stderr
                transcriptionOutput = result.stderr;
            } else if (result && typeof result === 'string') {
                // Sometimes the result is just a string
                transcriptionOutput = result;
            } else if (result && result.text) {
                // Sometimes it's in a text property
                transcriptionOutput = result.text;
            }
            
            if (!transcriptionOutput) {
                throw new Error('No transcription output received');
            }
            
            // Debug: Show what we received
            console.log('Debug - Raw transcription output:', transcriptionOutput);
            
            // Parse the transcription from stdout
            const lines = transcriptionOutput.trim().split('\n');
            let transcribedText = '';
            
            for (const line of lines) {
                // Look for lines with timestamps and Arabic text
                // Handle both formats: [00:00:00.000] text and [00:00:00.000 --> 00:00:02.000] text
                if (line.includes('[') && line.includes(']') && /[\u0600-\u06FF]/.test(line)) {
                    // Match text after the timestamp(s) - handle both single and range timestamps
                    // This regex looks for text after the closing bracket, handling any whitespace
                    const textMatch = line.match(/\]\s*(.+?)\s*$/);
                    if (textMatch && textMatch[1]) {
                        transcribedText = textMatch[1].replace(/[.،؟!]$/, '').trim();
                        break;
                    }
                }
                // Also check for lines that just contain Arabic text without timestamps
                else if (/[\u0600-\u06FF]/.test(line)) {
                    transcribedText = line.trim();
                    break;
                }
            }
            
            console.log('Debug - Extracted text:', transcribedText);
            
            if (!transcribedText) {
                throw new Error('No Arabic text found in transcription');
            }
            
            // Compare the transcription with expected phrase
            const expected = currentPhrase.ar;
            
            // Clean up text for comparison
            const cleanText = text => text
                .replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, '') // Remove diacritics
                .replace(/\s+/g, ' ')      // Normalize whitespace
                .replace(/[.،؟!]/g, '')    // Remove punctuation
                .trim();
            
            const normalizedTranscription = cleanText(transcribedText);
            const normalizedExpected = cleanText(expected);
            
            console.log(`Expected: ${expected}`);
            console.log(`You said: ${transcribedText}`);
            console.log();
            
            // Play both phrases for comparison
            console.log('Playing expected pronunciation...');
            speak(expected);
            
            // Wait a moment before playing the user's pronunciation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('Playing your pronunciation...');
            speak(transcribedText);
            
            // Wait a moment before showing results
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Calculate similarity score using Levenshtein distance
            const calculateSimilarity = (str1, str2) => {
                const matrix = [];
                for (let i = 0; i <= str2.length; i++) {
                    matrix[i] = [i];
                }
                for (let j = 0; j <= str1.length; j++) {
                    matrix[0][j] = j;
                }
                for (let i = 1; i <= str2.length; i++) {
                    for (let j = 1; j <= str1.length; j++) {
                        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1,
                                matrix[i][j - 1] + 1,
                                matrix[i - 1][j] + 1
                            );
                        }
                    }
                }
                const distance = matrix[str2.length][str1.length];
                const maxLength = Math.max(str1.length, str2.length);
                return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
            };
            
            const similarity = calculateSimilarity(normalizedTranscription, normalizedExpected);
            
            if (normalizedTranscription === normalizedExpected) {
                console.log('✅ Excellent! Your pronunciation was perfect!');
            } else if (similarity >= 0.7) {
                console.log('👍 Almost correct! Your pronunciation was very close.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            } else if (similarity >= 0.4) {
                console.log('🤔 Close! Keep practicing to improve your pronunciation.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            } else {
                console.log('❌ Try again! Focus on the pronunciation.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            }
        } catch (error) {
            console.clear();
            console.log('❌ An error occurred');
            console.log(error.message);
        }
        
    } finally {
        // Clean up temporary files silently
        try {
            if (fs.existsSync(TEMP_RAW)) fs.unlinkSync(TEMP_RAW);
            if (fs.existsSync(OUTPUT_WAV)) fs.unlinkSync(OUTPUT_WAV);
            if (fs.existsSync(WHISPER_WAV)) fs.unlinkSync(WHISPER_WAV);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
        
        // Ask what to do next
        promptForNextAction(speakThePhraseGame);
    }
};

// --- Navigation ---
const promptForNextAction = async (currentGame) => {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What next?',
            choices: ['Try another', 'Back to Menu']
        }
    ]);

    if (action === 'Try another') {
        currentGame();
    } else {
        mainMenu();
    }
};

// --- Main Menu ---
const mainMenu = async () => {
    console.clear();
    console.log('=== 🎯 Arabic Learning Games ===\n');

    const { game } = await inquirer.prompt([
        {
            type: 'list',
            name: 'game',
            message: 'Choose a game:',
            choices: [
                { name: '1. Flash Cards', value: flashCardsGame },
                { name: '2. Guess the Meaning', value: guessTheMeaningGame },
                { name: '3. Speak the Phrase', value: speakThePhraseGame },
                { name: '4. Phone Number Game', value: phoneNumberGame },
                { name: '5. Number Pronunciation Game', value: numberPronunciationGame },
                { name: 'Exit', value: 'exit' }
            ]
        }
    ]);

    if (game === 'exit') {
        console.log('\nGoodbye! 👋\n');
        process.exit(0);
    } else {
        game();
    }
};

// 4. Phone Number Game
const phoneNumberGame = async () => {
    console.clear();
    console.log('--- 📱 Phone Number Game ---');
    console.log('Listen to the phone number and type it correctly!');

    const phoneNumber = generateRandomPhoneNumber();
    console.log('\nListening to the number...');

    // Speak each digit with a small pause
    for (const digit of phoneNumber) {
        await new Promise(resolve => {
            speak(digit.ar);
            setTimeout(resolve, 1000);
        });
    }

    const { answer } = await inquirer.prompt([
        {
            type: 'input',
            name: 'answer',
            message: 'Type the phone number (use spaces between digits):'
        }
    ]);

    const userNumbers = answer.trim().split(' ');
    const correctNumbers = phoneNumber.map(n => n.value.toString());

    if (userNumbers.length !== correctNumbers.length) {
        console.log('\n❌ Incorrect! The number had a different length.');
    } else {
        const isCorrect = userNumbers.every((num, idx) => num === correctNumbers[idx]);
        if (isCorrect) {
            console.log('\n✅ Correct! Well done!');
        } else {
            console.log('\n❌ Incorrect! Try again.');
        }
    }

    console.log('\nThe correct number was:', correctNumbers.join(' '));
    promptForNextAction(phoneNumberGame);
};

// 5. Number Pronunciation Game
const numberPronunciationGame = async () => {
    console.clear();
    console.log('--- 💹 Number Pronunciation Game ---');
    console.log('Try to pronounce the number in Arabic!');

    const number = generateRandomPhoneNumber(1)[0];
    console.log('\nNumber to pronounce:', number.value);
    console.log('(In Arabic it\'s written as:', number.ar, ')');
    
    try {
        const transcription = await recordAndTranscribe();
        console.log('--- 🎙️ Results ---');
        console.log('\nYou said:', transcription);
        console.log('Expected:', number.ar);
        
        // Clean up text for comparison
        const cleanText = text => text
            .replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, '') // Remove diacritics
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .replace(/[.،؟!]/g, '')    // Remove punctuation
            .trim();
        
        const normalizedTranscription = cleanText(transcription);
        const normalizedExpected = cleanText(number.ar);
        
        // Calculate similarity score using Levenshtein distance
        const calculateSimilarity = (str1, str2) => {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            const distance = matrix[str2.length][str1.length];
            const maxLength = Math.max(str1.length, str2.length);
            return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
        };
        
        const similarity = calculateSimilarity(normalizedTranscription, normalizedExpected);
        
        if (normalizedTranscription === normalizedExpected) {
            console.log('\n✅ Excellent! Your pronunciation was perfect!');
        } else if (similarity >= 0.7) {
            console.log('\n👍 Almost correct! Your pronunciation was very close.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
        } else if (similarity >= 0.4) {
            console.log('\n🤔 Close! Keep practicing to improve your pronunciation.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
        } else {
            console.log('\n❌ Try again! Focus on the pronunciation.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
        }
    } catch (error) {
        console.error('Error during speech recognition:', error);
    }

    promptForNextAction(numberPronunciationGame);
};

// Start the application
mainMenu();
