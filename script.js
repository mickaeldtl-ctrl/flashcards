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
        resetSession();
    } catch (e) {
        document.getElementById('question').innerText = "⚠️ Erreur : Vérifie la publication du CSV.";
    }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 5);
    // Détection automatique du séparateur (virgule ou point-virgule)
    const separator = text.includes(';') ? ';' : ',';
    
    return lines.slice(1).map(line => {
        const parts = line.split(separator).map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
            return {
                q: parts[0],
                a: parts[1],
                cat: parts[2] ? parts[2].toUpperCase() : "BILAN" // Par défaut
            };
        }
    }).filter(x => x);
}

function resetSession() {
    const selectedValue = document.getElementById('category-select').value.toUpperCase();
    
    if (selectedValue === "TOUS") {
        sessionDeck = [...fullDeck];
    } else {
        sessionDeck = fullDeck.filter(c => c.cat === selectedValue);
    }

    if (sessionDeck.length === 0) {
        document.getElementById('question').innerText = "📭 Aucune fiche dans : " + selectedValue;
        document.getElementById('answer').innerText = "Vérifie l'orthographe dans ton tableur.";
        return;
    }

    currentIndex = Math.floor(Math.random() * sessionDeck.length);
    showCard();
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
    if (isKnown) { sessionDeck.splice(currentIndex, 1); }
    if (sessionDeck.length > 0) {
        currentIndex = Math.floor(Math.random() * sessionDeck.length);
        showCard();
    } else { showCard(); }
}

function changeCategory() { resetSession(); }
function flipCard() { document.getElementById('card').classList.toggle('flipped'); }

loadData();
