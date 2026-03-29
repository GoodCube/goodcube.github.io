let BOT_TOKEN = '';
let ADMIN_CHAT_ID = '';

async function loadTelegramConfig() {
    try {
        const response = await fetch('/assets/js/config.js');
        const text = await response.text();
        eval(text);
        console.log('✅ Конфиг загружен');
    } catch(e) {
        console.log('⚠️ Конфиг не загружен');
    }
}
loadTelegramConfig();

// дальше весь остальной код без измененийgit add assets/js/config.js
// git commit -m "feat: добавил config.js с пустыми переменными"
// git push origin main

let currentProduct = { name: 'Привилегия', price: 0, type: 'privilege' };
let currentDiscount = 0;
let currentDiscountedPrice = 0;
let currentPromoCode = null;

function escapeTelegram(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegramNotification(purchase) {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
        console.log('⚠️ Телеграм не настроен');
        return;
    }

    let statusEmoji = purchase.status === 'success' ? '✅' : (purchase.status === 'cancelled' ? '❌' : '⏳');
    let statusText = purchase.status === 'success' ? 'УСПЕШНО' : (purchase.status === 'cancelled' ? 'ОТМЕНЕНО' : 'ОЖИДАНИЕ');

    let typeRu = { privilege: 'Привилегия', title: 'Титул', service: 'Услуга', currency: 'Валюта' }[purchase.productType] || 'Товар';

    const message = `
🛒 НОВАЯ ПОКУПКА!

${statusEmoji} Статус: ${statusText}
👤 Игрок: ${purchase.playerName}
🏷️ Товар: ${typeRu} - ${purchase.productName}
💰 Сумма: ${purchase.finalPrice} ₽
🎫 Промокод: ${purchase.promoCode || 'нет'}
🆔 ID заказа: ${purchase.orderId}
📅 Время: ${new Date(purchase.timestamp).toLocaleString('ru-RU')}
`;

    try {
        await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'HTML' })
        });
    } catch(e) {}
}

function testTelegramNotification() {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
        console.log('⚠️ Телеграм не настроен');
        return;
    }
    fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: '✅ GoodCube бот работает!' })
    }).then(r => r.json()).then(d => console.log(d.ok ? '✅ Отправлено' : '❌ Ошибка: ' + d.description));
}

function showPurchases() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) { console.log('📭 Нет покупок'); return; }
    p.forEach((x,i) => console.log((i+1) + '. ' + x.timestamp + ' | ' + x.playerName + ' | ' + x.productName + ' | ' + x.finalPrice + '₽ | промо: ' + (x.promoCode || 'нет')));
    console.log('💰 Всего: ' + p.reduce((s,x)=>s+x.finalPrice,0) + '₽');
}

function copyPurchasesToClipboard() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) return showToast('Нет покупок');
    let text = p.map(x => x.timestamp + ' | ' + x.playerName + ' | ' + x.productName + ' | ' + x.finalPrice + '₽ | промо: ' + (x.promoCode || 'нет')).join('\n');
    navigator.clipboard.writeText(text);
    showToast('📋 Скопировано');
}

function downloadPurchasesCSV() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) return showToast('Нет данных');
    let csv = "Дата,Ник,Товар,Цена,Промокод\n" + p.map(x => x.timestamp + ',' + x.playerName + ',' + x.productName + ',' + x.finalPrice + ',' + (x.promoCode || '')).join('\n');
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    a.download = 'purchases_' + Date.now() + '.csv';
    a.click();
    showToast('📥 CSV скачан');
}

function clearPurchases() {
    if (confirm('Удалить всё?')) localStorage.removeItem('goodcube_purchases');
}

function buyPrivilege(name, price) { buy('privilege', name, price); }
function buyService(name, price) { buy('service', name, price); }
function buyTitle(name, price) { buy('title', name, price); }

function buy(type, name, price) {
    currentProduct = { name, price, type };
    document.getElementById('modalTitle').innerHTML = 'Покупка: ' + name;
    document.getElementById('modalDescription').innerHTML = 'Сумма: ' + price + ' ₽';
    resetPromo();
    openContactModal();
}

function resetPromo() {
    currentDiscount = 0;
    currentPromoCode = null;
    let inp = document.getElementById('promocodeInput');
    if (inp) inp.value = '';
    let msg = document.getElementById('promocodeMessage');
    if (msg) msg.classList.add('hidden');
    let desc = document.getElementById('modalDescription');
    if (desc && currentProduct.price) desc.innerHTML = 'Сумма: ' + currentProduct.price + ' ₽';
}

function applyPromocode() {
    let inp = document.getElementById('promocodeInput');
    let msgDiv = document.getElementById('promocodeMessage');
    let code = inp.value.trim().toUpperCase();
    if (!code) { showMsg('Введите промокод', 'error', msgDiv); return; }

    let res = PromoCodes.validatePromocode(code, currentProduct.price);
    if (res.valid) {
        currentDiscount = res.discount;
        currentDiscountedPrice = res.discountedPrice;
        currentPromoCode = code;
        showMsg(res.message, 'success', msgDiv);
        document.getElementById('modalDescription').innerHTML = 'Сумма: <s>' + currentProduct.price + ' ₽</s> <span class="text-green-400">' + currentDiscountedPrice + ' ₽</span> (скидка ' + currentDiscount + '%)';
    } else {
        currentDiscount = 0;
        currentPromoCode = null;
        showMsg(res.message, 'error', msgDiv);
        document.getElementById('modalDescription').innerHTML = 'Сумма: ' + currentProduct.price + ' ₽';
    }
}

function showMsg(msg, type, div) {
    div.textContent = msg;
    div.classList.remove('hidden');
    div.className = 'text-xs mt-2 ' + (type === 'success' ? 'text-green-400' : 'text-red-400');
    setTimeout(() => div.classList.add('hidden'), 3000);
}

function openYooMoney() {
    let price = currentDiscount > 0 ? currentDiscountedPrice : currentProduct.price;
    let nick = localStorage.getItem('minecraft_nick') || 'Не указан';
    if (nick === 'Не указан' && !confirm('Вы не указали ник. Продолжить?')) return;

    let typeText = { privilege: 'привилегию', title: 'титул', service: 'услугу' }[currentProduct.type] || 'товар';
    let comment = currentPromoCode ? nick + ' купил ' + typeText + ' ' + currentProduct.name + ' с промокодом ' + currentPromoCode + ' (скидка ' + currentDiscount + '%). Итог: ' + price + '₽' : nick + ' купил ' + typeText + ' ' + currentProduct.name + ' без промокода. Сумма: ' + price + '₽';
    let orderId = 'goodcube_' + Date.now() + '_' + Math.random().toString(36).substring(7);

    let purchases = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    purchases.push({
        id: Date.now(), timestamp: new Date().toISOString(), orderId, playerName: nick,
        productName: currentProduct.name, productType: currentProduct.type,
        originalPrice: currentProduct.price, finalPrice: price,
        discount: currentDiscount, promoCode: currentPromoCode || null, comment, status: 'pending'
    });
    localStorage.setItem('goodcube_purchases', JSON.stringify(purchases));

    sendTelegramNotification({
        status: 'pending', playerName: nick, productName: currentProduct.name,
        productType: currentProduct.type, finalPrice: price, promoCode: currentPromoCode || null,
        orderId, timestamp: new Date().toISOString()
    });

    let form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://yoomoney.ru/quickpay/confirm.xml';
    form.target = '_blank';

    let params = {
        receiver: '4100118384508073', 'quickpay-form': 'button', paymentType: 'AC', sum: price,
        label: orderId, targets: nick + ' | ' + currentProduct.name, comment: comment,
        successURL: window.location.origin + '/payment-success.html?order=' + orderId,
        cancelURL: window.location.origin + '/payment-cancel.html?order=' + orderId
    };

    for (let k in params) {
        let i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = params[k];
        form.appendChild(i);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    showToast('💰 Перенаправление на оплату...');
    if (currentPromoCode) PromoCodes.applyPromocode(currentPromoCode);
    setTimeout(closeContactModal, 2000);
}

function saveNickname() {
    let inp = document.getElementById('minecraftNick');
    if (inp && inp.value.trim()) {
        localStorage.setItem('minecraft_nick', inp.value.trim());
        document.getElementById('displayNick').innerHTML = inp.value.trim();
        showToast('✅ Ник сохранен');
        inp.value = '';
    } else {
        showToast('Введите ник');
    }
}

function displaySavedNick() {
    let nick = localStorage.getItem('minecraft_nick');
    if (nick) document.getElementById('displayNick').innerHTML = nick;
}

function openContactModal() {
    document.getElementById('contactModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    displaySavedNick();
}

function closeContactModal() {
    document.getElementById('contactModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openCurrencyModal() {
    document.getElementById('currencyModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    let s = document.getElementById('coinSlider');
    if (s) s.value = 0;
    let inp = document.getElementById('coinInput');
    if (inp) inp.value = 0;
    document.getElementById('coinAmount').innerHTML = '0';
    document.getElementById('rubAmount').innerHTML = '0';
}

function closeCurrencyModal() {
    document.getElementById('currencyModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function updateCoinAmount(v) {
    let coins = parseInt(v);
    document.getElementById('coinAmount').innerHTML = coins.toLocaleString();
    document.getElementById('coinInput').value = coins;
    document.getElementById('rubAmount').innerHTML = Math.floor(coins / 100);
}

function updateCoinFromInput(v) {
    let coins = parseInt(v) || 0;
    if (coins > 5000000) coins = 5000000;
    if (coins < 0) coins = 0;
    coins = Math.round(coins / 1000) * 1000;
    document.getElementById('coinSlider').value = coins;
    document.getElementById('coinAmount').innerHTML = coins.toLocaleString();
    document.getElementById('coinInput').value = coins;
    document.getElementById('rubAmount').innerHTML = Math.floor(coins / 100);
}

function setMaxCoins() { updateCoinFromInput(5000000); }

function saveCurrencyNick() {
    let inp = document.getElementById('currencyNick');
    if (inp && inp.value.trim()) {
        localStorage.setItem('minecraft_nick', inp.value.trim());
        document.getElementById('displayCurrencyNick').innerHTML = inp.value.trim();
        showToast('✅ Ник сохранен');
        inp.value = '';
    }
}

function buyCurrency() {
    let coins = parseInt(document.getElementById('coinSlider').value);
    let rub = Math.floor(coins / 100);
    if (coins < 1000) { showToast('Минимум 1000 монет (10 рублей)'); return; }

    let nick = localStorage.getItem('minecraft_nick') || 'Не указан';
    if (nick === 'Не указан' && !confirm('Укажите ник?')) return;

    let orderId = 'curr_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    let comment = nick + ' купил ' + coins + ' монет. Сумма: ' + rub + '₽';

    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    p.push({ id: Date.now(), timestamp: new Date().toISOString(), orderId, playerName: nick, productName: coins + ' монет', productType: 'currency', finalPrice: rub, status: 'pending' });
    localStorage.setItem('goodcube_purchases', JSON.stringify(p));

    sendTelegramNotification({ status: 'pending', playerName: nick, productName: coins + ' монет', productType: 'currency', finalPrice: rub, orderId, timestamp: new Date().toISOString() });

    let form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://yoomoney.ru/quickpay/confirm.xml';
    form.target = '_blank';

    let params = {
        receiver: '4100118384508073', 'quickpay-form': 'button', paymentType: 'AC', sum: rub,
        label: orderId, targets: nick + ' | ' + coins + ' монет', comment: comment,
        successURL: window.location.origin + '/payment-success.html?order=' + orderId,
        cancelURL: window.location.origin + '/payment-cancel.html?order=' + orderId
    };

    for (let k in params) {
        let i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = params[k];
        form.appendChild(i);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    showToast('💰 Перенаправление на оплату...');
    setTimeout(closeCurrencyModal, 2000);
}

function copyToClipboard(t) {
    navigator.clipboard.writeText(t);
    showToast('📋 Скопировано');
}

function showToast(m) {
    let t = document.getElementById('toast');
    let tm = document.getElementById('toastMessage');
    if (t && tm) {
        tm.textContent = m;
        t.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    displaySavedNick();
    if (typeof calculateUnmutePrice === 'function') calculateUnmutePrice();
    if (typeof calculateUnbanPrice === 'function') calculateUnbanPrice();
});

console.log('💡 АДМИН-КОМАНДЫ: showPurchases() | copyPurchasesToClipboard() | downloadPurchasesCSV() | clearPurchases() | testTelegramNotification()');