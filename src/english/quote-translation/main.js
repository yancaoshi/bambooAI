import allCards from './data.json';

let cards = [];
let currentIndex = 0;
let isRevealed = false;
let isFlipped = false;

const cardDisplay = document.getElementById('card-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtnTop = document.getElementById('prev-btn-top');
const nextBtnTop = document.getElementById('next-btn-top');
const randomBtn = document.getElementById('random-btn');
const jumpInput = document.getElementById('jump-input');
const totalCountEl = document.getElementById('total-count');

async function init() {
    try {
        cards = allCards.filter(card => card.status === 'active');
        totalCountEl.textContent = cards.length;
        
        const savedIndex = localStorage.getItem('quote-translation-index');
        if (savedIndex !== null) {
            currentIndex = parseInt(savedIndex, 10);
            if (currentIndex >= cards.length) currentIndex = 0;
        }

        renderCard();
    } catch (error) {
        console.error('Error loading cards:', error);
        cardDisplay.innerHTML = '<div class="error">加载失败，请检查数据。</div>';
    }
}

function renderCard() {
    if (cards.length === 0) return;

    const card = cards[currentIndex];
    isRevealed = false;
    isFlipped = false;

    cardDisplay.innerHTML = `
        <div class="flip-card" id="active-card">
            <div class="card-face card-face-front">
                <div class="card-header">
                    <span class="source-label">${card.source}</span>
                    <span class="card-id">#${String(currentIndex + 1).padStart(2, '0')}</span>
                </div>
                <div class="card-scroll-area">
                    <div class="ancient-text">${card.ancient_text}</div>
                    <div class="explanation-section" id="explanation">
                        <div class="modern-chinese">${card.modern_chinese}</div>
                        <div class="points-title">翻译要点</div>
                        <div class="translation-points">${card.translation_points}</div>
                    </div>
                </div>
                <div class="click-hint" id="front-hint">点击查看解析 | 再次点击翻转</div>
            </div>
            <div class="card-face card-face-back">
                <div class="english-translation">"${card.english_translation}"</div>
                <div class="click-hint">再次点击返回正面</div>
            </div>
        </div>
    `;

    document.getElementById('active-card').addEventListener('click', handleCardClick);
    
    updateControls();
    localStorage.setItem('quote-translation-index', currentIndex);
}

function handleCardClick() {
    const cardElement = document.getElementById('active-card');
    const explanation = document.getElementById('explanation');
    const hint = document.getElementById('front-hint');

    if (!isRevealed) {
        isRevealed = true;
        explanation.classList.add('is-visible');
        hint.textContent = '再次点击翻转显示英译';
    } else if (!isFlipped) {
        isFlipped = true;
        cardElement.classList.add('is-flipped');
    } else {
        isFlipped = false;
        isRevealed = false;
        cardElement.classList.remove('is-flipped');
        explanation.classList.remove('is-visible');
        hint.textContent = '点击查看解析 | 再次点击翻转';
    }
}

function updateControls() {
    jumpInput.value = currentIndex + 1;
    
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === cards.length - 1;
    
    prevBtn.disabled = isFirst;
    prevBtnTop.disabled = isFirst;
    nextBtn.disabled = isLast;
    nextBtnTop.disabled = isLast;
}

function navigate(direction) {
    if (direction === -1 && currentIndex > 0) {
        currentIndex--;
        renderCard();
    } else if (direction === 1 && currentIndex < cards.length - 1) {
        currentIndex++;
        renderCard();
    }
}

prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });
prevBtnTop.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
nextBtnTop.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

jumpInput.addEventListener('change', () => {
    let target = parseInt(jumpInput.value, 10) - 1;
    if (isNaN(target) || target < 0) target = 0;
    else if (target >= cards.length) target = cards.length - 1;
    currentIndex = target;
    renderCard();
});

randomBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cards.length <= 1) return;
    let newIndex;
    do { newIndex = Math.floor(Math.random() * cards.length); } while (newIndex === currentIndex);
    currentIndex = newIndex;
    renderCard();
});

jumpInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') jumpInput.blur(); });

init();
