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
document.getElementById('startGame').addEventListener('click', startGame);
startTimer();

function startGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (playerName === '') {
        alert('Proszę wprowadzić swoje imię.');
        return;
    }
    document.getElementById('playerInfo').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
    startTimer();
}

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
        { month: 10, name: "Drewno", difficulty: 'easy', weight: 2, points: 3 },
        { month: 11, name: "Odpady Chemiczne", difficulty: 'hard', weight: 8, points: 5 },
        { month: 12, name: "Złom", difficulty: 'medium', weight: 3, points: 2 },
    ];

    months.forEach(month => {
        for (let i = 0; i < 4; i++) {
            cards.push({ ...month });
        }
    });

    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
}

function drawCard() {
    if (deck.length === 0) {
        endGame();
        return;
    }
    const card = deck.pop();
    playerHand.push(card);
    updateHand();
    addCardToRecycleBin(card);
}

function addCardToRecycleBin(card) {
    recycleBin.push(card);
    const key = card.name;
    if (!recycleBinCounts[key]) {
        recycleBinCounts[key] = 0;
    }
    recycleBinCounts[key]++;
    updateRecycleBin();

    if (recycleBinCounts[key] === 3) {
        points -= 300;
        showMessage(`Trzy karty ${key} w koszu! Tracisz 300 punktów.`);
        recycleBin = recycleBin.filter(c => c.name !== key);
        recycleBinCounts[key] = 0;
        updateRecycleBin();
        updatePoints();
    } else if (recycleBinCounts[key] === 2) {
        const matchingCards = recycleBin.filter(c => c.name === key);
        if (matchingCards.length === 2) {
            const index = recycleBin.findIndex(c => c.name === key);
            recycleBin.splice(index, 1);
            recycleBin.splice(recycleBin.findIndex(c => c.name === key), 1);
            recycleBinCounts[key] = 0;
            updateRecycleBin();
            addPointsForPair(key);
        }
    }

    if (card.name === 'Odpady Nuklearne') {
        nuclearWasteCount++;
    } else if (card.name === 'Odpady Niebezpieczne') {
        hazardousWasteCount++;
    } else if (card.name === 'Odpady Zmieszane') {
        mixedWasteCount++;
    }

    updatePoints();
}

function updateHand() {
    const handElement = document.getElementById('hand');
    handElement.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerHTML = `${card.name}`;
        handElement.appendChild(cardElement);
    });
}

function updateRecycleBin() {
    const binElement = document.getElementById('bin');
    binElement.innerHTML = '';
    recycleBin.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerHTML = `${card.name}`;
        binElement.appendChild(cardElement);
    });
}

function addPointsForPair(name) {
    const pairBonus = {
        2: 100,
        3: 70,
        4: 50,
        5: 40,
        6: 10
    };
    const positions = recycleBin.map((card, index) => card.name === name ? index + 1 : null).filter(index => index);
    const distance = positions[1] - positions[0];
    const bonus = pairBonus[distance] || 0;
    points += bonus;
    timeLeft += 5;
    showMessage(`Usunięto parę ${name}. Otrzymujesz ${bonus} punktów i 5 sekund.`);
}

function updatePoints() {
    points -= (5 * nuclearWasteCount);
    points -= (2 * hazardousWasteCount);
    points -= (1 * mixedWasteCount);
    document.getElementById('points').innerText = `Punkty: ${points}`;
}

function startTimer() {
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        } else {
            timeLeft--;
            updateTimer();
        }
    }, 1000);
}

function updateTimer() {
    document.getElementById('timer').innerText = `Czas: ${timeLeft}s`;
}

function endGame() {
    clearInterval(timer);
    showMessage(`Koniec gry! Twoje punkty: ${points}`);
    saveScore();
    updateScoreList();
}

function showMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerText = message;
    setTimeout(() => {
        messageContainer.innerText = '';
    }, 3000);
}

function saveScore() {
    const playerName = document.getElementById('playerName').value;
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({ name: playerName, points });
    scores.sort((a, b) => b.points - a.points);
    localStorage.setItem('scores', JSON.stringify(scores));
}

function updateScoreList() {
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = '';
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.forEach(score => {
        const scoreItem = document.createElement('li');
        scoreItem.innerText = `${score.name}: ${score.points}`;
        scoreList.appendChild(scoreItem);
    });
}
