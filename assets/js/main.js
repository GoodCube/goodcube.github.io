




function initIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}



function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Скопировано: ${text}`);
    });
}


function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}


function saveNickname() {
    const nickInput = document.getElementById('minecraftNick');
    if (nickInput && nickInput.value.trim()) {
        const nick = nickInput.value.trim();
        localStorage.setItem('minecraft_nick', nick);
        const displayNick = document.getElementById('displayNick');
        if (displayNick) displayNick.textContent = nick;
        showToast(`Ник ${nick} сохранен!`);
        nickInput.value = '';
    } else {
        showToast('Введите ник');
    }
}


function displaySavedNick() {
    const savedNick = localStorage.getItem('minecraft_nick');
    const displayNick = document.getElementById('displayNick');
    if (savedNick && displayNick) {
        displayNick.textContent = savedNick;
    }
}


function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        initIcons();
        displaySavedNick();
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}


function openCurrencyModal() {
    const modal = document.getElementById('currencyModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        initIcons();
        displaySavedCurrencyNick();

        
        const coinSlider = document.getElementById('coinSlider');
        const coinInput = document.getElementById('coinInput');
        const coinAmount = document.getElementById('coinAmount');
        const rubAmount = document.getElementById('rubAmount');
        if (coinSlider) coinSlider.value = 0;
        if (coinInput) coinInput.value = 0;
        if (coinAmount) coinAmount.textContent = '0';
        if (rubAmount) rubAmount.textContent = '0';
        resetCurrencyPromo();
    }
}

function closeCurrencyModal() {
    const modal = document.getElementById('currencyModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function displaySavedCurrencyNick() {
    const savedNick = localStorage.getItem('minecraft_nick');
    const displayNick = document.getElementById('displayCurrencyNick');
    if (savedNick && displayNick) {
        displayNick.textContent = savedNick;
    }
}


function copyIP() {
    navigator.clipboard.writeText('секрет').then(() => {
        showToast('IP сервера скопирован!');
        const ipText = document.getElementById('ip-text');
        if (ipText) {
            ipText.textContent = 'Скопировано!';
            setTimeout(() => {
                ipText.textContent = 'секрет))';
            }, 2000);
        }
    });
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeContactModal();
        closeCurrencyModal();
    }
});


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    initIcons();
    displaySavedNick();
});