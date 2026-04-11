const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSC6cn5zv2nYLr6z69JGF0nQ1Rg-vhB9XsZDWXM17ZfkQMCWmqEmse4UNk9TbRTFQRAG-lKDbXtUb1r/pub?output=csv"; 

let fullDeck = [];
let currentDeck = [];
let currentIndex = 0;

// Fonction robuste pour lire le CSV même avec des virgules dans le texte
function parseCSV(text) {
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const lines = text.split('\n').filter(l => l.trim() !== "");
    return lines.slice(1).map(line => {
        // Cette ligne sépare intelligemment les colonnes
        const matches = line.match(/(".*?"|[^,]+)/g);
        if (matches) {
            return {
                q: matches[0].replace(/"/g, ''),
                a: matches[1].replace(/"/g, ''),
                cat: matches[2] ? matches[2].replace(/"/g, '').trim() : "Général"
            };
        }
    }).filter(card => card !== undefined);
}

async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        fullDeck = parseCSV(csvText);
        currentDeck = [...fullDeck];
        showCard();
    } catch (e) {
        document.getElementById('question').innerText = "Erreur de chargement. Vérifie ta connexion.";
    }
}

function showCard() {
    if (currentDeck.length === 0) return;
    document.getElementById('question').innerText = currentDeck[currentIndex].q;
    document.getElementById('answer').innerText = currentDeck[currentIndex].a;
    document.getElementById('card').classList.remove('flipped');
}

function flipCard() { document.getElementById('card').classList.toggle('flipped'); }

function nextCard() {
    if (currentDeck.length <= 1) return;
    let nextIndex;
    do {
        nextIndex = Math.floor(Math.random() * currentDeck.length);
    } while (nextIndex === currentIndex); // Pour ne pas avoir deux fois la même
    
    currentIndex = nextIndex;
    showCard();
}

function changeCategory() {
    const cat = document.getElementById('category-select').value;
    currentDeck = cat === "Tous" ? [...fullDeck] : fullDeck.filter(c => c.cat === cat);
    currentIndex = 0;
    showCard();
}

loadData();
