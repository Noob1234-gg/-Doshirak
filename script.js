// ======================
// НАСТРОЙКИ СЕРВЕРА
// ======================
const SERVER_URL = 'https://ваш-сервер.railway.app'; // ЗАМЕНИТЕ НА ВАШ URL
let onlineMode = false;
let playerId = localStorage.getItem('doshirakPlayerId') || generatePlayerId();
let syncInterval = null;

// ======================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================

// ======================
// ОПРЕДЕЛЕНИЕ УСТРОЙСТВА
// ======================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 767;
const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
const isDesktop = !isMobile && !isTablet;

// Оптимизация для мобильных устройств
function optimizeForDevice() {
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });

        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        reduceAnimations();
        initSwipeNavigation();
    }

    if (isTablet) {
        document.body.classList.add('tablet-device');
    }

    if (isDesktop) {
        document.body.classList.add('desktop-device');
    }

    adjustBetButtonsForDevice();
}

// Уменьшение анимаций на мобильных
function reduceAnimations() {
    const logoIcon = document.querySelector('.logo-icon');
    if (logoIcon) {
        logoIcon.style.animation = 'none';
    }

    const style = document.createElement('style');
    style.textContent = `
        .mobile-device .game-card::before {
            display: none !important;
        }
        .mobile-device .play-btn::after {
            display: none !important;
        }
        .mobile-device .slot.spinning {
            animation: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Инициализация свайп-навигации для мобильных
function initSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 100;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > swipeThreshold) {
            const tabs = document.querySelectorAll('.tab');
            let activeIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));

            if (diff > 0 && activeIndex > 0) {
                tabs[activeIndex - 1].click();
            } else if (diff < 0 && activeIndex < tabs.length - 1) {
                tabs[activeIndex + 1].click();
            }
        }
    }
}

// Адаптация кнопок ставок под устройство - ИСПРАВЛЕНО
function adjustBetButtonsForDevice() {
    if (isMobile) {
        document.querySelectorAll('.bet-btn').forEach(btn => {
            const change = parseInt(btn.getAttribute('data-change'));
            
            if (Math.abs(change) >= 1000) {
                btn.style.display = window.innerWidth <= 480 ? 'none' : 'block';
            }
            
            if (Math.abs(change) === 100 && window.innerWidth <= 380) {
                btn.style.display = 'none';
            }
        });
    }
}

// Переопределяем функцию showNotification для мобильных
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    if (isMobile) {
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.classList.add('show');
        notification.style.top = 'auto';
        notification.style.bottom = '20px';
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Улучшенная адаптация для клавиатуры на мобильных
function setupMobileInputs() {
    if (isMobile) {
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }
}

// Функция debounce для оптимизации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Генерация ID игрока
function generatePlayerId() {
    const id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('doshirakPlayerId', id);
    return id;
}

// Игровые переменные
let balance = parseInt(localStorage.getItem('doshirakBalance')) || 100;
let lastBonusDate = localStorage.getItem('lastBonusDate') || '';
let today = new Date().toDateString();
let gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
let playerStats = JSON.parse(localStorage.getItem('playerStats')) || {
    totalGames: 0,
    gamesWon: 0,
    gamesLost: 0
};

let usedPromoCodes = JSON.parse(localStorage.getItem('usedPromoCodes')) || [];

// Промокоды
let promoCodeInput, activatePromoBtn;

// Профиль игрока
let playerProfile = JSON.parse(localStorage.getItem('playerProfile')) || {
    name: "Игрок",
    avatar: "👨‍💼",
    joinedDate: new Date().toLocaleDateString('ru-RU')
};

// Время последнего обновления топа
let lastLeaderboardUpdate = localStorage.getItem('lastLeaderboardUpdate') || 0;

// Лидерборд
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || generateInitialLeaderboard();

// Режим разработчика
const DEVELOPER_PASSWORDS = {
    FULL: "RK9L3M-X8Q4N2-VB6C1X-PL5S7W",
    LIMITED: "4F6H8J-1A3C5E-7G9I2K-4M6N8P"
};

const ACCESS_LEVELS = {
    FULL: 'full',
    LIMITED: 'limited'
};

let currentAccessLevel = null;
let isDeveloperMode = false;

// DOM элементы
let balanceElement, dailyBonusButton, slotBetElement, guessBetElement, blackjackBetElement, rouletteBetElement, raceBetElement;
let slotResultElement, guessResultElement, blackjackResultElement, rouletteResultElement, raceResultElement, historyItemsElement;
let playerNameInput, playerAvatarSelect, leaderboardBody, leaderboardUpdateElement;
let totalGamesElement, gamesWonElement, gamesLostElement, winRateElement;
let shareBtn, shareLinks, copyLinkBtn, notification;

// Переменные для игр
let blackjackGameActive = false;
let blackjackDealerCards = [];
let blackjackPlayerCards = [];
let rouletteCurrentBet = null;
let raceSelectedRacer = null;
let raceInProgress = false;

// Элементы режима разработчика
let devModal, devPasswordInput, devControls, devMessage;
let devAccessBtn, closeDevModal, submitDevPassword, exitDevMode;
let setBalanceBtn, addBalanceBtn, resetBalanceBtn;
let clearHistoryBtn, clearAllDataBtn;
let testWinSlotsBtn, testWinGuessBtn, testWinBlackjackBtn, testWinRouletteBtn;

// Генерация начального лидерборда
function generateInitialLeaderboard() {
    const randomNames = [
        "ДоширакоМан", "НиндзяЛапши", "Суперазиат", "ЛапшаУдача", 
        "ВокМастер", "БоссДоширак", "РаменКороль", "МистерЛапша",
        "ЛапшаКинг", "ДоширакПро"
    ];
    
    const randomAvatars = ["🦸", "🥷", "🧙", "👨‍🍳", "👨‍🚀", "👨‍💼", "👑", "🍜", "🤴", "🦊"];
    
    return [
        {name: playerProfile.name, balance: balance, avatar: playerProfile.avatar},
        ...randomNames.map((name, index) => ({
            name: name,
            balance: Math.floor(Math.random() * 10000) + 1000,
            avatar: randomAvatars[index % randomAvatars.length]
        }))
    ].sort((a, b) => b.balance - a.balance).slice(0, 10);
}

// ======================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ - ИСПРАВЛЕНО
// ======================
document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    initApp();
    setupEventListeners();
    initDeveloperMode();
    initNewGames();
    optimizeForDevice();
    setupMobileInputs();
    
    window.addEventListener('resize', debounce(() => {
        const wasMobile = isMobile;
        const newIsMobile = window.innerWidth <= 767;
        
        window.isMobile = newIsMobile;
        window.isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
        window.isDesktop = !window.isMobile && !window.isTablet;
        
        if (wasMobile !== newIsMobile) {
            location.reload();
        } else {
            adjustBetButtonsForDevice();
        }
    }, 250));
});

// ======================
// КЭШИРОВАНИЕ DOM ЭЛЕМЕНТОВ - ИСПРАВЛЕНО
// ======================
function cacheDOMElements() {
    balanceElement = document.getElementById('balance');
    dailyBonusButton = document.getElementById('dailyBonus');
    
    slotBetElement = document.getElementById('slotBetAmount');
    guessBetElement = document.getElementById('guessBetAmount');
    blackjackBetElement = document.getElementById('blackjackBetAmount');
    rouletteBetElement = document.getElementById('rouletteBetAmount');
    raceBetElement = document.getElementById('raceBetAmount');
    
    slotResultElement = document.getElementById('slotResult');
    guessResultElement = document.getElementById('guessResult');
    blackjackResultElement = document.getElementById('blackjackResult');
    rouletteResultElement = document.getElementById('rouletteResult');
    raceResultElement = document.getElementById('raceResult');
    
    historyItemsElement = document.getElementById('historyItems');
    playerNameInput = document.getElementById('playerName');
    playerAvatarSelect = document.getElementById('playerAvatar');
    leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardUpdateElement = document.getElementById('leaderboardUpdate');
    
    totalGamesElement = document.getElementById('totalGames');
    gamesWonElement = document.getElementById('gamesWon');
    gamesLostElement = document.getElementById('gamesLost');
    winRateElement = document.getElementById('winRate');
    
    shareBtn = document.getElementById('shareBtn');
    shareLinks = document.getElementById('shareLinks');
    copyLinkBtn = document.getElementById('copyLinkBtn');
    
    notification = document.getElementById('notification');
    
    promoCodeInput = document.getElementById('promoCode');
    activatePromoBtn = document.getElementById('activatePromo');
}

// Инициализация приложения
function initApp() {
    updateBalance();
    checkDailyBonus();
    updateGameHistory();
    loadProfile();
    updateStats();
    checkLeaderboardUpdate();
    setupTabs();
}

// ======================
// НАСТРОЙКА СЛУШАТЕЛЕЙ СОБЫТИЙ - ИСПРАВЛЕНО
// ======================
function setupEventListeners() {
    document.querySelectorAll('.bet-btn').forEach(button => {
        button.addEventListener('click', handleBetChange);
    });
    
    const playSlotsBtn = document.getElementById('playSlots');
    if (playSlotsBtn) playSlotsBtn.addEventListener('click', playSlots);
    
    const playGuessBtn = document.getElementById('playGuess');
    if (playGuessBtn) playGuessBtn.addEventListener('click', playGuess);
    
    if (dailyBonusButton) dailyBonusButton.addEventListener('click', claimDailyBonus);
    
    const saveProfileBtn = document.getElementById('saveProfile');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    
    if (shareBtn) shareBtn.addEventListener('click', toggleShareLinks);
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyGameLink);
    
    document.querySelectorAll('.share-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            shareOnPlatform(this.getAttribute('data-platform'));
        });
    });
    
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    const toggleOnlineBtn = document.getElementById('toggleOnline');
    if (toggleOnlineBtn) {
        toggleOnlineBtn.addEventListener('click', toggleOnlineMode);
    }
    
    if (activatePromoBtn) {
        activatePromoBtn.addEventListener('click', activatePromoCode);
    }
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                activatePromoCode();
            }
        });
    }
}

// ======================
// ОБРАБОТКА ИЗМЕНЕНИЯ СТАВКИ - ИСПРАВЛЕНО
// ======================
function handleBetChange() {
    const change = parseInt(this.getAttribute('data-change'));
    const betElement = this.closest('.bet-controls')?.querySelector('.bet-amount');
    
    if (!betElement) return;
    
    const currentBet = parseInt(betElement.textContent);
    const newBet = currentBet + change;
    
    if (newBet >= 5 && newBet <= 1000000) {
        betElement.textContent = newBet;
        playSound('click');
    }
}

// Настройка вкладок
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
            playSound('click');
        });
    });
}

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`${tabId}-tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    if (tabId === 'leaderboard') {
        checkLeaderboardUpdate();
    }
}

// Обновление баланса
function updateBalance() {
    if (balanceElement) {
        balanceElement.textContent = balance;
    }
    localStorage.setItem('doshirakBalance', balance);
    updatePlayerInLeaderboard();
}

// Обновление игрока в лидерборде
function updatePlayerInLeaderboard() {
    const playerIndex = leaderboard.findIndex(player => player.name === playerProfile.name);
    
    if (playerIndex !== -1) {
        leaderboard[playerIndex].balance = balance;
        leaderboard[playerIndex].avatar = playerProfile.avatar;
    } else {
        leaderboard.push({
            name: playerProfile.name,
            balance: balance,
            avatar: playerProfile.avatar
        });
    }
    
    leaderboard.sort((a, b) => b.balance - a.balance);
    
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Проверка необходимости обновления лидерборда
function checkLeaderboardUpdate() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastLeaderboardUpdate > fiveMinutes) {
        updateLeaderboardWithCurrentData();
        lastLeaderboardUpdate = now;
        localStorage.setItem('lastLeaderboardUpdate', lastLeaderboardUpdate);
        
        const updateTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (leaderboardUpdateElement) {
            leaderboardUpdateElement.textContent = `Обновлено в ${updateTime}`;
        }
    } else {
        const lastUpdateTime = new Date(parseInt(lastLeaderboardUpdate)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (leaderboardUpdateElement) {
            leaderboardUpdateElement.textContent = `Обновлено в ${lastUpdateTime}`;
        }
    }
    
    displayLeaderboard();
}

// Обновление лидерборда текущими данными
function updateLeaderboardWithCurrentData() {
    updatePlayerInLeaderboard();
    
    leaderboard.forEach((player) => {
        if (player.name !== playerProfile.name) {
            const changePercent = (Math.random() * 0.3) - 0.15;
            const change = Math.round(player.balance * changePercent);
            player.balance += change;
            
            if (player.balance < 100) player.balance = 100 + Math.floor(Math.random() * 1000);
            if (player.balance > 50000) player.balance = 50000;
        }
    });
    
    leaderboard.sort((a, b) => b.balance - a.balance);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Проверка ежедневного бонуса
function checkDailyBonus() {
    if (!dailyBonusButton) return;
    
    if (lastBonusDate === today) {
        dailyBonusButton.disabled = true;
        dailyBonusButton.innerHTML = '<i class="fas fa-check"></i> Бонус уже получен сегодня';
    } else {
        dailyBonusButton.disabled = false;
    }
}

// Получение ежедневного бонуса
function claimDailyBonus() {
    const bonusAmount = 50;
    balance += bonusAmount;
    lastBonusDate = today;
    
    localStorage.setItem('lastBonusDate', lastBonusDate);
    updateBalance();
    checkDailyBonus();
    
    addToHistory('Ежедневный бонус', `+${bonusAmount}`, true);
    
    if (slotResultElement) {
        slotResultElement.innerHTML = `Вы получили ежедневный бонус: <span class="win">+${bonusAmount} дошираков!</span>`;
        slotResultElement.className = 'result win';
    }
    
    playSound('win');
    showNotification(`Получен ежедневный бонус: +${bonusAmount} дошираков!`, 'info');
    updateStats();
}

// ======================
// ИГРЫ
// ======================

// Игра в слоты
function playSlots() {
    if (!slotBetElement || !slotResultElement) return;
    
    const bet = parseInt(slotBetElement.textContent);
    const playButton = document.getElementById('playSlots');
    
    if (bet > balance) {
        slotResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        slotResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (playButton) {
        playButton.disabled = true;
        playButton.textContent = 'Вращение...';
    }
    
    balance -= bet;
    updateBalance();
    
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    
    if (!slots[0] || !slots[1] || !slots[2]) return;
    
    const allSymbols = ['🍜', '🥤', '🍥', '🎲', '💰'];
    let firstSymbol = null;
    let secondSymbol = null;
    
    const slot1Symbols = ['🍜', '🥤', '🍥', '🎲', '💰'];
    const slot2Symbols = ['n', '🍜', 'n', '🥤', 'n', '🍥', 'n', '🎲', 'n', '💰'];
    const slot3Symbols = ['n', '🍜', 'n', '🥤', 'n', '🍥', 'n', '🎲', 'n', '💰'];
    
    playSound('spin');
    
    let spinInterval = setInterval(() => {
        slots.forEach(slot => {
            if (slot && !slot.classList.contains('stopped')) {
                const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                slot.textContent = randomSymbol;
                slot.classList.add('spinning');
            }
        });
    }, 100);
    
    setTimeout(() => {
        clearInterval(spinInterval);
        
        const slot1 = slots[0];
        if (slot1) {
            firstSymbol = slot1Symbols[Math.floor(Math.random() * slot1Symbols.length)];
            slot1.textContent = firstSymbol;
            slot1.classList.remove('spinning');
            slot1.classList.add('stopped');
        }
        
        spinInterval = setInterval(() => {
            slots.slice(1).forEach(slot => {
                if (slot && !slot.classList.contains('stopped')) {
                    const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    slot.textContent = randomSymbol;
                    slot.classList.add('spinning');
                }
            });
        }, 100);
        
        setTimeout(() => {
            clearInterval(spinInterval);
            
            const slot2 = slots[1];
            if (slot2) {
                const slot2Options = slot2Symbols.map(symbol => symbol === 'n' ? firstSymbol : symbol);
                secondSymbol = slot2Options[Math.floor(Math.random() * slot2Options.length)];
                slot2.textContent = secondSymbol;
                slot2.classList.remove('spinning');
                slot2.classList.add('stopped');
            }
            
            spinInterval = setInterval(() => {
                const slot3 = slots[2];
                if (slot3 && !slot3.classList.contains('stopped')) {
                    const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                    slot3.textContent = randomSymbol;
                    slot3.classList.add('spinning');
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(spinInterval);
                
                const slot3 = slots[2];
                if (slot3) {
                    const slot3Options = slot3Symbols.map(symbol => symbol === 'n' ? firstSymbol : symbol);
                    const thirdSymbol = slot3Options[Math.floor(Math.random() * slot3Options.length)];
                    slot3.textContent = thirdSymbol;
                    slot3.classList.remove('spinning');
                    slot3.classList.add('stopped');
                    
                    setTimeout(() => {
                        checkSlotResult(slots, [firstSymbol, secondSymbol, thirdSymbol], bet);
                        
                        setTimeout(() => {
                            slots.forEach(slot => {
                                if (slot) {
                                    slot.classList.remove('stopped', 'spinning', 'winning');
                                }
                            });
                            if (playButton) {
                                playButton.disabled = false;
                                playButton.textContent = 'Вращать слоты';
                            }
                        }, 3000);
                    }, 500);
                }
            }, 1000);
        }, 1000);
    }, 1000);
    
    playerStats.totalGames += 1;
    updateStats();
}

// Проверка результата слотов
function checkSlotResult(slots, results, bet) {
    if (!slotResultElement) return;
    
    const allEqual = results[0] === results[1] && results[1] === results[2];
    
    if (allEqual) {
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        slots.forEach(slot => {
            if (slot) slot.classList.add('winning');
        });
        
        slotResultElement.innerHTML = `ПОБЕДА! 3 символа ${results[0]}! <span class="win">+${winAmount} дошираков!</span>`;
        slotResultElement.className = 'result win';
        
        addToHistory('Слоты', `+${winAmount}`, true);
        playerStats.gamesWon += 1;
        
        playSound('win');
        showNotification(`Выигрыш: +${winAmount} дошираков!`, 'info');
    } else {
        slotResultElement.innerHTML = `Повезет в следующий раз! <span class="lose">-${bet} дошираков</span>`;
        slotResultElement.className = 'result lose';
        
        addToHistory('Слоты', `-${bet}`, false);
        playerStats.gamesLost += 1;
        
        playSound('lose');
    }
    
    updateStats();
}

// Игра "Угадай число"
function playGuess() {
    if (!guessBetElement || !guessResultElement) return;
    
    const bet = parseInt(guessBetElement.textContent);
    const userGuess = parseInt(document.getElementById('numberGuess')?.value);
    
    if (userGuess < 1 || userGuess > 10) {
        guessResultElement.innerHTML = 'Пожалуйста, введите число от 1 до 10!';
        guessResultElement.className = 'result lose';
        showNotification('Введите число от 1 до 10!', 'error');
        return;
    }
    
    if (bet > balance) {
        guessResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        guessResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    playSound('click');
    
    balance -= bet;
    updateBalance();
    
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    
    if (userGuess === randomNumber) {
        const winAmount = bet * 5;
        balance += winAmount;
        updateBalance();
        
        guessResultElement.innerHTML = `ПОБЕДА! Вы угадали число ${randomNumber}! <span class="win">+${winAmount} дошираков!</span>`;
        guessResultElement.className = 'result win';
        
        addToHistory('Угадай число', `+${winAmount}`, true);
        playerStats.gamesWon += 1;
        
        playSound('win');
        showNotification(`Победа! +${winAmount} дошираков!`, 'info');
    } else {
        guessResultElement.innerHTML = `Неудача! Загаданное число было ${randomNumber}. <span class="lose">-${bet} дошираков</span>`;
        guessResultElement.className = 'result lose';
        
        addToHistory('Угадай число', `-${bet}`, false);
        playerStats.gamesLost += 1;
        
        playSound('lose');
    }
    
    playerStats.totalGames += 1;
    updateStats();
}

// ======================
// ПРОМОКОДЫ
// ======================

function activatePromoCode() {
    if (!promoCodeInput) return;
    
    const code = promoCodeInput.value.trim().toUpperCase();
    
    if (!code) {
        showNotification('Введите промокод!', 'error');
        return;
    }
    
    if (usedPromoCodes.includes(code)) {
        showNotification('Этот промокод уже был использован!', 'error');
        promoCodeInput.value = '';
        return;
    }
    
    const promoRewards = {
        'YTK455GP': 3000,
        'CSSTART': 500,
        'YURICH': 2000,
        'SUBOTA': 700,
        'BONUS': 100,
        'GOLDENKNIGHT': 900
    };
    
    const reward = promoRewards[code];
    
    if (reward) {
        balance += reward;
        updateBalance();
        
        usedPromoCodes.push(code);
        localStorage.setItem('usedPromoCodes', JSON.stringify(usedPromoCodes));
        
        showNotification(`Промокод активирован! +${reward} дошираков`, 'info');
        addToHistory('Промокод', `+${reward}`, true);
        
        playSound('win');
    } else {
        showNotification('Неверный промокод!', 'error');
    }
    
    promoCodeInput.value = '';
}

// ======================
// ОНЛАЙН-РЕЖИМ - ИСПРАВЛЕНО
// ======================

function toggleOnlineMode() {
    onlineMode = !onlineMode;
    const toggleBtn = document.getElementById('toggleOnline');
    const statusOffline = document.querySelector('.status-offline');
    const statusOnline = document.querySelector('.status-online');
    const playerIdDisplay = document.getElementById('playerIdDisplay');
    const playerIdSpan = document.getElementById('playerId');
    
    if (!toggleBtn || !statusOffline || !statusOnline || !playerIdDisplay || !playerIdSpan) {
        showNotification('Ошибка загрузки элементов онлайн-режима', 'error');
        return;
    }
    
    if (onlineMode) {
        toggleBtn.textContent = 'Выключить онлайн-режим';
        toggleBtn.classList.add('online');
        statusOffline.style.display = 'none';
        statusOnline.style.display = 'inline';
        playerIdDisplay.style.display = 'block';
        playerIdSpan.textContent = playerId;
        
        startSyncing();
        updateOnlineLeaderboard();
        showNotification('Онлайн-режим включен! Ваши данные синхронизируются с сервером.');
    } else {
        toggleBtn.textContent = 'Включить онлайн-режим';
        toggleBtn.classList.remove('online');
        statusOffline.style.display = 'inline';
        statusOnline.style.display = 'none';
        playerIdDisplay.style.display = 'none';
        
        stopSyncing();
        displayLeaderboard();
    }
}

function copyPlayerId() {
    navigator.clipboard.writeText(playerId).then(() => {
        showNotification('ID скопирован! Отправьте другу, чтобы он мог найти вас.');
    }).catch(() => {
        const tempInput = document.createElement('input');
        tempInput.value = playerId;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showNotification('ID скопирован!');
    });
}

function startSyncing() {
    syncInterval = setInterval(() => {
        syncWithServer();
        updateOnlineLeaderboard();
    }, 30000);
    
    syncWithServer();
}

function stopSyncing() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

async function syncWithServer() {
    if (!onlineMode) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/api/update-player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: playerId,
                name: playerProfile.name,
                avatar: playerProfile.avatar,
                balance: balance,
                stats: playerStats
            })
        });
        
        if (response.ok) {
            console.log('✅ Данные синхронизированы');
        }
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
    }
}

async function updateOnlineLeaderboard() {
    if (!onlineMode || !leaderboardBody) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/api/leaderboard`);
        const onlinePlayers = await response.json();
        displayOnlineLeaderboard(onlinePlayers);
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
    }
}

function displayOnlineLeaderboard(onlinePlayers) {
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    onlinePlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';
        
        let level = 'Новичок';
        if (player.balance >= 10000) level = 'Легенда';
        else if (player.balance >= 5000) level = 'Мастер';
        else if (player.balance >= 2000) level = 'Опытный';
        else if (player.balance >= 500) level = 'Игрок';
        
        const isCurrentPlayer = player.id === playerId;
        const playerStyle = isCurrentPlayer ? 'style="color: #ff9a3c; font-weight: bold;"' : '';
        
        const onlineIndicator = player.online ? ' <span class="online-indicator" title="Онлайн">●</span>' : '';
        
        row.innerHTML = `
            <td class="${rankClass}">${index + 1}</td>
            <td ${playerStyle}>
                <div class="player-cell">
                    <span style="font-size: 1.5rem;">${player.avatar}</span>
                    ${player.name} ${isCurrentPlayer ? '(Вы)' : ''}${onlineIndicator}
                </div>
            </td>
            <td ${playerStyle}>${player.balance}</td>
            <td>${level}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// ======================
// ПРОФИЛЬ И СТАТИСТИКА
// ======================

function loadProfile() {
    if (playerNameInput) playerNameInput.value = playerProfile.name;
    if (playerAvatarSelect) playerAvatarSelect.value = playerProfile.avatar;
}

function saveProfile() {
    if (!playerNameInput || !playerAvatarSelect || !slotResultElement) return;
    
    const newName = playerNameInput.value.trim() || "Игрок";
    const newAvatar = playerAvatarSelect.value;
    
    if (newName.toLowerCase() === "богдошираков") {
        balance += 10000;
        showNotification('Чит-код активирован! +10000 дошираков!');
    } else if (newName.toLowerCase() === "топ1") {
        balance += 50000;
        showNotification('Мега-чит активирован! +50000 дошираков!');
    }
    
    playerProfile.name = newName;
    playerProfile.avatar = newAvatar;
    localStorage.setItem('playerProfile', JSON.stringify(playerProfile));
    updatePlayerInLeaderboard();
    
    if (onlineMode) {
        syncWithServer();
    }
    
    slotResultElement.innerHTML = `<span class="win">Профиль сохранен!</span>`;
    slotResultElement.className = 'result win';
    
    setTimeout(() => switchTab('games'), 1500);
}

function updateStats() {
    if (totalGamesElement) totalGamesElement.textContent = playerStats.totalGames;
    if (gamesWonElement) gamesWonElement.textContent = playerStats.gamesWon;
    if (gamesLostElement) gamesLostElement.textContent = playerStats.gamesLost;
    
    const winRate = playerStats.totalGames > 0 
        ? Math.round((playerStats.gamesWon / playerStats.totalGames) * 100) 
        : 0;
    if (winRateElement) winRateElement.textContent = `${winRate}%`;
    
    localStorage.setItem('playerStats', JSON.stringify(playerStats));
}

function displayLeaderboard() {
    if (!leaderboardBody) return;
    
    const top10 = leaderboard.slice(0, 10);
    
    leaderboardBody.innerHTML = '';
    top10.forEach((player, index) => {
        const row = document.createElement('tr');
        
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        if (index === 1) rankClass = 'rank-2';
        if (index === 2) rankClass = 'rank-3';
        
        let level = 'Новичок';
        if (player.balance >= 10000) level = 'Легенда';
        else if (player.balance >= 5000) level = 'Мастер';
        else if (player.balance >= 2000) level = 'Опытный';
        else if (player.balance >= 500) level = 'Игрок';
        
        const isCurrentPlayer = player.name === playerProfile.name;
        const playerStyle = isCurrentPlayer ? 'style="color: #ff9a3c; font-weight: bold;"' : '';
        
        row.innerHTML = `
            <td class="${rankClass}">${index + 1}</td>
            <td ${playerStyle}>
                <div class="player-cell">
                    <span style="font-size: 1.5rem;">${player.avatar}</span>
                    ${player.name} ${isCurrentPlayer ? '(Вы)' : ''}
                </div>
            </td>
            <td ${playerStyle}>${player.balance}</td>
            <td>${level}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

function addToHistory(game, result, isWin) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const historyItem = {
        game,
        result,
        isWin,
        time: timeString
    };
    
    gameHistory.unshift(historyItem);
    
    if (gameHistory.length > 10) {
        gameHistory = gameHistory.slice(0, 10);
    }
    
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    updateGameHistory();
}

function updateGameHistory() {
    if (!historyItemsElement) return;
    
    historyItemsElement.innerHTML = '';
    
    if (gameHistory.length === 0) {
        historyItemsElement.innerHTML = '<div class="history-item">История игр пуста</div>';
        return;
    }
    
    gameHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div>
                <span class="history-game">${item.game}</span>
                <span> (${item.time})</span>
            </div>
            <div class="history-result ${item.isWin ? 'win' : 'lose'}">${item.result}</div>
        `;
        
        historyItemsElement.appendChild(historyItem);
    });
}

// ======================
// ОБЩИЙ ДОСТУП
// ======================

function toggleShareLinks() {
    if (shareLinks) {
        shareLinks.classList.toggle('show');
    }
    playSound('click');
}

function copyGameLink() {
    const gameUrl = window.location.href;
    
    navigator.clipboard.writeText(gameUrl).then(() => {
        showNotification('Ссылка скопирована в буфер обмена!', 'info');
        playSound('click');
    }).catch(err => {
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Ссылка скопирована в буфер обмена!', 'info');
        playSound('click');
    });
}

function shareOnPlatform(platform) {
    const gameUrl = window.location.href;
    const gameTitle = 'Доширак-Лэнд | Виртуальное казино';
    const gameDescription = 'Играйте в слоты и угадывайте числа, зарабатывайте дошираки!';
    
    let shareUrl = '';
    
    switch(platform) {
        case 'vk':
            shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(gameUrl)}&title=${encodeURIComponent(gameTitle)}&description=${encodeURIComponent(gameDescription)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(gameTitle + ' - ' + gameDescription)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(gameTitle + ' - ' + gameDescription + ' ' + gameUrl)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        showNotification('Открывается окно для публикации...', 'info');
    }
    
    playSound('click');
}

// ======================
// ЗВУКИ
// ======================

function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        let frequency = 440;
        let duration = 0.1;
        
        switch(type) {
            case 'click':
                frequency = 800;
                duration = 0.05;
                break;
            case 'win':
                frequency = 880;
                duration = 0.3;
                break;
            case 'lose':
                frequency = 220;
                duration = 0.2;
                break;
            case 'spin':
                frequency = 600;
                duration = 0.1;
                break;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
    } catch (e) {
        // Web Audio API не поддерживается
    }
}

// ======================
// НОВЫЕ ИГРЫ (БЛЭКДЖЕК, РУЛЕТКА, ГОНКИ)
// ======================

// 1. БЛЭКДЖЕК
function initBlackjack() {
    const hitBtn = document.getElementById('blackjackHit');
    const standBtn = document.getElementById('blackjackStand');
    const doubleBtn = document.getElementById('blackjackDouble');
    const restartBtn = document.getElementById('blackjackRestart');
    
    if (hitBtn) hitBtn.addEventListener('click', blackjackHit);
    if (standBtn) standBtn.addEventListener('click', blackjackStand);
    if (doubleBtn) doubleBtn.addEventListener('click', blackjackDouble);
    if (restartBtn) restartBtn.addEventListener('click', startBlackjack);
    
    if (blackjackResultElement) {
        blackjackResultElement.innerHTML = 'Сделайте ставку и начните игру!';
    }
    updateBlackjackControls(false);
}

function startBlackjack() {
    if (!blackjackBetElement || !blackjackResultElement) return;
    
    const bet = parseInt(blackjackBetElement.textContent);
    
    if (bet > balance) {
        blackjackResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        blackjackResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        blackjackResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        blackjackResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    balance -= bet;
    updateBalance();
    
    blackjackDealerCards = [];
    blackjackPlayerCards = [];
    blackjackGameActive = true;
    
    blackjackDealerCards.push(drawCard());
    blackjackPlayerCards.push(drawCard());
    blackjackPlayerCards.push(drawCard());
    
    updateBlackjackDisplay();
    
    if (calculateScore(blackjackPlayerCards) === 21) {
        blackjackGameActive = false;
        endBlackjackGame(bet, true);
        return;
    }
    
    updateBlackjackControls(true);
    blackjackResultElement.innerHTML = 'Ваш ход. Возьмите карту или остановитесь.';
    blackjackResultElement.className = 'result';
    
    playerStats.totalGames += 1;
    updateStats();
}

function drawCard() {
    const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return cards[Math.floor(Math.random() * cards.length)];
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    for (const card of cards) {
        if (card === 'A') {
            aces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card)) {
            score += 10;
        } else {
            score += parseInt(card);
        }
    }
    
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function updateBlackjackDisplay() {
    const dealerCardsElement = document.getElementById('dealerCards');
    const playerCardsElement = document.getElementById('playerCards');
    const dealerScoreElement = document.getElementById('dealerScore');
    const playerScoreElement = document.getElementById('playerScore');
    
    if (dealerCardsElement) {
        dealerCardsElement.innerHTML = '';
        if (blackjackGameActive) {
            dealerCardsElement.innerHTML += `<div class="card">${blackjackDealerCards[0] || '?'}</div>`;
            dealerCardsElement.innerHTML += `<div class="card">?</div>`;
        } else {
            blackjackDealerCards.forEach(card => {
                dealerCardsElement.innerHTML += `<div class="card">${card}</div>`;
            });
        }
    }
    
    if (dealerScoreElement) {
        dealerScoreElement.textContent = blackjackGameActive ? 'Очки: ?' : `Очки: ${calculateScore(blackjackDealerCards)}`;
    }
    
    if (playerCardsElement) {
        playerCardsElement.innerHTML = '';
        blackjackPlayerCards.forEach(card => {
            playerCardsElement.innerHTML += `<div class="card">${card}</div>`;
        });
    }
    
    if (playerScoreElement) {
        playerScoreElement.textContent = `Очки: ${calculateScore(blackjackPlayerCards)}`;
    }
}

function updateBlackjackControls(enable) {
    const hitBtn = document.getElementById('blackjackHit');
    const standBtn = document.getElementById('blackjackStand');
    const doubleBtn = document.getElementById('blackjackDouble');
    
    if (hitBtn) hitBtn.disabled = !enable;
    if (standBtn) standBtn.disabled = !enable;
    if (doubleBtn) doubleBtn.disabled = !enable || blackjackPlayerCards.length > 2;
}

function blackjackHit() {
    if (!blackjackGameActive) return;
    
    blackjackPlayerCards.push(drawCard());
    updateBlackjackDisplay();
    
    const playerScore = calculateScore(blackjackPlayerCards);
    
    if (playerScore > 21) {
        blackjackGameActive = false;
        endBlackjackGame(parseInt(blackjackBetElement?.textContent || 10), false);
    } else if (playerScore === 21) {
        blackjackStand();
    }
}

function blackjackStand() {
    if (!blackjackGameActive) return;
    
    blackjackGameActive = false;
    
    while (calculateScore(blackjackDealerCards) < 17) {
        blackjackDealerCards.push(drawCard());
    }
    
    updateBlackjackDisplay();
    endBlackjackGame(parseInt(blackjackBetElement?.textContent || 10), false);
}

function blackjackDouble() {
    if (!blackjackGameActive || blackjackPlayerCards.length > 2) return;
    if (!blackjackBetElement) return;
    
    const bet = parseInt(blackjackBetElement.textContent);
    
    if (bet * 2 > balance) {
        showNotification('Недостаточно дошираков для удвоения!', 'error');
        return;
    }
    
    balance -= bet;
    updateBalance();
    
    blackjackPlayerCards.push(drawCard());
    updateBlackjackDisplay();
    
    const playerScore = calculateScore(blackjackPlayerCards);
    
    if (playerScore > 21) {
        blackjackGameActive = false;
        endBlackjackGame(bet * 2, false, true);
    } else {
        blackjackStand();
    }
}

function endBlackjackGame(bet, isBlackjack = false, isDouble = false) {
    if (!blackjackResultElement) return;
    
    updateBlackjackControls(false);
    
    const playerScore = calculateScore(blackjackPlayerCards);
    const dealerScore = calculateScore(blackjackDealerCards);
    
    let result = '';
    let winAmount = 0;
    let isWin = false;
    
    if (isBlackjack) {
        winAmount = Math.floor(bet * 2.5);
        balance += winAmount;
        result = `БЛЭКДЖЕК! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore > 21) {
        result = `Перебор! Вы проиграли <span class="lose">${isDouble ? bet * 2 : bet} дошираков</span>`;
        playerStats.gamesLost += 1;
        playSound('lose');
    } else if (dealerScore > 21) {
        winAmount = isDouble ? bet * 4 : bet * 2;
        balance += winAmount;
        result = `Дилер перебрал! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore > dealerScore) {
        winAmount = isDouble ? bet * 4 : bet * 2;
        balance += winAmount;
        result = `Вы победили! Вы выиграли <span class="win">${winAmount} дошираков!</span>`;
        isWin = true;
        playerStats.gamesWon += 1;
        playSound('win');
    } else if (playerScore < dealerScore) {
        result = `Дилер победил! Вы проиграли <span class="lose">${isDouble ? bet * 2 : bet} дошираков</span>`;
        playerStats.gamesLost += 1;
        playSound('lose');
    } else {
        balance += isDouble ? bet * 2 : bet;
        result = `Ничья! Ставка возвращена`;
        playSound('click');
    }
    
    updateBalance();
    blackjackResultElement.innerHTML = result;
    blackjackResultElement.className = 'result ' + (isWin ? 'win' : 'lose');
    
    addToHistory('Блэкджек', isWin ? `+${winAmount}` : `-${isDouble ? bet * 2 : bet}`, isWin);
    
    if (isWin) {
        showNotification(`Победа в блэкджеке! +${winAmount} дошираков`, 'info');
    }
    
    updateStats();
}

// 2. РУЛЕТКА
function initRoulette() {
    const playBtn = document.getElementById('playRoulette');
    const numberBtn = document.getElementById('betOnNumber');
    const betButtons = document.querySelectorAll('.roulette-bet-btn');
    
    if (playBtn) playBtn.addEventListener('click', playRoulette);
    if (numberBtn) {
        numberBtn.addEventListener('click', () => {
            const number = parseInt(document.getElementById('rouletteNumber')?.value);
            if (number >= 0 && number <= 36) {
                rouletteCurrentBet = { type: 'number', value: number, multiplier: 36 };
                updateRouletteSelection();
            } else {
                showNotification('Введите число от 0 до 36!', 'error');
            }
        });
    }
    
    betButtons.forEach(btn => {
        if (btn.id !== 'betOnNumber') {
            btn.addEventListener('click', function() {
                const betType = this.getAttribute('data-bet');
                const multiplier = parseInt(this.getAttribute('data-multiplier'));
                rouletteCurrentBet = { type: betType, value: betType, multiplier: multiplier };
                updateRouletteSelection();
            });
        }
    });
}

function updateRouletteSelection() {
    if (!rouletteCurrentBet) return;
    
    const betButtons = document.querySelectorAll('.roulette-bet-btn');
    betButtons.forEach(btn => {
        const betType = btn.getAttribute('data-bet');
        if (betType === rouletteCurrentBet.value) {
            btn.style.backgroundColor = '#e94560';
        } else {
            btn.style.backgroundColor = '#0f3460';
        }
    });
    
    const rouletteNumber = document.getElementById('rouletteNumber');
    if (rouletteNumber) {
        if (rouletteCurrentBet.type === 'number') {
            rouletteNumber.style.borderColor = '#e94560';
            if (rouletteResultElement) {
                rouletteResultElement.innerHTML = `Выбрана ставка на число ${rouletteCurrentBet.value} (${rouletteCurrentBet.multiplier}x)`;
            }
        } else {
            rouletteNumber.style.borderColor = '#0f3460';
            const betNames = {
                'red': 'Красное',
                'black': 'Черное',
                'even': 'Четное',
                'odd': 'Нечетное'
            };
            if (rouletteResultElement) {
                rouletteResultElement.innerHTML = `Выбрана ставка: ${betNames[rouletteCurrentBet.value]} (${rouletteCurrentBet.multiplier}x)`;
            }
        }
    }
}

function playRoulette() {
    if (!rouletteCurrentBet || !rouletteBetElement || !rouletteResultElement) {
        if (rouletteResultElement) {
            rouletteResultElement.innerHTML = 'Сначала выберите тип ставки!';
            rouletteResultElement.className = 'result lose';
        }
        return;
    }
    
    const bet = parseInt(rouletteBetElement.textContent);
    
    if (bet > balance) {
        rouletteResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        rouletteResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        rouletteResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        rouletteResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    balance -= bet;
    updateBalance();
    
    playerStats.totalGames += 1;
    
    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
    const isBlack = !isRed && winningNumber !== 0;
    const isEven = winningNumber % 2 === 0 && winningNumber !== 0;
    const isOdd = winningNumber % 2 === 1;
    
    const wheel = document.getElementById('rouletteWheel');
    const ball = wheel?.querySelector('.roulette-ball');
    
    if (wheel) wheel.style.animation = 'spin 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
    if (ball) ball.style.animation = 'ballSpin 3s linear';
    
    const playBtn = document.getElementById('playRoulette');
    if (playBtn) {
        playBtn.disabled = true;
        playBtn.textContent = 'Крутится...';
    }
    
    playSound('spin');
    
    setTimeout(() => {
        if (wheel) wheel.style.animation = '';
        if (ball) ball.style.animation = '';
        
        let isWin = false;
        let winAmount = 0;
        
        if (rouletteCurrentBet.type === 'number') {
            if (rouletteCurrentBet.value === winningNumber) {
                isWin = true;
                winAmount = bet * rouletteCurrentBet.multiplier;
            }
        } else {
            switch(rouletteCurrentBet.value) {
                case 'red':
                    if (isRed) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'black':
                    if (isBlack) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'even':
                    if (isEven) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
                case 'odd':
                    if (isOdd) {
                        isWin = true;
                        winAmount = bet * rouletteCurrentBet.multiplier;
                    }
                    break;
            }
        }
        
        if (isWin) {
            balance += winAmount;
            playerStats.gamesWon += 1;
            playSound('win');
            showNotification(`Выигрыш в рулетке! +${winAmount} дошираков`, 'info');
        } else {
            playerStats.gamesLost += 1;
            playSound('lose');
        }
        
        updateBalance();
        
        const numberColor = winningNumber === 0 ? 'зеленый' : isRed ? 'красный' : 'черный';
        const numberType = winningNumber === 0 ? 'ноль' : isEven ? 'четное' : 'нечетное';
        
        if (isWin) {
            rouletteResultElement.innerHTML = `
                Выигрышное число: ${winningNumber} (${numberColor}, ${numberType})<br>
                <span class="win">ПОБЕДА! +${winAmount} дошираков!</span>
            `;
            rouletteResultElement.className = 'result win';
        } else {
            rouletteResultElement.innerHTML = `
                Выигрышное число: ${winningNumber} (${numberColor}, ${numberType})<br>
                <span class="lose">Вы проиграли ${bet} дошираков</span>
            `;
            rouletteResultElement.className = 'result lose';
        }
        
        addToHistory('Рулетка', isWin ? `+${winAmount}` : `-${bet}`, isWin);
        
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.textContent = 'Крутить рулетку';
        }
        
        updateStats();
    }, 3000);
}

// 3. ГОНКИ
function initRace() {
    const startBtn = document.getElementById('startRace');
    const racerBtns = document.querySelectorAll('.racer-btn');
    
    if (startBtn) startBtn.addEventListener('click', startRace);
    
    racerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const racerId = this.getAttribute('data-racer');
            selectRacer(parseInt(racerId));
        });
    });
}

function selectRacer(racerId) {
    raceSelectedRacer = racerId;
    
    const racerBtns = document.querySelectorAll('.racer-btn');
    racerBtns.forEach(btn => {
        if (btn.getAttribute('data-racer') == racerId) {
            btn.style.backgroundColor = '#e94560';
        } else {
            btn.style.backgroundColor = '#0f3460';
        }
    });
    
    const racerNames = {
        1: '🍜 Лапша-1',
        2: '🥤 Напиток',
        3: '🍥 Вафля',
        4: '🎲 Удача'
    };
    
    const selectedRacerElement = document.getElementById('selectedRacer');
    if (selectedRacerElement) {
        selectedRacerElement.innerHTML = 
            `Выбран гонщик: <strong>${racerNames[racerId]}</strong>`;
    }
}

function startRace() {
    if (!raceSelectedRacer || !raceBetElement || !raceResultElement) {
        if (raceResultElement) {
            raceResultElement.innerHTML = 'Сначала выберите гонщика!';
            raceResultElement.className = 'result lose';
        }
        return;
    }
    
    const bet = parseInt(raceBetElement.textContent);
    
    if (bet > balance) {
        raceResultElement.innerHTML = 'Недостаточно дошираков для ставки!';
        raceResultElement.className = 'result lose';
        showNotification('Недостаточно дошираков!', 'error');
        return;
    }
    
    if (bet < 5) {
        raceResultElement.innerHTML = 'Минимальная ставка - 5 дошираков!';
        raceResultElement.className = 'result lose';
        showNotification('Минимальная ставка - 5 дошираков!', 'error');
        return;
    }
    
    if (raceInProgress) return;
    
    balance -= bet;
    updateBalance();
    
    raceInProgress = true;
    playerStats.totalGames += 1;
    
    const startBtn = document.getElementById('startRace');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = 'Гонка началась!';
    }
    
    raceResultElement.innerHTML = 'Гонка началась!';
    raceResultElement.className = 'result';
    
    for (let i = 1; i <= 4; i++) {
        const racer = document.getElementById(`racer${i}`);
        if (racer) {
            racer.style.left = '0px';
        }
    }
    
    const finishLine = 280;
    const racers = [1, 2, 3, 4];
    const speeds = racers.map(() => Math.random() * 3 + 2);
    
    let positions = [0, 0, 0, 0];
    let winner = null;
    
    playSound('spin');
    
    const raceInterval = setInterval(() => {
        for (let i = 0; i < 4; i++) {
            positions[i] += speeds[i] + Math.random() * 2;
            const racer = document.getElementById(`racer${i + 1}`);
            if (racer) {
                racer.style.left = `${Math.min(positions[i], finishLine)}px`;
            }
            
            if (positions[i] >= finishLine && winner === null) {
                winner = i + 1;
            }
        }
        
        if (winner !== null) {
            clearInterval(raceInterval);
            endRace(winner, bet);
        }
    }, 50);
}

function endRace(winner, bet) {
    raceInProgress = false;
    
    const startBtn = document.getElementById('startRace');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = 'Начать гонку';
    }
    
    const winnerRacer = document.getElementById(`racer${winner}`);
    if (winnerRacer) {
        winnerRacer.classList.add('winning');
    }
    
    const isWin = winner === raceSelectedRacer;
    
    if (isWin) {
        const winAmount = bet * 3;
        balance += winAmount;
        updateBalance();
        
        if (raceResultElement) {
            raceResultElement.innerHTML = `
                Победил гонщик №${winner}!<br>
                <span class="win">ПОБЕДА! Ваш гонщик выиграл! +${winAmount} дошираков!</span>
            `;
            raceResultElement.className = 'result win';
        }
        
        playerStats.gamesWon += 1;
        playSound('win');
        showNotification(`Победа в гонках! +${winAmount} дошираков`, 'info');
        
        addToHistory('Гонки', `+${winAmount}`, true);
    } else {
        if (raceResultElement) {
            raceResultElement.innerHTML = `
                Победил гонщик №${winner}!<br>
                <span class="lose">Вы проиграли ${bet} дошираков</span>
            `;
            raceResultElement.className = 'result lose';
        }
        
        playerStats.gamesLost += 1;
        playSound('lose');
        
        addToHistory('Гонки', `-${bet}`, false);
    }
    
    updateStats();
    
    setTimeout(() => {
        if (winnerRacer) {
            winnerRacer.classList.remove('winning');
        }
    }, 3000);
}

// Инициализация новых игр
function initNewGames() {
    initBlackjack();
    initRoulette();
    initRace();
}

// ======================
// РЕЖИМ РАЗРАБОТЧИКА
// ======================

function initDeveloperMode() {
    devModal = document.getElementById('devModal');
    devPasswordInput = document.getElementById('devPassword');
    devControls = document.querySelector('.dev-controls');
    devMessage = document.getElementById('devMessage');
    devAccessBtn = document.getElementById('devAccessBtn');
    closeDevModal = document.getElementById('closeDevModal');
    submitDevPassword = document.getElementById('submitDevPassword');
    exitDevMode = document.getElementById('exitDevMode');
    
    setBalanceBtn = document.getElementById('setBalance');
    addBalanceBtn = document.getElementById('addBalance');
    resetBalanceBtn = document.getElementById('resetBalance');
    clearHistoryBtn = document.getElementById('clearHistory');
    clearAllDataBtn = document.getElementById('clearAllData');
    testWinSlotsBtn = document.getElementById('testWinSlots');
    testWinGuessBtn = document.getElementById('testWinGuess');
    testWinBlackjackBtn = document.getElementById('testWinBlackjack');
    testWinRouletteBtn = document.getElementById('testWinRoulette');
    
    setupDeveloperEventListeners();
}

function setupDeveloperEventListeners() {
    if (devAccessBtn) {
        devAccessBtn.addEventListener('click', () => {
            if (devModal) devModal.style.display = 'flex';
            if (devPasswordInput) devPasswordInput.focus();
        });
    }
    
    if (closeDevModal) {
        closeDevModal.addEventListener('click', closeDeveloperModal);
    }
    
    if (submitDevPassword) {
        submitDevPassword.addEventListener('click', checkDeveloperPassword);
    }
    
    if (exitDevMode) {
        exitDevMode.addEventListener('click', exitDeveloperMode);
    }
    
    if (setBalanceBtn) {
        setBalanceBtn.addEventListener('click', () => {
            const newBalance = parseInt(document.getElementById('devBalance')?.value);
            if (!isNaN(newBalance) && newBalance >= 0) {
                balance = newBalance;
                updateBalance();
                showDeveloperMessage(`Баланс установлен: ${newBalance} дошираков`);
            }
        });
    }
    
    if (addBalanceBtn) {
        addBalanceBtn.addEventListener('click', () => {
            balance += 1000;
            updateBalance();
            showDeveloperMessage(`Добавлено 1000 дошираков. Новый баланс: ${balance}`);
        });
    }
    
    if (resetBalanceBtn) {
        resetBalanceBtn.addEventListener('click', () => {
            balance = 100;
            updateBalance();
            showDeveloperMessage('Баланс сброшен к начальному значению: 100 дошираков');
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            gameHistory = [];
            localStorage.removeItem('gameHistory');
            updateGameHistory();
            showDeveloperMessage('История игр очищена');
        });
    }
    
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', () => {
            if (confirm('Вы уверены? Это удалит все данные игры.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    if (testWinSlotsBtn) {
        testWinSlotsBtn.addEventListener('click', () => {
            const bet = 10;
            const winAmount = bet * 5;
            balance += winAmount;
            updateBalance();
            
            if (slotResultElement) {
                slotResultElement.innerHTML = `ТЕСТ: ПОБЕДА! 3 символа 🍜! <span class="win">+${winAmount} дошираков!</span>`;
                slotResultElement.className = 'result win';
            }
            
            addToHistory('Тест: Слоты', `+${winAmount}`, true);
            showDeveloperMessage(`Тест победы в слотах выполнен. +${winAmount} дошираков`);
        });
    }
    
    if (testWinGuessBtn) {
        testWinGuessBtn.addEventListener('click', () => {
            const bet = 10;
            const winAmount = bet * 5;
            balance += winAmount;
            updateBalance();
            
            if (guessResultElement) {
                guessResultElement.innerHTML = `ТЕСТ: ПОБЕДА! Вы угадали число! <span class="win">+${winAmount} дошираков!</span>`;
                guessResultElement.className = 'result win';
            }
            
            addToHistory('Тест: Угадай число', `+${winAmount}`, true);
            showDeveloperMessage(`Тест победы в угадайке выполнен. +${winAmount} дошираков`);
        });
    }
    
    if (testWinBlackjackBtn) {
        testWinBlackjackBtn.addEventListener('click', () => {
            const bet = 10;
            const winAmount = bet * 2;
            balance += winAmount;
            updateBalance();
            
            if (blackjackResultElement) {
                blackjackResultElement.innerHTML = `ТЕСТ: ПОБЕДА в блэкджеке! <span class="win">+${winAmount} дошираков!</span>`;
                blackjackResultElement.className = 'result win';
            }
            
            addToHistory('Тест: Блэкджек', `+${winAmount}`, true);
            showDeveloperMessage(`Тест победы в блэкджеке выполнен. +${winAmount} дошираков`);
        });
    }
    
    if (testWinRouletteBtn) {
        testWinRouletteBtn.addEventListener('click', () => {
            const bet = 10;
            const winAmount = bet * 36;
            balance += winAmount;
            updateBalance();
            
            if (rouletteResultElement) {
                rouletteResultElement.innerHTML = `ТЕСТ: ПОБЕДА в рулетке! <span class="win">+${winAmount} дошираков!</span>`;
                rouletteResultElement.className = 'result win';
            }
            
            addToHistory('Тест: Рулетка', `+${winAmount}`, true);
            showDeveloperMessage(`Тест победы в рулетке выполнен. +${winAmount} дошираков`);
        });
    }
    
    if (devModal) {
        devModal.addEventListener('click', (e) => {
            if (e.target === devModal) {
                closeDeveloperModal();
            }
        });
    }
    
    if (devPasswordInput) {
        devPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkDeveloperPassword();
            }
        });
    }
}

function checkDeveloperPassword() {
    if (!devPasswordInput || !devControls || !submitDevPassword || !exitDevMode || !devMessage) return;
    
    const password = devPasswordInput.value.trim();
    
    if (password === DEVELOPER_PASSWORDS.FULL) {
        isDeveloperMode = true;
        currentAccessLevel = ACCESS_LEVELS.FULL;
        devControls.style.display = 'block';
        submitDevPassword.style.display = 'none';
        exitDevMode.style.display = 'inline-block';
        devPasswordInput.style.display = 'none';
        showDeveloperMessage('🔓 Режим разработчика (ПОЛНЫЙ ДОСТУП) активирован', false);
        playSound('win');
    } else if (password === DEVELOPER_PASSWORDS.LIMITED) {
        isDeveloperMode = true;
        currentAccessLevel = ACCESS_LEVELS.LIMITED;
        devControls.style.display = 'block';
        submitDevPassword.style.display = 'none';
        exitDevMode.style.display = 'inline-block';
        devPasswordInput.style.display = 'none';
        showDeveloperMessage('🔐 Режим тестировщика (ОГРАНИЧЕННЫЙ ДОСТУП) активирован', false);
        playSound('click');
    } else {
        showDeveloperMessage('❌ Неверный пароль! Доступ запрещён.', true);
        devPasswordInput.value = '';
        devPasswordInput.focus();
        playSound('lose');
    }
}

function closeDeveloperModal() {
    if (devModal) {
        devModal.style.display = 'none';
    }
    resetDeveloperModal();
}

function resetDeveloperModal() {
    if (devPasswordInput) {
        devPasswordInput.value = '';
        devPasswordInput.style.display = 'block';
    }
    if (devControls) {
        devControls.style.display = 'none';
    }
    if (submitDevPassword) {
        submitDevPassword.style.display = 'inline-block';
    }
    if (exitDevMode) {
        exitDevMode.style.display = 'none';
    }
    if (devMessage) {
        devMessage.textContent = '';
    }
    isDeveloperMode = false;
    currentAccessLevel = null;
}

function exitDeveloperMode() {
    resetDeveloperModal();
    closeDeveloperModal();
    showNotification('Режим разработчика деактивирован', 'info');
}

function showDeveloperMessage(message, isError = false) {
    if (!devMessage) return;
    
    devMessage.textContent = message;
    devMessage.style.color = isError ? '#ff3b30' : '#4cd964';
    devMessage.style.display = 'block';
    
    if (!isError) {
        setTimeout(() => {
            if (devMessage) {
                devMessage.style.display = 'none';
            }
        }, 5000);
    }
}

// Промокоды для разработчика
window.promoRewards = {
    'YTK455GP': 3000,
    'CSSTART': 500,
    'YURICH': 2000,
    'SUBOTA': 700,
    'BONUS': 100,
    'GOLDENKNIGHT': 900
};

// Загружаем промокоды из localStorage
const savedPromos = localStorage.getItem('promoRewards');
if (savedPromos) {
    window.promoRewards = JSON.parse(savedPromos);
}

// ======================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ
// ======================
window.copyPlayerId = copyPlayerId;
