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

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

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
                weight: 2
            };
        }
        return null;
    }).filter(x => x !== null);
}

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

    // Réinitialiser les transformations et styles de swipe
    cardEl.style.transform = '';
    cardEl.style.transition = '';
    cardEl.classList.remove('hidden', 'flipped', 'swiping-left', 'swiping-right');
    controlsEl.classList.remove('hidden');
    finishEl.classList.add('hidden');

    document.getElementById('question').innerText = card.q;
    document.getElementById('answer').innerText = card.a;
}

function handleAnswer(isKnown) {
    if (!currentCard) return;

    if (isKnown) {
        currentCard.weight -= 1;
    } else {
        currentCard.weight += 2;
    }

    pickNextCard();
}

function changeCategory() { resetSession(); }

// Retournement de carte (évite de retourner si un swipe a eu lieu)
let isSwiping = false;
function flipCard() {
    if (isSwiping) return;
    document.getElementById('card').classList.toggle('flipped');
}

/* ==========================================
   GESTION DU SWIPE TACTILE
   ========================================== */
const card = document.getElementById('card');
let startX = 0;
let currentX = 0;
let isDragging = false;

card.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    isSwiping = false;
    card.style.transition = 'none';
}, { passive: true });

card.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;

    // Si le déplacement est significatif, on bloque le flip au clic
    if (Math.abs(diffX) > 10) {
        isSwiping = true;
    }

    const rotate = diffX * 0.08; // légère rotation
    card.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;

    if (diffX > 40) {
        card.classList.add('swiping-right');
        card.classList.remove('swiping-left');
    } else if (diffX < -40) {
        card.classList.add('swiping-left');
        card.classList.remove('swiping-right');
    } else {
        card.classList.remove('swiping-left', 'swiping-right');
    }
}, { passive: true });

card.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = currentX - startX;
    const threshold = 80; // Seuil de validation du swipe

    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    if (diffX > threshold) {
        // Swipe à droite -> MAÎTRISÉ
        card.style.transform = `translateX(500px) rotate(30deg)`;
        card.style.opacity = '0';
        setTimeout(() => {
            handleAnswer(true);
            card.style.opacity = '1';
        }, 250);
    } else if (diffX < -threshold) {
        // Swipe à gauche -> À REVOIR
        card.style.transform = `translateX(-500px) rotate(-30deg)`;
        card.style.opacity = '0';
        setTimeout(() => {
            handleAnswer(false);
            card.style.opacity = '1';
        }, 250);
    } else {
        // Retour au centre si le swipe est annulé
        card.style.transform = '';
        card.classList.remove('swiping-left', 'swiping-right');
    }

    startX = 0;
    currentX = 0;
});

loadData();
