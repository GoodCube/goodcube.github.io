async function openAdminModal() {
    if (!checkAdminAccess()) return;
    const role = currentUser.role;
    const isAdmin = isOwner();
    let h = `<div class="glass rounded-2xl p-6 w-full max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold mb-4">
            <i data-lucide="shield" class="w-6 h-6 inline text-red-400 mr-2"></i>
            Админ-панель (${role})
        </h2>
        <div class="flex flex-wrap gap-1 md:gap-2 border-b border-gray-700 pb-2 mb-4 admin-tab-container">
    `;

    const tabs = [
        { name: 'Статистика', key: 'stats', icon: 'bar-chart' },
        { name: 'Баны', key: 'bans', icon: 'ban' },
        { name: 'Муты', key: 'mutes', icon: 'mic-off' },
        { name: 'Администрация', key: 'staff', icon: 'users' },
        { name: 'История', key: 'history', icon: 'history' },
        { name: 'Покупки', key: 'purchases', icon: 'shopping-bag' },
        { name: 'Промокоды', key: 'promocodes', icon: 'ticket' },
        { name: 'Тест-покупки', key: 'testbuy', icon: 'flask' },
        { name: 'Игроки', key: 'players', icon: 'user' },
        { name: 'Тикеты', key: 'tickets', icon: 'message-circle' }
    ];

    if (isAdmin) tabs.push({ name: 'Рассылка', key: 'mailing', icon: 'mail' });

    tabs.forEach((t, i) => {
        h += `<button onclick="switchAdminTab('${t.key}', event)" 
            class="admin-tab ${i === 0 ? 'active bg-orange-600 text-white' : 'glass hover:bg-white/10'} 
            px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm">
            <i data-lucide="${t.icon}" class="w-3 h-3 md:w-4 md:h-4 inline mr-1"></i>
            <span class="hidden sm:inline">${t.name}</span>
            <span class="sm:hidden">${t.name.substring(0, 4)}</span>
        </button>`;
    });

    h += `</div><div id="adminTabContent" class="col-span-2">${await getStatsTab()}</div></div>`;
    showModal(h);
}

async function switchAdminTab(tab, ev) {
    const c = document.getElementById('adminTabContent');
    if (ev && ev.target) {
        document.querySelectorAll('.admin-tab').forEach(b => {
            b.classList.remove('bg-orange-600', 'text-white');
            b.classList.add('glass');
        });
        ev.target.classList.add('bg-orange-600', 'text-white');
        ev.target.classList.remove('glass');
    }
    c.innerHTML = '<div class="text-center py-8"><div class="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>';
    let h = '';
    if (tab === 'stats') h = await getStatsTab();
    else if (tab === 'bans') h = await getBansTab();
    else if (tab === 'mutes') h = await getMutesTab();
    else if (tab === 'staff') h = await getStaffTab();
    else if (tab === 'history') h = await getHistoryTab();
    else if (tab === 'purchases') h = await getPurchasesTab();
    else if (tab === 'promocodes') h = await getPromocodesTab();
    else if (tab === 'testbuy') h = await getTestBuyTab();
    else if (tab === 'players') h = await getPlayersTab();
    else if (tab === 'mailing') h = await getMailingTab();
    else if (tab === 'tickets') h = await getTicketsTab();
    c.innerHTML = h;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}


async function getTicketsTab() {
    const { data: tickets, error } = await supabaseClient
        .from('tickets')
        .select('*')
        .order('last_reply_at', { ascending: false });

    if (error) {
        console.error(error);
        return '<p class="text-red-400 text-center py-8">Ошибка загрузки тикетов</p>';
    }

    if (!tickets || tickets.length === 0) {
        return '<p class="text-gray-400 text-center py-8">Нет обращений</p>';
    }

    let html = '<div class="space-y-3">';

    for (const t of tickets) {
        const { data: lastMsg } = await supabaseClient
            .from('ticket_replies')
            .select('message')
            .eq('ticket_id', t.id)
            .order('created_at', { ascending: false })
            .limit(1);

        const lastMessage = lastMsg && lastMsg[0] ? lastMsg[0].message.substring(0, 100) : '';
        const statusColor = t.status === 'open' ? 'text-green-400' : 'text-gray-400';
        const statusText = t.status === 'open' ? '🟢 Открыт' : '🔴 Закрыт';

        html += `
            <div class="glass rounded-lg p-4">
                <div class="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <div>
                        <span class="font-bold text-orange-400">#${t.id}</span>
                        <span class="text-white ml-2">${escapeHtml(t.nickname)}</span>
                        <span class="text-xs ${statusColor} ml-2">${statusText}</span>
                    </div>
                    <span class="text-xs text-gray-500">${new Date(t.created_at).toLocaleString()}</span>
                </div>
                <p class="text-sm font-medium text-white mb-1">${escapeHtml(t.subject)}</p>
                <p class="text-xs text-gray-400 mb-3">${escapeHtml(lastMessage)}${lastMessage.length >= 100 ? '...' : ''}</p>
                <div class="flex gap-2">
                    <button onclick="openAdminTicket(${t.id})" class="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 px-3 py-1 rounded-lg text-sm">Ответить</button>
                    ${t.status === 'open' ? `<button onclick="closeTicket(${t.id})" class="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-sm">Закрыть</button>` : ''}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

async function openAdminTicket(ticketId) {
    const response = prompt('Введите ответ (пользователь увидит на сайте):');
    if (!response) return;

    const { data: ticket } = await supabaseClient
        .from('tickets')
        .select('nickname')
        .eq('id', ticketId)
        .single();

    await supabaseClient
        .from('ticket_replies')
        .insert({
            ticket_id: ticketId,
            message: response,
            is_admin: true,
            author: currentUser?.username || 'Администратор',
            created_at: new Date()
        });

    await supabaseClient
        .from('tickets')
        .update({ last_reply_at: new Date() })
        .eq('id', ticketId);

    showToast('Ответ отправлен!');
    switchAdminTab('tickets');
}

async function closeTicket(ticketId) {
    if (!confirm('Закрыть тикет?')) return;

    await supabaseClient
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

    showToast('Тикет закрыт');
    switchAdminTab('tickets');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}