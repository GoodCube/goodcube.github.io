const PromoCodes = {
    supabase: null,

    
    init: function(clientOrUrl, key) {
        
        if (clientOrUrl && typeof clientOrUrl === 'object' && clientOrUrl.from) {
            this.supabase = clientOrUrl;
            return;
        }

        
        if (typeof clientOrUrl === 'string' && typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(clientOrUrl, key);
            return;
        }

        
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
        }
    },

    
    validatePromocode: async function(code, amount, playerName = null) {
        code = code.toUpperCase().trim();

        if (!this.supabase) {
            console.error('Supabase не инициализирован');
            return { valid: false, message: "База данных недоступна" };
        }

        try {
            const { data: promos, error } = await this.supabase
                .from('promocodes')
                .select('*')
                .eq('code', code)
                .eq('active', true)
                .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
                .limit(1);

            if (error) throw error;
            if (!promos || promos.length === 0) {
                return { valid: false, message: "Промокод не найден или истёк" };
            }

            const promo = promos[0];

            if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
                return { valid: false, message: "Лимит использований исчерпан" };
            }

            if (amount < promo.min_amount) {
                return { valid: false, message: `Минимальная сумма: ${promo.min_amount}₽` };
            }

            if (promo.one_time_only && playerName && playerName !== 'Не указан') {
                const { data: uses } = await this.supabase
                    .from('promocode_uses')
                    .select('id')
                    .eq('code', code)
                    .eq('player_name', playerName)
                    .limit(1);

                if (uses && uses.length > 0) {
                    return { valid: false, message: "Вы уже использовали этот промокод" };
                }
            }

            const discountedPrice = Math.floor(amount - (amount * promo.discount / 100));

            return {
                valid: true,
                message: `Промокод активирован! Скидка ${promo.discount}%`,
                discount: promo.discount,
                discountedPrice: discountedPrice,
                promoData: promo
            };

        } catch (error) {
            console.error('Ошибка проверки промокода:', error);
            return { valid: false, message: "Ошибка проверки промокода" };
        }
    },

    
    applyPromocode: async function(code, playerName = null, orderId = null, amount = 0) {
        code = code.toUpperCase().trim();

        if (!this.supabase) return false;

        try {
            const { data: promos } = await this.supabase
                .from('promocodes')
                .select('*')
                .eq('code', code)
                .limit(1);

            if (!promos || promos.length === 0) return false;

            const promo = promos[0];

            await this.supabase
                .from('promocodes')
                .update({ used_count: promo.used_count + 1 })
                .eq('id', promo.id);

            if (playerName && playerName !== 'Не указан') {
                await this.supabase
                    .from('promocode_uses')
                    .insert({
                        promocode_id: promo.id,
                        code: code,
                        player_name: playerName,
                        order_id: orderId,
                        discount_amount: Math.floor(amount * promo.discount / 100)
                    });
            }

            return true;

        } catch (error) {
            console.error('Ошибка применения промокода:', error);
            return false;
        }
    },

    
    getAllPromocodes: async function() {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('promocodes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка получения промокодов:', error);
            return [];
        }

        return data;
    },

    
    addPromocode: async function(code, data) {
        if (!this.supabase) return false;

        try {
            const { error } = await this.supabase
                .from('promocodes')
                .insert({
                    code: code.toUpperCase(),
                    name: data.name || code,
                    discount: data.discount,
                    max_uses: data.max_uses || 0,
                    min_amount: data.min_amount || 0,
                    one_time_only: data.oneTimeOnly || false,
                    active: data.active !== undefined ? data.active : true,
                    valid_until: data.validUntil,
                    description: data.description,
                    created_by: data.created_by
                });

            if (error) {
                console.error('Ошибка добавления:', error);
                return false;
            }

            return true;

        } catch (error) {
            console.error('Ошибка добавления:', error);
            return false;
        }
    },

    
    updatePromocode: async function(code, updates) {
        if (!this.supabase) return false;

        try {
            const { error } = await this.supabase
                .from('promocodes')
                .update(updates)
                .eq('code', code.toUpperCase());

            return !error;

        } catch (error) {
            console.error('Ошибка обновления:', error);
            return false;
        }
    },

    
    togglePromocode: async function(code, active) {
        return await this.updatePromocode(code, { active: active });
    },

    
    deletePromocode: async function(code) {
        if (!this.supabase) return false;

        try {
            const { error } = await this.supabase
                .from('promocodes')
                .delete()
                .eq('code', code.toUpperCase());

            return !error;

        } catch (error) {
            console.error('Ошибка удаления:', error);
            return false;
        }
    },

    
    getStats: async function() {
        const promos = await this.getAllPromocodes();
        return promos.map(p => ({
            code: p.code,
            name: p.name,
            discount: p.discount,
            validUntil: p.valid_until,
            usedCount: p.used_count,
            maxUses: p.max_uses === 0 ? "∞" : p.max_uses,
            remaining: p.max_uses === 0 ? "∞" : p.max_uses - p.used_count,
            minAmount: p.min_amount,
            oneTimeOnly: p.one_time_only,
            active: p.active
        }));
    },

    
    hasPlayerUsed: async function(code, playerName) {
        if (!this.supabase || !playerName) return false;

        const { data } = await this.supabase
            .from('promocode_uses')
            .select('id')
            .eq('code', code.toUpperCase())
            .eq('player_name', playerName)
            .limit(1);

        return data && data.length > 0;
    }
};