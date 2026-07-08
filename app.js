/* ---------------------------------------------------------
   Reelmind demo logic.
   Everything here is SIMULATED on the client so the full
   product flow is walkable with no backend. Swap the marked
   functions for real API calls — see README.md.
--------------------------------------------------------- */

// ---------- Filmstrip hero decoration ----------
(function buildFilmstrip(){
  const track = document.getElementById('filmstripTrack');
  const codes = ['A001','A002','A003','B014','B015','C002','C003','C004','D011','D012'];
  const frames = [...codes, ...codes]; // duplicate for seamless loop
  track.innerHTML = frames.map(c => `<div class="frame">${c}</div>`).join('');
})();

// ---------- State ----------
const state = {
  fileName: null,
  refAdded: false,
  goal: 'Talking Head',
  style: 'Fast & punchy',
};

// ---------- Step navigation ----------
function showStep(name){
  document.querySelectorAll('.wb-step').forEach(el => {
    el.classList.toggle('hidden', el.dataset.step !== name);
  });
  document.getElementById('wbShell').scrollIntoView({behavior:'smooth', block:'start'});
}

// ---------- Step 1: Upload ----------
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const chooseFileBtn = document.getElementById('chooseFileBtn');
const refBtn = document.getElementById('refStatus') ? document.getElementById('refBtn') : null;
const refStatus = document.getElementById('refStatus');

chooseFileBtn.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', (e) => { if(e.target === chooseFileBtn) return; fileInput.click(); });

['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.add('drag');
}));
['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.remove('drag');
}));
dropzone.addEventListener('drop', e => {
  const f = e.dataTransfer.files[0];
  if(f) handleFile(f);
});
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if(f) handleFile(f);
});

function handleFile(file){
  state.fileName = file.name;
  document.getElementById('fileNameLabel').textContent = `"${file.name}"`;
  showStep('style');
}

document.getElementById('refBtn').addEventListener('click', () => {
  state.refAdded = true;
  refStatus.textContent = '1 reference video added — style will be matched to it';
});

// ---------- Step 2: Goal + style ----------
document.getElementById('goalChips').addEventListener('click', e => {
  if(!e.target.classList.contains('chip')) return;
  [...e.currentTarget.children].forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  state.goal = e.target.dataset.goal;
});
document.getElementById('styleChips').addEventListener('click', e => {
  if(!e.target.classList.contains('chip')) return;
  [...e.currentTarget.children].forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  state.style = e.target.dataset.style;
});
document.getElementById('startAnalysis').addEventListener('click', () => {
  showStep('analysis');
  runAnalysis();
});

// ---------- Step 3: Simulated analysis ----------
// Replace this with real calls to your transcription / vision / LLM pipeline.
const ANALYSIS_STEPS = [
  'Transcribing audio track…',
  'Detecting silence, filler words, and false starts…',
  'Mapping speaker energy and topic changes…',
  'Locating the strongest 8 seconds for the hook…',
  'Building the edit plan…',
  'Applying cuts and re-timing pacing…',
  'Generating word-by-word subtitles…',
  'Selecting music and setting ducking levels…',
  'Color balancing and grading…',
  'Scoring the draft for retention and pacing…',
];

function runAnalysis(){
  const log = document.getElementById('analysisLog');
  const fill = document.getElementById('progressFill');
  log.innerHTML = '';
  fill.style.width = '0%';

  ANALYSIS_STEPS.forEach((text, i) => {
    setTimeout(() => {
      const tc = String(i * 4).padStart(2,'0');
      const line = document.createElement('div');
      line.className = 'line';
      line.style.animationDelay = '0ms';
      line.innerHTML = `<span class="tc">00:${tc}</span>${text}`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
      fill.style.width = `${((i+1)/ANALYSIS_STEPS.length)*100}%`;

      if(i > 0){
        log.children[i-1].classList.add('done');
      }
      if(i === ANALYSIS_STEPS.length - 1){
        setTimeout(buildResults, 700);
      }
    }, i * 480);
  });
}

// ---------- Step 4: Results ----------
function buildResults(){
  showStep('results');
  buildScorebar();
  buildTimeline();
  buildRationale();
  resetChat();
}

function buildScorebar(){
  const scores = [
    {label:'Hook', value: rand(78,96)},
    {label:'Pacing', value: rand(75,94)},
    {label:'Retention', value: rand(70,92)},
    {label:'Audio', value: rand(85,98)},
  ];
  document.getElementById('scorebar').innerHTML = scores.map(s =>
    `<div class="score-pill"><span class="label">${s.label}</span><span class="value">${s.value}</span></div>`
  ).join('');
}

const TIMELINE_TEMPLATE = [
  {type:'keep', label:'HOOK', width:14},
  {type:'trim', label:'TRIM', width:6},
  {type:'keep', label:'STORY', width:20},
  {type:'broll', label:'B-ROLL', width:10},
  {type:'keep', label:'STORY', width:18},
  {type:'trim', label:'TRIM', width:5},
  {type:'keep', label:'PAYOFF', width:16},
  {type:'keep', label:'CTA', width:11},
];

function buildTimeline(){
  document.getElementById('timeline').innerHTML = TIMELINE_TEMPLATE.map(c =>
    `<div class="clip ${c.type}" style="width:${c.width}%">${c.label}</div>`
  ).join('');
}

const RATIONALE_TEMPLATE = [
  {tc:'00:00', text:'Kept the first 8s as the hook — highest energy and a clear promise to the viewer.'},
  {tc:'00:14', text:'Removed 11s of a repeated sentence and a long pause before the second point.'},
  {tc:'00:41', text:'Inserted a B-roll slot — the topic changes but the camera doesn\u2019t, so a cutaway keeps it visual.'},
  {tc:'01:22', text:'Sped up a slow explanation slightly to hold pacing without losing clarity.'},
  {tc:'02:05', text:'Kept the story beat at full length — energy and specificity were both high here.'},
];

function buildRationale(){
  document.getElementById('rationaleList').innerHTML = RATIONALE_TEMPLATE.map(r =>
    `<li><span class="tc">${r.tc}</span><span>${r.text}</span></li>`
  ).join('');
}

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

// ---------- Chat refinement ----------
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSuggestions = document.getElementById('chatSuggestions');

const SUGGESTIONS = [
  'Cut the intro shorter',
  'Fewer zooms',
  'Make pacing faster',
  'Use my Creator DNA style',
];

function resetChat(){
  chatLog.innerHTML = '';
  addMessage('ai', `First pass is done — hook, pacing, and retention scores are up there. Tell me what to change, or ask why I made a specific cut.`);
  chatSuggestions.innerHTML = SUGGESTIONS.map(s => `<span class="suggestion">${s}</span>`).join('');
}

chatSuggestions.addEventListener('click', e => {
  if(!e.target.classList.contains('suggestion')) return;
  chatInput.value = e.target.textContent;
  chatForm.dispatchEvent(new Event('submit'));
});

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if(!text) return;
  addMessage('user', text);
  chatInput.value = '';
  setTimeout(() => respondToRefinement(text), 500);
});

function addMessage(role, text){
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Rule-based demo responses. Swap this for a real LLM call — see README.md.
function respondToRefinement(text){
  const t = text.toLowerCase();
  let reply, action;

  if(t.includes('zoom')){
    reply = "Cut zoom frequency by about half — keeping them only on the two punchlines. Timeline and scores updated.";
    action = () => bump('Pacing', -1);
  } else if(t.includes('fast') || t.includes('faster') || t.includes('pace')){
    reply = "Tightened pauses across the middle section and trimmed two more slow stretches. That should feel noticeably quicker.";
    action = () => bump('Pacing', 4);
  } else if(t.includes('intro') || t.includes('hook')){
    reply = "Shortened the hook to the first 5 seconds and moved straight into the story. Hook score updated.";
    action = () => bump('Hook', 3);
  } else if(t.includes('dna') || t.includes('style') || t.includes('like my')){
    reply = state.refAdded
      ? "Matched cut rhythm, subtitle style, and music choice to your reference video."
      : "I don't have a reference video yet — add one in the upload step and I'll match its rhythm, subtitles, and music choice.";
    action = () => bump('Retention', 2);
  } else if(t.includes('subtitle') || t.includes('caption')){
    reply = "Restyled the subtitles — bold, word-by-word, positioned lower third.";
  } else if(t.includes('music')){
    reply = "Swapped the background track and adjusted ducking so it sits under your voice more.";
    action = () => bump('Audio', 2);
  } else if(t.includes('why')){
    reply = "The cuts prioritize keeping energy high and removing anything that repeats a point already made — I favor trimming pauses over trimming content.";
  } else {
    reply = "Got it — applied that change and re-scored the draft. Anything else you want adjusted?";
  }

  addMessage('ai', reply);
  if(action) action();
}

function bump(label, delta){
  const pills = [...document.querySelectorAll('.score-pill')];
  const pill = pills.find(p => p.querySelector('.label').textContent === label);
  if(!pill) return;
  const valueEl = pill.querySelector('.value');
  let val = parseInt(valueEl.textContent, 10) + delta;
  val = Math.max(0, Math.min(99, val));
  valueEl.textContent = val;
}

// ---------- Export + restart ----------
document.getElementById('exportBtn').addEventListener('click', () => {
  addMessage('ai', 'Export queued at 1080p for YouTube. In a real deployment this triggers a render job on your backend.');
});
document.getElementById('restartBtn').addEventListener('click', () => {
  state.fileName = null;
  state.refAdded = false;
  refStatus.textContent = '';
  fileInput.value = '';
  showStep('upload');
});
