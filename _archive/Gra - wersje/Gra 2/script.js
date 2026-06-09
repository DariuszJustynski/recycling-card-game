const deck = generateDeck();
let playerHand = [];
let recycleBin = [];
let selectedCards = [];
let points = 0;
let lastCard = null;
let cardHistory = [];
const recycleBinCounts = {};

document.getElementById('drawCard').addEventListener('click', drawCard);

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
        updatePoints();
        displayMessage(message);
    }

    lastCard = card;
}

function updatePoints() {
    document.getElementById('points').innerText = points;
}

function displayMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement);
}

function renderHand() {
    const handElement = document.getElementById('hand');
    handElement.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerText = card.name;
        cardElement.addEventListener('click', () => moveToRecycleBin(index));
        handElement.appendChild(cardElement);
    });
}

function moveToRecycleBin(cardIndex) {
    const card = playerHand.splice(cardIndex, 1)[0];
    recycleBin.push(card);
    if (!recycleBinCounts[card.name]) {
        recycleBinCounts[card.name] = 0;
    }
    recycleBinCounts[card.name]++;
    renderHand();
    renderRecycleBin();
    checkRecycleBin();
}

function renderRecycleBin() {
    const binElement = document.getElementById('bin');
    binElement.innerHTML = '';
    recycleBin.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerText = card.name;
        cardElement.addEventListener('click', () => selectCard(index));
        if (selectedCards.includes(index)) {
            cardElement.classList.add('selected');
        }
        binElement.appendChild(cardElement);
    });
}

function selectCard(cardIndex) {
    if (selectedCards.includes(cardIndex)) {
        selectedCards = selectedCards.filter(index => index !== cardIndex);
    } else {
        selectedCards.push(cardIndex);
    }
    
    if (selectedCards.length === 2) {
        checkForPair();
    }

    renderRecycleBin();
}

function checkForPair() {
    const [firstIndex, secondIndex] = selectedCards.sort((a, b) => a - b); // Sortowanie indeksów
    const firstCard = recycleBin[firstIndex];
    const secondCard = recycleBin[secondIndex];

    if (firstCard.name === secondCard.name) {
        recycleBin.splice(secondIndex, 1); // Najpierw usuń wyższy indeks
        recycleBin.splice(firstIndex, 1);  // Następnie usuń niższy indeks
        points += 10;
        updatePoints();
        displayMessage('Usunięto parę kart. +10 punktów.');
        recycleBinCounts[firstCard.name] -= 2;
    }

    selectedCards = [];
    renderRecycleBin();
}


function checkRecycleBin() {
    for (let name in recycleBinCounts) {
        if (recycleBinCounts[name] === 3) {
            points -= 300;
            updatePoints();
            displayMessage(`Przeoczyłeś usunięcie pary kart ${name}. -300 punktów.`);
            break;
        }
    }
}
