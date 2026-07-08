/* ---------------------------------------------------------
   Reelmind demo logic.
   REAL: file handling, video playback, frame-capture thumbnails,
   caption sync, aspect-ratio crop previews — all run on your
   actual uploaded video, client-side.
   SIMULATED: the cut plan, scores, chat replies, captions text,
   and B-roll/SEO suggestions — scripted to demonstrate the
   product logic. Swap the marked functions for real API calls,
   see README.md.
--------------------------------------------------------- */

// ---------- Hero waveform decoration ----------
(function buildWaveform(){
  const el = document.getElementById('waveform');
  const bars = Array.from({length:80}, () => 15 + Math.random()*85);
  el.innerHTML = bars.map(h => `<span style="height:${h}%"></span>`).join('');
})();

// ---------- State ----------
const state = {
  fileName: null,
  fileURL: null,
  duration: 0,
  refAdded: false,
  goal: 'Talking Head',
  style: 'Fast & punchy',
  thumbnails: [],
  captionStyle: { position:'bottom', weight:'bold', color:'#4F46E5' },
  brollInserted: false,
};

function showStep(name){
  document.querySelectorAll('.wb-step').forEach(el => el.classList.toggle('hidden', el.dataset.step !== name));
  document.getElementById('wbShell').scrollIntoView({behavior:'smooth', block:'start'});
}

// ---------- Step 1: Upload (real file) ----------
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const refStatus = document.getElementById('refStatus');

document.getElementById('chooseFileBtn').addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', e => { if(e.target.id !== 'chooseFileBtn') fileInput.click(); });
['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) handleFile(f); });
fileInput.addEventListener('change', e => { const f = e.target.files[0]; if(f) handleFile(f); });

function handleFile(file){
  state.fileName = file.name;
  state.fileURL = URL.createObjectURL(file);
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
document.getElementById('startAnalysis').addEventListener('click', () => { showStep('analysis'); runAnalysis(); });

// ---------- Step 3: Simulated analysis log ----------
const ANALYSIS_STEPS = [
  'Reading video metadata and duration…',
  'Transcribing audio track…',
  'Detecting silence, filler words, and false starts…',
  'Mapping speaker energy and topic changes…',
  'Locating the strongest opening for the hook…',
  'Building the edit plan…',
  'Capturing candidate thumbnail frames…',
  'Generating captions and choosing a style…',
  'Selecting music and setting ducking levels…',
  'Scoring the draft for retention and pacing…',
];

function runAnalysis(){
  const log = document.getElementById('analysisLog');
  const fill = document.getElementById('progressFill');
  log.innerHTML = ''; fill.style.width = '0%';

  // Read real duration while the log plays.
  const probe = document.createElement('video');
  probe.src = state.fileURL;
  probe.addEventListener('loadedmetadata', () => { state.duration = probe.duration || 60; });

  ANALYSIS_STEPS.forEach((text, i) => {
    setTimeout(() => {
      const tc = String(i * 4).padStart(2,'0');
      const line = document.createElement('div');
      line.className = 'line';
      line.innerHTML = `<span class="tc">00:${tc}</span>${text}`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
      fill.style.width = `${((i+1)/ANALYSIS_STEPS.length)*100}%`;
      if(i > 0) log.children[i-1].classList.add('done');
      if(i === ANALYSIS_STEPS.length - 1) setTimeout(buildResults, 700);
    }, i * 460);
  });
}

// ---------- Step 4: Results ----------
async function buildResults(){
  showStep('results');

  const mainVideo = document.getElementById('mainVideo');
  mainVideo.src = state.fileURL;
  await new Promise(res => {
    if(mainVideo.readyState >= 1) return res();
    mainVideo.addEventListener('loadedmetadata', res, {once:true});
  });
  if(!state.duration) state.duration = mainVideo.duration || 60;

  buildScorebar();
  buildTimeline();
  buildCaptions();
  buildBroll();
  buildSeo();
  setupExportPreview();
  resetChat();

  // Real thumbnails — captured from the actual video, not simulated.
  document.getElementById('thumbGrid').innerHTML = `<div class="thumb-placeholder">Capturing real frames from your video…</div>`;
  state.thumbnails = await generateThumbnails(state.fileURL, state.duration, 6);
  renderThumbnails();
}

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function fmtTime(sec){
  sec = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
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
  {type:'keep', label:'HOOK', frac:0.14},
  {type:'trim', label:'TRIM', frac:0.06},
  {type:'keep', label:'STORY', frac:0.20},
  {type:'keep', label:'STORY', frac:0.10},
  {type:'keep', label:'STORY', frac:0.18},
  {type:'trim', label:'TRIM', frac:0.05},
  {type:'keep', label:'PAYOFF', frac:0.16},
  {type:'keep', label:'CTA', frac:0.11},
];

function buildTimeline(){
  const mainVideo = document.getElementById('mainVideo');
  let cursor = 0;
  const el = document.getElementById('timeline');
  el.innerHTML = TIMELINE_TEMPLATE.map((c,i) => {
    const start = cursor * state.duration;
    cursor += c.frac;
    const cls = state.brollInserted && i === 3 ? 'broll' : c.type;
    return `<div class="clip ${cls}" style="width:${c.frac*100}%" data-start="${start}">${c.label}</div>`;
  }).join('');
  el.querySelectorAll('.clip').forEach(clip => {
    clip.addEventListener('click', () => { mainVideo.currentTime = parseFloat(clip.dataset.start); mainVideo.play(); });
  });
}

// ---------- Real thumbnail capture ----------
function generateThumbnails(url, duration, count){
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.src = url; v.muted = true; v.preload = 'auto';
    const canvas = document.createElement('canvas');
    const times = Array.from({length:count}, (_,k) => Math.min(duration - 0.2, (duration*(k+1))/(count+1)));
    const thumbs = [];
    let i = 0;
    function seekNext(){
      if(i >= times.length){ resolve(thumbs); return; }
      v.currentTime = Math.max(0, times[i]);
    }
    v.addEventListener('loadeddata', seekNext, {once:true});
    v.addEventListener('seeked', () => {
      canvas.width = v.videoWidth || 320;
      canvas.height = v.videoHeight || 180;
      const ctx = canvas.getContext('2d');
      try{
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        thumbs.push({ time: times[i], src: canvas.toDataURL('image/jpeg', 0.72) });
      }catch(err){ /* some browsers restrict certain codecs — skip silently */ }
      i++;
      seekNext();
    });
    v.addEventListener('error', () => resolve(thumbs));
    setTimeout(() => resolve(thumbs), 8000); // safety timeout
  });
}

function renderThumbnails(){
  const grid = document.getElementById('thumbGrid');
  if(!state.thumbnails.length){
    grid.innerHTML = `<div class="thumb-placeholder">Couldn't capture frames from this file format — try an MP4.</div>`;
    return;
  }
  grid.innerHTML = state.thumbnails.map((t,i) =>
    `<img src="${t.src}" data-time="${t.time}" data-i="${i}" title="${fmtTime(t.time)} — click to preview + set as cover">`
  ).join('');
  grid.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', () => {
      grid.querySelectorAll('img').forEach(x => x.classList.remove('selected'));
      img.classList.add('selected');
      const mainVideo = document.getElementById('mainVideo');
      mainVideo.currentTime = parseFloat(img.dataset.time);
    });
  });
}

// ---------- Captions (synced to real playback, text is a scripted demo) ----------
const CAPTION_LINES = [
  "This is where your dialogue would appear as animated captions.",
  "Each line is timed to your actual audio in a production build.",
  "Keywords like this get auto-highlighted.",
  "Word-by-word or line-by-line — your choice.",
  "Captions restyle instantly from the panel on the right.",
];
function buildCaptions(){
  const mainVideo = document.getElementById('mainVideo');
  const overlay = document.getElementById('captionOverlay');
  const segLen = state.duration / CAPTION_LINES.length;
  mainVideo.addEventListener('timeupdate', () => {
    const idx = Math.min(CAPTION_LINES.length - 1, Math.floor(mainVideo.currentTime / segLen));
    overlay.textContent = CAPTION_LINES[idx];
    overlay.style.color = state.captionStyle.color;
  });
  applyCaptionStyle();
}
function applyCaptionStyle(){
  const overlay = document.getElementById('captionOverlay');
  overlay.classList.toggle('pos-center', state.captionStyle.position === 'center');
  overlay.classList.toggle('weight-normal', state.captionStyle.weight === 'normal');
}
function bindSegControl(id, onChange){
  document.getElementById(id).addEventListener('click', e => {
    if(e.target.tagName !== 'BUTTON') return;
    [...e.currentTarget.children].forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    onChange(e.target.dataset.val);
  });
}
bindSegControl('capPosition', v => { state.captionStyle.position = v; applyCaptionStyle(); });
bindSegControl('capWeight', v => { state.captionStyle.weight = v; applyCaptionStyle(); });
document.getElementById('capColor').addEventListener('click', e => {
  if(!e.target.classList.contains('swatch')) return;
  [...e.currentTarget.children].forEach(s => s.classList.remove('active'));
  e.target.classList.add('active');
  state.captionStyle.color = e.target.dataset.val;
});

// ---------- B-roll suggestions ----------
const BROLL_ICONS = {
  wide: '⛶', closeup: '◎', product: '▣', bcam: '⧉',
};
function brollSuggestions(){
  const base = {
    'Talking Head': [['closeup','Reaction close-up','on the punchline at 00:41'],['bcam','B-cam angle switch','to break up a long static shot'],['product','Screen/graphic insert','while you reference a stat']],
    'Vlog': [['wide','Wide establishing shot','to open the new location'],['closeup','Detail insert','of what you are describing'],['bcam','Walking B-roll','under the voiceover section']],
    'Tutorial': [['product','Screen recording insert','while you explain the steps'],['closeup','Hands/detail close-up','for the demo moment'],['wide','Before/after wide shot','to bookend the result']],
    'Podcast Clip': [['bcam','Guest reaction cutaway','while the host is talking'],['product','Quote card overlay','on the key soundbite'],['closeup','Push-in on speaker','at the emotional beat']],
    'Review': [['product','Product close-up','while you list specs'],['wide','Unboxing wide shot','at the start'],['closeup','Detail insert','on the flaw you mention']],
  };
  return base[state.goal] || base['Talking Head'];
}
function buildBroll(){
  const list = brollSuggestions();
  document.getElementById('brollList').innerHTML = list.map(([icon,title,sub],i) => `
    <div class="broll-card">
      <div class="broll-icon">${BROLL_ICONS[icon]}</div>
      <div class="broll-meta"><strong>${title}</strong><span>${sub}</span></div>
      <button data-i="${i}">Insert</button>
    </div>`).join('');
  document.querySelectorAll('.broll-card button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? 'Inserted ✓' : 'Insert';
      state.brollInserted = document.querySelectorAll('.broll-card button.active').length > 0;
      buildTimeline();
    });
  });
}

// ---------- Title & SEO ----------
const SEO_TITLES = {
  'Talking Head': ["I Tried This for 30 Days (Here's What Happened)", "The Truth Nobody Tells You About This", "Why I Almost Quit — Then This Happened"],
  'Vlog': ["A Day in My Life (It Got Chaotic)", "This Trip Didn't Go as Planned", "Come With Me — Real, Unfiltered Day"],
  'Tutorial': ["The Beginner's Guide Nobody Wrote", "Do This Before You Start (Step by Step)", "Stop Doing It Wrong — Full Walkthrough"],
  'Podcast Clip': ["The Moment the Whole Room Went Silent", "This Answer Changed My Mind Completely", "The Clip Everyone's Talking About"],
  'Review': ["I Used It for a Month — Honest Review", "Is It Actually Worth It? Full Breakdown", "The Review They Didn't Want Me to Post"],
};
function buildSeo(){ regenerateSeo(); }
function regenerateSeo(){
  const titles = SEO_TITLES[state.goal] || SEO_TITLES['Talking Head'];
  const title = titles[rand(0, titles.length-1)];
  document.getElementById('seoTitle').textContent = title;
  document.getElementById('seoDesc').textContent =
    `In this ${state.goal.toLowerCase()} video, I break down exactly what happened and why it matters. ` +
    `Edited with a ${state.style.toLowerCase()} pace. Watch to the end for the payoff — let me know your take in the comments.`;
  const tagPool = ['#' + state.goal.replace(/\s+/g,''), '#youtube', '#storytime', '#behindthescenes', '#creator', '#2026'];
  document.getElementById('seoTags').textContent = tagPool.join(' ');
}
document.getElementById('seoRegen').addEventListener('click', regenerateSeo);

// ---------- Export / aspect-ratio preview (real crop of your video) ----------
function setupExportPreview(){
  const cropVideo = document.getElementById('cropVideo');
  cropVideo.src = state.fileURL;
  const mainVideo = document.getElementById('mainVideo');
  cropVideo.addEventListener('loadedmetadata', () => { cropVideo.currentTime = mainVideo.currentTime || 1; });
  mainVideo.addEventListener('play', () => { cropVideo.currentTime = mainVideo.currentTime; cropVideo.play().catch(()=>{}); });
  mainVideo.addEventListener('pause', () => cropVideo.pause());
  mainVideo.addEventListener('seeked', () => { cropVideo.currentTime = mainVideo.currentTime; });

  bindSegControl('ratioControl', v => {
    document.getElementById('ratioPreview').dataset.ratio = v;
  });
  document.getElementById('ratioPreview').dataset.ratio = '16-9';

  document.querySelectorAll('.platform-row button').forEach(btn => {
    btn.addEventListener('click', () => showToast(`Export queued for ${btn.dataset.platform}. Wire this to a render backend — see README.md.`));
  });
}

function showToast(text){
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 4000);
}

// ---------- Tabs ----------
document.getElementById('tabbar').addEventListener('click', e => {
  if(!e.target.classList.contains('tab')) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelector(`.tab-pane[data-pane="${e.target.dataset.tab}"]`).classList.add('active');
});

// ---------- Chat refinement ----------
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSuggestions = document.getElementById('chatSuggestions');
const SUGGESTIONS = ['Cut the intro shorter', 'Fewer zooms', 'Make pacing faster', 'Use my Creator DNA style'];

function resetChat(){
  chatLog.innerHTML = '';
  addMessage('ai', `First pass is done — check the scores above, scrub the timeline, or open the other tabs for captions, B-roll, thumbnails, SEO, and export. Tell me what to change here.`);
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
  setTimeout(() => respondToRefinement(text), 450);
});
function addMessage(role, text){
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function respondToRefinement(text){
  const t = text.toLowerCase();
  let reply, action;
  if(t.includes('zoom')){
    reply = "Cut zoom frequency by about half — keeping them only on the two punchlines.";
    action = () => bump('Pacing', -1);
  } else if(t.includes('fast') || t.includes('faster') || t.includes('pace')){
    reply = "Tightened pauses across the middle section and trimmed two more slow stretches.";
    action = () => bump('Pacing', 4);
  } else if(t.includes('intro') || t.includes('hook')){
    reply = "Shortened the hook and moved straight into the story. Hook score updated.";
    action = () => bump('Hook', 3);
  } else if(t.includes('dna') || t.includes('style') || t.includes('like my')){
    reply = state.refAdded ? "Matched cut rhythm, captions, and music to your reference video." : "I don't have a reference video yet — add one in the upload step and I'll match its rhythm, captions, and music.";
    action = () => bump('Retention', 2);
  } else if(t.includes('caption') || t.includes('subtitle')){
    reply = "Opened the Captions tab for you — try the position, weight, and color controls.";
    document.querySelector('.tab[data-tab="captions"]').click();
  } else if(t.includes('broll') || t.includes('b-roll')){
    reply = "Opened B-roll suggestions — insert the ones that fit.";
    document.querySelector('.tab[data-tab="broll"]').click();
  } else if(t.includes('music')){
    reply = "Swapped the background track and adjusted ducking so it sits under your voice more.";
    action = () => bump('Audio', 2);
  } else if(t.includes('why')){
    reply = "The plan prioritizes keeping energy high and trimming pauses over trimming content — that's why the hook and payoff segments stayed full length.";
  } else {
    reply = "Got it — applied that and re-scored the draft. Anything else?";
  }
  addMessage('ai', reply);
  if(action) action();
}
function bump(label, delta){
  const pill = [...document.querySelectorAll('.score-pill')].find(p => p.querySelector('.label').textContent === label);
  if(!pill) return;
  const valueEl = pill.querySelector('.value');
  let val = Math.max(0, Math.min(99, parseInt(valueEl.textContent,10) + delta));
  valueEl.textContent = val;
}

// ---------- Restart ----------
document.getElementById('restartBtn').addEventListener('click', () => {
  if(state.fileURL) URL.revokeObjectURL(state.fileURL);
  Object.assign(state, { fileName:null, fileURL:null, duration:0, refAdded:false, thumbnails:[], brollInserted:false });
  refStatus.textContent = '';
  fileInput.value = '';
  showStep('upload');
});
