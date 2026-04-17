




function calculateUnmutePrice() {
    const minutesInput = document.getElementById('muteMinutes');
    if (!minutesInput) return 150;

    let minutes = parseInt(minutesInput.value) || 0;
    if (minutes < 0) minutes = 0;

    let price = 0;
    let priceDetail = '';
    const hours = minutes / 60;

    
    
    if (minutes <= 180) {
        price = 150;
        priceDetail = `Фиксированная цена за мут до 180 минут (3 часа)`;
    } else {
        const basePrice = 150;
        const extraMinutes = minutes - 180;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        const extraPrice = extraBlocks * 10;
        price = basePrice + extraPrice;

        priceDetail = `150₽ (первые 180 минут) + ${extraPrice}₽ (${extraMinutes} мин = ${extraBlocks} блоков по 10 мин)`;
    }

    const priceSpan = document.getElementById('unmutePrice');
    const detailSpan = document.getElementById('unmutePriceDetail');
    if (priceSpan) priceSpan.textContent = price;
    if (detailSpan) detailSpan.textContent = priceDetail;

    return price;
}

function buyUnmute() {
    const minutesInput = document.getElementById('muteMinutes');
    let minutes = parseInt(minutesInput?.value) || 0;
    if (minutes < 0) minutes = 0;

    if (minutes === 0) {
        showToast('Укажите длительность мута (в минутах)');
        return;
    }

    const price = calculateUnmutePrice();
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let durationText = '';

    if (hours > 0 && remainingMinutes > 0) {
        durationText = `${hours} ч ${remainingMinutes} мин`;
    } else if (hours > 0) {
        durationText = `${hours} ч`;
    } else {
        durationText = `${minutes} мин`;
    }

    currentProduct = {
        name: `Размьют (${durationText})`,
        price: price,
        type: 'service',
        muteMinutes: minutes
    };

    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDescription');
    if (modalTitle) modalTitle.textContent = `Услуга: Размьют`;
    if (modalDesc) modalDesc.innerHTML = `Снятие мута длительностью ${durationText}<br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}


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

    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDescription');
    if (modalTitle) modalTitle.textContent = `Услуга: Перенос аккаунта`;
    if (modalDesc) modalDesc.innerHTML = `Перенос прогресса с <span class="text-orange-400">${oldNick}</span> на <span class="text-orange-400">${newNick}</span><br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}


function calculateUnbanPrice() {
    const minutesInput = document.getElementById('banMinutes');
    if (!minutesInput) return 50;

    let minutes = parseInt(minutesInput.value) || 0;
    if (minutes < 0) minutes = 0;

    let price = 0;
    let priceDetail = '';

    
    
    if (minutes <= 180) {
        price = 50;
        priceDetail = `Фиксированная цена за бан до 180 минут (3 часа)`;
    } else {
        const basePrice = 50;
        const extraMinutes = minutes - 180;
        const extraBlocks = Math.ceil(extraMinutes / 10);
        const extraPrice = extraBlocks * 10;
        price = basePrice + extraPrice;

        priceDetail = `50₽ (первые 180 минут) + ${extraPrice}₽ (${extraMinutes} мин = ${extraBlocks} блоков по 10 мин)`;
    }

    const priceSpan = document.getElementById('unbanPrice');
    const detailSpan = document.getElementById('unbanPriceDetail');
    if (priceSpan) priceSpan.textContent = price;
    if (detailSpan) detailSpan.textContent = priceDetail;

    return price;
}

function buyUnban() {
    const minutesInput = document.getElementById('banMinutes');
    let minutes = parseInt(minutesInput?.value) || 0;
    if (minutes < 0) minutes = 0;

    if (minutes === 0) {
        showToast('Укажите длительность бана (в минутах)');
        return;
    }

    const price = calculateUnbanPrice();
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let durationText = '';

    if (hours > 0 && remainingMinutes > 0) {
        durationText = `${hours} ч ${remainingMinutes} мин`;
    } else if (hours > 0) {
        durationText = `${hours} ч`;
    } else {
        durationText = `${minutes} мин`;
    }

    currentProduct = {
        name: `Разбан (${durationText})`,
        price: price,
        type: 'service',
        banMinutes: minutes
    };

    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDescription');
    if (modalTitle) modalTitle.textContent = `Услуга: Разбан`;
    if (modalDesc) modalDesc.innerHTML = `Снятие бана длительностью ${durationText}<br>Сумма: <span class="text-green-400">${price} ₽</span>`;

    resetPromo();
    openContactModal();
}