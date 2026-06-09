const deck = generateDeck();
let playerHand = [];
let recycleBin = [];
let selectedCards = [];
let points = 0;
let lastCard = null;
let cardHistory = [];
const recycleBinCounts = {};
let nuclearWasteCount = 0;
let hazardousWasteCount = 0;
let mixedWasteCount = 0;
let timeLeft = 60;
let timer;

// Inicjalizacja gry
document.getElementById('drawCard').addEventListener('click', drawCard);
startTimer();

function generateDeck() {
    const cards = [];
    const months = [
        { month: 1, name: "Papier", difficulty: 'easy', weight: 1, points: 1 },
        { month: 2, name: "Szkło", difficulty: 'medium', weight: 2, points: 2 },
        { month: 3, name: "Odpady Nuklearne", difficulty: 'hard', weight: 10, points: 5 },
        { month: 4, name: "Plastik", difficulty: 'easy', weight: 3, points: 3 },
        { month: 5, name: "Metal", difficulty: 'medium', weight: 4, points: 4 },
        { month: 6, name: "Bioodpady", difficulty: 'easy', weight: 2, points: 2 },
        { month: 7, name: "Elektronika", difficulty: 'medium', weight: 5, points: 4 },
        { month: 8, name: "Odpady Niebezpieczne", difficulty: 'hard', weight: 7, points: 4 },
        { month: 9, name: "Odpady Zmieszane", difficulty: 'hard', weight: 5, points: 3 },
        { month: 10, name: "Drewno", difficulty: 'easy', weight: 2, points: 2 },
        { month: 11, name: "Tekstylia", difficulty: 'medium', weight: 3, points: 3 },
        { month: 12, name: "Ceramika", difficulty: 'hard', weight: 6, points: 5 }
    ];

    for (let i = 0; i < 48; i++) {
        const cardType = months[i % months.length];
        cards.push({ ...cardType });
    }
    
    return shuffle(cards);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawCard() {
    if (deck.length === 0) {
        alert('Brak więcej kart w talii');
        return;
    }
    const card = deck.pop();
    playerHand.push(card);
    cardHistory.push(card);
    checkForBonus(card);
    renderHand();
}

function checkForBonus(card) {
    let bonus = 0;
    let message = '';

    if (lastCard && lastCard.name === card.name) {
        bonus = 100;
        message = 'Bonus 100 punktów za dwie takie same karty jedna po drugiej!';
    } else if (cardHistory.length >= 3 && cardHistory[cardHistory.length - 3].name === card.name) {
        bonus = 70;
        message = 'Bonus 70 punktów za dwie takie same karty co drugi raz!';
    } else if (cardHistory.length >= 4 && cardHistory[cardHistory.length - 4].name === card.name) {
        bonus = 50;
        message = 'Bonus 50 punktów za dwie takie same karty w szeregu 1:3!';
    } else if (cardHistory.length >= 5 && cardHistory[cardHistory.length - 5].name === card.name) {
        bonus = 40;
        message = 'Bonus 40 punktów za dwie takie same karty w szeregu 1:4!';
    } else if (cardHistory.length >= 6 && cardHistory[cardHistory.length - 6].name === card.name) {
        bonus = 10;
        message = 'Bonus 10 punktów za dwie takie same karty w szeregu 1:5!';
    }

    if (bonus > 0) {
        points += bonus;
        document.getElementById('points').innerText = `Punkty: ${points}`;
        displayMessage(message);
        timeLeft += 5;
    }

    lastCard = card;
}

function renderHand() {
    const handContainer = document.getElementById('hand');
    handContainer.innerHTML = '';

    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', card.difficulty);
        cardElement.innerText = card.name;
        cardElement.addEventListener('click', () => selectCard(index));
        handContainer.appendChild(cardElement);
    });

    const binContainer = document.getElementById('bin');
    binContainer.innerHTML = '';
    
    recycleBin.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', card.difficulty);
        cardElement.innerText = card.name;
        cardElement.addEventListener('click', () => removeFromBin(index));
        binContainer.appendChild(cardElement);
    });
}

function selectCard(index) {
    const selectedCard = playerHand[index];
    playerHand.splice(index, 1);
    recycleBin.push(selectedCard);

    if (!recycleBinCounts[selectedCard.name]) {
        recycleBinCounts[selectedCard.name] = 0;
    }
    recycleBinCounts[selectedCard.name]++;
    calculatePenalties(selectedCard);

    renderHand();
}

function removeFromBin(index) {
    const removedCard = recycleBin[index];
    recycleBin.splice(index, 1);
    recycleBinCounts[removedCard.name]--;
    if (recycleBinCounts[removedCard.name] === 0) {
        delete recycleBinCounts[removedCard.name];
    }

    points += removedCard.points;
    document.getElementById('points').innerText = `Punkty: ${points}`;
    displayMessage(`Zdobywasz ${removedCard.points} punktów za usunięcie karty ${removedCard.name} z kosza`);
    timeLeft += 5;
    renderHand();
}

function calculatePenalties(card) {
    let penalty = 0;

    if (card.name === 'Odpady Nuklearne') {
        nuclearWasteCount++;
        penalty = Math.pow(2, nuclearWasteCount + 1) * 5;
        points -= penalty;
        document.getElementById('points').innerText = `Punkty: ${points}`;
        displayMessage(`Kara ${penalty} punktów za Odpady Nuklearne`);
        timeLeft -= 10;
    } else if (card.name === 'Odpady Niebezpieczne') {
        hazardousWasteCount++;
        penalty = Math.pow(2, hazardousWasteCount + 1);
        points -= penalty;
        document.getElementById('points').innerText = `Punkty: ${points}`;
        displayMessage(`Kara ${penalty} punktów za Odpady Niebezpieczne`);
        timeLeft -= 5;
    } else if (card.name === 'Odpady Zmieszane') {
        mixedWasteCount++;
        penalty = Math.pow(2, mixedWasteCount);
        points -= penalty;
        document.getElementById('points').innerText = `Punkty: ${points}`;
        displayMessage(`Kara ${penalty} punktów za Odpady Zmieszane`);
        timeLeft -= 1;
    }
}

function displayMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerText = message;
    setTimeout(() => {
        messageContainer.innerText = '';
    }, 3000);
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `Czas: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('Koniec czasu! Gra skończona.');
            location.reload();
        }
    }, 1000);
}
function renderBin() {
    const binContainer = document.getElementById('bin');
    binContainer.innerHTML = '';

    recycleBin.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', card.difficulty);
        cardElement.innerText = card.name;
        cardElement.addEventListener('click', () => removeFromBin(index));
        binContainer.appendChild(cardElement);
    });
}

function removeFromBin(index) {
    const removedCard = recycleBin[index];
    recycleBin.splice(index, 1);
    recycleBinCounts[removedCard.name]--;
    if (recycleBinCounts[removedCard.name] === 0) {
        delete recycleBinCounts[removedCard.name];
    }

    points += removedCard.points;
    document.getElementById('points').innerText = `Punkty: ${points}`;
    displayMessage(`Zdobywasz ${removedCard.points} punktów za usunięcie karty ${removedCard.name} z kosza`);
    timeLeft += 5;
    renderBin();
}