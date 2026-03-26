// ============================================
// payment.js - функции оплаты через ЮMoney
// ============================================

// Текущий выбранный товар
let currentProduct = { name: 'Привилегия', price: 0, type: 'privilege' };

// Промокод переменные
let currentDiscount = 0;
let currentDiscountedPrice = 0;
let currentPromoCode = null;

// Функция покупки привилегии
function buyPrivilege(privilegeName, price) {
    currentProduct = { name: privilegeName, price: price, type: 'privilege' };
    document.getElementById('modalTitle').textContent = `Покупка: ${privilegeName}`;
    document.getElementById('modalDescription').textContent = `Сумма: ${price} ₽`;
    resetPromo();
    openContactModal();
}

// Функция покупки услуги
function buyService(serviceName, price) {
    currentProduct = { name: serviceName, price: price, type: 'service' };
    document.getElementById('modalTitle').textContent = `Услуга: ${serviceName}`;
    document.getElementById('modalDescription').textContent = `Сумма: ${price} ₽`;
    resetPromo();
    openContactModal();
}

// Сброс промокода
function resetPromo() {
    currentDiscount = 0;
    currentDiscountedPrice = 0;
    currentPromoCode = null;
    const input = document.getElementById('promocodeInput');
    if (input) input.value = '';
    const msgDiv = document.getElementById('promocodeMessage');
    if (msgDiv) msgDiv.classList.add('hidden');
    const modalDesc = document.getElementById('modalDescription');
    if (modalDesc && currentProduct.price) {
        modalDesc.textContent = `Сумма: ${currentProduct.price} ₽`;
    }
}

// Применение промокода
function applyPromocode() {
    const input = document.getElementById('promocodeInput');
    const msgDiv = document.getElementById('promocodeMessage');
    const code = input.value.trim();

    if (!code) {
        showMessage('Введите промокод', 'error', msgDiv);
        return;
    }

    const amount = currentProduct.price;
    const result = PromoCodes.validatePromocode(code, amount);

    if (result.valid) {
        currentDiscount = result.discount;
        currentDiscountedPrice = result.discountedPrice;
        currentPromoCode = code;
        showMessage(result.message, 'success', msgDiv);

        const modalDesc = document.getElementById('modalDescription');
        modalDesc.innerHTML = `Сумма: <span class="line-through text-gray-500">${amount} ₽</span> <span class="text-green-400 font-bold">${currentDiscountedPrice} ₽</span> (скидка ${currentDiscount}%)`;
    } else {
        currentDiscount = 0;
        currentPromoCode = null;
        showMessage(result.message, 'error', msgDiv);
        document.getElementById('modalDescription').textContent = `Сумма: ${amount} ₽`;
    }
}

function showMessage(msg, type, msgDiv) {
    msgDiv.textContent = msg;
    msgDiv.classList.remove('hidden');
    msgDiv.className = `text-xs mt-2 ${type === 'success' ? 'text-green-400' : 'text-red-400'}`;
    setTimeout(() => msgDiv.classList.add('hidden'), 3000);
}

// Функция оплаты через ЮMoney
function openYooMoney() {
    let finalPrice = currentProduct.price;
    let promoInfo = '';

    if (currentDiscount > 0) {
        finalPrice = currentDiscountedPrice;
        promoInfo = ` (скидка ${currentDiscount}%, было ${currentProduct.price}₽)`;
    }

    const playerName = localStorage.getItem('minecraft_nick') || 'Не указан';
    if (playerName === 'Не указан' && !confirm('Вы не указали ник в Minecraft. Продолжить?')) return;

    let extraInfo = '';
    if (currentProduct.type === 'service') {
        if (currentProduct.name.includes('Размьют')) {
            extraInfo = `. Длительность мута: ${currentProduct.muteHours} часов`;
        } else if (currentProduct.name.includes('Разбан')) {
            extraInfo = `. Длительность бана: ${currentProduct.banHours} часов`;
        } else if (currentProduct.name.includes('Перенос аккаунта')) {
            extraInfo = `. Перенос с "${currentProduct.oldNickname}" на "${currentProduct.newNickname}"`;
        }
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://yoomoney.ru/quickpay/confirm.xml';
    form.target = '_blank';
    const orderId = 'goodcube_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const productType = currentProduct.type === 'privilege' ? 'Привилегия' : 'Услуга';
    const params = {
        'receiver': '4100118384508073',
        'quickpay-form': 'button',
        'paymentType': 'AC',
        'sum': finalPrice,
        'label': orderId,
        'targets': `${productType} ${currentProduct.name} для ${playerName}${promoInfo}`,
        'formcomment': `GoodCube: ${currentProduct.name}`,
        'short-dest': `GoodCube: ${currentProduct.name}`,
        'comment': `Покупка ${productType.toLowerCase()} ${currentProduct.name}. Ник: ${playerName}. Промокод: ${currentPromoCode || 'нет'}${extraInfo}`
    };
    for (let key in params) { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = params[key]; form.appendChild(input); }
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
    showToast('Перенаправляем на страницу оплаты ЮMoney...');
    if (currentPromoCode) PromoCodes.applyPromocode(currentPromoCode);
    setTimeout(closeContactModal, 2000);
}