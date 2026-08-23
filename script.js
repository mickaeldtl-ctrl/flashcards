const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSC6cn5zv2nYLr6z69JGF0nQ1Rg-vhB9XsZDWXM17ZfkQMCWmqEmse4UNk9TbRTFQRAG-lKDbXtUb1r/pub?output=csv"; 

let fullDeck = [];
let sessionDeck = [];
let currentCard = null;

async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error();
        const csvText = await response.text();
        fullDeck = parseCSV(csvText);
        updateCategorySelect();
        resetSession();
    } catch (e) {
        document.getElementById('question').innerText = "⚠️ Erreur : Vérifie la publication du CSV.";
    }
}

// Parser CSV conforme (gestion propre des virgules, guillemets et sauts de ligne)
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    // Détection du séparateur principal (, ou ;)
    const header = lines[0];
    const separator = header.includes(';') ? ';' : ',';

    const parseLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === separator && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += c;
            }
        }
        result.push(cur.trim());
        return result;
    };

    return lines.slice(1).map(line => {
        const parts = parseLine(line);
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return {
                q: parts[0],
                a: parts[1],
                cat: parts[2] ? parts[2].trim().toUpperCase() : "GENERAL",
                weight: 2 // Poids initial : 2 réussites nécessaires pour valider la carte
            };
        }
        return null;
    }).filter(x => x !== null);
}

// Remplit automatiquement le <select> avec les catégories trouvées dans le Sheet
function updateCategorySelect() {
    const select = document.getElementById('category-select');
    const categories = Array.from(new Set(fullDeck.map(c => c.cat))).sort();
    
    select.innerHTML = '<option value="TOUS">Toutes les catégories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function resetSession() {
    const selectedValue = document.getElementById('category-select').value.toUpperCase();
    
    // Réinitialisation du poids pour la nouvelle session
    const source = selectedValue === "TOUS" 
        ? fullDeck 
        : fullDeck.filter(c => c.cat === selectedValue);

    sessionDeck = source.map(card => ({ ...card, weight: 2 }));

    if (sessionDeck.length === 0) {
        document.getElementById('question').innerText = "📭 Aucune fiche dans : " + selectedValue;
        document.getElementById('answer').innerText = "Vérifie le contenu de ton tableur.";
        return;
    }

    pickNextCard();
}

// Tire une carte de façon pondérée (plus le poids est grand, plus la probabilité est forte)
function pickNextCard() {
    const activeCards = sessionDeck.filter(c => c.weight > 0);

    if (activeCards.length === 0) {
        showCard(null);
        return;
    }

    const totalWeight = activeCards.reduce((sum, card) => sum + card.weight, 0);
    let randomVal = Math.random() * totalWeight;

    for (const card of activeCards) {
        if (randomVal < card.weight) {
            currentCard = card;
            break;
        }
        randomVal -= card.weight;
    }

    showCard(currentCard);
}

function showCard(card) {
    const cardEl = document.getElementById('card');
    const controlsEl = document.getElementById('controls');
    const finishEl = document.getElementById('finished-state');

    if (!card) {
        cardEl.classList.add('hidden');
        controlsEl.classList.add('hidden');
        finishEl.classList.remove('hidden');
        return;
    }

    cardEl.classList.remove('hidden', 'flipped');
    controlsEl.classList.remove('hidden');
    finishEl.classList.add('hidden');

    document.getElementById('question').innerText = card.q;
    document.getElementById('answer').innerText = card.a;
}

function handleAnswer(isKnown) {
    if (!currentCard) return;

    if (isKnown) {
        // Reduit la fréquence d'apparition (poids diminue)
        currentCard.weight -= 1;
    } else {
        // Augmente la fréquence d'apparition (revient plus souvent)
        currentCard.weight += 2;
    }

    pickNextCard();
}

function changeCategory() { resetSession(); }
function flipCard() { document.getElementById('card').classList.toggle('flipped'); }

loadData();
