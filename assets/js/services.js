// ============================================
// services.js - функции для дополнительных услуг
// ============================================

// ===== ФУНКЦИИ ДЛЯ РАЗМЬЮТА =====
function calculateUnmutePrice() {
    const hoursInput = document.getElementById('muteHours');
    if (!hoursInput) return 150;

    let hours = parseInt(hoursInput.value) || 0;
    if (hours < 0) hours = 0;

    let price = 0;
    let priceDetail = '';

    if (hours <= 3) {
        price = 150;
        priceDetail = 'Фиксированная цена за мут до 3 часов';
    } else {
        const basePrice = 150;
        const extraMinutes = (hours - 3) * 60;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        const extraPrice = extraBlocks * 30;
        price = basePrice + extraPrice;

        const extraHours = hours - 3;
        priceDetail = `150₽ (первые 3 часа) + ${extraPrice}₽ (${extraHours}ч = ${extraMinutes}мин = ${extraBlocks} блоков по 10мин)`;
    }

    const priceSpan = document.getElementById('unmutePrice');
    const detailSpan = document.getElementById('unmutePriceDetail');
    if (priceSpan) priceSpan.textContent = price;
    if (detailSpan) detailSpan.textContent = priceDetail;

    return price;
}

function buyUnmute() {
    const hoursInput = document.getElementById('muteHours');
    let hours = parseInt(hoursInput?.value) || 0;
    if (hours < 0) hours = 0;

    if (hours === 0) {
        showToast('Укажите длительность мута (в часах)');
        return;
    }

    const price = calculateUnmutePrice();

    let muteDescription = '';
    if (hours <= 3) {
        muteDescription = `мут до ${hours} часов`;
    } else {
        const extraMinutes = (hours - 3) * 60;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        muteDescription = `мут ${hours} часов (${extraBlocks} блоков по 10мин сверх 3ч)`;
    }

    currentProduct = {
        name: `Размьют (${muteDescription})`,
        price: price,
        type: 'service',
        muteHours: hours
    };

    document.getElementById('modalTitle').textContent = `Услуга: Размьют`;
    document.getElementById('modalDescription').innerHTML = `Снятие мута длительностью ${hours} часов<br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}

// ===== ФУНКЦИИ ДЛЯ ПЕРЕНОСА АККАУНТА =====
function buyAccountTransfer() {
    const oldNickInput = document.getElementById('oldNickname');
    const newNickInput = document.getElementById('newNickname');

    const oldNick = oldNickInput?.value?.trim();
    const newNick = newNickInput?.value?.trim();

    if (!oldNick) {
        showToast('Введите старый ник (с которого переносите)');
        return;
    }

    if (!newNick) {
        showToast('Введите новый ник (на который переносите)');
        return;
    }

    if (oldNick === newNick) {
        showToast('Старый и новый ник не могут совпадать');
        return;
    }

    const price = 500;

    currentProduct = {
        name: `Перенос аккаунта (${oldNick} → ${newNick})`,
        price: price,
        type: 'service',
        oldNickname: oldNick,
        newNickname: newNick
    };

    document.getElementById('modalTitle').textContent = `Услуга: Перенос аккаунта`;
    document.getElementById('modalDescription').innerHTML = `Перенос прогресса с <span class="text-orange-400">${oldNick}</span> на <span class="text-orange-400">${newNick}</span><br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}

// ===== ФУНКЦИИ ДЛЯ РАЗБАНА =====
function calculateUnbanPrice() {
    const hoursInput = document.getElementById('banHours');
    if (!hoursInput) return 50;

    let hours = parseInt(hoursInput.value) || 0;
    if (hours < 0) hours = 0;

    let price = 0;
    let priceDetail = '';

    if (hours <= 3) {
        price = 50;
        priceDetail = 'Фиксированная цена за бан до 3 часов';
    } else {
        const basePrice = 50;
        const extraMinutes = (hours - 3) * 60;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        const extraPrice = extraBlocks * 10;
        price = basePrice + extraPrice;

        const extraHours = hours - 3;
        priceDetail = `50₽ (первые 3 часа) + ${extraPrice}₽ (${extraHours}ч = ${extraMinutes}мин = ${extraBlocks} блоков по 10мин)`;
    }

    const priceSpan = document.getElementById('unbanPrice');
    const detailSpan = document.getElementById('unbanPriceDetail');
    if (priceSpan) priceSpan.textContent = price;
    if (detailSpan) detailSpan.textContent = priceDetail;

    return price;
}

function buyUnban() {
    const hoursInput = document.getElementById('banHours');
    let hours = parseInt(hoursInput?.value) || 0;
    if (hours < 0) hours = 0;

    if (hours === 0) {
        showToast('Укажите длительность бана (в часах)');
        return;
    }

    const price = calculateUnbanPrice();

    let banDescription = '';
    if (hours <= 3) {
        banDescription = `бан до ${hours} часов`;
    } else {
        const extraMinutes = (hours - 3) * 60;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        banDescription = `бан ${hours} часов (${extraBlocks} блоков по 10мин сверх 3ч)`;
    }

    currentProduct = {
        name: `Разбан (${banDescription})`,
        price: price,
        type: 'service',
        banHours: hours
    };

    document.getElementById('modalTitle').textContent = `Услуга: Разбан`;
    document.getElementById('modalDescription').innerHTML = `Снятие бана длительностью ${hours} часов<br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}