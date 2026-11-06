/* The story engine is independent of the browser so routes can be checked offline. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const names = { bedroom: 'Your bedroom', landing: 'Upstairs landing', bathroom: 'Bathroom', hall: 'Entrance hall', living: 'Living room', study: 'Study', sister: "Leah's room", kitchen: 'Kitchen', laundry: 'Laundry room' };
  const links = {
    bedroom: ['landing'], landing: ['bedroom', 'bathroom', 'hall', 'sister'], bathroom: ['landing'],
    hall: ['landing', 'living', 'kitchen'], living: ['hall', 'study'], study: ['living'],
    sister: ['landing'], kitchen: ['hall', 'laundry'], laundry: ['kitchen']
  };
  const descriptions = {
    bedroom: 'The bedside clock reads 02:13. Cold water and an untouched supper sit beside your phone. A black wrist strap protrudes from the half-open bedside drawer. Your coat hangs over a chair. Beyond the bedroom door, the landing is dark. The bedside lamp is still plugged in.',
    landing: 'Family photographs follow the stairs down to the entrance hall. One frame hangs crooked. A pale scuff on the wall leads towards the bathroom. At the far end is Leah’s bedroom. Your own room is behind you.',
    bathroom: 'The bathroom is empty. A wet towel lies beside the basin. Something red-brown remains around the plughole; someone has wiped the porcelain. A tiny silver charm is caught against the drain. The only door leads back to the landing.',
    hall: 'Leah’s shoes are beside the front door. Mud has dried in their soles. The door chain is fastened from inside. A small entry panel glows beside the frame. The living room is to your left; a passage leads to the kitchen. Stairs rise to the landing.',
    living: 'Rain presses against the windows. The sofa cushions hold the shape of someone who has just stood up. A family tablet lies beside a framed photograph of Leah. Its calendar is open; an older saved voice message sits beneath it. A small drawer sits beneath the photograph. Beyond the sofa, an open doorway leads into the study. The entrance hall is behind you.',
    study: 'The desk lamp is on. An open file index bears Leah’s name. A page has been torn from it. The chair is turned towards the wall. The doorway behind you leads to the living room.',
    sister: 'Leah’s suitcase is open on the bed. The charger is still here; her bag is not. A photograph rests face down beside a partly emptied document folder. A small metal ring protrudes from its edge. Her little bedside player is labelled “Birthday disasters”. The door leads to the landing.',
    kitchen: 'One kitchen light is dead. A chair lies on its side. Broken glass and a long scrape lead towards the closed laundry door. A small bead glints against the skirting board. The electrical panel is beside the back door. The entrance hall is behind you.',
    laundry: 'No one is here. An overturned laundry basket. A dark mark across the floor, dragged towards the door. A phone has slipped against the lowest shelf. Nothing in this room is large enough to conceal a person. Behind you, somewhere upstairs, a floorboard settles.'
  };
  const aliases = {
    bedroom: /^(?:my |your |own )?(?:bedroom|room)$/, landing: /^(?:upstairs(?: landing| hall(?:way)?)?|landing|stairs|staircase)$/,
    bathroom: /^(?:bathroom|washroom|toilet)$/, hall: /^(?:(?:entrance|front) hall|hall|hallway|downstairs|foyer|entrance)$/,
    living: /^(?:living ?room|lounge|sitting room)$/, study: /^(?:study|office)$/, sister: /^(?:(?:leahs?|sisters?) (?:bedroom|room)|sister|leah)$/,
    kitchen: /^kitchen$/, laundry: /^(?:laundry(?: room)?|utility room)$/
  };
  const itemNames = { torch: 'flashlight', charm: 'Leah’s silver phone charm', key: 'key marked “Laundry”', glasses: 'spare glasses', coat: 'your coat', leahPhone: 'Leah’s phone' };
  const knownFlags = ['lamp', 'kitchenLight', 'drawer', 'wrist', 'scuff', 'basin', 'entry', 'photo', 'calendar', 'index', 'folder', 'bead', 'unlocked', 'video', 'called', 'outside', 'listened', 'recorded', 'selfQuestion', 'copied', 'timeSaved', 'waitingConfirm', 'mumClaim', 'dadClaim', 'kitchenMessage', 'suitcase', 'personalNote', 'routeSolved', 'purposeSolved'];
  // Local reactions rejoin ordinary exploration; none supplies evidence or an ending condition.
  const incidents = {
    bedroom: {
      prompt: 'A soft knock comes from the landing again. The handle is within reach; the bed is behind you.', speaker: 'Leah',
      settled: 'The knocking has stopped for now. The door still leads to the landing.',
      reactions: [
        { id:'quiet', match:/^(?:listen(?: (?:at|to) (?:the )?(?:door|knocking|voice))?|wait|stay (?:quiet|silent|still)|say nothing|hide(?: (?:under (?:the )?(?:covers|bed|blanket)|behind (?:the )?bed))?)$/,
          text:'You stay still. A breath catches outside.\n“I know you’re awake.”\nYou wait for another knock. None comes. The bed gives a small creak when you move.', memory:'You stayed quiet by the bed. The voice said it knew you were awake, then stopped knocking.' },
        { id:'question', match:/^(?:(?:ask|say|shout|whisper) )?(?:who (?:is there|are you)|whos there|what do you want|leah is that you|are you leah)$|^(?:answer (?:the )?(?:door|knocking)|call out)$/,
          text:'“Who is there?”\nLeah’s voice: “You know who. It’s cold out here.”\n“Why didn’t you call?”\n“I did.” Your phone shows no missed call from tonight. You still cannot see the speaker.', memory:'At your bedroom door the voice claimed to have called. Your phone showed no missed call from tonight.' },
        { id:'door', match:/^(?:open|check|examine|inspect|try|approach|walk to|go to|look at) (?:the |my )?(?:bedroom )?door$/,
          text:'The knocking stops as your hand reaches the handle.\n“Wait,” the voice says, suddenly farther away.\nThere is no weight pressing against the door.', memory:'You approached your bedroom door; the voice drew away as you reached the handle.', after:'You check the bedroom handle. It turns freely; nothing is pressing against the other side.', continue:/^open\b/ }
      ]
    },
    landing: {
      prompt: 'Water behind the bathroom door. A careful step on the stairs below. For a moment you cannot tell which sound to follow.', speaker:'Mother',
      settled:'The landing is quiet enough to hear the rain downstairs. The bathroom and stairs remain accessible.',
      reactions:[
        { id:'listen', match:/^(?:listen(?: (?:to|for) (?:the )?(?:water|footsteps|sounds|voices))?|wait|stay (?:quiet|silent|still)|say nothing|hide(?: behind (?:the )?(?:wall|corner))?)$/,
          text:'You wait between the two sounds. The water stops first.\nFrom below: “Did she hear you?”\nA voice near the bathroom says, “Keep looking.” The same search seems to be happening around you.', memory:'On the landing you heard two voices discussing the search from different directions.' },
        { id:'bathroom', match:/^(?:open|check|inspect|examine|approach|look at) (?:the )?bathroom door$/,
          text:'You come close to the bathroom door. The water has stopped.\nMother’s voice: “I’m going down. Take a look in there for me.”\nYou hear a step, but cannot see past the turn in the stairs.', memory:'You approached the bathroom; Mother’s voice said she was going downstairs.', after:'You check the bathroom door. It is not locked. The water has stopped.', continue:/^open\b/ },
        { id:'stairs', match:/^(?:follow (?:the )?(?:footsteps|steps|sound)|look down (?:the )?stairs|check (?:the )?stairs)$/,
          text:'You lean over the banister. The foot of the stairs is empty.\nA man clears his throat beyond the living-room doorway. He could have turned the corner before you looked.', memory:'You checked the stairs; a man’s voice seemed to continue beyond the living-room doorway.', after:'You look down over the banister. You can see the entrance hall, but not around the living-room doorway.' },
        { id:'question', match:/^(?:(?:ask|say|shout|call out) )?(?:(?:mum|mom|mother) )?(?:which way did you go|are you upstairs or downstairs|who is on the stairs|who is there)$/,
          text:'Mother: “Down here. I thought I heard her by the kitchen.”\nA beat later, from nearer the bathroom: “Mind that loose frame.”\nYou look between the stairs and the crooked photograph.', memory:'You called from the landing. Mother’s directions and the apparent distance of her voice did not quite agree.' }
      ]
    },
    bathroom: {
      prompt:'In the mirror, the open doorway sits just behind your shoulder. You hear a small click where its latch should be.', speaker:'Mother',
      settled:'The bathroom door is still open. Water drips into the basin.',
      reactions:[
        { id:'mirror', match:/^(?:look(?: at| in)?|examine|inspect|check|touch|wipe) (?:the |my )?(?:mirror|reflection)$/,
          text:'You watch the doorway in the mirror instead of turning. Nothing crosses it.\n“Are you all right?” Mother asks from the stairs.\nYou catch yourself holding your breath. Your reflection lets it out when you do.', memory:'You watched the doorway in the mirror. Nobody crossed it while Mother asked whether you were all right.', after:'Your tired reflection fills the mirror. The open doorway is still visible behind your shoulder.' },
        { id:'door', match:/^(?:open|check|inspect|examine|try|touch|look at) (?:the )?(?:bathroom )?(?:door|lock|latch|handle)$/,
          text:'You turn towards the click and test the latch yourself. It slides freely. It is not holding the door shut.\nA step sounds farther down the stairs. You can leave whenever you choose.', memory:'You checked the bathroom latch after hearing a click. It was not holding the door shut.', after:'You test the handle and latch. Both move freely. The door is not locked.', continue:/^open (?:the )?(?:bathroom )?door$/ },
        { id:'question', match:/^(?:(?:ask|say|shout|call out) )?(?:(?:mum|mom|mother) )?(?:did you (?:close|lock) (?:the )?door|who (?:closed|locked) (?:the )?door|are you still there)$/,
          text:'Mother: “I only pulled it to. The draught catches it.”\nYou look at the open doorway.\n“Come down when you’re ready,” she adds. You do not hear her wait for you.', memory:'Mother attributed the bathroom click to a draught; you still saw an open doorway.' },
        { id:'quiet', match:/^(?:listen(?: (?:to|for) (?:the )?(?:click|latch|door|footsteps))?|wait|stay (?:quiet|silent|still)|say nothing|hide)$/,
          text:'You keep your eyes on the door and wait. A drop falls into the basin. Then another.\nNothing comes through. The moon-shaped glint near the drain catches your eye.', memory:'You waited after the bathroom click. Only dripping water followed; nobody came through the doorway.' }
      ]
    },
    hall: {
      prompt:'Through the front door, a step seems to stop on the porch. Then a light tap, low down near the letter slot.', speaker:'Leah',
      settled:'The porch is quiet for now. Rain runs against the front door; the entry panel still glows beside it.',
      reactions:[
        { id:'listen', match:/^(?:listen(?: (?:at|to|through) (?:the )?(?:front )?(?:door|letter slot|footsteps|tapping))?|wait|stay (?:quiet|silent|still)|say nothing|hide(?: behind (?:the )?(?:wall|door))?)$/,
          text:'You hold still beside the front door.\n“Don’t leave her,” someone says from the porch.\nThen, from the kitchen passage: “Aiden?”\nYou cannot tell whether the first speaker walked away. The tapping has stopped.', memory:'At the front door you heard “Don’t leave her” outside, followed by your name from inside.' },
        { id:'question', match:/^(?:(?:ask|say|shout|call out) )?(?:who is (?:there|outside)|whos (?:there|outside)|what do you want|is someone outside|leah are you outside)$/,
          text:'“Who’s outside?”\nA voice like Leah’s: “I thought you were coming to get me.”\n“Where?”\nNo answer from the porch. Your own question sounds too loud in the entrance hall.', memory:'You questioned the porch voice. It said it thought you were coming, but gave no location.' },
        { id:'door', match:/^(?:open|check|inspect|examine|approach|look at|look through|peek through) (?:the )?(?:front door|letter slot|door)$/,
          text:'You lean close to the letter slot. Rain glitters on the porch beyond it; no shoes stand in the strip you can see.\nA quiet scrape comes from inside the house. You turn your head towards the kitchen.', memory:'You looked through the letter slot. You saw only part of an empty porch before hearing a scrape inside.', after:'Through the letter slot you can see a narrow strip of the rain-soaked porch. No one stands in that strip; you cannot see the whole porch.', continue:/^open\b/ }
      ]
    },
    living: {
      prompt:'A sofa cushion gives a faint creak. From near the study, Father calls: “Wasn’t she with you? She went upstairs for something.”', speaker:'Father',
      settled:'The sofa is empty. The study doorway and the entrance hall remain open to you.',
      reactions:[
        { id:'sofa', match:/^(?:approach|check|examine|inspect|search|touch|look(?: at| behind| under)?|sit (?:on|beside)|walk to|go to) (?:the )?(?:sofa|couch|cushions)$/,
          text:'You press a hand into the empty cushion. Its fabric creaks under your palm.\n“Not there. I’m by the desk,” Father says.\nYou lift your hand. You cannot tell whether that was the sound you heard before.', memory:'You checked the empty sofa and heard its fabric creak under your hand. Father said he was by the desk.', after:'You check around and beneath the sofa. No bag or person is hidden there. The cushions creak when you lean on them.' },
        { id:'question', match:/^(?:(?:ask|say|shout|call out) )?(?:(?:dad|father) )?(?:are you sitting (?:there|on the sofa)|were you on the sofa|did you (?:sit|move)|who is on the sofa|what was that noise)$/,
          text:'Father: “I was looking under it for her bag. I’ve moved over here.”\n“Did you find it?”\n“No. Have you tried the papers?” His voice stays near the study doorway.', memory:'Father claimed to have searched under the sofa for Leah’s bag, then moved to the study.' },
        { id:'quiet', match:/^(?:listen(?: (?:to|for) (?:the )?(?:sofa|creak|voice|sound))?|wait|stay (?:quiet|silent|still)|say nothing|hide(?: behind (?:the )?(?:sofa|couch))?)$/,
          text:'You wait beside the sofa. No second creak.\nFather lowers his voice: “She used to leave everything on this table.”\nThe tablet is still here beside the birthday photograph. For a moment the room feels painfully ordinary.', memory:'You waited by the sofa; Father spoke about Leah’s habit of leaving things on the table.' }
      ]
    },
    laundry: {
      prompt:'From the passage, so faintly you almost miss it: “Stay there.” The doorway behind you is open.', speaker:'Leah',
      settled:'The shelf and basket have not moved. The way back to the kitchen is open.',
      reactions:[
        { id:'listen', match:/^(?:listen(?: (?:at|to|for) (?:the )?(?:door|passage|voice|footsteps|sound))?|wait|stay (?:quiet|silent|still)|say nothing|hide)$/,
          text:'You stop breathing for a moment.\nA sleeve seems to brush the other side of the doorway. Then only the refrigerator starts again in the kitchen.\nThe phone below the shelf remains dark. You can reach it without going towards the sound.', memory:'You listened in the empty laundry room. A brushing sound gave way to the refrigerator starting in the kitchen.' },
        { id:'answer', match:/^(?:(?:ask|say|shout|call out) )?(?:(?:leah) )?(?:are you there|are you hurt|where are you|is that you|im here|i am here|i found your phone|who is there)$|^(?:call out|call for leah)$/,
          text:'You call towards the passage.\n“Keep the phone with you,” the voice says.\nYou wait for someone to step into the doorway. Nobody does. You still have the phone to examine.', memory:'You called from the empty laundry room. A voice in the passage told you to keep the phone.' },
        { id:'door', match:/^(?:(?:check|examine|inspect|approach|look (?:at|through)|peek (?:out|through)) (?:the )?(?:door|doorway|passage)|follow (?:the )?(?:voice|sound|footsteps))$/,
          text:'You lean into the doorway. The kitchen chair is still on its side; nobody stands beside it.\n“Stay there,” the voice says again, too softly to place. You step back beside the shelf. The way out remains clear.', memory:'You checked the passage from the laundry room. The kitchen was empty, although the voice repeated “Stay there”.', after:'You look through the laundry doorway. The fallen kitchen chair is visible. The passage back is clear.' }
      ]
    }
  };
  const normalize = text => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (text, pattern) => pattern.test(text);
  const roomFor = text => Object.keys(aliases).find(id => aliases[id].test(text));
  function readingBeats(entries) {
    const beats = [];
    for (const entry of entries) {
      if (['location', 'ending', 'command'].includes(entry.kind)) { beats.push({ ...entry }); continue; }
      const parts = [];
      for (const line of entry.text.split(/\r?\n/).map(x => x.trim()).filter(Boolean)) {
        let quoted = false, start = 0, paragraph = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '“') quoted = true;
          else if (char === '”') quoted = false;
          else if (char === '"') quoted = !quoted;
          const boundary = !quoted && /[.!?…”"]/.test(char) && (i === line.length - 1 || /\s/.test(line[i + 1]));
          if (!boundary && i !== line.length - 1) continue;
          const sentence = line.slice(start, i + 1).trim();
          if (paragraph && (paragraph.length + sentence.length + 1 > 180)) { parts.push(paragraph); paragraph = ''; }
          paragraph += (paragraph ? ' ' : '') + sentence;
          start = i + 1;
        }
        if (paragraph) parts.push(paragraph);
      }
      parts.forEach((text, i) => beats.push({ ...entry, text, cue: i === 0 ? entry.cue : null }));
    }
    return beats;
  }
  const fresh = () => ({ version: VERSION, room: 'bedroom', visited: ['bedroom'], inventory: [], flags: {}, events: [], mode: 'world', ending: null, turns: 0 });
  function valid(s) {
    return s && s.version === VERSION && Object.hasOwn(names, s.room) && Array.isArray(s.visited) && s.visited.every(x => Object.hasOwn(names, x)) &&
      Array.isArray(s.inventory) && s.inventory.every(x => Object.hasOwn(itemNames, x)) && s.flags && typeof s.flags === 'object' && !Array.isArray(s.flags) &&
      Object.entries(s.flags).every(([k, v]) => knownFlags.includes(k) && typeof v === 'boolean') && Array.isArray(s.events) && s.events.every(x => typeof x === 'string' && x.length < 80) && s.events.length < 80 &&
      (s.correction == null || (typeof s.correction === 'string' && s.correction.length <= 240)) &&
      (s.speaker == null || ['Mother','Father','Leah','The low voice'].includes(s.speaker)) && (s.endingIntent == null || s.endingIntent === 'grief') &&
      ['world', 'phone', 'voice', 'final'].includes(s.mode) && [null, 'pursuit', 'grief', 'memory'].includes(s.ending) && Number.isSafeInteger(s.turns) && s.turns >= 0;
  }
  class Game {
    constructor(saved) { this.state = valid(saved) ? JSON.parse(JSON.stringify(saved)) : fresh(); this.output = []; }
    snapshot() { return JSON.parse(JSON.stringify(this.state)); }
    say(text, kind = 'story', cue = null) { this.output.push({ text, kind, cue }); }
    once(id, fn) { if (!this.state.events.includes(id)) { this.state.events.push(id); fn(); } }
    flag(name) { this.state.flags[name] = true; }
    item(name) { if (!this.state.inventory.includes(name)) this.state.inventory.push(name); }
    start() {
      this.output = [];
      this.say('You remember waiting for her. You do not remember going to bed.');
      this.say('Three knocks. The last one is almost polite.', 'sound', 'knock');
      this.say('Your name is Aiden. Your sister has been missing for three days.');
      this.describe(false);
      this.say('Your phone vibrates. Leah, 02:13:\n“Don’t open the door.”\n“Even if it sounds like me.”', 'message', 'phone');
      this.say('From the landing: “Aiden? I left my key inside.”', 'voice');
      return this.output;
    }
    describe(withIncident = true) {
      const s = this.state;
      this.say(names[s.room], 'location'); this.say(descriptions[s.room]);
      if (withIncident && incidents[s.room] && !s.flags.video && !s.events.some(x => x.startsWith('branch-' + s.room + '-'))) this.say(incidents[s.room].prompt, 'sound');
      if (s.events.includes('enter-' + s.room) && !s.events.some(x => x.startsWith('branch-' + s.room + '-'))) {
        const unresolved = { sister:'Another footstep outside. The wardrobe door could hide you from the doorway. “What did she take?”', study:'The doorway is still open behind you. “Shut the door first,” the low voice repeats.', kitchen:'Another breath behind the laundry door. “Aiden?”' };
        if (unresolved[s.room] && !s.flags.video) this.say(unresolved[s.room], 'voice');
      }
    }
    enter(id) {
      const s = this.state;
      if (id === 'laundry' && !s.flags.unlocked) { this.say('The laundry door is locked. Its handle turns a little, then stops.'); return; }
      if (id === 'laundry' && !s.flags.kitchenLight && !s.inventory.includes('torch')) { this.say('The dead kitchen light leaves the floor beyond the door completely black. You cannot see where to put your feet.'); return; }
      s.room = id; s.mode = 'world'; s.speaker = null;
      if (!s.visited.includes(id)) s.visited.push(id);
      this.describe();
      const events = {
        landing: () => this.say('A voice like your mother’s: “Aiden? You’re awake. I heard her come in.”', 'voice', 'water'),
        bathroom: () => { this.say('Outside the doorway, footsteps seem to descend the stairs. “Look downstairs,” the voice says.'); this.say('A sharp ache behind your eyes. The floor remains exactly where it was.', 'pain', 'ache'); },
        hall: () => this.say('Leah’s message appears beneath the first:\n“I’m inside.”', 'message', 'phone'),
        study: () => this.say('Close behind you, a low voice: “Shut the door first.”\nYou turn. The doorway is empty.', 'voice', 'step'),
        sister: () => { this.say('Footsteps climb the stairs and stop outside. The wardrobe door could hide you from the doorway.\nA low voice: “What did she take?”', 'voice', 'step'); this.say('Your phone lights up.\n“Don’t make a sound.”', 'message', 'phone'); },
        kitchen: () => { this.say('Your mother’s voice comes from the passage: “She was just here. Don’t let that man find her.”', 'voice'); this.say('From behind the laundry door, very softly: “Aiden?”', 'voice', 'knock'); },
        laundry: () => this.say('“Leah? It’s me.”\nNo answer. You can still hear a faint movement somewhere beyond the kitchen.')
      };
      if (events[id]) this.once('enter-' + id, events[id]);
    }
    move(target) {
      const s = this.state;
      if (target === s.room) { this.say('You are already in ' + names[target].toLowerCase() + '.'); return; }
      // The house is small: a named known room can be reached through its described passages.
      const queue = [[s.room]]; const seen = new Set([s.room]); let path;
      while (queue.length) {
        const p = queue.shift(); const tail = p[p.length - 1];
        if (tail === target) { path = p; break; }
        for (const next of links[tail]) if (!seen.has(next)) { seen.add(next); queue.push([...p, next]); }
      }
      if (!path) { this.say('You cannot find a way there from here.'); return; }
      for (const next of path.slice(1)) {
        if (next !== target && s.visited.includes(next)) { s.room = next; s.mode = 'world'; s.speaker = null; }
        else this.enter(next);
        if (s.room !== next) break;
      }
    }
    inspect(t) {
      const s = this.state, r = s.room;
      if (/\b(?:hands?|wrist|scratch|scratches|injury|arm)\b/.test(t)) { this.flag('wrist'); this.say('A scratch crosses your wrist. You remember catching your sleeve on a fence while searching in the rain. Was that when it happened?'); return true; }
      if (/\b(?:inventory|pockets|belongings)\b/.test(t)) { this.say(s.inventory.length ? 'You are carrying your phone and ' + s.inventory.map(x => itemNames[x]).join(', ') + '.' : 'Your phone is in your pocket. You are carrying nothing else.'); return true; }
      if (/\bleahs? (?:phone|mobile)\b/.test(t) && r !== 'laundry') { this.say(s.inventory.includes('leahPhone') ? 'Leah’s phone is open to the camera session from yesterday, 23:12. Your own phone is separate, in your pocket.' : 'Leah’s phone is not within reach here. Your own phone is in your pocket.'); return true; }
      if (/\b(?:phone|mobile|messages?|texts?|screen)\b/.test(t) && !(r === 'laundry' && !/\b(?:my|your)\b/.test(t)) && !(r === 'living' && /\b(?:saved|old|voice|tablet)\b/.test(t))) { s.mode = s.flags.video ? 'final' : 'phone'; this.say('Leah’s conversation fills the screen.\nThree days of your unanswered messages. Then tonight:\n“Don’t open the door.”\n“Even if it sounds like me.”\nThe cursor waits beneath her name.', 'message'); return true; }
      if (r === 'bedroom') {
        if (/\b(?:keyhole|peephole)\b/.test(t)) { this.say('There is no viewing hole in your bedroom door. From here you can only listen to the landing.'); return true; }
        if (/\bglasses\b/.test(t)) { this.say(s.flags.drawer || s.inventory.includes('glasses') ? 'A spare pair of reading glasses. The lenses are clean.' : 'You have not found any glasses in reach.'); return true; }
        if (/\bcoat\b/.test(t)) { this.say('Your coat hangs over the chair. Its lining smells faintly of rain.'); return true; }
        if (/\bchair\b/.test(t)) { this.say('The chair is pulled away from the desk. Your coat is draped across its back.'); return true; }
        if (/\bglass\b/.test(t)) { this.say('A drinking glass, half full of cold water, stands beside your supper.'); return true; }
        if (/\b(?:drawer|nightstand|bedside (?:table|cabinet))\b/.test(t)) { this.flag('drawer'); this.say('The drawer slides open. The black strap belongs to a flashlight. A spare pair of glasses sits behind it.'); return true; }
        if (/\b(?:bed|supper|water|glass|clock|coat|chair|lamp)\b/.test(t)) { this.say('02:13. Supper has gone cold. Your coat smells faintly of rain. The lamp switch is beside the bed; the door opens onto the landing.'); return true; }
      }
      if (r === 'landing' && /\b(?:photo|photos|photograph|photographs|frame|wall|scuff|scratch)\b/.test(t)) { this.flag('scuff'); this.say('You straighten the family photograph. A fresh scuff runs along the wall towards the bathroom. One corner of the frame is chipped.'); return true; }
      if (r === 'bathroom') {
        if (/\btowel\b/.test(t)) { this.say('The towel is damp and crumpled. One end has been pressed against the side of the basin.'); return true; }
        if (/\b(?:basin|sink|drain|plug|charm|stain|blood|towel|water)\b/.test(t)) { this.flag('basin'); this.say('The silver charm is a little moon. Leah hung it from her phone. Its cord is snapped. The reddish stain has been wiped into the porcelain rather than washed away.'); return true; }
        if (/\b(?:mirror|reflection)\b/.test(t)) { this.say('Your reflection looks exhausted. The bathroom lock clicks behind you. When you turn, the door is still open.'); return true; }
      }
      if (r === 'hall') {
        if (/\b(?:panel|log|entry|access|record|records|doorbell|keycard|card)\b/.test(t)) { this.flag('entry'); this.say('The entry panel keeps a local record:\nYESTERDAY 22:40 — LEAH — ACCESS GRANTED.\nNo recording. No face. Just her name and the time.\nHer shoes are here too.'); return true; }
        if (/\b(?:shoes|mud|chain|front door)\b/.test(t)) { this.say('Her shoes are the pair from the missing-person photograph. The chain is fastened from inside. The entry panel beside the door still has power.'); return true; }
      }
      if (r === 'living') {
        if (/\b(?:saved|old|voice|audio|message|recording)\b/.test(t)) { this.flag('kitchenMessage'); this.say('Saved voice message · Yesterday, 23:08. Leah sent it to the family tablet.\n“I have the copies in my bag. I’m in the kitchen. The back door is sticking again. I’ll try the front.”\nA cupboard shuts at the end. It does not tell you where she went afterwards.', 'voice'); return true; }
        if (/\b(?:tablet|calendar|schedule|plan|appointment|diary)\b/.test(t)) { this.flag('calendar'); this.say('The family tablet is open to a shared calendar. Leah’s entry, yesterday:\n“Home tonight. Pick up the copies.”\nIt was added before she disappeared.'); return true; }
        if (/\b(?:photo|photograph|picture|frame|bracelet)\b/.test(t)) { this.flag('photo'); this.say('Leah, in her grey coat, holding up a ridiculous birthday cake. The bracelet on her wrist has a single blue glass bead. You remember taking the photograph.'); return true; }
        if (/\b(?:drawer|note|paper)\b/.test(t)) { this.say('A scrap of paper in two childish hands:\n“If the lights go out, count to three.”\n“You first.”\nYou used to say it through her bedroom door.'); return true; }
        if (/\b(?:sofa|couch|television|tv|window|curtain)\b/.test(t)) { this.say('Nothing behind the sofa. Nothing by the window. Your father’s voice now seems to come from the study. “Check what she left behind.”'); return true; }
      }
      if (r === 'study') {
        if (/\b(?:file|files|index|desk|paper|papers|document|documents|folder|copies|copy)\b/.test(t)) { this.flag('index'); this.say('LEAH — PERSONAL COPIES.\nA list of dates and six numbered files. The contents have been removed. In her handwriting beneath the index:\n“Second set in my room. Blue folder.”\nYou cannot remember what the files contain.'); return true; }
        if (/\b(?:chair|wall|door)\b/.test(t)) { this.say('The chair is empty. The voice has stopped. Beyond the open doorway you can see the dark living room.'); return true; }
      }
      if (r === 'sister') {
        if (/\b(?:file|folder|envelope|documents?|papers?|metal|ring|checklist)\b/.test(t)) { this.flag('folder'); this.say('The blue folder is almost empty. Six rectangular marks remain where the copies were clipped. Leah’s checklist is dated yesterday: “22:52 — upstairs set packed. Six of six.”\nIn the inner sleeve is a key with an old label: LAUNDRY. A note on the sleeve reads: “Keep the spare with the papers.”'); return true; }
        if (/\b(?:photo|photograph|picture|frame|note)\b/.test(t)) { this.flag('personalNote'); this.say('On the back of the photograph:\n“This time I want to decide for myself.”\nBelow it, smaller: “Buy real coffee. Stop living on toast. Call Aiden about the terrible birthday cake.”\nShe has drawn a tiny, furious cake in the corner.'); return true; }
        if (/\b(?:voicemail|voice mail|old message|audio|birthday)\b/.test(t)) { this.say('An old birthday message saved on her bedside player:\n“Aiden, you put salt in it. Salt. I ate two slices because you looked so proud.”\nShe laughs before adding, “Next year, I’m baking. You can wash up.”', 'voice'); return true; }
        if (/\b(?:suitcase|luggage|bed|charger|bag|wardrobe|closet)\b/.test(t)) { this.flag('suitcase'); this.say('Work clothes, worn slippers, her favourite chipped mug wrapped in a towel. A luggage tag reads “Temporary address” but has not been filled in. The bag she used for papers is missing; the charger remains plugged in.\nThe blue folder is beside the bed. You cannot tell whether she meant to return for the suitcase.'); return true; }
      }
      if (r === 'kitchen') {
        if (/\bchair\b/.test(t)) { this.say('The chair lies on its side. One leg has gouged the floor towards the laundry door. There is a small blue glint beside the skirting board.'); return true; }
        if (/\b(?:glass|cup|shards)\b/.test(t)) { this.say('A broken drinking glass. Shards spread out beneath the table, as if it was knocked from the edge. A long scrape leads past them towards the laundry door.'); return true; }
        if (/\b(?:bead|bracelet|scrape|floor|trail|skirting|mark|marks)\b/.test(t)) { this.flag('bead'); this.say('A blue bead, broken cleanly through its centre. Beside it, a chair has gouged the floor towards the laundry door. The scrape continues under that door.'); return true; }
        if (/\b(?:panel|fuse|breaker|electric|light)\b/.test(t)) { this.say('The kitchen circuit is labelled in your father’s handwriting. One breaker has tripped. Beside it, the back door opens to the rain.'); return true; }
        if (/\b(?:laundry|door|lock|keyhole)\b/.test(t)) { this.say(s.flags.unlocked ? 'The laundry lock is released. The scrape continues beneath the closed door.' : 'The laundry door is locked. A lock you have used a hundred times.\nFrom the other side: “Quiet. He’ll hear you.”', 'voice'); return true; }
      }
      if (r === 'laundry') {
        if (/\b(?:phone|mobile|screen|video|camera|thumbnail)\b/.test(t)) { this.say('Leah’s phone. A snapped cord hangs from its case, matching the moon charm. Its camera session is still open. The last thumbnail shows a face close to the lens.\nYesterday. 23:12.'); return true; }
        if (/\b(?:floor|blood|stain|mark|marks|basket|shelf|shelves|trail|scrape)\b/.test(t)) { this.say('The basket is empty. A dark drag mark crosses the floor and continues towards the kitchen. Nothing here tells you where it ends.'); return true; }
      }
      if (/\b(?:key|flashlight|torch|charm)\b/.test(t)) {
        if (/key/.test(t) && s.inventory.includes('key')) { this.say('A small brass key. The label reads “Laundry”.'); return true; }
        if (/flashlight|torch/.test(t) && s.inventory.includes('torch')) { this.say('The flashlight works. Its narrow beam is steady.'); return true; }
        if (/charm/.test(t) && s.inventory.includes('charm')) { this.say('Leah’s little silver moon. The cord has snapped.'); return true; }
      }
      return false;
    }
    take(t) {
      const s = this.state;
      if (/\b(?:phone|mobile)\b/.test(t)) {
        if (s.room === 'laundry' && !/\bmy\b/.test(t)) {
          if (!/\bleahs?\b/.test(t)) this.say('Your own phone is already in your pocket. Do you mean Leah’s phone on the shelf?');
          else { this.item('leahPhone'); this.say('You lift Leah’s phone from the shelf. Your own phone remains in your pocket.'); }
        } else this.say('Your own phone is already in your pocket.');
        return;
      }
      if (/\b(?:glasses|coat)\b/.test(t)) { const item = /glasses/.test(t) ? 'glasses' : 'coat'; if (s.inventory.includes(item)) this.say('You already have it.'); else if (s.room === 'bedroom' && (item === 'coat' || s.flags.drawer)) { this.item(item); this.say(item === 'coat' ? 'You take your coat from the chair.' : 'You take the spare glasses from the drawer.'); } else this.say('That is not within reach here.'); return; }
      if (/\bstrap\b/.test(t) && s.room === 'bedroom') { this.flag('drawer'); this.say('You pull the strap gently. The drawer slides open; a flashlight is attached to the strap.'); this.take('take flashlight'); return; }
      if (/flashlight|torch/.test(t)) { if (s.inventory.includes('torch')) this.say('You already have the flashlight.'); else if (s.room === 'bedroom' && s.flags.drawer) { this.item('torch'); this.say('You take the flashlight. The switch clicks under your thumb.', 'story', 'click'); } else this.say('There is no flashlight in reach.'); return; }
      if (/charm|moon/.test(t)) { if (s.inventory.includes('charm')) this.say('The silver charm is already in your pocket.'); else if (s.room === 'bathroom') { this.flag('basin'); this.item('charm'); this.say('You lift the silver moon from the drain. Leah’s phone charm. The cord has snapped.'); } else this.say('There is no charm in reach.'); return; }
      if (/key/.test(t)) { if (s.inventory.includes('key')) this.say('You already have the laundry key.'); else if (s.room === 'sister' && s.flags.folder) { this.item('key'); this.say('You take the key marked “Laundry”.'); } else this.say('You cannot see a loose key here.'); return; }
      this.say('You cannot take that. It remains where it is.');
    }
    journal() {
      const f = this.state.flags;
      this.say('What you remember checking', 'location');
      const clues = [
        ['mumClaim', 'Mother’s account: on an earlier phone call, Leah was in the kitchen after eleven. She describes hearing a cup, not seeing Leah.'],
        ['dadClaim', 'Father’s account: on an earlier phone call, Leah went upstairs for papers after eleven. He describes hearing the stairs, not seeing her.'],
        ['entry', 'Entry panel: Leah’s access was used yesterday at 22:40.'],
        ['calendar', 'Shared calendar: “Home tonight. Pick up the copies.”'],
        ['index', 'Study index: six personal files; a second set in Leah’s blue folder upstairs.'],
        ['folder', 'Folder checklist, yesterday: “22:52 — upstairs set packed. Six of six.” The clips are empty.'],
        ['kitchenMessage', 'Saved message, yesterday at 23:08: Leah said she had the copies in her bag and was in the kitchen, trying to leave.'],
        ['suitcase', 'Suitcase: work clothes, slippers, favourite mug; an unfinished temporary-address tag. Her paper bag is missing; the charger remains.'],
        ['personalNote', 'Leah’s note: “This time I want to decide for myself.” Coffee, toast and a birthday cake on her ordinary to-do list.'],
        ['routeSolved', 'Working conclusion: papers upstairs before the kitchen message. Neither parent’s account establishes where she is now, or that they saw her.'],
        ['purposeSolved', 'Working conclusion: collecting copies was planned; her belongings suggest preparing to live elsewhere. Neither proves who she feared or what happened next.']
      ];
      for (const [flag, text] of clues) if (f[flag]) this.say(text);
      const memories = {
        'branch-sister-hide':'At Leah’s door you kept quiet: the low voice said a set had already been taken; another voice said the blue cover was left.',
        'branch-sister-question':'At Leah’s door the voice asked how much you remembered. It did not identify itself.',
        'branch-sister-open':'You opened Leah’s door immediately: an empty landing, then the voice continuing from downstairs.',
        'branch-study-close':'You closed the study door: the low voice insisted that six missing sheets mattered more than the cover.',
        'branch-study-question':'You challenged the study voice: it said a second set existed upstairs, then avoided saying how it knew.',
        'branch-study-open':'You checked the study doorway: nobody visible; Father’s voice continued from the living room.',
        'branch-kitchen-answer':'You answered the laundry call: the voice said “Count to three. Like before.”',
        'branch-kitchen-listen':'You listened at the laundry door: a voice said “I had my bag. I was going.”',
        'branch-kitchen-open':'You tried the laundry door at once: the voice sounded farther away as you touched the handle.',
        'memory-concealed':'You told the voice you remembered everything. It asked why you were still asking.',
        'memory-admitted':'You admitted the missing hours. The voice told you to start with what Leah wrote down.',
        'memory-questioned':'You asked the voice what you should remember. It claimed Leah had asked to leave; you have not verified that claim.'
      };
      for (const [room, incident] of Object.entries(incidents)) {
        for (const reaction of incident.reactions) memories['branch-' + room + '-' + reaction.id] = reaction.memory;
      }
      for (const id of this.state.events) if (memories[id]) this.say('Your recollection: ' + memories[id]);
      if (!clues.some(([flag]) => f[flag]) && !this.state.events.some(id => memories[id])) this.say('You have not checked an account or a written clue yet.');
      this.say('Accounts are things you heard. Dated records can be checked again at their source. These notes do not establish who was in the house.');
    }
    deduce(t, puzzle) {
      const f = this.state.flags;
      const comparing = /^(?:compare|connect|reconsider|work out|think about|deduce|conclude)\b/.test(t);
      if (/\b(?:dont|do not|never|not|wasnt|didnt|cant|cannot)\b/.test(t)) { this.say('You hold back that conclusion. Compare the dated records and the belongings before deciding what they rule out. Nothing depends on settling it now.'); return; }
      if (puzzle === 'route') {
        if (!f.mumClaim || !f.dadClaim) { this.say('You need both accounts before comparing them. Ask each parent where they last heard or saw Leah. You can keep searching meanwhile.'); return; }
        if (!f.folder || !f.kitchenMessage) { this.say(!f.folder ? 'Both accounts use “after eleven”. You need something dated upstairs; the papers may help.' : 'The folder gives you 22:52. It does not place her downstairs later. The family tablet has an older saved message you can check.'); return; }
        if (/\b(?:lying|liar|lies|never|still upstairs|stayed upstairs|kitchen first)\b/.test(t) || /\b(?:downstairs|kitchen)\b.*\b(?:then|before)\b.*\bupstairs\b/.test(t)) { this.say('That goes further than the evidence. The upstairs checklist says 22:52; the kitchen message says 23:08. Both accounts could describe different moments. Neither proves who is lying, or where Leah is now.'); return; }
        if (comparing) { this.say('You set the records beside the accounts: upstairs copies packed at 22:52; a kitchen message at 23:08. Both parents only said “after eleven”.\nCould their accounts fit the same sequence? You have not settled that yet.'); return; }
        if (!/\bupstairs\b.*\b(?:then|before|later|followed)\b.*\b(?:downstairs|kitchen)\b|\bboth (?:could|can|may|might) be (?:true|right)\b|\bdifferent (?:times|moments)\b/.test(t)) { this.say('That may place her at one moment. How does it fit the other account and the two recorded times? You can leave the question open.'); return; }
        this.flag('routeSolved'); this.say('22:52: the upstairs copies were packed. 23:08: Leah said she was in the kitchen with them. Upstairs, then downstairs.\nMother and Father may be describing different moments. Neither actually says they saw her. Their voices cannot tell you where she is now.');
      } else {
        if (!f.calendar || !f.index || !f.suitcase) { this.say(!f.calendar ? 'You do not yet know what she planned before returning. The shared calendar on the family tablet may help.' : !f.index ? '“Copies” could mean anything. The study index may tell you what sort of things were missing.' : 'Taking papers does not explain whether she planned to stay. Her suitcase and the things she left behind may help.'); return; }
        if (/\b(?:holiday|vacation|visit|visiting|only|just|definitely|certainly|meet|meeting|find someone|find a person)\b/.test(t)) { this.say('The calendar names copies, not a meeting. Work clothes, slippers and a favourite mug suggest a longer move, but a charger left behind proves little by itself. You cannot be certain who she intended to see. Try separating what she planned to collect from what she planned afterwards.'); return; }
        if (comparing) { this.say('You put the calendar beside the index and picture her packed belongings: copies, work clothes, slippers, the mug.\nWhat brought her back, and what was she preparing to do afterwards? Those need not have the same answer.'); return; }
        if (!/\b(?:copies|papers|documents|files)\b/.test(t) || !/\b(?:leave|leaving|move|moving|live elsewhere)\b/.test(t)) { this.say('That could explain one part. The calendar says what she came to collect; the packed everyday things suggest what she planned afterwards. You do not have to choose just one purpose.'); return; }
        this.flag('purposeSolved'); this.say('The calendar names the copies; the index explains the missing files. Her packed everyday things suggest she was preparing to live elsewhere.\nComing back for papers and preparing to leave can both be true. You still do not know who she meant to meet, or why she never got away.');
      }
    }
    encounter(t) {
      const s = this.state, r = s.room;
      if (s.flags.video || /^(?:text|message|reply|respond)\b/.test(t) || /\b(?:dont|do not|never|wont|will not|then)\b/.test(t.replace(/i dont remember/g, '')) || (/\band\b/.test(t) && !/^(?:who|what|why|how|ask|say|tell|shout|whisper)\b/.test(t))) return false;
      const incident = incidents[r];
      if (incident) {
        const reaction = incident.reactions.find(x => x.match.test(t));
        if (!reaction) return false;
        const speech = ['question','answer'].includes(reaction.id);
        // An unaddressed question still belongs to the phone while its conversation is open.
        if (speech && s.mode === 'phone' && !/^(?:say|shout|whisper|call out)\b|\b(?:mum|mom|mother|dad|father)\b/.test(t)) return false;
        const continues = reaction.continue && reaction.continue.test(t);
        if (s.events.some(x => x.startsWith('branch-' + r + '-'))) {
          if (speech) return false;
          if (!continues) this.say(reaction.after || incident.settled);
          return !continues;
        }
        s.events.push('branch-' + r + '-' + reaction.id);
        if (!continues) s.turns++;
        if (speech) { s.mode = 'voice'; s.speaker = incident.speaker; }
        this.say(reaction.text);
        return !continues;
      }
      if (/\b(?:mum|mom|mother|dad|father)\b/.test(t) || (s.mode === 'phone' && !/^(?:say|shout|whisper|ask the voice)\b/.test(t))) return false;
      const spoken = /^(?:ask|say|tell|shout|whisper|call out|who|what|why|how|are you|hello|leah|can you|i remember|i forgot|i cant remember|i cannot remember|i dont remember)\b/.test(t);
      if (r === 'sister' && s.events.includes('branch-sister-question') && spoken) {
        let id, line;
        if (/\b(?:remember everything|remember it all|i remember|i know what happened)\b/.test(t)) { id = 'memory-concealed'; line = '“Everything,” you say, though the hours are still missing.\n“Then why are you asking me?” The voice retreats towards the stairs.'; }
        else if (/\b(?:dont remember|cant remember|cannot remember|forgot|lost my memory|missing hours)\b/.test(t)) { id = 'memory-admitted'; line = '“I don’t remember.”\n“Then start with what she wrote down.” The voice retreats towards the stairs.'; }
        else if (/\b(?:remember|mean|happened|which part)\b/.test(t)) { id = 'memory-questioned'; line = '“What am I supposed to remember?”\n“She asked to leave. Did you hear that part?” It is a claim, not an answer. The steps move away.'; }
        if (id && !s.events.some(x => x.startsWith('memory-'))) { s.events.push(id); s.mode = 'voice'; s.speaker = 'The low voice'; this.say(line, 'voice'); return true; }
      }
      if (!['sister','study','kitchen'].includes(r) || s.events.some(x => x.startsWith('branch-' + r + '-'))) return false;
      const quiet = /^(?:hide(?:\b.*)?|listen(?: (?:to|at) (?:the )?(?:laundry )?(?:door|footsteps|voices?|argument))?|wait|stay (?:quiet|silent|still)|keep (?:quiet|silent|still)|remain silent|say nothing|hold my breath)$/.test(t);
      const door = /^(?:open|check|look|peek|inspect|examine|try|pull|push)\b/.test(t) && /\b(?:door|doorway|hallway|landing)\b/.test(t) && !/\b(?:wardrobe|front|back)\b/.test(t);
      let action, line, continueAction = false;
      if (r === 'sister') {
        if (quiet) { action = 'hide'; line = 'You keep out of the doorway.\n“She already took the set,” says the low voice.\nAnother voice: “She left the blue cover.”\nTheir steps fade towards the stairs. You can check the folder yourself.'; }
        else if (door) { action = 'open'; line = 'You pull the door open. The landing is empty.\nBefore you step out, the low voice continues from downstairs: “I asked what she took.”\nYou did not hear it pass the stairs.'; continueAction = /^open\b/.test(t); }
        else if (spoken) { action = 'question'; line = 'You speak through the door.\n“How much do you actually remember?” the low voice asks.\nThe question hangs there. You could press it, or decide how much to admit.'; }
      } else if (r === 'study') {
        if (/^close (?:the )?(?:study )?door$/.test(t)) { action = 'close'; line = 'You close the study door yourself.\n“Six sheets. Count what’s missing, not the cover.”\nThe desk index is still under the lamp. When you turn back, nobody is beside it.'; }
        else if (spoken) { action = 'question'; line = /\b(?:who|name|yourself)\b/.test(t) ? 'You call towards the doorway, asking who is there.\n“Someone who knows she made a second set. Upstairs.”\nThe voice gives no name. The file index is within reach.' : '“Why should I shut it?”\n“She made a second set. Upstairs.”\n“How do you know?”\nThe low voice does not answer. The index is within reach.'; }
        else if (door) { action = 'open'; line = 'You look through the doorway. Nobody is there.\nFrom the living room, Father says, “Did you find the papers?”\nYou cannot tell whether he heard the other voice.'; continueAction = /^open\b/.test(t); }
      } else {
        if (quiet) { action = 'listen'; line = 'The refrigerator motor stops. You hold still beside the laundry door.\n“I had my bag. I was going.”\nThe words stop when you shift your weight. The scrape beneath the door remains.'; }
        else if (door) { action = 'open'; line = 'As your hand touches the laundry handle, the voice sounds farther away.\nYou keep hold of the metal. Whatever you heard, the door is still in front of you.'; continueAction = true; }
        else if (spoken || /^knock\b/.test(t)) { action = 'answer'; line = '“Leah? I’m here.”\n“Count to three. Like before.”\nYou used to say that through her bedroom door. The reply is familiar enough to keep you beside this one.'; }
      }
      if (!action) return false;
      s.events.push('branch-' + r + '-' + action); s.turns++; s.mode = 'voice'; s.speaker = r === 'kitchen' ? 'Leah' : 'The low voice'; this.say(line, 'voice');
      if (continueAction) { if (r !== 'kitchen') this.move(links[r][0]); else if (s.flags.unlocked && /^open\b/.test(t)) this.enter('laundry'); else this.say(s.flags.unlocked ? 'The lock is released. The laundry door can be opened.' : 'The laundry door is locked. The handle turns a little, then stops.'); }
      return true;
    }
    talk(t, target) {
      const s = this.state;
      if (s.flags.video && target === 'phone') { s.mode = 'final'; this.finish(t); return; }
      if (target === 'phone') {
        s.mode = 'phone';
        if (/\b(?:where|location|which room)\b/.test(t)) this.say('Leah: “I can hear you.”', 'message', 'phone');
        else if (/\b(?:real|really|prove|who are|is this|your name)\b/.test(t)) this.say('Leah: “You always made me count to three.”', 'message');
        else if (/\b(?:count|three|3)\b/.test(t)) this.say('Leah: “You first.”', 'message');
        else if (/\b(?:outside|knock|man|someone|who is|whos)\b/.test(t)) this.say('Leah: “Don’t let him find me.”', 'message');
        else if (/\b(?:dead|died|kill|murder)\b/.test(t)) this.say('The typing indicator appears. Then it disappears.', 'message');
        else if (/\b(?:sorry|love|save|help|coming|protect)\b/.test(t)) this.say('Leah: “Please hurry.”', 'message');
        else if (/\b(?:open|door|light)\b/.test(t)) this.say('Leah: “Turn the light on first.”', 'message');
        else this.say('Your message sits beneath her name. No reply yet.', 'message');
        return;
      }
      s.mode = 'voice';
      if (/\b(?:did i|was i|my memory|i did|my fault)\b/.test(t)) { this.flag('selfQuestion'); this.say('“I don’t remember last night,” you say.\nNo one answers that question.'); return; }
      const address = t.match(/^(?:(?:hello|hi|hey|ask|tell|talk to|speak to|say to)\s+)?(mum|mom|mother|dad|father|leah)\b/);
      const named = address && ({mum:'Mother',mom:'Mother',mother:'Mother',dad:'Father',father:'Father',leah:'Leah'})[address[1]];
      const who = named || s.speaker || (['bathroom','landing','kitchen'].includes(s.room) ? 'Mother' : s.room === 'living' ? 'Father' : ['study','sister'].includes(s.room) ? 'The low voice' : 'Leah');
      s.speaker = who;
      const arrival = /\b(?:when|arrive|arrived|returned|return|come back|get here|got here|back home)\b/.test(t);
      const location = /\b(?:where are you|where r you|show yourself|come out|see you)\b/.test(t);
      const together = /\b(?:help|come with|join|together|stay with)\b/.test(t);
      if (who === 'Mother' || who === 'Father') {
        let line;
        if (/\b(?:where|last|see|saw|hear|heard)\b/.test(t) && /\b(?:leah|sister|she|her)\b/.test(t) && !together && !/\b(?:you said|mum said|dad said)\b/.test(t)) {
          this.flag(who === 'Mother' ? 'mumClaim' : 'dadClaim');
          line = who === 'Mother' ? '“On the phone earlier, after eleven. She was in the kitchen. I heard a cup. I thought she was making tea.”\n“You saw her?”\n“I said I heard her.”' : '“On the phone earlier, after eleven. Upstairs, for her papers. I heard the stairs.”\n“You saw her go?”\n“No. Your mother had the speaker on.”';
        }
        else if (/\b(?:midnight|before you arrived|before you got here)\b/.test(t) && /\b(?:but|how|said|arrived)\b/.test(t)) line = '“The call was earlier. Before we came over. I’m telling you what I thought I heard then.”';
        else if (/\b(?:why|how)\b.*\b(?:say|said|claim)\b/.test(t) && /\b(?:she|her|leah|here)\b/.test(t)) line = who === 'Mother' ? '“I thought I heard her. Just now, towards the back. I didn’t see her. Check there while I look out here.”' : '“I heard the stairs on the earlier call. I assumed she was getting her papers. I didn’t see her go.”';
        else if (/\b(?:why|what are you doing)\b/.test(t)) line = '“You thought she might come back here. We couldn’t sit at home and wait for another call.”';
        else if (arrival) line = who === 'Mother' ? '“Your father rang just after midnight. We took a taxi from the flat. I wasn’t going to let you search all night on your own.”' : '“Not long ago. Your mother wanted to come as soon as you called. We let ourselves in with the spare.”';
        else if (location) line = who === 'Mother' ? '“By the kitchen. One of the lights is out. Mind the step.”' : '“Near the study. I’m checking whether she left her bag.”';
        else if (together) line = '“I’ll keep looking down here. If she went upstairs for her papers, check whether they’re still there. Call me if you find her.”';
        else if (/\b(?:lie|lying|said|story|believe)\b/.test(t)) line = '“I said I heard her. I didn’t say she stayed in that room. Are you listening to me?”';
        else if (/\b(?:hello|hi|hey)\b/.test(t) || /^(?:mum|mom|mother|dad|father)$/.test(t)) line = '“Aiden. Keep your voice down. Have you found her?”';
        if (line) { this.say(who + ': ' + line, 'voice'); return; }
      }
      if (who === 'Leah') { this.say(/\b(?:who|is that you|are you leah|prove|real)\b/.test(t) ? 'Leah: “You used to make me count to three. You first, remember?”' : /\b(?:where|location)\b/.test(t) ? 'Leah’s voice, beyond the next doorway: “I can hear you moving. Please don’t shout.”' : /\b(?:hurt|safe|okay|help|hear me)\b/.test(t) ? 'Leah: “I need you to listen. Don’t let him hear you.”' : 'Leah: “Aiden? Are you still there?”', 'voice'); return; }
      const responses = {
        Mother: /\b(?:where|leah|sister|seen|find)\b/.test(t) ? (s.room === 'kitchen' ? '“She was here a moment ago. Look behind the kitchen. Don’t let him find her.”' : '“I heard her come in. Look downstairs.”') : /\b(?:why|home|here|back)\b/.test(t) ? '“We can talk about that after we find her.”' : '“Lower your voice, Aiden. Listen.”',
        Father: /\b(?:coat|wear|clothes)\b/.test(t) ? '“Her grey coat. The one in the photograph.”' : /\b(?:help|come|join)\b/.test(t) ? '“You check what she left. I’ll look here.”' : '“Wasn’t she with you? She went upstairs for something.”',
        'The low voice': /\b(?:who|name|show|come out)\b/.test(t) ? '“Your sister didn’t want you looking at those.”' : /\b(?:hurt|touch|kill|did|leave|stop)\b/.test(t) ? '“Why don’t you ask her yourself?”' : '“You don’t know what she was afraid of.”',
        'The voice outside': '“Aiden? I left my key inside.”'
      };
      if (s.room === 'laundry') this.say('“Leah?”\nOnly a faint movement beyond the kitchen.');
      else this.say(who + ': ' + responses[who], 'voice');
    }
    playVideo() {
      const s = this.state;
      if (s.room !== 'laundry' && !s.inventory.includes('leahPhone')) { this.say('There is no video in reach here.'); return; }
      if (s.flags.video) { s.mode = 'final'; this.say('You stop on the first frame. Leah looks into the lens.\n“You promised you’d let me leave.”\nYou cannot watch the rest again. The file is still there.\nYour own phone is still waiting for your reply to Leah.'); return; }
      this.flag('video'); s.mode = 'final';
      this.say('Last recording · Yesterday, 23:12', 'location');
      this.say('Leah crouches in front of the lens. Her face is clearly lit. It is her. The laundry room. Last night.');
      if (!s.flags.calendar && !s.flags.index) this.say('Why did she come home? You still do not know. The papers she mentions may answer that, but the recording keeps playing.');
      this.say('She looks past the phone.\n“You promised you’d let me leave.”\nThe door opens behind the camera. The phone is knocked sideways. The image settles low against the shelf.', 'voice');
      this.say('23:15.\nSomeone attacks her. The frame catches her falling, then a second, fatal injury. When the movement stops, the wound is unmistakable. Leah is dead.\nThe person above the lens never steps far enough into view to be identified.');
      this.say('You lower the phone. The place where she lay is empty now. The mark on the floor leads out of the room.\nSomeone moved her. You do not know where.');
      this.say('“She wasn’t waiting for me.”\nYou cannot get the rest of the sentence out.');
      this.say('Your own phone vibrates. Leah, now:\n“Are you there?”', 'message', 'phone');
      this.say('Your thumb rests over the reply field.');
    }
    epilogue() {
      this.say('You touch the playback control once more. Her last words before the door opened return.');
      this.say('“You promised you’d let me leave…”\nA touch against the lock.\n“Please. Not again.”', 'voice');
      this.say('You pause the playback before the door opens. Somewhere along the passage, a voice almost says your name.');
    }
    finish(t) {
      const s = this.state;
      const self = /\b(?:was i|where was i|my memory|my memories|what did i|did i|i was here|i dont remember|i cannot remember|i cant remember|missing hours)\b/.test(t);
      const pursuit = /\b(?:find|catch|hunt|who did|who killed|who hurt|murderer|killer|track)\b/.test(t);
      const grief = /\b(?:sorry|late|failed|protect|forgive|love|goodbye|bye|put|close|away|leave|silence|nothing)\b/.test(t) || /\bi (?:should have|could not|couldnt|was unable to) (?:save|saved|protect|protected) you\b/.test(t);
      if (!self && /\b(?:(?:not|never) (?:sorry|late|going to find)|(?:dont|wont) (?:want to )?(?:find|catch|hunt|forgive))\b/.test(t)) { this.say('You pause over the reply. What do you want to tell Leah?', 'message'); return; }
      if (!self && !pursuit && !grief) { this.say(/are you there|hello|where/.test(t) ? 'Your message remains unanswered. The reply field is still open beneath Leah’s name.' : 'You read your words again. You cannot tell her everything at once. What do you mean?', 'message'); return; }
      if (self && (!s.flags.wrist || !s.flags.timeSaved)) { this.say(!s.flags.wrist ? 'You cannot account for last night. Your wrist aches, but you have not examined the injury. The question stays with you.' : 'Your memory is not a record. You need to preserve a reliable time from last night before you can compare it with what you remember.'); return; }
      if (grief && !self && !pursuit && /^(?:(?:reply|say|text|message)\s+)?(?:(?:i am|im)\s+)?sorry$/.test(t)) { s.endingIntent = 'grief'; this.say('Do you mean you’re sorry you couldn’t save her? The words wait in the reply field.'); return; }
      s.ending = self ? 'memory' : pursuit ? 'pursuit' : 'grief'; s.mode = 'world';
      this.say('The screen stays still. No new message.');
      if (!s.flags.called) this.say('You call for help and give the address. They ask where your sister is. You have no answer.');
      this.epilogue();
      const ending = { memory: ['The missing hours', '“Where was I when she came home?”'], pursuit: ['I’ll find him', '“I don’t know who you are. But I’ll find you.”'], grief: ['Too late', '“If I had woken up earlier…”'] }[s.ending];
      this.say(ending[1]); this.say('End of chapter one\n' + ending[0], 'ending', 'end');
      this.say('Leah was killed. Her body is missing. The recording remains on the phone.\nThe story continues in chapter two.');
    }
    command(raw) {
      this.output = [];
      const s = this.state;
      if (typeof raw !== 'string' || raw.length > 240) { this.say('One short action or sentence at a time.'); return this.output; }
      if (/[\u3400-\u9fff]/u.test(raw)) { this.say('請用英文輸入。Please type your action in English.'); return this.output; }
      let t = normalize(raw); if (!t) { if (raw.trim()) this.say('Please type an action or sentence in English.'); return this.output; }
      // These are equivalent phrases, not guesses about an unspecified object or destination.
      t = t.replace(/\bletter ?box\b/g, 'letter slot').replace(/\bcouch\b/g, 'sofa')
        .replace(/^who is knocking$/, 'who is there').replace(/^who is out there$/, 'who is outside')
        .replace(/\bis that really you\b/g, 'is that you').replace(/^listen carefully$/, 'listen')
        .replace(/\bdid you just lock me in\b/g, 'did you lock the door')
        .replace(/\bwere you sitting on the sofa\b/g, 'were you on the sofa')
        .replace(/^take (?:a |the )?(?:photo|photograph|picture)(?: of)?\s+/, 'photograph ')
        .replace(/^(?:pull|tug(?: on)?) (?:the )?(?:black |wrist )?strap$/, 'take strap');
      const notes = /^(?:(?:read|check|review|open|look at) (?:my |the )?)?(?:journal|notes|clues|evidence)$/.test(t);
      if (t === 'restart' || t === 'new game') { this.flag('waitingConfirm'); this.say('Start a new night and replace this save? Type YES to confirm.'); return this.output; }
      if (s.flags.waitingConfirm) { s.flags.waitingConfirm = false; if (t === 'yes') { this.state = fresh(); return this.start(); } this.say('Your current night is kept.'); return this.output; }
      if (s.ending) { if (notes) this.journal(); else if (/^(?:replay epilogue|play video|listen|listen to (?:the )?recording)$/.test(t)) this.epilogue(); else this.say('The first chapter has ended. Your progress is saved.'); return this.output; }
      if (s.endingIntent) { s.endingIntent = null; if (/^(?:yes|yes i do|thats what i mean)$/.test(t)) return this.command('I am sorry I could not protect you'); if (t === 'no') { this.say('You erase the apology. What did you want to tell her?', 'message'); return this.output; } }
      if (s.correction) { const proposed = s.correction; s.correction = null; if (t === 'yes') return this.command(proposed); if (t === 'no') { this.say('Nothing changes.'); return this.output; } }
      // Only a small, explicit spelling vocabulary is suggested; never execute a guess.
      const misspellings = { bathrom:'bathroom', bathroon:'bathroom', drawr:'drawer', drawrer:'drawer', kichen:'kitchen', flashligt:'flashlight', laudry:'laundry', glases:'glasses' };
      const corrected = t.replace(/\b\w+\b/g, word => misspellings[word] || word);
      if (corrected !== t) { s.correction = corrected; this.say('Did you mean “' + corrected + '”? Type YES to confirm, or rephrase your action. Nothing has changed.'); return this.output; }
      if (t === 'help' || t === 'instructions') { this.say('Read the environment and type an action in English. Common verbs: look, examine, read, open, take, use, go, listen, ask, say, text, wear, compare. Name the object or person. Type journal to recall checked clues and conversations, or hint for a contextual clue. You can leave an unanswered question and keep exploring.'); return this.output; }
      if (notes) { this.journal(); return this.output; }
      const comparing = /^(?:compare|connect|reconsider|work out|think about|deduce|conclude)\b/.test(t);
      const hypothesis = /^(?:i think|maybe|perhaps|she|leah)\b/.test(t) && !/^(?:text|reply)\b/.test(t) && s.mode !== 'final' && s.mode !== 'phone';
      if ((comparing && /\b(?:parents?|accounts?|stories|statements?|locations?|times?|timeline|mum|dad)\b/.test(t)) || (hypothesis && /\b(?:upstairs|downstairs|kitchen|lying|liar|different times|different moments)\b/.test(t)) || /^both (?:could|can|may|might) be (?:true|right)\b/.test(t)) { this.deduce(t, 'route'); return this.output; }
      if ((comparing && /\b(?:purpose|plans?|copies|papers|leah|return|returned|came back|came home|suitcase|leaving)\b/.test(t)) || (hypothesis && /\b(?:came|returned|return|copies|papers|documents|files|leaving|leave|holiday|vacation|visit|visiting|meet|meeting|moving)\b/.test(t))) { this.deduce(t, 'purpose'); return this.output; }
      if (t === 'hint') {
        const hints = { bedroom:'The strap runs into the half-open drawer. Something is attached to its other end.', landing:'The scuff on the wall leads towards the bathroom.', bathroom:'Something belonging to Leah is caught against the drain.', hall:'The entry panel stores a time, even without a camera.', living:'The tablet keeps a planned visit and a dated message. Neither is a voice speaking to you now.', study:'The index mentions a second set of papers.', sister:'The papers and packed everyday things may explain both why she returned and why she meant to leave. Something metallic protrudes from the folder.', kitchen:'The blue glint beside the skirting board may belong to something Leah wore.', laundry:s.flags.video ? 'Your own phone is waiting for your reply. The unexplained scratch on your wrist is still there.' : 'Leah’s phone has a camera session still open. You can watch it even with questions unanswered.' };
        this.say(hints[s.room]); return this.output;
      }
      if (t === 'inventory' || t === 'i') { this.inspect('inventory'); return this.output; }
      if (t === 'look' || t === 'look around' || t === 'l') { s.mode = 'world'; this.describe(); return this.output; }
      if (this.encounter(t)) return this.output;
      if (s.mode !== 'final' && /^(?:stay (?:quiet|silent|still)|keep (?:quiet|silent|still)|remain silent|say nothing|hold my breath)$/.test(t)) { this.say('You keep quiet for a moment. No one comes into view. The room is still yours to search.'); return this.output; }
      if (/^(?:wear|put on)\b/.test(t)) { const item = /\bglasses\b/.test(t) ? 'glasses' : /\bcoat\b/.test(t) ? 'coat' : null; if (!item) this.say('What are you trying to wear?'); else { if (!s.inventory.includes(item)) this.take('take ' + item); if (s.inventory.includes(item)) this.say(item === 'glasses' ? 'You put on the spare glasses. The edges of the room sharpen.' : 'You put on your coat. The lining is cold against your arms.'); } return this.output; }
      if (/^(?:pull|take|get) (?:the )?ring$/.test(t)) { if (s.room === 'sister') this.inspect('folder'); else this.say('There is no loose metal ring within reach here.'); return this.output; }
      if (/\bhatch\b/.test(t) && /^(?:open|look|inspect|examine|pull)\b/.test(t)) { this.say('There is no hatch visible in ' + names[s.room].toLowerCase() + '.'); return this.output; }
      if (/^(?:stop texting|put (?:my |the )?phone away|close (?:my |the )?phone|back to room)$/.test(t) && !s.flags.video) { s.mode = 'world'; this.say('You lower your phone. The room is still here.'); return this.output; }
      const addressedLeah = /^leah\b/.test(t);
      const greeting = /^(?:(?:hello|hi|hey|sorry)\b|(?:mum|mom|mother|dad|father|leah)$)/.test(t);
      const explicitSpeech = greeting || addressedLeah || /^(?:mum|mom|mother|dad|father|say|ask|tell|call out|shout|whisper|talk|speak|text|message|reply|answer|respond|you said|mum said|dad said|but)\b/.test(t);
      const textSpeech = /^(?:text|message|reply|respond)\b/.test(t);
      const interrogative = /^(?:where|who|whos|why|what|when|have you|are you|is this|did you|did i|was i|how|can you|will you|count|you first|im sorry|i am sorry|ill find|i will find|i dont remember|i love|please)\b/.test(t);
      const physical = /^(?:go|walk|move|head|return|enter|visit|travel|follow|exit|leave|look|inspect|examine|check|search|read|study|view|play|watch|replay|take|get|pick|grab|collect|open|unlock|use|shine|turn|switch|fix|reset|restore|push|flip|listen|wait|knock|hide|wash|clean|photograph|photo|record|call|dial|save|copy|put|close)\b/.test(t);
      if (s.mode === 'final' && /^(?:put .*phone away|close .*phone|stay silent|remain silent|say nothing|dont reply|do not reply|no reply)$/.test(t)) { this.finish('put phone away'); return this.output; }
      if (explicitSpeech || interrogative || (s.mode === 'final' && !physical)) {
        const namedVoice = /\b(?:mum|mom|mother|dad|father|man|voice)\b/.test(t);
        const spoken = /^(?:say|shout|whisper|call out)\b/.test(t);
        const phone = textSpeech || (!namedVoice && !spoken && ['phone','final'].includes(s.mode));
        s.turns++; this.talk(t, phone ? 'phone' : 'voice'); return this.output;
      }
      // Negation is checked before imperative parsing: “don't open” must never open a door.
      if (/\b(?:dont|do not|never|wont|will not|not going to)\b/.test(t)) { this.say('You leave things as they are.'); return this.output; }
      if (/\b(?:then|and then)\b/.test(t)) { this.say('One action at a time. Nothing has changed yet.'); return this.output; }
      // Observation and replay must not silently change the active conversation.
      if (/^follow\b/.test(t)) {
        const following = t.match(/^follow (?:mum|mom|mother|dad|father|leah|the voice|the footsteps)(?: (?:into|to) (?:the )?(.+))?$/);
        const destination = following && following[1] && roomFor(following[1]);
        if (destination) { this.say('You follow the sound through the house.'); s.turns++; this.move(destination); }
        else this.say('You cannot see anyone to follow. Which room or passage do you want to check?');
        return this.output;
      }
      let target = t.replace(/^(?:go|walk|move|head|return|enter|visit|travel)(?: back)?(?: to| into| towards)?\s+/, '').replace(/^(?:the|a|my|your)\s+/, '');
      if (/^(?:go|walk|move|head|return|enter|visit|travel)\b/.test(t) || roomFor(t)) {
        target = target.replace(/^(?:upstairs|downstairs|up|down) (?:to|into) (?:the )?/, '');
        target = target.replace(/^(?:through|out of|down|up) (?:the )?/, match => /down/.test(match) ? 'down ' : /up/.test(match) ? 'up ' : '').replace(/^(?:the )?(laundry|bathroom|study|bedroom) door$/, '$1');
        if (/^(?:down|up) (?:the )?stairs$/.test(target)) target = target.startsWith('down') ? 'hall' : 'landing';
        if (/^(?:north|south|east|west|n|s|e|w)$/.test(target)) { this.say('You cannot orient yourself by compass in this house. Name a room or a doorway described around you.'); return this.output; }
        if (/^(?:out|outside)$/.test(target) && !['hall','kitchen'].includes(s.room)) { this.move(links[s.room][0]); return this.output; }
        if (/outside|front door|back door|street|^out$|leave (?:the )?house/.test(target)) { this.flag('outside'); this.say('Rain falls on an ordinary street. Behind you, the phone lights up:\n“I’m inside.”\nYou cannot leave her here. You step back into the entrance.', 'message'); this.move('hall'); return this.output; }
        if (/^back$/.test(target)) target = links[s.room][0];
        if (/^(?:up|upstairs)$/.test(target)) target = 'landing';
        if (/^(?:down|downstairs)$/.test(target)) target = 'hall';
        const destination = roomFor(target) || (Object.hasOwn(names, target) ? target : null);
        if (destination) { s.turns++; this.move(destination); } else this.say('Which place do you mean?');
        return this.output;
      }
      if (/^(?:exit|leave)(?: (?:the|my|your))?(?: room|bedroom|bathroom|study|kitchen|laundry)?$/.test(t)) { this.move(links[s.room][0]); return this.output; }
      if (s.room === 'sister' && /^(?:play|listen|replay)\b/.test(t) && /player|birthday|voicemail|message|audio/.test(t)) { this.inspect('voicemail'); return this.output; }
      if (s.room === 'living' && /^(?:play|listen|replay)\b/.test(t) && /saved|old|voice|message|audio|recording/.test(t)) { this.inspect('saved message'); return this.output; }
      if (/^(?:play|watch|replay|view)\b/.test(t) && /video|recording|footage|clip/.test(t)) { this.playVideo(); return this.output; }
      if (/^(?:take|get|pick up|grab|collect)\b/.test(t)) { s.turns++; this.take(t); return this.output; }
      if (/^(?:look(?: at| in| inside| under)?|inspect|examine|check|search|read|study|view)\b/.test(t)) { if (!this.inspect(t)) this.say('You cannot see what you mean here. Nothing has moved.'); else s.turns++; return this.output; }
      if (/^(?:open|unlock|use|shine|turn|switch|fix|reset|restore|push|flip)\b/.test(t)) {
        if (/flashlight|torch/.test(t)) { this.say(!s.inventory.includes('torch') ? 'You are not carrying a flashlight.' : s.room === 'kitchen' && /\blaundry\b/.test(t) ? 'The beam settles on the closed door. You will have to open it to see the laundry room.' : 'The flashlight throws a steady beam ahead of you.'); return this.output; }
        if (/lamp|light|breaker|fuse|electric/.test(t)) { if (s.room === 'bedroom' || s.room === 'kitchen') { const flag = s.room === 'kitchen' ? 'kitchenLight' : 'lamp'; s.flags[flag] = !/\boff\b/.test(t); this.say(s.flags[flag] ? 'The light comes on. Nothing moves out of it.' : 'The light goes out.', 'story', 'click'); } else this.say('There is no light switch in reach.'); return this.output; }
        if (/phone|mobile|messages?/.test(t)) { this.inspect(t); return this.output; }
        if (/drawer/.test(t)) { if (!this.inspect(t)) this.say('There is no drawer in reach.'); return this.output; }
        if (/folder|envelope|file|tablet|panel/.test(t)) { if (!this.inspect(t)) this.say('That is not within reach here.'); return this.output; }
        if (/key|lock|door/.test(t)) {
          if (/^(?:use|turn) (?:the |my )?key$/.test(t)) { this.say('What are you trying to open with the key?'); return this.output; }
          if (/front door/.test(t) && s.room !== 'hall') { this.say('The front door is not within reach here.'); return this.output; }
          if (/key|unlock/.test(t) && s.room !== 'kitchen') { this.say('There is no matching lock within reach here.'); return this.output; }
          if (s.room === 'kitchen' || s.room === 'laundry') {
            if (/back door/.test(t)) { this.say('The back door opens onto rain. You hear a cry from the laundry and stay inside.'); return this.output; }
            if (s.room === 'laundry') { this.move('kitchen'); return this.output; }
            if (!s.flags.unlocked) { if (/key|unlock/.test(t)) { if (s.inventory.includes('key')) { this.flag('unlocked'); this.say('The laundry key turns. The lock releases. Beyond it, someone takes a shallow breath.', 'voice', 'click'); } else this.say('You do not have the laundry key.'); } else this.say('The laundry door is locked. The handle turns a little, then stops.'); }
            else if (/key|unlock/.test(t)) this.say('The laundry door is already unlocked.');
            else this.enter('laundry');
          } else if (s.room === 'bedroom') this.move('landing');
          else if (s.room === 'landing') { if (/sister|leah/.test(t)) this.move('sister'); else if (/bathroom/.test(t)) this.move('bathroom'); else if (/my|own|bedroom/.test(t)) this.move('bedroom'); else this.say('Which door do you mean?'); }
          else if (s.room === 'bathroom' || s.room === 'sister') this.move('landing');
          else if (s.room === 'living') this.move('study');
          else if (s.room === 'study') this.move('living');
          else this.say('You release the chain. A cry sounds from inside the house, and you stop at the threshold.');
          return this.output;
        }
        this.say('What are you trying to use or open?'); return this.output;
      }
      if (/^(?:listen|wait|knock|hide|wash|clean|photograph|photo|record|call|dial|save|copy|put|close)\b/.test(t)) {
        if (/^call|^dial/.test(t) && /police|help|emergency|999|911|112/.test(t)) { this.flag('called'); this.say('You give your address. The operator tells you to wait outside.\nA cry comes from deeper in the house. Leah’s voice.\n“She’s still inside,” you say. “I can’t leave her.”'); return this.output; }
        if (/^record/.test(t)) { this.flag('recorded'); this.say('You start recording on your phone. Rain and your breathing fill the level meter. The voice seems farther away now.'); return this.output; }
        if (/^photo|^save|^copy/.test(t)) { this.flag('copied'); if (s.room === 'hall' && /\b(?:panel|entry|record|log|time)\b/.test(t)) { this.flag('entry'); this.flag('timeSaved'); this.say('You save a photograph of the entry record: YESTERDAY 22:40 — LEAH. You now have a time you can compare with your memory.'); } else this.say('You keep a record on your phone.'); return this.output; }
        if (/^wash|^clean/.test(t)) { this.say(s.room === 'bathroom' ? 'You wash your hands. Mud slips from your cuffs into the basin. You remember searching in the rain.' : 'There is nowhere to wash here.'); return this.output; }
        if (/^hide/.test(t)) { this.say(s.room === 'sister' ? 'You slip behind the wardrobe door. A low voice outside asks, “What did she take?” After a while the steps retreat.' : 'You hold still, out of the doorway. The room does not become quieter.'); return this.output; }
        if (/^close/.test(t)) { if (/\bdoor\b/.test(t)) this.say('You close the door. A voice seems to move to the other side.'); else if (/\b(?:folder|drawer)\b/.test(t) && ['sister','bedroom','living'].includes(s.room)) this.say('You close it, leaving its contents where they are.'); else this.say('What are you trying to close here?'); return this.output; }
        if (/^put/.test(t)) { this.say('What are you trying to put down, and where?'); return this.output; }
        const sounds = { bedroom:'Three gentle knocks from the landing, then: “Aiden?”', landing:'Water runs behind the bathroom door. A step sounds on the stairs below you.', bathroom:'A tap drips into the basin. Beyond the door, footsteps seem to be descending.', hall:'Rain taps the front door. A man speaks too quietly to make out from the living room.', living:'The rain almost covers your father’s voice near the study doorway.', study:'The desk lamp hums. Behind you: “Did she take the copies?”', sister:'A slow footstep stops outside the bedroom. The suitcase zip rattles when your hand brushes it.', kitchen:'The refrigerator motor stops. A tiny breath comes from behind the laundry door.', laundry:'A quiet room. A faint sound in the passage. No answer.' };
        this.flag('listened'); this.say(sounds[s.room], 'sound', 'step'); return this.output;
      }
      this.say('You cannot make sense of that action. Try saying it another way. Nothing has changed.');
      return this.output;
    }
  }
  const api = { Game, names, valid, normalize, readingBeats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TwoThirteen = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
