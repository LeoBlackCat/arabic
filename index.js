const fs = require('fs');
const say = require('say');
const inquirer = require('inquirer');

// Load and parse the logic.json file
let logic;
try {
    const rawData = fs.readFileSync('logic.json');
    logic = JSON.parse(rawData);
} catch (error) {
    console.error("Error reading or parsing logic.json:", error);
    process.exit(1);
}

const items = logic.items;

// --- Helper Functions ---

// Get a random item from the list
const getRandomItem = () => {
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
    // Using 'Majed' voice, which is good for Arabic on macOS.
    // You might need to download it first: System Settings > Accessibility > Spoken Content > System Voice.
    say.speak(text, 'Majed', 1.0, (err) => {
        if (err) {
            console.error('Error trying to use Arabic voice:', err);
            console.log('Could not use Arabic voice. Please ensure it is installed on your system.');
            console.log('Falling back to default system voice.');
            say.speak(text, null, 1.0);
        }
    });
};


// --- Game Modes ---

// 1. Flash Cards Game
const flashCardsGame = async () => {
    console.clear();
    console.log('--- 🃏 Flash Cards ---');
    console.log('Listen to the Arabic phrase, then press Enter to see the translation.');

    const item = getRandomItem();
    console.log(`\nArabic: ${item.ar} (${item.chat})`);
    speak(item.ar);

    await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: 'Press Enter to reveal the meaning...'
    }]);

    console.log(`English: ${item.eng}\n`);

    const {
        action
    } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What next?',
        choices: ['Next Card', 'Back to Menu'],
    }, ]);

    if (action === 'Next Card') {
        flashCardsGame();
    } else {
        mainMenu();
    }
};

// 2. Guess the Meaning Game
const guessTheMeaningGame = async () => {
    console.clear();
    console.log('--- 🤔 Guess the Meaning ---');
    console.log('Listen to the Arabic phrase and choose the correct English translation.');

    // Get a correct answer
    const correctAnswer = getRandomItem();
    speak(correctAnswer.ar);
    console.log(`\nListen...`);


    // Get three other unique random items for incorrect options
    const incorrectOptions = [];
    while (incorrectOptions.length < 3) {
        const option = getRandomItem();
        // Ensure the option is not the correct answer and not already in the list
        if (option.id !== correctAnswer.id && !incorrectOptions.some(o => o.id === option.id)) {
            incorrectOptions.push(option);
        }
    }

    // Create choices array and shuffle it
    const choices = shuffleArray([
        correctAnswer.eng,
        ...incorrectOptions.map(o => o.eng)
    ]);

    const {
        guess
    } = await inquirer.prompt([{
        type: 'list',
        name: 'guess',
        message: 'What is the meaning?',
        choices: choices,
    }, ]);

    if (guess === correctAnswer.eng) {
        console.log('\nCorrect! ✅');
        console.log(`${correctAnswer.ar} (${correctAnswer.chat}) = ${correctAnswer.eng}`);
    } else {
        console.log('\nIncorrect. ❌');
        console.log(`The correct answer was: "${correctAnswer.eng}"`);
    }

    await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
    }]);

    guessTheMeaningGame();
};


// --- Main Menu ---
const mainMenu = async () => {
    console.clear();
    const {
        game
    } = await inquirer.prompt([{
        type: 'list',
        name: 'game',
        message: 'Choose a game to play:',
        choices: ['Flash Cards', 'Guess the Meaning', 'Exit'],
    }, ]);

    switch (game) {
        case 'Flash Cards':
            flashCardsGame();
            break;
        case 'Guess the Meaning':
            guessTheMeaningGame();
            break;
        case 'Exit':
            console.log('Goodbye! (مع السلامة)');
            process.exit(0);
    }
};

// Start the application
mainMenu();