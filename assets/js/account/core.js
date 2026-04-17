const SUPABASE_URL = 'https://sxuvodwuqhyievbnvaye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7Q_z0BWiR7xWnD8YqeiBSA_afgPot8z';
const API_BASE = 'https://proxy.goodcube.site';
const RCON_PROXY_URL = 'https://proxy.goodcube.site/rcon_proxy.php';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = supabaseClient;

let currentUser = null;
let allPurchases = [];
let tgCheckInterval = null;
let pendingTgCode = null;

const ADMIN_ROLES = ['owner', 'co_owner', 'admin', 'curator', 'moderator', 'helper', 'Владелец проекта', 'Со-владелец проекта', 'Администратор', 'Куратор', 'Модератор', 'Хелпер'];
const OWNER_ROLES = ['owner', 'co_owner', 'admin', 'Владелец проекта', 'Со-владелец проекта', 'Администратор'];


(function(){const c=document.getElementById('particles');if(!c)return;const ctx=c.getContext('2d');let p=[];function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}function init(){p=[];for(let i=0;i<80;i++){p.push({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*2+1,dx:(Math.random()-0.5)*0.8,dy:(Math.random()-0.5)*0.8});}}function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#f97316';for(let i of p){ctx.beginPath();ctx.arc(i.x,i.y,i.r,0,Math.PI*2);ctx.fill();i.x+=i.dx;i.y+=i.dy;if(i.x<0||i.x>c.width)i.dx*=-1;if(i.y<0||i.y>c.height)i.dy*=-1;}requestAnimationFrame(draw);}window.addEventListener('resize',()=>{resize();init();});resize();init();draw();})();


function showToast(m){const t=document.getElementById('toast'),tm=document.getElementById('toastMessage');if(t&&tm){tm.textContent=m;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000);}}
function copyToClipboard(t){navigator.clipboard.writeText(t);showToast(`Скопировано: ${t}`);}
async function hashPassword(p){const e=new TextEncoder().encode(p),h=await crypto.subtle.digest('SHA-256',e);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function checkAdminAccess(){if(!currentUser?.role||!ADMIN_ROLES.some(r=>currentUser.role.includes(r))){showToast('Доступ запрещён');return false;}return true;}
function isOwner(){return currentUser?.role&&OWNER_ROLES.some(r=>currentUser.role.includes(r));}


async function checkBanStatus(n){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/bans?select=*&player_name=eq.${n}&active=eq.true&or=(expires_at.is.null,expires_at.gt.now())&limit=1`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});const b=await r.json();if(b.length)return {banned:true,reason:b[0].reason||'Нарушение',banned_by:b[0].banned_by||'Админ',expires_at:b[0].expires_at};return {banned:false};}catch(e){return {banned:false};}}
async function getPlayerRole(n){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/staff?select=role&player_name=eq.${n}&active=eq.true&limit=1`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});const s=await r.json();if(s.length){const roles={owner:'Владелец проекта',co_owner:'Со-владелец проекта',admin:'Администратор',curator:'Куратор',moderator:'Модератор',helper:'Хелпер',builder:'Строитель',designer:'Дизайнер'};return roles[s[0].role]||s[0].role;}return null;}catch(e){return null;}}
async function refreshUserRole(){if(!currentUser)return null;const role=await getPlayerRole(currentUser.minecraft_nick||currentUser.username);if(role){currentUser.role=role;}else{delete currentUser.role;}const s=JSON.parse(localStorage.getItem('user_session'));if(s){if(role){s.role=role;}else{delete s.role;}localStorage.setItem('user_session',JSON.stringify(s));}updateUserUI();if(role){showAdminPanelLink(role);updateMobileAdminLinks();}else{const al=document.getElementById('adminPanelLink');if(al)al.remove();updateMobileAdminLinks();}return role;}


async function getPlayerAvatar(playerName) {
    if (!playerName) return null;
    try {
        const uuidResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerName}`);
        if (!uuidResponse.ok) return null;
        const uuidData = await uuidResponse.json();
        const uuid = uuidData.id;
        return {
            uuid: uuid,
            name: uuidData.name,
            avatarUrl: `https://crafatar.com/avatars/${uuid}?size=80&overlay`,
            headUrl: `https://crafatar.com/renders/head/${uuid}?scale=6&overlay`
        };
    } catch (e) {
        console.error('Ошибка получения аватарки:', e);
        return null;
    }
}

async function updateAvatar() {
    if (!currentUser || !currentUser.minecraft_nick) return;
    const avatar = await getPlayerAvatar(currentUser.minecraft_nick);
    if (avatar) {
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            avatarEl.innerHTML = `<img src="${avatar.avatarUrl}" alt="${currentUser.minecraft_nick}" class="w-full h-full rounded-full object-cover">`;
            avatarEl.style.background = 'none';
        }
        currentUser.avatar = avatar.avatarUrl;
    }
}


function updateMobileAdminLinks() {
    const hasAccess = currentUser?.role && ADMIN_ROLES.some(r => currentUser.role.includes(r));
    const menuLink = document.getElementById('mobileAdminMenuLink');
    const headerBtn = document.getElementById('mobileAdminHeaderBtn');
    if (menuLink) menuLink.style.display = hasAccess ? 'block' : 'none';
    if (headerBtn) {
        if (hasAccess) {
            headerBtn.classList.add('admin-visible');
            headerBtn.classList.remove('hidden');
        } else {
            headerBtn.classList.remove('admin-visible');
            headerBtn.classList.add('hidden');
        }
    }
}

window.addEventListener('resize', () => setTimeout(updateMobileAdminLinks, 100));

function switchAuthTab(tab){document.getElementById('loginForm').style.display='none';document.getElementById('registerForm').style.display='none';document.getElementById('telegramForm').style.display='none';document.getElementById('loginTab').classList.remove('active');document.getElementById('registerTab').classList.remove('active');document.getElementById('telegramTab').classList.remove('active');if(tab==='login'){document.getElementById('loginForm').style.display='block';document.getElementById('loginTab').classList.add('active');}else if(tab==='register'){document.getElementById('registerForm').style.display='block';document.getElementById('registerTab').classList.add('active');}else{document.getElementById('telegramForm').style.display='block';document.getElementById('telegramTab').classList.add('active');resetTelegramForm();}}
function resetTelegramForm(){document.getElementById('telegramStatus').classList.add('hidden');document.getElementById('telegramCodeDisplay').classList.add('hidden');document.getElementById('telegramAuthBtn').innerHTML='Получить код';document.getElementById('telegramAuthBtn').onclick=startTelegramAuth;if(tgCheckInterval){clearInterval(tgCheckInterval);tgCheckInterval=null;}}

async function loginWithPassword(){const u=document.getElementById('loginUsername').value.trim(),p=document.getElementById('loginPassword').value;if(!u||!p){showToast('Введите логин и пароль');return;}const hash=await hashPassword(p);try{const r=await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&or=(username.eq.${u},email.eq.${u})&password_hash=eq.${hash}&limit=1`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});const d=await r.json();if(!d.length){showToast('Неверный логин или пароль');return;}const user=d[0],pn=user.minecraft_nick||user.username,ban=await checkBanStatus(pn);if(ban.banned){let msg=`❌ Аккаунт заблокирован!\nПричина: ${ban.reason}\nЗабанил: ${ban.banned_by}`;if(ban.expires_at)msg+=`\nРазбан: ${new Date(ban.expires_at).toLocaleString('ru-RU')}`;else msg+='\nБан навсегда';alert(msg);return;}await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,{method:'PATCH',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({last_login:new Date().toISOString()})});const role=await getPlayerRole(pn);localStorage.setItem('user_session',JSON.stringify({id:user.id,username:user.username,email:user.email,minecraft_nick:user.minecraft_nick,role}));currentUser={...user,role};checkAuth();showToast(`Добро пожаловать, ${user.username}!`);}catch(e){showToast('Ошибка соединения');}}

async function registerWithPassword(){const u=document.getElementById('regUsername').value.trim(),e=document.getElementById('regEmail').value.trim(),p=document.getElementById('regPassword').value,pc=document.getElementById('regPasswordConfirm').value,n=document.getElementById('regMinecraftNick').value.trim();if(!u||!e||!p){showToast('Заполните все поля');return;}if(p.length<6){showToast('Пароль минимум 6 символов');return;}if(p!==pc){showToast('Пароли не совпадают');return;}try{const cr=await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&or=(username.eq.${u},email.eq.${e})&limit=1`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});if((await cr.json()).length){showToast('Пользователь уже существует');return;}const hash=await hashPassword(p);const rr=await fetch(`${SUPABASE_URL}/rest/v1/users`,{method:'POST',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({username:u,email:e,password_hash:hash,minecraft_nick:n||null,registered_at:new Date().toISOString(),last_login:new Date().toISOString()})});const user=(await rr.json())[0];localStorage.setItem('user_session',JSON.stringify({id:user.id,username:user.username,email:user.email,minecraft_nick:user.minecraft_nick,role:null}));currentUser=user;checkAuth();showToast(`Регистрация успешна!`);}catch(e){showToast('Ошибка соединения');}}

async function startTelegramAuth(){const code=Math.floor(100000+Math.random()*900000).toString();pendingTgCode=code;document.getElementById('telegramCodeValue').textContent=code;document.getElementById('telegramCodeDisplay').classList.remove('hidden');document.getElementById('telegramStatus').classList.remove('hidden');document.getElementById('telegramStatus').innerHTML='⏳ Ожидание подтверждения...';document.getElementById('telegramAuthBtn').innerHTML='Проверить снова';document.getElementById('telegramAuthBtn').onclick=()=>checkAuthCode(code);try{await navigator.clipboard.writeText(code);showToast('Код скопирован');}catch(e){}if(tgCheckInterval)clearInterval(tgCheckInterval);tgCheckInterval=setInterval(async()=>{if(await checkAuthCode(code)){clearInterval(tgCheckInterval);tgCheckInterval=null;}},2000);setTimeout(()=>{if(tgCheckInterval){clearInterval(tgCheckInterval);tgCheckInterval=null;document.getElementById('telegramStatus').innerHTML='❌ Время истекло';document.getElementById('telegramAuthBtn').innerHTML='Получить новый код';document.getElementById('telegramAuthBtn').onclick=startTelegramAuth;}},300000);}
function copyTelegramCode(){if(pendingTgCode)copyToClipboard(pendingTgCode);}
async function checkAuthCode(code){try{const r=await fetch(`${API_BASE}/check_auth_code.php?code=${code}`);if(!r.ok)return false;const d=await r.json();if(d.ok){document.getElementById('telegramStatus').innerHTML='✅ Код подтверждён!';await handleTelegramLogin(d.user);document.getElementById('telegramCodeDisplay').classList.add('hidden');return true;}}catch(e){}return false;}
async function handleTelegramLogin(tgData){try{const {data:ex}=await supabaseClient.from('users').select('*').eq('tg_id',tgData.tg_id).single();let user;if(ex){const ban=await checkBanStatus(ex.minecraft_nick||ex.username);if(ban.banned){let msg=`❌ Аккаунт заблокирован!\nПричина: ${ban.reason}`;alert(msg);resetTelegramForm();return;}await supabaseClient.from('users').update({last_login:new Date().toISOString()}).eq('id',ex.id);user=ex;showToast(`С возвращением, ${user.username||tgData.first_name}!`);}else{const nick=prompt('Введите Minecraft ник:');if(!nick){resetTelegramForm();return;}const ban=await checkBanStatus(nick);if(ban.banned){alert(`Ник ${nick} забанен!`);resetTelegramForm();return;}const un=tgData.username||`tg_${tgData.tg_id}`;const {data:newUser}=await supabaseClient.from('users').insert({tg_id:tgData.tg_id,tg_username:tgData.username,first_name:tgData.first_name,last_name:tgData.last_name,username:un,minecraft_nick:nick,registered_at:new Date().toISOString(),last_login:new Date().toISOString()}).select().single();user=newUser;showToast(`Регистрация завершена!`);}const role=await getPlayerRole(user.minecraft_nick||user.username);localStorage.setItem('user_session',JSON.stringify({id:user.id,username:user.username,email:user.email,minecraft_nick:user.minecraft_nick,tg_id:user.tg_id,role}));currentUser={...user,role};checkAuth();}catch(e){resetTelegramForm();}}


function logout(){localStorage.removeItem('user_session');currentUser=null;const al=document.getElementById('adminPanelLink');if(al)al.remove();checkAuth();showToast('Вы вышли');updateMobileAdminLinks();}
function syncPurchases(){if(currentUser){loadUserPurchases();showToast('Синхронизировано');}}
function loadUserPurchases(){if(!currentUser)return;const all=JSON.parse(localStorage.getItem('goodcube_purchases')||'[]'),nick=currentUser.minecraft_nick||'';allPurchases=all.filter(p=>p.playerName===nick||p.playerName===currentUser.username);updateUserStats();renderPurchasesTable();}
function updateUserStats(){if(!currentUser)return;document.getElementById('totalPurchases').innerText=allPurchases.length;document.getElementById('totalSpent').innerText=allPurchases.reduce((s,p)=>s+(p.finalPrice||0),0);document.getElementById('titlesCount').innerText=allPurchases.filter(p=>p.productType==='title'&&p.status==='success').length;const priv=allPurchases.filter(p=>p.productType==='privilege'&&p.status==='success');let active='Нет';if(priv.some(p=>p.productName==='D ADMIN'))active='D ADMIN';else if(priv.some(p=>p.productName==='D MODER'))active='D MODER';else if(priv.some(p=>p.productName==='LEGEND'))active='LEGEND';else if(priv.some(p=>p.productName==='PREMIUM'))active='PREMIUM';else if(priv.some(p=>p.productName==='VIP'))active='VIP';document.getElementById('activePrivilege').innerText=active;document.getElementById('minecraftNickDisplay').innerHTML=`🎮 Ник: ${currentUser.minecraft_nick||'не привязан'}`;}
function renderPurchasesTable(){const tb=document.getElementById('purchasesTable');if(!allPurchases.length){tb.innerHTML='<tr><td colspan="5" class="text-center py-8 text-gray-500"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>Нет покупок</td></tr>';lucide.createIcons();return;}let h='';allPurchases.slice().reverse().forEach(p=>{const sc=p.status==='success'?'text-green-400':(p.status==='cancelled'?'text-red-400':'text-yellow-400'),st=p.status==='success'?'✅ Успешно':(p.status==='cancelled'?'❌ Отменено':'⏳ Ожидание');h+=`<tr class="border-b border-gray-800"><td class="py-3 text-gray-300">${p.timestamp?.slice(0,10)||'---'}</td><td class="py-3 text-white">${p.productName||'???'}</td><td class="py-3 text-green-400">${p.finalPrice||0} ₽</td><td class="py-3 text-gray-400">${p.promoCode||'нет'}</td><td class="py-3 ${sc}">${st}</td></tr>`;});tb.innerHTML=h;lucide.createIcons();}
function updateUserUI(){if(!currentUser)return;document.getElementById('userAvatar').innerHTML=(currentUser.username?.[0]||'G').toUpperCase();let dn=currentUser.username||'Игрок';if(currentUser.role){const rc={'Владелец проекта':'#ef4444','Со-владелец проекта':'#f97316','Администратор':'#ef4444','Куратор':'#3b82f6','Модератор':'#22c55e','Хелпер':'#a855f7','Строитель':'#eab308','Дизайнер':'#ec4899'};document.getElementById('userName').innerHTML=`${dn} <span style="color:${rc[currentUser.role]||'#f97316'};font-size:0.875rem;margin-left:8px;">[${currentUser.role}]</span>`;}else document.getElementById('userName').innerHTML=dn;document.getElementById('userLoginDisplay').innerHTML=currentUser.email||currentUser.username;const nick=currentUser.minecraft_nick||'не привязан';const nickLink=nick!=='не привязан'?`<a href="player.html?name=${nick}" target="_blank" class="hover:underline">${nick}</a>`:nick;document.getElementById('minecraftNickDisplay').innerHTML=`🎮 Ник: ${nickLink}`;}

async function checkAuth(){const s=localStorage.getItem('user_session');if(s){currentUser=JSON.parse(s);const dbRole=await getPlayerRole(currentUser.minecraft_nick||currentUser.username);if(!dbRole){delete currentUser.role;const sd=JSON.parse(s);delete sd.role;localStorage.setItem('user_session',JSON.stringify(sd));}else{currentUser.role=dbRole;}document.getElementById('unauthorizedState').classList.add('hidden');document.getElementById('authorizedState').classList.remove('hidden');updateUserUI();loadUserPurchases();updateAvatar();if(currentUser.role){setTimeout(()=>{showAdminPanelLink(currentUser.role);updateMobileAdminLinks();},100);}else{updateMobileAdminLinks();}}else{document.getElementById('unauthorizedState').classList.remove('hidden');document.getElementById('authorizedState').classList.add('hidden');switchAuthTab('login');updateMobileAdminLinks();}}

function showAdminPanelLink(role){if(!role||!ADMIN_ROLES.some(r=>role.includes(r)))return;const nav=document.querySelector('nav .hidden.md\\:flex');if(nav&&!document.getElementById('adminPanelLink')){const al=document.createElement('a');al.id='adminPanelLink';al.href='#';al.className='text-red-400 hover:text-red-300 transition-colors font-medium';al.innerHTML='<i data-lucide="shield" class="w-4 h-4 inline mr-1"></i> Админ-панель';al.onclick=(e)=>{e.preventDefault();openAdminModal();};nav.appendChild(al);lucide.createIcons();}}

function showModal(content){const m=document.createElement('div');m.className='fixed inset-0 z-[200] flex items-center justify-center p-4';m.innerHTML=`<div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div><div class="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto"><button onclick="this.closest('.fixed').remove()" class="sticky top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center float-right"><i data-lucide="x" class="w-5 h-5 text-white"></i></button><div class="clear-both"></div>${content}</div>`;document.body.appendChild(m);lucide.createIcons();}


function showForgotPasswordModal(){document.getElementById('forgotPasswordModal').classList.remove('hidden');document.body.style.overflow='hidden';document.getElementById('forgotMessage').classList.add('hidden');document.getElementById('forgotEmail').value='';}
function closeForgotPasswordModal(){document.getElementById('forgotPasswordModal').classList.add('hidden');document.body.style.overflow='auto';}
async function sendResetEmail(){const email=document.getElementById('forgotEmail').value.trim();const msgDiv=document.getElementById('forgotMessage');if(!email){msgDiv.className='mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30';msgDiv.innerHTML='❌ Введите email';msgDiv.classList.remove('hidden');return;}msgDiv.className='mb-4 p-3 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';msgDiv.innerHTML='⏳ Отправляем инструкцию...';msgDiv.classList.remove('hidden');try{const response=await fetch('https://proxy.goodcube.site/send_reset_email.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const result=await response.json();if(result.ok){msgDiv.className='mb-4 p-3 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30';msgDiv.innerHTML='✅ Инструкция отправлена на email. Проверьте почту (включая спам).';setTimeout(()=>{closeForgotPasswordModal();},3000);}else{msgDiv.className='mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30';msgDiv.innerHTML='❌ '+(result.error||'Ошибка отправки');}}catch(e){msgDiv.className='mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30';msgDiv.innerHTML='❌ Ошибка соединения';}}

function openCurrencyModal(){showToast('В разработке');}


document.addEventListener('DOMContentLoaded',()=>{lucide.createIcons();checkAuth();if(typeof PromoCodes!=='undefined'){PromoCodes.init(supabaseClient);}setTimeout(updateMobileAdminLinks,300);setTimeout(updateMobileAdminLinks,600);setTimeout(updateMobileAdminLinks,1000);});
window.addEventListener('beforeunload',()=>{if(tgCheckInterval)clearInterval(tgCheckInterval);});

function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
        <div class="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <button onclick="this.closest('.fixed').remove()" class="sticky top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center float-right">
                <i data-lucide="x" class="w-5 h-5 text-white"></i>
            </button>
            <div class="clear-both"></div>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}