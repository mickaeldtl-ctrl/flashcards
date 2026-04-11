// COLLE ICI TON LIEN DE PUBLICATION CSV
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSC6cn5zv2nYLr6z69JGF0nQ1Rg-vhB9XsZDWXM17ZfkQMCWmqEmse4UNk9TbRTFQRAG-lKDbXtUb1r/pub?output=csv"; 

let fullDeck = [];
let currentDeck = [];
let currentIndex = 0;

async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        // Nettoyage simple du CSV
        const lines = csvText.split('\n').filter(line => line.trim() !== "");
        fullDeck = lines.slice(1).map(line => {
            const columns = line.split(','); 
            return { q: columns[0], a: columns[1], cat: columns[2]?.trim() };
        });

        currentDeck = [...fullDeck];
        showCard();
    } catch (e) {
        document.getElementById('question').innerText = "Erreur de lien Sheet";
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
    currentIndex = (currentIndex + 1) % currentDeck.length;
    showCard();
}

function changeCategory() {
    const cat = document.getElementById('category-select').value;
    currentDeck = cat === "Tous" ? [...fullDeck] : fullDeck.filter(c => c.cat === cat);
    currentIndex = 0;
    showCard();
}

loadData();