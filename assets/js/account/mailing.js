



async function getMailingTab(){if(!isOwner())return'<p class="text-red-400 text-center py-4 text-sm">Недостаточно прав</p>';return`<h3 class="text-lg font-bold mb-4"><i data-lucide="mail" class="w-5 h-5 inline text-blue-400 mr-1"></i>Рассылка</h3><div class="glass rounded-lg p-3"><p class="text-gray-400 mb-3 text-sm">Отправить уведомление администратору через Telegram.</p><textarea id="mailingMessage" rows="4" placeholder="Текст..." class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3"></textarea><button onclick="sendMailing()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm w-full"><i data-lucide="send" class="w-3 h-3 inline mr-1"></i>Отправить</button></div>`;}

async function sendMailing(){if(!isOwner()){showToast('Недостаточно прав');return;}const m=document.getElementById('mailingMessage').value.trim();if(!m){showToast('Введите сообщение');return;}await fetch(`${API_BASE}/telegram_proxy.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:`📢 РАССЫЛКА\n👤 ${currentUser.username}\n\n${m}`})});showToast('Отправлено!');switchAdminTab('mailing');}