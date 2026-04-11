
// REMPLACE BIEN PAR TON LIEN CSV GOOGLE DRIVE
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSC6cn5zv2nYLr6z69JGF0nQ1Rg-vhB9XsZDWXM17ZfkQMCWmqEmse4UNk9TbRTFQRAG-lKDbXtUb1r/pub?output=csv"; 


let fullDeck = [];
let sessionDeck = [];
let currentIndex = 0;

async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error();
        const csvText = await response.text();
        fullDeck = parseCSV(csvText);
        if (fullDeck.length === 0) throw new Error();
        resetSession();
    } catch (e) {
        document.getElementById('question').innerText = "⚠️ Erreur de lien Sheet. Vérifie que tu as bien publié en .csv";
    }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 5);
    return lines.slice(1).map(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 2) {
            return {
                q: parts[0].replace(/"/g, '').trim(),
                a: parts[1].replace(/"/g, '').trim(),
                cat: parts[2] ? parts[2].replace(/"/g, '').trim() : "Général"
            };
        }
    }).filter(x => x);
}

function showCard() {
    const cardEl = document.getElementById('card');
    const controlsEl = document.getElementById('controls');
    const finishEl = document.getElementById('finished-state');

    if (sessionDeck.length === 0) {
        cardEl.classList.add('hidden');
        controlsEl.classList.add('hidden');
        finishEl.classList.remove('hidden');
        return;
    }

    cardEl.classList.remove('hidden', 'flipped');
    controlsEl.classList.remove('hidden');
    finishEl.classList.add('hidden');

    document.getElementById('question').innerText = sessionDeck[currentIndex].q;
    document.getElementById('answer').innerText = sessionDeck[currentIndex].a;
}

function handleAnswer(isKnown) {
    if (isKnown) {
        sessionDeck.splice(currentIndex, 1);
    }
    
    if (sessionDeck.length > 0) {
        currentIndex = Math.floor(Math.random() * sessionDeck.length);
        showCard();
    } else {
        showCard();
    }
}

function resetSession() {
    const cat = document.getElementById('category-select').value;
    sessionDeck = cat === "Tous" ? [...fullDeck] : fullDeck.filter(c => c.cat === cat);
    currentIndex = Math.floor(Math.random() * sessionDeck.length);
    showCard();
}

function changeCategory() { resetSession(); }
function flipCard() { document.getElementById('card').classList.toggle('flipped'); }

loadData();
