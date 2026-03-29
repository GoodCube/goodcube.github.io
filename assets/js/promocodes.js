// ============================================
// promocodes.js - система промокодов для GoodCube
// ============================================

const PromoCodes = {
    codes: {
        "SPRING26": {
            name: "Сезонный",
            discount: 50,
            validUntil: "2026-06-01 00:00:00",
            maxUses: 0,
            usedCount: 0,
            minAmount: 0,
            oneTimeOnly: false,
            active: true,
            description: "Скидка 50% на весь сезон"
        },
        "TESTPROMO99": {
            name: "ff",
            discount: 90,
            validUntil: "2026-06-01 00:00:00",
            maxUses: 0,
            usedCount: 0,
            minAmount: 0,
            oneTimeOnly: false,
            active: false,
            description: "Скидfка 50% на весь сезон"
        }
    },

    validatePromocode: function(code, amount, playerName = null) {
        code = code.toUpperCase().trim();
        const promo = this.codes[code];

        if (!promo) {
            return { valid: false, message: "Промокод не найден" };
        }

        // ПРОВЕРКА НА АКТИВНОСТЬ (НОВОЕ!)
        if (promo.active === false) {
            return { valid: false, message: "Промокод временно отключен администрацией" };
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

        // Не применяем если отключен
        if (promo.active === false) return false;

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
                if (this.codes[code] && this.codes[code].maxUses > 0) {
                    this.codes[code].usedCount = usedCodes[code].usedCount || 0;
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
            active: data.active !== undefined ? data.active : true,  // по умолчанию активен
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

    // НОВАЯ ФУНКЦИЯ: включить/выключить промокод
    togglePromocode: function(code, active) {
        code = code.toUpperCase().trim();
        if (this.codes[code]) {
            this.codes[code].active = active;
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
                oneTimeOnly: promo.oneTimeOnly || false,
                active: promo.active || false      // показываем статус активности
            });
        }
        return stats;
    }
};

PromoCodes.loadFromLocalStorage();