const fs = require('fs');
const path = require('path');
const say = require('say');
const inquirer = require('inquirer');
const { nodewhisper } = require('nodejs-whisper');
const mic = require('mic');
const { exec } = require('child_process');

// Configuration
const USE_WAV_FILES = true; // Set to false to use say.js instead
const SOUNDS_DIR = path.join(__dirname, 'sounds');

// Constants
const MODEL_PATH = path.join(__dirname, 'models', 'ggml-medium.bin');
const BASE_MODEL_PATH = path.join(__dirname, 'models', 'ggml-base.bin');
const OUTPUT_WAV = path.join(__dirname, 'output.wav');
const TEMP_RAW = path.join(__dirname, 'temp.raw');
const WHISPER_WAV = path.join(__dirname, 'whisper_input.wav');

// Ensure models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
}

// Check which model to use
let currentModelPath = MODEL_PATH;
let currentModelName = 'medium';

if (!fs.existsSync(MODEL_PATH)) {
    console.log('Medium model not found, falling back to base model...');
    currentModelPath = BASE_MODEL_PATH;
    currentModelName = 'base';
    
    // Copy base model if it's in root but not in models/
    if (fs.existsSync(path.join(__dirname, 'ggml-base.bin')) && !fs.existsSync(BASE_MODEL_PATH)) {
        fs.copyFileSync(path.join(__dirname, 'ggml-base.bin'), BASE_MODEL_PATH);
    }
}

// --- Helper Functions ---

// Shuffle an array
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const arrayWithIdGreaterThan = (array, value) => {
    const newArray = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i].id > value) newArray.push(array[i]);
    }
    return newArray;
}

// Load and parse the logic.json file
let logic;
let currentPhrase;
let phraseQueue = [];
let currentSetStats = { total: 0, correct: 0 };
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

// add logic.numerals to items (initial = false, replyTo = nil)
logic.numerals.forEach((numeral) => {
    logic.items.push({
        ar: numeral.ar,
        chat: numeral.chat,
        eng: String(numeral.value)
    });
});

// shuffle logic.items
logic.items = shuffleArray(logic.items);
//logic.items = arrayWithIdGreaterThan(logic.items, 48);

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
                console.log('Processing...');

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

                console.log('Transcribing (using Whisper CLI)...');

                try {
                    // Try using raw Whisper CLI command to force Arabic
                    const whisperCmd = `"${path.join(__dirname, 'node_modules/nodejs-whisper/cpp/whisper.cpp/build/bin/whisper-cli')}" -l ar -m "${currentModelPath}" -f "${WHISPER_WAV}"`;
                    
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
                        const lines = transcription.trim().split('');
                        
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

// Pronounce text in Arabic
const speak = (text) => {
    return new Promise((resolve) => {
        if (USE_WAV_FILES) {
            // Try to find a matching .wav file in the sounds directory
            const wavFile = path.join(SOUNDS_DIR, `${text}.wav`);
            if (fs.existsSync(wavFile)) {
                // Play the .wav file using system audio player
                const playerCmd = process.platform === 'darwin' ? 'afplay' : 
                                 process.platform === 'win32' ? 'start' : 'aplay';
                
                if (process.platform === 'win32') {
                    exec(`start "" "${wavFile}"`, (error) => {
                        if (error) {
                            console.log('Error playing .wav file, falling back to say.js');
                            fallbackToSay(text).then(resolve);
                        } else {
                            // For Windows, we need to estimate the duration
                            // Most audio files are around 1-3 seconds, so we'll wait 2 seconds
                            setTimeout(resolve, 2000);
                        }
                    });
                } else {
                    exec(`${playerCmd} "${wavFile}"`, (error) => {
                        if (error) {
                            console.log('Error playing .wav file, falling back to say.js');
                            fallbackToSay(text).then(resolve);
                        } else {
                            // For macOS/Linux, afplay/aplay blocks until finished
                            resolve();
                        }
                    });
                }
            } else {
                // No .wav file found, fall back to say.js
                fallbackToSay(text).then(resolve);
            }
        } else {
            // Use say.js directly
            fallbackToSay(text).then(resolve);
        }
    });
};

// Fallback function using say.js
const fallbackToSay = (text) => {
    return new Promise((resolve) => {
        say.speak(text, 'Majed', 1.0, (err) => {
            if (err) {
                console.error('Error trying to use Arabic voice:', err);
                console.log('Falling back to default system voice.');
                say.speak(text, null, 1.0, resolve);
            } else {
                resolve();
            }
        });
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
    console.log(`Arabic: ${item.ar} (${item.chat})`);
    await speak(USE_WAV_FILES ? item.chat : item.ar);

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to reveal the meaning...' }]);
    console.log(`English: ${item.eng}`);

    promptForNextAction(flashCardsGame);
};

// 2. Guess the Meaning Game
const guessTheMeaningGame = async () => {
    console.clear();
    console.log('--- 🤔 Guess the Meaning ---');
    const correctAnswer = getRandomItem();
    await speak(USE_WAV_FILES ? correctAnswer.chat : correctAnswer.ar);
    console.log(`Listen...`);

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
        console.log(`Correct! ✅ ${correctAnswer.ar} = ${correctAnswer.eng}`);
    } else {
        console.log(`Incorrect. ❌ The correct answer was: \"${correctAnswer.eng}\"`);
    }
    
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    promptForNextAction(guessTheMeaningGame);
};

// Get next phrase from the queue, reshuffle if needed
const getNextPhrase = () => {
    // If queue is empty, refill it with shuffled phrases
    if (phraseQueue.length === 0) {
        // Show stats from previous set if it's not the first run
        if (currentSetStats.total > 0) {
            const percentage = Math.round((currentSetStats.correct / currentSetStats.total) * 100);
            console.log('📊 Set completed! Stats:');
            console.log(`Correct answers: ${currentSetStats.correct}/${currentSetStats.total} (${percentage}%)`);
        }

        // Reset stats for new set
        currentSetStats = { total: 0, correct: 0 };

        const phrases = logic.items;
        phraseQueue = [...phrases]; // Create a copy of the array
        
        // Shuffle the queue
        for (let i = phraseQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [phraseQueue[i], phraseQueue[j]] = [phraseQueue[j], phraseQueue[i]];
        }
        
        console.log(`🔄 Starting a new shuffled set...`);
    }
    
    // Return and remove the first phrase from the queue
    return phraseQueue.shift();
};

// 3. Speak the Phrase Game
const speakThePhraseGame = async () => {
    try {
        // Get next phrase from our queue
        currentPhrase = getNextPhrase();
        
        // Show progress
        const totalPhrases = logic.items.length;
        const remaining = phraseQueue.length;
        console.log(`Progress: ${totalPhrases - remaining}/${totalPhrases} phrases in current set`);

        // Verify model exists first
        if (!fs.existsSync(currentModelPath)) {
            console.error('Error: Whisper model not found at', currentModelPath);
            console.log('Please download the model first.');
            return promptForNextAction(speakThePhraseGame);
        }

        console.log('--- 🗣️ Speak the Phrase ---');
        console.log(`Arabic:          ${currentPhrase.ar}`);
        console.log(`English:         ${currentPhrase.eng}`);
        console.log();
        // console.log('Press Enter to start recording, then Enter again to stop.');
        
        // await inquirer.prompt([{ 
        //     type: 'input', 
        //     name: 'ready', 
        //     message: 'Ready to record? Press Enter to start...'
        // }]);

        // Clean up any existing files silently
        [TEMP_RAW, OUTPUT_WAV, WHISPER_WAV].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });

        try {
            const transcribedText = await recordAndTranscribe();
            console.log('--- 🎯 Results ---');
            
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
            
            const different = async () => {
                console.log(`Expected: ${expected}`);
                console.log(`You said: ${transcribedText}`);
                console.log();
                
                // Play both phrases for comparison
                console.log('Playing expected pronunciation...');
                await speak(USE_WAV_FILES ? currentPhrase.chat : currentPhrase.ar);
                
                // Wait a moment before playing the user's pronunciation
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('Playing your pronunciation...');
                await speak(transcribedText);
            }
            
            
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
            
            // Update stats
            currentSetStats.total++;
            const isCorrect = similarity >= 0.4;
            if (isCorrect) currentSetStats.correct++;

            if (normalizedTranscription === normalizedExpected) {
                console.log('✅ Excellent! Your pronunciation was perfect!');
                await speak(USE_WAV_FILES ? currentPhrase.chat : currentPhrase.ar);
            } else if (similarity >= 0.7) {
                console.log('👍 Almost correct! Your pronunciation was very close.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
                await different();
            } else if (similarity >= 0.4) {
                console.log('🤔 Close enough! Keep practicing to improve your pronunciation.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
                await different();
            } else {
                console.log('❌ Try again! Focus on the pronunciation.');
                console.log(`Similarity: ${Math.round(similarity * 100)}%`);
                await different();
            }

            // Show current progress including correctness rate
            const currentPercentage = Math.round((currentSetStats.correct / currentSetStats.total) * 100);
            console.log(`Current set progress: ${currentSetStats.correct}/${currentSetStats.total} correct (${currentPercentage}%)`);
        } catch (error) {
            // Restore output first
            process.stdout.write = originalStdout;
            process.stderr.write = originalStderr;
            
            console.error('Transcription error:', error.message);
            console.log('Trying fallback transcription method...');
            
            // Try fallback method using raw Whisper CLI
            try {
                const whisperCmd = `"${path.join(__dirname, 'node_modules/nodejs-whisper/cpp/whisper.cpp/build/bin/whisper-cli')}" -l ar -m "${currentModelPath}" -f "${WHISPER_WAV}"`;
                
                const fallbackResult = await new Promise((resolve, reject) => {
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
                if (fallbackResult && fallbackResult.stdout) {
                    transcription = fallbackResult.stdout;
                } else if (fallbackResult && fallbackResult.stderr) {
                    transcription = fallbackResult.stderr;
                } else if (fallbackResult && typeof fallbackResult === 'string') {
                    transcription = fallbackResult;
                } else if (fallbackResult && fallbackResult.text) {
                    transcription = fallbackResult.text;
                }
                
                // Parse the transcription properly
                let transcribedText = '';
                if (transcription) {
                    const lines = transcription.trim().split('');
                    
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
                
                if (!transcribedText) {
                    throw new Error('No transcription output received from fallback method');
                }
                
                // Continue with the transcribed text
                result = { text: transcribedText };
            } catch (fallbackError) {
                console.error('Fallback transcription also failed:', fallbackError.message);
                throw new Error('All transcription methods failed');
            }
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
    console.log('=== 🎯 Arabic Learning Games ===');

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
                { name: '6. Listen & Respond Game', value: listenAndRespondGame },
                { name: 'Exit', value: 'exit' }
            ]
        }
    ]);

    if (game === 'exit') {
        console.log('Goodbye! 👋');
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
    console.log('Listening to the number...');

    // Speak each digit with a small pause
    for (const digit of phoneNumber) {
        await speak(USE_WAV_FILES ? digit.chat : digit.ar);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small pause between digits
    }

    // Keep asking until user enters a non-empty response
    let userAnswer = '';
    while (userAnswer.trim() === '') {
        const { answer } = await inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message: 'Type the phone number (use spaces between digits):'
            }
        ]);
        
        userAnswer = answer;
        
        // If empty string is entered, repeat the numbers
        if (userAnswer.trim() === '') {
            console.log('Repeating the number...');
            for (const digit of phoneNumber) {
                await speak(USE_WAV_FILES ? digit.chat : digit.ar);
                await new Promise(resolve => setTimeout(resolve, 500)); // Small pause between digits
            }
        }
    }

    const userNumbers = userAnswer.trim().split(' ');
    const correctNumbers = phoneNumber.map(n => n.value.toString());

    if (userNumbers.length !== correctNumbers.length) {
        console.log('❌ Incorrect! The number had a different length.');
    } else {
        const isCorrect = userNumbers.every((num, idx) => num === correctNumbers[idx]);
        if (isCorrect) {
            console.log('✅ Correct! Well done!');
        } else {
            console.log('❌ Incorrect! Try again.');
        }
    }

    console.log('The correct number was:', correctNumbers.join(' '));
    promptForNextAction(phoneNumberGame);
};

// 5. Number Pronunciation Game
const numberPronunciationGame = async () => {
    console.clear();
    console.log('--- 💹 Number Pronunciation Game ---');
    console.log('Try to pronounce the number in Arabic!');

    const number = generateRandomPhoneNumber(1)[0];
    console.log('Number to pronounce:', number.value);
    console.log('(In Arabic it\'s written as:', number.ar, ')');
    //console.log('(Transliteration:', number.chat, ')');
    
    try {
        const transcription = await recordAndTranscribe();
        console.log('--- 🎙️ Results ---');
        //console.log('You said:', transcription);
        //console.log('Expected:', number.ar);
        
        const different = async () => {
            console.log(`Expected: ${number.ar}`);
            console.log(`You said: ${transcription}`);
            console.log();
            
            // Play both phrases for comparison
            console.log('Playing expected pronunciation...');
            await speak(USE_WAV_FILES ? number.chat : number.ar);
            
            // Wait a moment before playing the user's pronunciation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('Playing your pronunciation...');
            await speak(transcription);
        }

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
            console.log('✅ Excellent! Your pronunciation was perfect!');
            await speak(USE_WAV_FILES ? number.chat : number.ar);
        } else if (similarity >= 0.7) {
            console.log('👍 Almost correct! Your pronunciation was very close.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            await different();
        } else if (similarity >= 0.4) {
            console.log('🤔 Close! Keep practicing to improve your pronunciation.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            await different();
        } else {
            console.log('❌ Try again! Focus on the pronunciation.');
            console.log(`Similarity: ${Math.round(similarity * 100)}%`);
            await different();
        }
    } catch (error) {
        console.error('Error during speech recognition:', error);
    }

    promptForNextAction(numberPronunciationGame);
};

// 6. Listen & Respond Game
const listenAndRespondGame = async () => {
    console.clear();
    console.log('--- 🎧 Listen & Respond Game ---');
    console.log('Listen to a phrase and respond with the appropriate reply!');
    
    // Get all initial phrases (those that can be replied to)
    const initialPhrases = logic.items.filter(item => item.initial);
    if (initialPhrases.length === 0) {
        console.log('No initial phrases found in the data.');
        return promptForNextAction(listenAndRespondGame);
    }
    
    // Get all phrases that have replyTo (possible responses)
    const responsePhrases = logic.items.filter(item => item.replyTo);
    if (responsePhrases.length === 0) {
        console.log('No response phrases found in the data.');
        return promptForNextAction(listenAndRespondGame);
    }
    
    // Select a random initial phrase
    const initialPhrase = initialPhrases[Math.floor(Math.random() * initialPhrases.length)];
    
    console.log('Listen to this phrase:');
    console.log(`Arabic: ${initialPhrase.ar}`);
    console.log(`English: ${initialPhrase.eng}`);
    //console.log(`Transliteration: ${initialPhrase.chat}`);
    
    // Play the initial phrase
    await speak(USE_WAV_FILES ? initialPhrase.chat : initialPhrase.ar);
    
    try {
        const transcription = await recordAndTranscribe();
        console.log('--- 🎯 Results ---');
        
        // Find all valid responses for this initial phrase
        const validResponses = responsePhrases.filter(response => {
            if (!response.replyTo) return false;
            
            // Handle both single ID and multiple IDs (comma-separated)
            const replyToIds = response.replyTo.toString().split(',').map(id => id.trim());
            return replyToIds.includes(initialPhrase.id.toString());
        });
        
        if (validResponses.length === 0) {
            console.log('No valid responses found for this phrase.');
            console.log('You said:', transcription);
            return promptForNextAction(listenAndRespondGame);
        }
        
        // Clean up text for comparison
        const cleanText = text => text
            .replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, '') // Remove diacritics
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .replace(/[.،؟!]/g, '')    // Remove punctuation
            .trim();
        
        const normalizedTranscription = cleanText(transcription);
        
        // Check if the transcription matches any valid response
        let bestMatch = null;
        let bestSimilarity = 0;
        
        for (const response of validResponses) {
            const normalizedResponse = cleanText(response.ar);
            const similarity = calculateSimilarity(normalizedTranscription, normalizedResponse);
            
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = response;
            }
        }
        
        console.log(`You said: ${transcription}`);
        console.log();
        
        // Show all valid responses
        console.log('Valid responses were:');
        validResponses.forEach((response, index) => {
            console.log(`${index + 1}. ${response.ar} (${response.eng})`);
        });
        console.log();
        
        if (bestMatch && bestSimilarity >= 0.7) {
            console.log(`✅ Excellent! Your response was correct!`);
            console.log(`You matched: ${bestMatch.ar} (${bestMatch.eng})`);
            console.log(`Similarity: ${Math.round(bestSimilarity * 100)}%`);
            
            // Play the correct response
            await speak(USE_WAV_FILES ? bestMatch.chat : bestMatch.ar);
        } else if (bestMatch && bestSimilarity >= 0.4) {
            console.log(`👍 Close! Your response was almost correct.`);
            console.log(`Best match: ${bestMatch.ar} (${bestMatch.eng})`);
            console.log(`Similarity: ${Math.round(bestSimilarity * 100)}%`);
            
            // Play the best match
            await speak(USE_WAV_FILES ? bestMatch.chat : bestMatch.ar);
        } else {
            console.log(`❌ Try again! Focus on the pronunciation.`);
            if (bestMatch) {
                console.log(`Best match: ${bestMatch.ar} (${bestMatch.eng})`);
                console.log(`Similarity: ${Math.round(bestSimilarity * 100)}%`);
            }
            
            // Play one of the correct responses
            const correctResponse = validResponses[0];
            await speak(USE_WAV_FILES ? correctResponse.chat : correctResponse.ar);
        }
        
    } catch (error) {
        console.log('❌ An error occurred during transcription');
        console.log(error.message);
    }
    
    promptForNextAction(listenAndRespondGame);
};

// Helper function to calculate similarity (reuse from other games)
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

// Start the application
mainMenu();
