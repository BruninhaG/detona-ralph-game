/* script.js - lógica do jogo, sons via WebAudio API (sem arquivos externos) */
const grid = document.getElementById('grid');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const durationInput = document.getElementById('duration');
const template = document.getElementById('window-template');

let windows = [];
let activeIndex = -1;
let score = 0;
let timeLeft = 60;
let gameInterval = null;
let spawnInterval = 1000;
let timerInterval = null;
let level = 1;
let audioCtx = null;
let bgOsc = null;
let running = false;

// create 3x3 windows
for(let i=0;i<9;i++){
  const node = template.content.cloneNode(true);
  const element = node.querySelector('.window');
  element.dataset.index = i;
  grid.appendChild(node);
}
windows = Array.from(document.querySelectorAll('.window'));

// helper - play short tone
function playTone(freq=440, duration=0.08, type='sine', gain=0.08){
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// background "music" (simple)
function startBackground(){
  if(!audioCtx) return;
  if(bgOsc) return;
  bgOsc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 110;
  g.gain.value = 0.0035;
  bgOsc.connect(g);
  g.connect(audioCtx.destination);
  bgOsc.start();
}

// stop background
function stopBackground(){
  if(bgOsc){ try{ bgOsc.stop(); }catch(e){} bgOsc=null; }
}

// spawn ralph in a random window
function spawn(){
  const idx = Math.floor(Math.random()*windows.length);
  // clear previous
  if(activeIndex >=0) windows[activeIndex].classList.remove('active');
  activeIndex = idx;
  windows[activeIndex].classList.add('active');

  // disappear after a short time
  const visibleFor = Math.max(350, spawnInterval - 120*Math.random()*level);
  setTimeout(()=>{
    if(windows[activeIndex]) windows[activeIndex].classList.remove('active');
    activeIndex = -1;
  }, visibleFor);
}

// handle click
grid.addEventListener('click', (ev)=>{
  // ensure audio context started on first interaction
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); startBackground(); }
  const r = ev.target.closest('.window');
  if(!r) return;
  const idx = Number(r.dataset.index);
  if(r.classList.contains('active')){
    // hit
    score += 10 * level;
    scoreDisplay.textContent = score;
    level = 1 + Math.floor(score / 200);
    levelDisplay.textContent = level;
    // visual feedback
    const ralph = r.querySelector('.ralph');
    ralph.classList.add('hit');
    setTimeout(()=>ralph.classList.remove('hit'),140);
    playTone(900 + Math.random()*300, 0.06, 'square', 0.09);
    // make next spawn slightly faster
    spawnInterval = Math.max(380, spawnInterval - 12);
  } else {
    // miss
    score = Math.max(0, score - 2);
    scoreDisplay.textContent = score;
    playTone(180, 0.08, 'sawtooth', 0.06);
  }
});

// start game
function startGame(){
  if(running) return;
  running = true;
  score = 0;
  scoreDisplay.textContent = 0;
  level = 1;
  levelDisplay.textContent = 1;

  timeLeft = Math.max(5, Number(durationInput.value) || 60);
  timeDisplay.textContent = timeLeft;
  spawnInterval = 900;

  // initialize audio ctx at gesture if needed
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); startBackground(); }

  // spawn loop
  gameInterval = setInterval(spawn, spawnInterval);
  // dynamic adjust spawn interval to match level
  timerInterval = setInterval(()=>{
    timeLeft -= 1;
    timeDisplay.textContent = timeLeft;
    if(timeLeft <= 0){
      endGame();
    }
  }, 1000);

  startBtn.disabled = true;
  restartBtn.disabled = false;
}

// end game
function endGame(){
  running = false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  // clear any active
  if(activeIndex>=0) windows[activeIndex].classList.remove('active');
  activeIndex = -1;
  stopBackground();
  // final sound
  playTone(220, 0.35, 'sine', 0.12);
  // show result
  setTimeout(()=>alert('Tempo esgotado! Sua pontuação: ' + score), 80);
  startBtn.disabled = false;
  restartBtn.disabled = true;
}

// restart
function restartGame(){
  endGame();
  // reset values
  score = 0;
  scoreDisplay.textContent = score;
  timeLeft = Number(durationInput.value) || 60;
  timeDisplay.textContent = timeLeft;
  spawnInterval = 900;
  startGame();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// allow pressing Enter to start
durationInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') startGame(); });

