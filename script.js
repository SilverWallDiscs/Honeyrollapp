/**
 * script.js — Honeyroll ♡
 * Interfaz de juego para teléfono. Sin scroll.
 * Imágenes reales de Honey: default, feliz, durmiendo.
 */
'use strict';

/* ═══════════════════════════════════════════
   CONFIGURACIÓN
═══════════════════════════════════════════ */
const STORAGE_KEY = 'honeyroll_v1';

const IMAGES = {
  default:  'Assets/Honeydefault.png',
  happy:    'Assets/Honeyfeliz.png',
  sleeping: 'Assets/Honeydurmiendo.png',
};

const DECAY    = { happiness:.4, energy:.35, hunger:.55, affection:.25 };
const DECAY_MS = 9000;

const GAIN = {
  feed:  { hunger:22 },
  hug:   { affection:25, happiness:6 },
  play:  { happiness:28, energy:-18 },
  sleep: { energy:28,    happiness:4 },
  sing:  { happiness:20, affection:10 },
  bath:  { affection:22, happiness:8 },
  dance: { happiness:22, energy:-10,  affection:10 },
  kiss:  { affection:30, happiness:12 },
  pet:   { affection:8,  happiness:5 },
};

const MSG = {
  idle: [
    '¡Hola Honey! Me alegra verte aquí ♡',
    'Qué bonito día contigo hoy ☁️',
    'Me encanta cuando me visitas ✨',
    '¿Me das otra galletita? 🍪',
    '¡Juguemos juntos! ⭐',
    'Un abracito más, ¿sí? 🤗',
    'Hoy el cielo está muy bonito 💙',
    'Sigo aquí, siempre esperándote ♥',
    'Eres tan amable, Honey 🌸',
  ],
  sad: [
    'Me siento un poco sola… 🥺',
    'Tengo hambre, Honey 🍪',
    'Necesito energía… quiero dormir 😴',
    'Un abrazo me haría sentir mejor 💕',
    'Por favor no me olvides… ♥',
  ],
  sleep: [
    'Zzzzz… 💤 soñando con nubes…',
    'Dormidita… Zzz ☁️🌙',
    'Soñando con galletitas… 🍪💤',
  ],
  superHappy: [
    '✨ ¡Estoy súper feliz! ¡Gracias Honey! ✨',
    '🌟 ¡Todo es perfecto cuando estás aquí! 🌟',
    '💖 ¡Eres lo mejor que me pudo pasar! 💖',
    '🎉 ¡Me siento en una nube de algodón! 🎉',
  ],
  feed:  ['¡Qué rica galletita! 🍪 ¡Gracias!', '¡Mmm, deliciosa! 😋🍪', '¡Me encantan las galletitas! 🍪♡'],
  hug:   ['Honey me dio un abrazito ♥', '¡El mejor abrazo del mundo! 🤗', 'Me siento tan querida… ♡'],
  play:  ['¡Qué divertido! ¡Juguemos más! ⭐', '¡Me encantan los juegos! 🌟', '¡Jugar contigo es lo mejor! ⭐'],
  sing:  ['🎵 La la la… ¡qué canción tan bonita! 🎵', '¡Me encanta cantar contigo! 🎶'],
  bath:  ['¡Qué limpia y esponjosa quedé! 🛁✨', '¡Mmm, huelo a flores! 🌸'],
  dance: ['💃 ¡Weee! ¡Me encanta bailar! 💃', '¡Baila, baila conmigo! 💫'],
  kiss:  ['💋 ¡Un besito! Me puse toda rojita… 🌸', '¡Eres muy cariñoso! 💕'],
  pet:   ['Purrrr… 🥰', '¡Eso se siente muy bien! ♡', '…más, por favor… 🥺♡'],
  sleep_start: ['Buenas noches Honey… 🌙', 'Voy a dormir un ratito… 💤', 'Qué rico estar calientita 🌙✨'],
  wake:  ['¡Buenos días Honey! ☀️ ¡Descansé muy bien!', '¡Ya desperté! ¡Lista para jugar! ⭐'],
};

const LETTERS = [
  { text:'Espero que hoy hayas sonreído al menos una vez.\nSi no lo hiciste, sonríe ahora mismo. 😊', sig:'— Silver' },
  { text:'Gracias por preocuparte por mí.\nNo es poca cosa saber que alguien piensa en ti.',           sig:'— Silver ♡' },
  { text:'Siempre me alegra verte aparecer.\nCada vez que lo haces, el día se siente más suave.',      sig:'— Silver 🌸' },
  { text:'Eres una persona muy especial para mí.\nNo lo digo siempre, pero lo pienso siempre.',       sig:'— Silver ✨' },
  { text:'Incluso los días grises tienen algo bonito.\nHoy ese algo eres tú.',                         sig:'— Silver 💙' },
  { text:'No necesitas ser perfecta para merecer cariño.\nYa eres suficiente tal como eres.',         sig:'— Silver ♥' },
  { text:'Ojalá tus días estén llenos de nubes suaves\ny de galletitas calentitas. Lo mereces.',       sig:'— Silver 🍪' },
  { text:'Si algún día sientes que el mundo es muy ruidoso,\nrecuerda que aquí siempre hay paz y abrazo.', sig:'— Silver 🤍' },
  { text:'No sé cómo explicarlo, pero cuando apareces\ntodo se siente un poco más bonito.',            sig:'— Silver 🌙' },
  { text:'Cada vez que abres esta página, yo estoy aquí.\nEsperándote. Siempre.',                      sig:'— Silver 💜' },
];

const THOUGHTS = ['💭 ☁️','💭 🍪','💭 ⭐','💭 🌸','💭 💕','💭 🌙','💭 ✨','💭 🎵'];
const CLICK_FX = ['✨','💕','⭐','🌸','💖','☁️','💫','🎀','♡'];
const HEARTS   = ['♥','💕','💗','💖','🌸','✨','💝','💓'];

/* ═══════════════════════════════════════════
   ESTADO
═══════════════════════════════════════════ */
const DEF = { happiness:80, energy:80, hunger:80, affection:80, lastSaved:Date.now() };
let S = { ...DEF };
let sleeping   = false;
let superHappy = false;
let sleepTimer = null;
let heartTimer = null;
let thoughtTm  = null;
let lastLetter = -1;
let msgTm      = null;

/* Mini juego */
let mgRunning  = false;
let mgScore    = 0;
let mgTime     = 15;
let mgInterval = null;
let mgSpawn    = null;

/* ═══════════════════════════════════════════
   DOM
═══════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const G = {
  screenGame  : $('screen-game'),

  honeyImg    : $('honey-img'),
  thought     : $('thought'),
  thoughtText : $('thought-text'),
  dropItem    : $('drop-item'),
  superBadge  : $('super-badge'),

  dialogBox   : $('dialog-box'),
  dialogText  : $('dialog-text'),

  /* mini-stats top */
  msH: $('ms-h'), msE: $('ms-e'), msN: $('ms-n'), msA: $('ms-a'),
  msHappy: $('ms-happiness'), msEnergy: $('ms-energy'),
  msHunger: $('ms-hunger'),   msAffect: $('ms-affection'),

  /* barras */
  barHappy : $('bar-happiness'), valHappy : $('val-happiness'),
  barEnergy: $('bar-energy'),    valEnergy: $('val-energy'),
  barHunger: $('bar-hunger'),    valHunger: $('val-hunger'),
  barAffect: $('bar-affection'), valAffect: $('val-affection'),

  /* botones acción */
  btnFeed : $('btn-feed'),  btnHug  : $('btn-hug'),
  btnPlay : $('btn-play'),  btnSleep: $('btn-sleep'),
  btnSing : $('btn-sing'),  btnBath : $('btn-bath'),
  btnDance: $('btn-dance'), btnKiss : $('btn-kiss'),

  /* nav */
  navBtns  : document.querySelectorAll('.nav-btn'),
  panels   : document.querySelectorAll('.panel'),

  /* mini juego */
  mgArena  : $('mg-arena'),
  mgScore  : $('mg-score'),
  mgTimer  : $('mg-timer'),
  mgIdleMsg: $('mg-idle-msg'),
  btnMgStart:$('btn-mg-start'),

  /* cartitas */
  btnLetter    : $('btn-letter'),
  envelope     : $('envelope'),
  letterText   : $('letter-text'),
  letterSig    : $('letter-sig'),

  /* efectos */
  heartsLayer  : $('hearts-layer'),
  clickFx      : $('click-fx'),
  toast        : $('toast'),
};

/* ═══════════════════════════════════════════
   UTILIDADES
═══════════════════════════════════════════ */
const clamp   = (v,lo=0,hi=100) => Math.min(hi,Math.max(lo,v));
const rand    = (a,b) => Math.random()*(b-a)+a;
const randInt = (a,b) => Math.floor(rand(a,b+1));
const pick    = arr  => arr[Math.floor(Math.random()*arr.length)];
function pickNoRep(arr, last) {
  if (arr.length===1) return {item:arr[0],idx:0};
  let i; do { i=randInt(0,arr.length-1); } while(i===last);
  return {item:arr[i],idx:i};
}

/* ═══════════════════════════════════════════
   PERSISTENCIA
═══════════════════════════════════════════ */
function save() {
  S.lastSaved = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch(_){}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if (!d) return;
    const cycles = Math.min(Math.floor((Date.now()-(d.lastSaved||Date.now()))/DECAY_MS), 72);
    S.happiness = clamp((d.happiness||80) - DECAY.happiness*cycles);
    S.energy    = clamp((d.energy   ||80) - DECAY.energy   *cycles);
    S.hunger    = clamp((d.hunger   ||80) - DECAY.hunger   *cycles);
    S.affection = clamp((d.affection||80) - DECAY.affection*cycles);
  } catch(_){}
}

/* ═══════════════════════════════════════════
   IMAGEN DE HONEY
═══════════════════════════════════════════ */
function setHoneyImage(key) {
  if (G.honeyImg.dataset.current === key) return;
  G.honeyImg.dataset.current = key;
  G.honeyImg.style.transition = 'opacity .25s';
  G.honeyImg.style.opacity    = '0';
  setTimeout(() => {
    G.honeyImg.src = IMAGES[key];
    G.honeyImg.style.opacity = '1';
  }, 150);
}

function calcHoneyState() {
  if (sleeping) return 'sleeping';
  const avg = (S.happiness+S.energy+S.hunger+S.affection)/4;
  if (superHappy || avg >= 72) return 'happy';
  return 'default';
}

/* ═══════════════════════════════════════════
   ANIMACIONES
═══════════════════════════════════════════ */
const ANIMS = ['idle','bounce','sleep','dance','sing','super','petting'];
function setAnim(name, duration=0) {
  const img = G.honeyImg;
  img.classList.remove(...ANIMS);
  void img.offsetWidth;
  img.classList.add(name);
  if (duration>0) setTimeout(()=>{
    img.classList.remove(name);
    img.classList.add(sleeping?'sleep':superHappy?'super':'idle');
  }, duration);
}

/* ═══════════════════════════════════════════
   RENDER
═══════════════════════════════════════════ */
function renderBars() {
  const rows = [
    [S.happiness, G.barHappy,  G.valHappy,  G.msH, G.msHappy],
    [S.energy,    G.barEnergy, G.valEnergy, G.msE, G.msEnergy],
    [S.hunger,    G.barHunger, G.valHunger, G.msN, G.msHunger],
    [S.affection, G.barAffect, G.valAffect, G.msA, G.msAffect],
  ];
  rows.forEach(([val, bar, valEl, miniSpan, miniWrap]) => {
    const v = Math.round(val);
    bar.style.width   = v+'%';
    valEl.textContent = v;
    miniSpan.textContent = v;
    bar.classList.toggle('danger', v<25);
    miniWrap.classList.toggle('low', v<25);
  });
}

function checkSuperHappy() {
  const was = superHappy;
  superHappy = S.happiness>90 && S.energy>90 && S.hunger>90 && S.affection>90;
  G.superBadge.classList.toggle('on', superHappy);
  if (superHappy && !was) {
    setAnim('super');
    startHearts();
    speak(pick(MSG.superHappy), 8000);
    toast('🌟 ¡Modo Súper Feliz! 🌟');
  } else if (!superHappy && was) {
    stopHearts();
    setAnim('idle');
  }
}

function render() {
  renderBars();
  setHoneyImage(calcHoneyState());
  checkSuperHappy();
}

/* ═══════════════════════════════════════════
   DIÁLOGO
═══════════════════════════════════════════ */
function speak(text, ttl=4500) {
  clearTimeout(msgTm);
  G.dialogText.textContent = text;
  G.dialogBox.classList.remove('pop');
  void G.dialogBox.offsetWidth;
  G.dialogBox.classList.add('pop');
  if (ttl>0) msgTm = setTimeout(speakIdle, ttl);
}
function speakIdle() {
  if (sleeping)   { speak(pick(MSG.sleep),0); return; }
  if (superHappy) { speak(pick(MSG.superHappy),8000); return; }
  const avg = (S.happiness+S.energy+S.hunger+S.affection)/4;
  speak(pick(avg<38 ? MSG.sad : MSG.idle), 0);
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastTm = null;
function toast(text) {
  clearTimeout(toastTm);
  G.toast.textContent = text;
  G.toast.classList.add('show');
  toastTm = setTimeout(()=>G.toast.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════════════
   BURBUJA DE PENSAMIENTO
═══════════════════════════════════════════ */
function showThought(text, ttl=2200) {
  G.thoughtText.textContent = text;
  G.thought.classList.add('show');
  clearTimeout(thoughtTm);
  thoughtTm = setTimeout(()=>G.thought.classList.remove('show'), ttl);
}

/* ═══════════════════════════════════════════
   PARTÍCULAS
═══════════════════════════════════════════ */
function spawnFx(x, y, n=5) {
  for (let i=0;i<n;i++) {
    const el = document.createElement('span');
    el.className='click-p';
    el.textContent = pick(CLICK_FX);
    el.style.left = (x+rand(-35,35))+'px';
    el.style.top  = (y+rand(-20,20))+'px';
    el.style.animationDuration = rand(.5,.9)+'s';
    G.clickFx.appendChild(el);
    setTimeout(()=>el.remove(), 900);
  }
}

/* ═══════════════════════════════════════════
   CORAZONES FLOTANTES
═══════════════════════════════════════════ */
function spawnHeart() {
  const h = document.createElement('span');
  h.className = 'fheart';
  h.textContent = pick(HEARTS);
  h.style.left  = rand(5,90)+'vw';
  h.style.bottom= '-20px';
  h.style.fontSize = rand(.9,2)+'rem';
  const dur = rand(3.5,7);
  h.style.animationDuration = dur+'s';
  G.heartsLayer.appendChild(h);
  setTimeout(()=>h.remove(), dur*1000+200);
}
function startHearts() {
  stopHearts();
  for (let i=0;i<8;i++) setTimeout(spawnHeart, i*140);
  heartTimer = setInterval(spawnHeart, 600);
}
function stopHearts() { clearInterval(heartTimer); heartTimer=null; }

/* ═══════════════════════════════════════════
   CAÍDA DE OBJETO
═══════════════════════════════════════════ */
function dropFood(emoji='🍪') {
  G.dropItem.textContent = emoji;
  G.dropItem.classList.remove('falling');
  void G.dropItem.offsetWidth;
  G.dropItem.classList.add('falling');
  setTimeout(()=>G.dropItem.classList.remove('falling'), 950);
}

/* ═══════════════════════════════════════════
   ACCIONES
═══════════════════════════════════════════ */
function ifAwake(fn) {
  if (sleeping) { toast('Shhh… está durmiendo 🌙'); return; }
  fn();
}

function applyGain(gains) {
  Object.entries(gains).forEach(([k,v])=>{ S[k]=clamp(S[k]+v); });
}

/* Ripple visual en botón */
function addRipple(btn, e) {
  const r  = document.createElement('span');
  r.className = 'ripple';
  const rc = btn.getBoundingClientRect();
  const sz = Math.max(rc.width,rc.height);
  r.style.cssText=`width:${sz}px;height:${sz}px;
    left:${e.clientX-rc.left-sz/2}px;top:${e.clientY-rc.top-sz/2}px;`;
  btn.appendChild(r);
  setTimeout(()=>r.remove(),650);
}

function doAction(action, e) {
  ifAwake(()=>{
    const btn = document.querySelector(`.act[data-action="${action}"]`);
    if (btn && e) addRipple(btn, e);

    switch(action) {
      case 'feed':
        applyGain(GAIN.feed); dropFood('🍪');
        setAnim('bounce',700); speak(pick(MSG.feed));
        spawnFx(e.clientX,e.clientY,6); toast('+Hambre 🍪');
        break;
      case 'hug':
        applyGain(GAIN.hug);
        setAnim('petting',500); showThought('♡');
        speak(pick(MSG.hug)); spawnFx(e.clientX,e.clientY,7); toast('+Cariño 💕');
        break;
      case 'play':
        if (S.energy<12) { speak('Estoy muy cansada para jugar… 😴 ¡Déjame dormir!'); toast('Sin energía 😴'); return; }
        applyGain(GAIN.play); setAnim('bounce',700);
        speak(pick(MSG.play)); spawnFx(e.clientX,e.clientY,8); toast('+Felicidad ⭐');
        break;
      case 'sing':
        applyGain(GAIN.sing); setAnim('sing',2500); showThought('🎵');
        speak(pick(MSG.sing)); spawnFx(e.clientX,e.clientY,5); toast('+Felicidad 🎵');
        break;
      case 'bath':
        applyGain(GAIN.bath); setAnim('bounce',700); dropFood('🫧'); showThought('🛁');
        speak(pick(MSG.bath)); spawnFx(e.clientX,e.clientY,6); toast('+Cariño 🛁');
        break;
      case 'dance':
        if (S.energy<10) { speak('Estoy muy cansada para bailar… 😴'); toast('Sin energía 😴'); return; }
        applyGain(GAIN.dance); setAnim('dance',2500); showThought('💃');
        speak(pick(MSG.dance)); spawnFx(e.clientX,e.clientY,9); toast('+Felicidad 💃');
        break;
      case 'kiss':
        applyGain(GAIN.kiss); setAnim('petting',500); showThought('💋');
        for(let i=0;i<6;i++) setTimeout(spawnHeart,i*100);
        speak(pick(MSG.kiss)); spawnFx(e.clientX,e.clientY,8); toast('+Cariño 💋');
        break;
      case 'pet':
        applyGain(GAIN.pet); setAnim('petting',450); showThought(pick(['♡','🥰','uwu','(˘ω˘)']));
        speak(pick(MSG.pet)); spawnFx(e.clientX,e.clientY,4);
        break;
    }
    render(); save();
  });
}

/* ── Dormir ── */
function doSleep() {
  if (sleeping) { wakeUp(); return; }
  sleeping = true;
  lockBtns(true);
  G.btnSleep.querySelector('.act-e').textContent = '☀️';
  G.btnSleep.querySelector('.act-n').textContent = 'Despertar';
  setHoneyImage('sleeping');
  setAnim('sleep');
  speak(pick(MSG.sleep_start),0); toast('Buenas noches… 🌙'); save();

  let cycles=0;
  function cycle() {
    if(!sleeping) return;
    applyGain(GAIN.sleep); cycles++;
    renderBars(); save();
    if(cycles<5) sleepTimer=setTimeout(cycle,1200);
    else wakeUp();
  }
  sleepTimer=setTimeout(cycle,1200);
}
function wakeUp() {
  clearTimeout(sleepTimer); sleeping=false;
  lockBtns(false);
  G.btnSleep.querySelector('.act-e').textContent='🌙';
  G.btnSleep.querySelector('.act-n').textContent='Dormir';
  setAnim('bounce',700);
  speak(pick(MSG.wake)); toast('¡Buenos días! ☀️');
  render(); save();
}
function lockBtns(on) {
  [G.btnFeed,G.btnHug,G.btnPlay,G.btnSing,G.btnBath,G.btnDance,G.btnKiss]
    .forEach(b=>b.disabled=on);
}

/* Toque directo sobre la imagen */
function petHoney(e) {
  doAction('pet', e);
}

/* ═══════════════════════════════════════════
   NAVEGACIÓN DE PANELES
═══════════════════════════════════════════ */
function openPanel(panelId) {
  G.panels.forEach(p=>p.classList.remove('active'));
  G.navBtns.forEach(b=>b.classList.remove('active'));
  const panel = $(panelId);
  if (panel) panel.classList.add('active');
  const navBtn = document.querySelector(`[data-panel="${panelId}"]`);
  if (navBtn) navBtn.classList.add('active');
}

/* ═══════════════════════════════════════════
   MINI JUEGO
═══════════════════════════════════════════ */
function startMinigame() {
  if (mgRunning) return;
  mgRunning=true; mgScore=0; mgTime=15;
  G.mgScore.textContent='0';
  G.mgTimer.textContent='15s';
  G.btnMgStart.disabled=true;
  G.btnMgStart.textContent='🎮 Jugando…';
  G.mgIdleMsg.style.display='none';
  G.mgArena.querySelectorAll('.mg-star').forEach(s=>s.remove());

  // countdown
  const cd = setInterval(()=>{
    mgTime--;
    G.mgTimer.textContent=mgTime+'s';
    if(mgTime<=0) { clearInterval(cd); endMinigame(); }
  },1000);

  // spawn estrellas
  spawnMgStar();
  mgSpawn=setInterval(spawnMgStar,800);
}

function spawnMgStar() {
  if(!mgRunning) return;
  const star = document.createElement('div');
  star.className='mg-star';
  star.textContent=pick(['⭐','🌟','✨','💫']);
  star.style.left=rand(4,82)+'%';
  star.style.top =rand(15,72)+'%';
  G.mgArena.appendChild(star);
  const kill=setTimeout(()=>star.remove(),1900);
  star.addEventListener('click',e=>{
    e.stopPropagation();
    if(!mgRunning) return;
    clearTimeout(kill);
    star.classList.add('caught');
    mgScore++;
    G.mgScore.textContent=mgScore;
    spawnFx(e.clientX,e.clientY,3);
    setTimeout(()=>star.remove(),300);
  },{once:true});
}

function endMinigame() {
  mgRunning=false;
  clearInterval(mgSpawn);
  G.mgArena.querySelectorAll('.mg-star').forEach(s=>s.remove());
  const bonus=Math.min(mgScore*2,40);
  S.happiness=clamp(S.happiness+bonus);
  S.energy   =clamp(S.energy   -Math.min(mgScore,15));
  renderBars(); save();
  G.btnMgStart.disabled=false;
  G.btnMgStart.textContent='🎮 ¡Otra vez!';
  G.mgIdleMsg.style.display='';
  G.mgIdleMsg.textContent=`¡Fin! ${mgScore} ⭐ → +${bonus} felicidad`;
  if(mgScore>=10) {
    speak(`¡Wow! ¡${mgScore} estrellas! ¡Eres increíble! ⭐✨`);
    for(let i=0;i<10;i++) setTimeout(spawnHeart,i*100);
  } else if(mgScore>=5) {
    speak(`¡Bien! ¡Atrapaste ${mgScore} estrellas! ⭐`);
  } else {
    speak(`¡${mgScore} estrellitas… ¡la próxima mejor! 🌟`);
  }
  toast(`+${bonus} felicidad 🌟`); render();
}

/* ═══════════════════════════════════════════
   CARTITAS DE SILVER
═══════════════════════════════════════════ */
function readLetter() {
  const {item:l, idx} = pickNoRep(LETTERS, lastLetter);
  lastLetter=idx;
  G.letterText.textContent=l.text;
  G.letterSig.textContent =l.sig;
  const env=G.envelope;
  if (!env.classList.contains('open')) {
    env.classList.add('open');
  } else {
    env.style.opacity='0';
    setTimeout(()=>{ env.style.opacity=''; },220);
  }
  showThought('💌');
  speak('Una cartita de Silver… ♡',5000);
}

/* ═══════════════════════════════════════════
   DECAIMIENTO
═══════════════════════════════════════════ */
function decay() {
  if(sleeping) return;
  S.happiness=clamp(S.happiness-DECAY.happiness);
  S.energy   =clamp(S.energy   -DECAY.energy);
  S.hunger   =clamp(S.hunger   -DECAY.hunger);
  S.affection=clamp(S.affection-DECAY.affection);
  render(); save();
  if(S.hunger<22)    { speak('Tengo hambre… ¿me das una galletita? 🍪',5500); return; }
  if(S.energy<20)    { speak('Estoy muy cansada… ¿dormimos? 😴',5500); return; }
  if(S.happiness<22) { speak('Me siento un poquito triste… 🥺 ¿jugamos?',5500); return; }
  if(S.affection<20) { speak('Necesito un abracito, Honey… 💕',5500); return; }
}

/* ═══════════════════════════════════════════
   BIENVENIDA
═══════════════════════════════════════════ */
function welcomeMsg() {
  const h=new Date().getHours();
  let g;
  if(h>=5&&h<12)       g='¡Buenos días, Honey! ☀️ Te estaba esperando ♥';
  else if(h>=12&&h<18) g='¡Buenas tardes, Honey! ☁️ Te estaba esperando ♥';
  else if(h>=18&&h<22) g='¡Buenas noches, Honey! 🌙 Te estaba esperando ♥';
  else                  g='¡Hola Honey! Es tarde, pero me alegra verte ♥';
  speak(g,7000);
}

/* ═══════════════════════════════════════════
   EVENTOS
═══════════════════════════════════════════ */
function bindEvents() {
  /* Acciones */
  document.querySelectorAll('.act[data-action]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const a=btn.dataset.action;
      if(a==='sleep') doSleep();
      else doAction(a,e);
    });
  });

  /* Toque directo sobre Honey */
  G.honeyImg.addEventListener('click', petHoney);

  /* Navegación */
  G.navBtns.forEach(btn=>{
    btn.addEventListener('click',()=>openPanel(btn.dataset.panel));
  });

  /* Mini juego */
  G.btnMgStart.addEventListener('click', startMinigame);

  /* Cartitas */
  G.btnLetter.addEventListener('click', readLetter);

  /* Guardar al salir */
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });
  window.addEventListener('beforeunload', save);

  /* Pensamiento aleatorio al tocar Honey */
  G.honeyImg.addEventListener('touchstart',e=>{
    e.preventDefault();
    const t=e.changedTouches[0];
    petHoney({clientX:t.clientX, clientY:t.clientY});
  },{passive:false});
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init() {
  load();
  render();
  setAnim('idle');
  openPanel('panel-actions');
  bindEvents();
  welcomeMsg();

  setInterval(decay,     DECAY_MS);
  setInterval(speakIdle, 32000);
  setInterval(()=>{ if(!sleeping&&Math.random()<.3) showThought(pick(THOUGHTS)); }, 10000);
  setInterval(save, 60000);

  console.log("🐾 Honeyroll listo con todo el cariño ♥");
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
} else { init(); }
