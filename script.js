
loadData();
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSC6cn5zv2nYLr6z69JGF0nQ1Rg-vhB9XsZDWXM17ZfkQMCWmqEmse4UNk9TbRTFQRAG-lKDbXtUb1r/pub?output=csv"; 

let fullDeck = [];      // Toutes les cartes du Sheet
let sessionDeck = [];   // Les cartes qu'il reste à apprendre maintenant
let currentIndex = 0;

async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        fullDeck = parseCSV(csvText);
        resetSession(); // On commence une session avec toutes les cartes
    } catch (e) {
        document.getElementById('question').innerText = "Erreur de chargement.";
    }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim() !== "");
    return lines.slice(1).map(line => {
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

function showCard() {
    if (sessionDeck.length === 0) {
        document.getElementById('card').style.display = "none";
        document.getElementById('controls').style.display = "none";
        document.getElementById('finished-state').style.display = "block";
        return;
    }
    document.getElementById('card').style.display = "block";
    document.getElementById('controls').style.display = "flex";
    document.getElementById('finished-state').style.display = "none";
    
    document.getElementById('question').innerText = sessionDeck[currentIndex].q;
    document.getElementById('answer').innerText = sessionDeck[currentIndex].a;
    document.getElementById('card').classList.remove('flipped');
}

function handleAnswer(isKnown) {
    if (isKnown) {
        // Enlever la carte du deck de session (elle est sue)
        sessionDeck.splice(currentIndex, 1);
    } else {
        // Laisser la carte et passer à une autre (elle reviendra)
        currentIndex = (currentIndex + 1) % sessionDeck.length;
    }
    
    // Si on a encore des cartes, on en choisit une au hasard
    if (sessionDeck.length > 0) {
        currentIndex = Math.floor(Math.random() * sessionDeck.length);
        showCard();
    } else {
        showCard(); // Affichera l'écran de fin
    }
}

function resetSession() {
    const cat = document.getElementById('category-select').value;
    sessionDeck = cat === "Tous" ? [...fullDeck] : fullDeck.filter(c => c.cat === cat);
    currentIndex = Math.floor(Math.random() * sessionDeck.length);
    showCard();
}

function changeCategory() {
    resetSession();
}

function flipCard() { 
    document.getElementById('card').classList.toggle('flipped'); 
}

loadData();
