// ============================================
// admin.js - админ-команды для консоли
// ============================================

// Показать статистику промокодов
function PromoStats() {
    console.log("📊 Статистика промокодов:");
    console.table(PromoCodes.getStats());

    const stats = PromoCodes.getStats();
    const totalUsed = stats.reduce((sum, p) => sum + (p.maxUses === "∞" ? 0 : p.usedCount), 0);
    console.log(`
Всего промокодов: ${stats.length}
Всего использований: ${totalUsed}
One-time промокодов: ${stats.filter(p => p.oneTimeOnly).length}
    `);
}

// Добавить обычный промокод
function PromoAdd(code, discount, maxUses = 100, validUntil = "2026-12-31", minAmount = 0) {
    PromoCodes.addPromocode(code, {
        name: `Промокод ${code}`,
        discount: discount,
        validUntil: validUntil,
        maxUses: maxUses,
        minAmount: minAmount,
        oneTimeOnly: false
    });
    console.log(`✅ Промокод ${code} добавлен!`);
    PromoStats();
}

// Добавить одноразовый промокод (только 1 раз на игрока)
function PromoOneTime(code, discount, validUntil = "2026-12-31", minAmount = 0) {
    PromoCodes.addPromocode(code, {
        name: `One-time ${code}`,
        discount: discount,
        validUntil: validUntil,
        maxUses: 1,
        minAmount: minAmount,
        oneTimeOnly: true,
        description: `Скидка ${discount}% (только один раз)`
    });
    console.log(`✅ One-time промокод ${code} (${discount}%) добавлен!`);
    PromoStats();
}

// Добавить бесконечный промокод
function PromoInfinity(code, discount, validUntil = "2026-12-31", minAmount = 0) {
    PromoCodes.addPromocode(code, {
        name: `Бесконечный ${code}`,
        discount: discount,
        validUntil: validUntil,
        maxUses: 0,
        minAmount: minAmount,
        oneTimeOnly: false,
        description: `Бесконечная скидка ${discount}%`
    });
    console.log(`✅ Бесконечный промокод ${code} (${discount}%) добавлен!`);
    PromoStats();
}

// Удалить промокод
function PromoDelete(code) {
    const result = PromoCodes.deletePromocode(code);
    if (result) {
        console.log(`✅ Промокод ${code} удален!`);
    } else {
        console.log(`❌ Промокод ${code} не найден!`);
    }
    PromoStats();
}

// Обновить параметры промокода
function PromoUpdate(code, updates) {
    const promoCode = code.toUpperCase().trim();
    if (PromoCodes.codes[promoCode]) {
        Object.assign(PromoCodes.codes[promoCode], updates);
        PromoCodes.saveToLocalStorage();
        console.log(`✅ Промокод ${promoCode} обновлен!`);
        PromoStats();
    } else {
        console.log(`❌ Промокод ${promoCode} не найден!`);
    }
}

// Проверить промокод
function PromoCheck(code, amount = 100, playerName = "Тестовый_игрок") {
    const result = PromoCodes.validatePromocode(code, amount, playerName);
    if (result.valid) {
        console.log(`✅ ${result.message}`);
        console.log(`💰 Итоговая сумма: ${result.discountedPrice}₽ (было ${amount}₽)`);
    } else {
        console.log(`❌ ${result.message}`);
    }
    return result;
}

// Очистить историю использования промокодов
function PromoClearHistory() {
    localStorage.removeItem('player_used_promocodes');
    console.log(`✅ История использования промокодов игроками очищена!`);
}