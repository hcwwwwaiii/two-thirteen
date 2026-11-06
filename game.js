/* Browser presentation. Story state and input rules live in engine.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SAVE = 'two-thirteen-chapter-one-v1';
  const SOUND = 'two-thirteen-sound';
  let game = new TwoThirteen.Game();
  let transcript = [];
  let pending = [];
  let active = false;
  let sound = false;
  let context;
  let history = [];
  let historyIndex = 0;
  let draft = '';
  let storageAvailable = true;
  try { sound = localStorage.getItem(SOUND) === 'on'; } catch { storageAvailable = false; }
  function storageWarning() {
    $('storage-error').hidden = false;
    $('storage-error').textContent = 'This browser could not save your progress. Keep this tab open to continue playing.';
    $('save-status').textContent = 'Progress is not being saved.';
  }
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ state: game.snapshot(), transcript: transcript.slice(-400), pending }));
      $('storage-error').hidden = true;
      storageAvailable = true;
      $('save-status').textContent = 'Progress saved on this computer.';
    } catch { storageAvailable = false; storageWarning(); }
  }
  function resume() {
    try {
      const raw = localStorage.getItem(SAVE);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      const validEntry = x => x && typeof x.text === 'string' && x.text.length < 12000 && ['story','command','location','voice','message','sound','pain','ending'].includes(x.kind) && (x.cue == null || ['knock','phone','step','click','ache','water','end'].includes(x.cue));
      const savedPending = saved.pending === undefined ? [] : saved.pending;
      if (!TwoThirteen.valid(saved.state) || !Array.isArray(saved.transcript) || saved.transcript.length > 400 || !saved.transcript.every(validEntry) || !Array.isArray(savedPending) || savedPending.length > 400 || !savedPending.every(validEntry)) {
        $('storage-error').hidden = false;
        $('storage-error').textContent = 'The saved night could not be read. Start a new night to replace it.';
        return false;
      }
      game = new TwoThirteen.Game(saved.state);
      transcript = saved.transcript;
      pending = savedPending;
      return true;
    } catch {
      $('storage-error').hidden = false;
      $('storage-error').textContent = 'The saved night could not be read. Your next new night will replace it.';
      return false;
    }
  }
  function initAudio() {
    if (!sound) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { sound = false; $('audio').textContent = 'Sound unavailable'; }
  }
  function tone(freq, start, duration, volume, type = 'sine') {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function cue(name) {
    if (!sound || !context) return;
    const now = context.currentTime + .025;
    if (name === 'knock') [0,.42,1.15].forEach((d,i) => tone(83 - i*8, now+d, .19, .13, 'triangle'));
    if (name === 'phone') { tone(140,now,.18,.035,'square'); tone(140,now+.25,.18,.035,'square'); }
    if (name === 'step') [0,.6,1.2].forEach(d => tone(52,now+d,.15,.07,'triangle'));
    if (name === 'click') tone(650,now,.045,.025,'triangle');
    if (name === 'ache') tone(110,now,1,.018);
    if (name === 'water') tone(180,now,.7,.012,'sawtooth');
    if (name === 'end') { tone(110,now,2,.025); tone(113,now,2,.018); }
  }
  function nearBottom() { const el = $('transcript'); return el.scrollHeight - el.clientHeight - el.scrollTop < 90; }
  function append(entries, replay = false) {
    const follow = replay || nearBottom();
    const fragment = document.createDocumentFragment();
    for (const item of entries) {
      const p = document.createElement('p');
      p.className = 'entry ' + item.kind;
      p.textContent = item.text;
      fragment.appendChild(p);
      if (item.kind === 'location' && Object.values(TwoThirteen.names).includes(item.text)) $('place').textContent = item.text;
      if (!replay) { transcript.push({ text:item.text, kind:item.kind }); if (item.cue) cue(item.cue); }
    }
    $('transcript').appendChild(fragment);
    // Match the saved-history bound so a long session cannot grow the DOM indefinitely.
    if (transcript.length > 400) transcript.splice(0, transcript.length - 400);
    while ($('transcript').childElementCount > 400) $('transcript').firstElementChild.remove();
    if (follow) $('transcript').scrollTop = $('transcript').scrollHeight;
    else $('latest').hidden = false;
  }
  function updateReading() {
    const reading = pending.length > 0;
    $('continue').hidden = !reading;
    $('command-form').hidden = reading;
    $('command').disabled = reading;
    $('restart').disabled = reading;
    const s = game.state;
    $('context').textContent = s.mode === 'phone' || s.mode === 'final' ? 'Phone / Leah' : s.mode === 'voice' ? 'Room / voice' : 'Room';
    $('mode-note').textContent = reading ? 'Reading' : s.ending ? 'Chapter complete' : 'English input';
    if (!reading) $('place').textContent = TwoThirteen.names[s.room];
    (reading ? $('continue') : $('command')).focus({ preventScroll:true });
  }
  function nextBeat() {
    if (!active || !pending.length) return;
    const beat = pending.shift();
    append([beat]);
    // A room heading belongs with its first short paragraph, not on an empty screen.
    if (beat.kind === 'location' && pending.length && pending[0].kind !== 'location') append([pending.shift()]);
    $('transcript').scrollTop = $('transcript').scrollHeight;
    $('latest').hidden = true;
    updateReading();
    save();
  }
  function respond(entries) {
    pending = TwoThirteen.readingBeats(entries);
    if (pending.length) nextBeat();
    else { updateReading(); save(); }
  }
  const hasSave = resume();
  $('restart').disabled = hasSave && pending.length > 0;
  $('begin').textContent = hasSave ? 'Press Enter to continue' : 'Press Enter to wake up';
  if (hasSave && game.state.ending && !pending.length) $('begin').textContent = 'Press Enter to revisit the ending';
  function begin() {
    if (active) return;
    active = true; initAudio();
    $('boot').hidden = true; $('play').hidden = false;
    if (hasSave) { append(transcript, true); updateReading(); }
    else respond(game.start());
    if (!storageAvailable) storageWarning();
  }
  function submit(raw) {
    if (!active || pending.length) return;
    const input = raw.trim();
    if (!input) return;
    initAudio();
    const restarting = game.state.flags.waitingConfirm && TwoThirteen.normalize(input) === 'yes';
    const result = game.command(input);
    if (restarting) { $('transcript').replaceChildren(); transcript = []; history = []; }
    else { append([{ text:'> ' + input, kind:'command' }]); history.push(input); if (history.length > 100) history.shift(); }
    historyIndex = history.length; draft = '';
    $('command').value = '';
    respond(result);
  }
  $('begin').addEventListener('click', begin);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (!active && event.target.tagName !== 'BUTTON') { event.preventDefault(); if (!event.repeat) begin(); }
    else if (active && pending.length && (event.target.tagName !== 'BUTTON' || event.target.id === 'continue')) {
      event.preventDefault();
      if (!event.repeat) nextBeat();
    }
  });
  $('continue').addEventListener('click', nextBeat);
  $('command-form').addEventListener('submit', event => { event.preventDefault(); submit($('command').value); });
  $('command').addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    if (historyIndex === history.length) draft = $('command').value;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    $('command').value = historyIndex === history.length ? draft : history[historyIndex];
    $('command').setSelectionRange($('command').value.length, $('command').value.length);
  });
  $('transcript').addEventListener('scroll', () => { if (nearBottom()) $('latest').hidden = true; });
  $('latest').addEventListener('click', () => { $('transcript').scrollTop = $('transcript').scrollHeight; $('latest').hidden = true; $('command').focus(); });
  $('restart').addEventListener('click', () => {
    if (!active) begin();
    submit('restart');
    $('command').focus();
  });
  $('audio').textContent = sound ? 'Sound on' : 'Sound off';
  $('audio').setAttribute('aria-pressed', String(sound));
  $('audio').addEventListener('click', () => {
    sound = !sound;
    $('audio').textContent = sound ? 'Sound on' : 'Sound off';
    $('audio').setAttribute('aria-pressed', String(sound));
    try { localStorage.setItem(SOUND, sound ? 'on' : 'off'); } catch { /* Sound preference is optional; play remains available. */ }
    if (sound) { initAudio(); cue('click'); }
    else if (context) context.suspend().catch(() => {});
  });
})();
