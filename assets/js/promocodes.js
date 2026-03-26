// ============================================
// ФАЙЛ: promocodes.js
// Система управления промокодами для GoodCube
// ============================================

const PromoCodes = {
    codes: {
        "SPRING26": {
            name: "Сезонный промокод на скидку в 50%",
            discount: 50,
            validUntil: "2026-06-01",
            maxUses: 0,
            usedCount: 0,
            minAmount: 0,
            oneTimeOnly: false,
            description: "Сезонный промокод на скидку в 50%"
        }
    },

    validatePromocode: function(code, amount, playerName = null) {
        code = code.toUpperCase().trim();
        const promo = this.codes[code];

        if (!promo) {
            return { valid: false, message: "Промокод не найден" };
        }

        const today = new Date();
        const validUntil = new Date(promo.validUntil);
        if (today > validUntil) {
            return { valid: false, message: "Срок действия промокода истек" };
        }

        if (promo.oneTimeOnly && playerName && playerName !== 'Не указан') {
            if (this.checkPlayerUsed(code, playerName)) {
                return { valid: false, message: "Этот промокод уже был использован! Он действует только на одну покупку." };
            }
        }

        if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
            return { valid: false, message: "Промокод больше не активен (достигнут лимит использований)" };
        }

        if (amount < promo.minAmount) {
            return { valid: false, message: `Промокод действует при сумме от ${promo.minAmount}₽` };
        }

        const discountedPrice = amount - (amount * promo.discount / 100);
        return {
            valid: true,
            message: `Промокод активирован! Скидка ${promo.discount}%`,
            discount: promo.discount,
            discountedPrice: Math.floor(discountedPrice),
            promoData: promo
        };
    },

    checkPlayerUsed: function(code, playerName) {
        const usedPromos = JSON.parse(localStorage.getItem('player_used_promocodes') || '{}');
        const key = `${code}_${playerName}`;
        return usedPromos[key] === true;
    },

    markPlayerUsed: function(code, playerName) {
        const usedPromos = JSON.parse(localStorage.getItem('player_used_promocodes') || '{}');
        const key = `${code}_${playerName}`;
        usedPromos[key] = true;
        localStorage.setItem('player_used_promocodes', JSON.stringify(usedPromos));
    },

    applyPromocode: function(code, playerName = null) {
        code = code.toUpperCase().trim();
        const promo = this.codes[code];

        if (!promo) return false;

        if (promo.oneTimeOnly && playerName && playerName !== 'Не указан') {
            this.markPlayerUsed(code, playerName);
        }

        if (promo.maxUses > 0 && promo.usedCount < promo.maxUses) {
            promo.usedCount++;
            this.saveToLocalStorage();
            return true;
        } else if (promo.maxUses === 0) {
            this.saveToLocalStorage();
            return true;
        }

        return false;
    },

    saveToLocalStorage: function() {
        const usedCodes = {};
        for (let code in this.codes) {
            if (this.codes[code].maxUses > 0) {
                usedCodes[code] = {
                    usedCount: this.codes[code].usedCount
                };
            }
        }
        localStorage.setItem('used_promocodes', JSON.stringify(usedCodes));
    },

    loadFromLocalStorage: function() {
        const saved = localStorage.getItem('used_promocodes');
        if (saved) {
            const usedCodes = JSON.parse(saved);
            for (let code in usedCodes) {
                if (this.codes[code]) {
                    if (this.codes[code].maxUses > 0) {
                        this.codes[code].usedCount = usedCodes[code].usedCount || 0;
                    }
                }
            }
        }
    },

    addPromocode: function(code, data) {
        this.codes[code.toUpperCase()] = {
            name: data.name || "Новый промокод",
            discount: data.discount || 10,
            validUntil: data.validUntil || "2026-12-31",
            maxUses: data.maxUses || 100,
            usedCount: 0,
            minAmount: data.minAmount || 0,
            oneTimeOnly: data.oneTimeOnly || false,
            description: data.description || "Новый промокод"
        };
        this.saveToLocalStorage();
        return true;
    },

    deletePromocode: function(code) {
        code = code.toUpperCase().trim();
        if (this.codes[code]) {
            delete this.codes[code];
            this.saveToLocalStorage();
            return true;
        }
        return false;
    },

    getStats: function() {
        const stats = [];
        for (let code in this.codes) {
            const promo = this.codes[code];
            stats.push({
                code: code,
                name: promo.name,
                discount: promo.discount,
                validUntil: promo.validUntil,
                usedCount: promo.usedCount,
                maxUses: promo.maxUses === 0 ? "∞" : promo.maxUses,
                remaining: promo.maxUses === 0 ? "∞" : promo.maxUses - promo.usedCount,
                minAmount: promo.minAmount,
                oneTimeOnly: promo.oneTimeOnly || false
            });
        }
        return stats;
    }
};

PromoCodes.loadFromLocalStorage();

// Функции для работы с промокодами (доступны в консоли)
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

function PromoDelete(code) {
    const result = PromoCodes.deletePromocode(code);
    if (result) {
        console.log(`✅ Промокод ${code} удален!`);
    } else {
        console.log(`❌ Промокод ${code} не найден!`);
    }
    PromoStats();
}

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

function PromoClearHistory() {
    localStorage.removeItem('player_used_promocodes');
    console.log(`✅ История использования промокодов игроками очищена!`);
}

// Не выводим ничего в консоль при загрузке