const PROXY_URL = 'https://proxy.goodcube.site/telegram_proxy.php';
const EMAIL_PROXY_URL = 'https://proxy.goodcube.site/send_purchase_email.php';
const RCON_PROXY_URL = 'https://proxy.goodcube.site/rcon_proxy.php';
const SUPABASE_URL = 'https://sxuvodwuqhyievbnvaye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7Q_z0BWiR7xWnD8YqeiBSA_afgPot8z';

var currentProduct = { name: 'Привилегия', price: 0, type: 'privilege' };
var currentDiscount = 0;
var currentDiscountedPrice = 0;
var currentPromoCode = null;


var currentCurrencyDiscount = 0;
var currentCurrencyDiscountedPrice = 0;
var currentCurrencyPromoCode = null;

async function sendTelegramNotification(purchase) {
    let statusEmoji = purchase.status === 'success' ? '✅' : (purchase.status === 'cancelled' ? '❌' : '⏳');
    let statusText = purchase.status === 'success' ? 'УСПЕШНО' : (purchase.status === 'cancelled' ? 'ОТМЕНЕНО' : 'ОЖИДАНИЕ');
    let typeRu = { privilege: 'Привилегия', title: 'Титул', service: 'Услуга', currency: 'Валюта' }[purchase.productType] || 'Товар';
    const message = `\n🛒 НОВАЯ ПОКУПКА!\n\n${statusEmoji} Статус: ${statusText}\n👤 Игрок: ${purchase.playerName}\n🏷️ Товар: ${typeRu} - ${purchase.productName}\n💰 Сумма: ${purchase.finalPrice} ₽\n🎫 Промокод: ${purchase.promoCode || 'нет'}\n🆔 ID заказа: ${purchase.orderId}\n📅 Время: ${new Date(purchase.timestamp).toLocaleString('ru-RU')}`;
    try { await fetch(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) }); } catch(e) {}
}

async function sendEmailNotification(purchase) {
    try {
        await fetch(EMAIL_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName: purchase.playerName,
                productName: purchase.productName,
                productType: purchase.productType,
                finalPrice: purchase.finalPrice,
                promoCode: purchase.promoCode || null,
                orderId: purchase.orderId,
                status: purchase.status,
                timestamp: purchase.timestamp || new Date().toISOString()
            })
        });
    } catch(e) {}
}

function testTelegramNotification() {
    fetch(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '✅ GoodCube бот работает!' }) })
        .then(r => r.json()).then(d => console.log(d.ok ? '✅ Отправлено' : '❌ Ошибка')).catch(e => console.log('❌ Ошибка:', e));
}

function testEmailNotification() {
    fetch(EMAIL_PROXY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'TestPlayer', productName: 'Тестовый товар', productType: 'test', finalPrice: 100, promoCode: null, orderId: 'test_' + Date.now(), status: 'success' })
    }).then(r => r.json()).then(d => console.log(d.ok ? '✅ Письмо отправлено' : '❌ Ошибка')).catch(e => console.log('❌ Ошибка:', e));
}



function showPurchases() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) { console.log('📭 Нет покупок'); return; }
    p.forEach((x,i) => console.log((i+1) + '. ' + x.timestamp + ' | ' + x.playerName + ' | ' + x.productName + ' | ' + x.finalPrice + '₽'));
    console.log('💰 Всего: ' + p.reduce((s,x) => s + x.finalPrice, 0) + '₽');
}

function copyPurchasesToClipboard() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) return showToast('Нет покупок');
    navigator.clipboard.writeText(p.map(x => x.timestamp + ' | ' + x.playerName + ' | ' + x.productName + ' | ' + x.finalPrice + '₽').join('\n'));
    showToast('📋 Скопировано');
}

function downloadPurchasesCSV() {
    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    if (!p.length) return showToast('Нет данных');
    let csv = "Дата,Ник,Товар,Цена,Промокод,Статус\n" + p.map(x => x.timestamp + ',' + x.playerName + ',' + x.productName + ',' + x.finalPrice + ',' + (x.promoCode || '') + ',' + x.status).join('\n');
    let a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})); a.download = 'purchases_' + Date.now() + '.csv'; a.click();
    showToast('📥 CSV скачан');
}

function clearPurchases() {
    if (confirm('Удалить все покупки?')) { localStorage.removeItem('goodcube_purchases'); showToast('История очищена'); }
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


async function applyPromocode() {
    console.log('🟢 applyPromocode вызвана');

    let inp = document.getElementById('promocodeInput');
    let msgDiv = document.getElementById('promocodeMessage');

    if (!inp) { console.error('❌ promocodeInput не найден'); return; }

    let code = inp.value.trim().toUpperCase();
    console.log('🔍 Код:', code);

    if (!code) { showMsg('Введите промокод', 'error', msgDiv); return; }

    if (!currentProduct || !currentProduct.price) { showMsg('Товар не выбран', 'error', msgDiv); return; }

    if (typeof PromoCodes !== 'undefined' && !PromoCodes.supabase) {
        if (window.supabaseClient) PromoCodes.init(window.supabaseClient);
    }

    let playerName = localStorage.getItem('minecraft_nick') || null;
    let res = await PromoCodes.validatePromocode(code, currentProduct.price, playerName);
    console.log('📋 Результат:', res);

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

async function applyCurrencyPromocode() {
    console.log('🟢 applyCurrencyPromocode вызвана');

    let inp = document.getElementById('currencyPromocodeInput');
    let msgDiv = document.getElementById('currencyPromocodeMessage');

    if (!inp) { console.error('❌ currencyPromocodeInput не найден'); return; }

    let code = inp.value.trim().toUpperCase();
    console.log('🔍 Код:', code);

    if (!code) { showMsg('Введите промокод', 'error', msgDiv); return; }

    let coins = parseInt(document.getElementById('coinSlider')?.value || 0);
    let amount = Math.floor(coins / 100);

    if (amount < 10) { showMsg('Минимальная сумма 10 ₽', 'error', msgDiv); return; }

    if (typeof PromoCodes !== 'undefined' && !PromoCodes.supabase) {
        if (window.supabaseClient) PromoCodes.init(window.supabaseClient);
    }

    let res = await PromoCodes.validatePromocode(code, amount);
    console.log('📋 Результат:', res);

    if (res.valid) {
        currentCurrencyDiscount = res.discount;
        currentCurrencyDiscountedPrice = res.discountedPrice;
        currentCurrencyPromoCode = code;
        showMsg(res.message, 'success', msgDiv);
        document.getElementById('rubAmount').innerHTML = `<span class="line-through text-gray-500 text-xl">${amount}</span> <span class="text-green-400 text-3xl">${res.discountedPrice}</span>`;
    } else {
        currentCurrencyDiscount = 0;
        currentCurrencyPromoCode = null;
        showMsg(res.message, 'error', msgDiv);
        document.getElementById('rubAmount').textContent = amount;
    }
}

function showMsg(msg, type, div) {
    div.textContent = msg;
    div.classList.remove('hidden');
    div.className = 'text-xs mt-2 ' + (type === 'success' ? 'text-green-400' : 'text-red-400');
    setTimeout(() => div.classList.add('hidden'), 3000);
}

async function openYooMoney() {
    let price = currentDiscount > 0 ? currentDiscountedPrice : currentProduct.price;
    let nick = localStorage.getItem('minecraft_nick') || 'Не указан';
    if (nick === 'Не указан' && !confirm('Вы не указали ник. Продолжить?')) return;

    let typeText = { privilege: 'привилегию', title: 'титул', service: 'услугу' }[currentProduct.type] || 'товар';
    let orderId = 'goodcube_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    let timestamp = new Date().toISOString();

    let purchases = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    purchases.push({
        id: Date.now(), timestamp, orderId, playerName: nick,
        productName: currentProduct.name, productType: currentProduct.type,
        originalPrice: currentProduct.price, finalPrice: price,
        discount: currentDiscount, promoCode: currentPromoCode || null, status: 'pending'
    });
    localStorage.setItem('goodcube_purchases', JSON.stringify(purchases));

    sendTelegramNotification({ status: 'pending', playerName: nick, productName: currentProduct.name, productType: currentProduct.type, finalPrice: price, promoCode: currentPromoCode || null, orderId, timestamp });
    sendEmailNotification({ status: 'pending', playerName: nick, productName: currentProduct.name, productType: currentProduct.type, finalPrice: price, promoCode: currentPromoCode || null, orderId, timestamp });

    if (currentPromoCode && typeof PromoCodes !== 'undefined') {
        if (!PromoCodes.supabase && window.supabaseClient) PromoCodes.init(window.supabaseClient);
        await PromoCodes.applyPromocode(currentPromoCode, nick, orderId, currentProduct.price);
    }

    let form = document.createElement('form'); form.method = 'POST'; form.action = 'https://yoomoney.ru/quickpay/confirm.xml'; form.target = '_blank';
    let params = {
        receiver: '4100118384508073', 'quickpay-form': 'button', paymentType: 'AC', sum: price, label: orderId,
        targets: nick + ' | ' + currentProduct.name,
        comment: currentPromoCode ? nick + ' купил ' + typeText + ' ' + currentProduct.name + ' с промокодом ' + currentPromoCode + '. Итог: ' + price + '₽' : nick + ' купил ' + typeText + ' ' + currentProduct.name + '. Сумма: ' + price + '₽',
        successURL: window.location.origin + '/payment-success.html?order=' + orderId,
        cancelURL: window.location.origin + '/payment-cancel.html?order=' + orderId
    };
    for (let k in params) { let i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = params[k]; form.appendChild(i); }
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
    showToast('💰 Перенаправление на оплату...');
    setTimeout(closeContactModal, 2000);
}

function updateCoinAmount(v) { let coins = parseInt(v); document.getElementById('coinAmount').innerHTML = coins.toLocaleString(); document.getElementById('coinInput').value = coins; document.getElementById('rubAmount').innerHTML = Math.floor(coins / 100); }
function updateCoinFromInput(v) { let coins = parseInt(v) || 0; if (coins > 5000000) coins = 5000000; if (coins < 0) coins = 0; coins = Math.round(coins / 1000) * 1000; document.getElementById('coinSlider').value = coins; document.getElementById('coinAmount').innerHTML = coins.toLocaleString(); document.getElementById('coinInput').value = coins; document.getElementById('rubAmount').innerHTML = Math.floor(coins / 100); }
function setMaxCoins() { updateCoinFromInput(5000000); }

function saveCurrencyNick() {
    let inp = document.getElementById('currencyNick');
    if (inp && inp.value.trim()) { localStorage.setItem('minecraft_nick', inp.value.trim()); document.getElementById('displayCurrencyNick').innerHTML = inp.value.trim(); showToast('✅ Ник сохранен'); inp.value = ''; }
}

async function buyCurrency() {
    let coins = parseInt(document.getElementById('coinSlider').value);
    let rub = Math.floor(coins / 100);
    if (coins < 1000) { showToast('Минимум 1000 монет (10 рублей)'); return; }

    let nick = localStorage.getItem('minecraft_nick') || 'Не указан';
    if (nick === 'Не указан' && !confirm('Укажите ник?')) return;

    let finalPrice = currentCurrencyDiscount > 0 ? currentCurrencyDiscountedPrice : rub;
    let orderId = 'curr_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    let timestamp = new Date().toISOString();

    let p = JSON.parse(localStorage.getItem('goodcube_purchases') || '[]');
    p.push({ id: Date.now(), timestamp, orderId, playerName: nick, productName: coins + ' монет', productType: 'currency', finalPrice: finalPrice, status: 'pending' });
    localStorage.setItem('goodcube_purchases', JSON.stringify(p));

    sendTelegramNotification({ status: 'pending', playerName: nick, productName: coins + ' монет', productType: 'currency', finalPrice: finalPrice, orderId, timestamp });
    sendEmailNotification({ status: 'pending', playerName: nick, productName: coins + ' монет', productType: 'currency', finalPrice: finalPrice, promoCode: currentCurrencyPromoCode, orderId, timestamp });

    if (currentCurrencyPromoCode && typeof PromoCodes !== 'undefined') {
        await PromoCodes.applyPromocode(currentCurrencyPromoCode, nick, orderId, rub);
    }

    let form = document.createElement('form'); form.method = 'POST'; form.action = 'https://yoomoney.ru/quickpay/confirm.xml'; form.target = '_blank';
    let params = {
        receiver: '4100118384508073', 'quickpay-form': 'button', paymentType: 'AC', sum: finalPrice, label: orderId,
        targets: nick + ' | ' + coins + ' монет',
        comment: nick + ' купил ' + coins + ' монет. Сумма: ' + finalPrice + '₽',
        successURL: window.location.origin + '/payment-success.html?order=' + orderId,
        cancelURL: window.location.origin + '/payment-cancel.html?order=' + orderId
    };
    for (let k in params) { let i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = params[k]; form.appendChild(i); }
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
    showToast('💰 Перенаправление на оплату...');
    setTimeout(closeCurrencyModal, 2000);
}


function saveNickname() {
    let inp = document.getElementById('minecraftNick');
    if (inp && inp.value.trim()) { localStorage.setItem('minecraft_nick', inp.value.trim()); document.getElementById('displayNick').innerHTML = inp.value.trim(); showToast('✅ Ник сохранен'); inp.value = ''; } else { showToast('Введите ник'); }
}

function displaySavedNick() {
    let nick = localStorage.getItem('minecraft_nick');
    if (nick) { let display = document.getElementById('displayNick'); if (display) display.innerHTML = nick; }
}

function openContactModal() {
    let modal = document.getElementById('contactModal');
    if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; if (typeof lucide !== 'undefined') lucide.createIcons(); displaySavedNick(); }
}

function closeContactModal() {
    let modal = document.getElementById('contactModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }
}

function openCurrencyModal() {
    let modal = document.getElementById('currencyModal');
    if (modal) {
        modal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        document.getElementById('coinSlider').value = 0; document.getElementById('coinInput').value = 0;
        document.getElementById('coinAmount').innerHTML = '0'; document.getElementById('rubAmount').innerHTML = '0';
        document.getElementById('displayCurrencyNick').innerHTML = localStorage.getItem('minecraft_nick') || 'не указан';
        currentCurrencyDiscount = 0; currentCurrencyPromoCode = null;
        let msg = document.getElementById('currencyPromocodeMessage'); if (msg) msg.classList.add('hidden');
    }
}

function closeCurrencyModal() {
    let modal = document.getElementById('currencyModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }
}


function calculateUnmutePrice() {
    let minutes = parseInt(document.getElementById('muteMinutes')?.value) || 0;
    let price = minutes <= 180 ? 150 : 150 + Math.ceil((minutes - 180) / 10) * 10;
    document.getElementById('unmutePrice').textContent = price;
    return price;
}

function buyUnmute() {
    let minutes = parseInt(document.getElementById('muteMinutes')?.value) || 0;
    if (minutes <= 0) { showToast('Укажите длительность'); return; }
    let price = calculateUnmutePrice();
    currentProduct = { name: 'Размьют (' + minutes + ' мин)', price: price, type: 'service' };
    openContactModal();
}

function calculateUnbanPrice() {
    let minutes = parseInt(document.getElementById('banMinutes')?.value) || 0;
    let price = minutes <= 180 ? 50 : 50 + Math.ceil((minutes - 180) / 10) * 10;
    document.getElementById('unbanPrice').textContent = price;
    return price;
}

function buyUnban() {
    let minutes = parseInt(document.getElementById('banMinutes')?.value) || 0;
    if (minutes <= 0) { showToast('Укажите длительность'); return; }
    let price = calculateUnbanPrice();
    currentProduct = { name: 'Разбан (' + minutes + ' мин)', price: price, type: 'service' };
    openContactModal();
}

function buyAccountTransfer() {
    let oldNick = document.getElementById('oldNickname')?.value.trim();
    let newNick = document.getElementById('newNickname')?.value.trim();
    if (!oldNick || !newNick) { showToast('Введите оба ника'); return; }
    currentProduct = { name: 'Перенос аккаунта (' + oldNick + ' → ' + newNick + ')', price: 500, type: 'service' };
    openContactModal();
}

function copyToClipboard(t) { navigator.clipboard.writeText(t); showToast('📋 Скопировано: ' + t); }
function showToast(m) { let t = document.getElementById('toast'), tm = document.getElementById('toastMessage'); if (t && tm) { tm.textContent = m; t.classList.remove('translate-y-20', 'opacity-0'); setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000); } }

window.applyPromocode = applyPromocode;
window.applyCurrencyPromocode = applyCurrencyPromocode;
window.openYooMoney = openYooMoney;
window.buyCurrency = buyCurrency;
window.buyPrivilege = buyPrivilege;
window.buyService = buyService;
window.buyTitle = buyTitle;
window.saveNickname = saveNickname;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.openCurrencyModal = openCurrencyModal;
window.closeCurrencyModal = closeCurrencyModal;
window.updateCoinAmount = updateCoinAmount;
window.updateCoinFromInput = updateCoinFromInput;
window.setMaxCoins = setMaxCoins;
window.saveCurrencyNick = saveCurrencyNick;
window.calculateUnmutePrice = calculateUnmutePrice;
window.calculateUnbanPrice = calculateUnbanPrice;
window.buyUnmute = buyUnmute;
window.buyUnban = buyUnban;
window.buyAccountTransfer = buyAccountTransfer;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    displaySavedNick();
    if (document.getElementById('banMinutes')) calculateUnbanPrice();
    if (document.getElementById('muteMinutes')) calculateUnmutePrice();
});

console.log('💡 АДМИН-КОМАНДЫ: showPurchases() | copyPurchasesToClipboard() | downloadPurchasesCSV() | clearPurchases() | testTelegramNotification() | testEmailNotification()');