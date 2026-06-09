const deck = generateDeck();
let playerHand = [];
let recycleBin = [];
let selectedCards = [];

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
    renderHand();
}

function renderHand() {
    const handContainer = document.getElementById('hand');
    handContainer.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerText = `${card.name}\nWaga: ${card.weight}\nPunkty: ${card.points}`;
        cardElement.addEventListener('click', () => moveToRecycleBin(index));
        handContainer.appendChild(cardElement);
    });
}

function moveToRecycleBin(index) {
    const card = playerHand.splice(index, 1)[0];
    recycleBin.push(card);
    renderHand();
    renderRecycleBin();
}

function renderRecycleBin() {
    const binContainer = document.getElementById('bin');
    binContainer.innerHTML = '';
    recycleBin.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.difficulty}`;
        cardElement.innerText = `${card.name}\nWaga: ${card.weight}\nPunkty: ${card.points}`;
        cardElement.addEventListener('click', () => selectCard(card, index));
        binContainer.appendChild(cardElement);
    });
}

function selectCard(card, index) {
    if (selectedCards.includes(index)) {
        selectedCards = selectedCards.filter(i => i !== index);
        document.getElementsByClassName('card')[index].classList.remove('selected');
    } else {
        selectedCards.push(index);
        document.getElementsByClassName('card')[index].classList.add('selected');
    }

    if (selectedCards.length === 2) {
        const [firstCard, secondCard] = selectedCards.map(i => recycleBin[i]);
        if (firstCard.name === secondCard.name) {
            recycleBin = recycleBin.filter((_, i) => !selectedCards.includes(i));
        }
        selectedCards = [];
        renderRecycleBin();
    }
}
