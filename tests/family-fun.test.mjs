import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const code = readFileSync('idea-hub/family/family-games.js','utf8');
const kidHtml = readFileSync('idea-hub/family/kids.html','utf8');
const familyHtml = readFileSync('idea-hub/family/family.html','utf8');
const css = readFileSync('idea-hub/family/family.css','utf8');

class Element {
  constructor(tag='div') {
    this.tagName=tag.toUpperCase(); this.children=[]; this.events={}; this.attributes={};
    this.dataset={}; this.textContent=''; this.value=''; this.disabled=false;
    this.className=''; this._classes=new Set();
    this.classList = {toggle:(name,on)=>{if(on)this._classes.add(name);else this._classes.delete(name);}};
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children=[...children]; }
  setAttribute(k,v) { this.attributes[k]=v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(k,fn) { this.events[k]=fn; }
  click() { if(!this.disabled) this.events.click?.(); }
  dispatchEvent(event) { this.events[event.type]?.(event); }
}
function boot(page) {
  const ids = {};
  const names = [
    'memory-board','memory-status','memory-level','memory-new',
    'count-pictures','count-answers','count-status','count-next',
    'pattern-question','pattern-answers','pattern-status','pattern-next',
    'word-letters','word-hint','word-status','word-guess','word-form','word-next',
    'trivia-question','trivia-answers','trivia-status','trivia-progress','trivia-next',
    'ttt-board','ttt-status','ttt-new',
    'charades-prompt','charades-clock','charades-status','charades-next','charades-timer',
    'slider-board','slider-status','slider-shuffle'
  ];
  for(const name of names) ids[name]=new Element();
  ids['memory-level'].value='easy';
  const intervals = new Map(), timeouts=[];
  let intervalId=0;
  const context = {
    document:{body:{dataset:{page}},getElementById:id=>ids[id]??null,createElement:tag=>new Element(tag)},
    window:{
      setTimeout: callback => {timeouts.push(callback);return timeouts.length;},
      setInterval: callback => {const id=++intervalId;intervals.set(id,callback);return id;},
      clearInterval: id => intervals.delete(id)
    }, Math
  };
  runInNewContext(code,context);
  return {ids,intervals,timeouts};
}

test('two separate pages link the shared game script, design, and each other',()=>{
  for(const h of [kidHtml,familyHtml]){
    assert.match(h,/family-games\.js/);
    assert.match(h,/family\.css/);
    assert.match(h,/idea-hub-theme\.js/);
    assert.match(h,/Choose.*color mood|idea-hub-theme\.js/);
    assert.match(h,/Content-Security-Policy/);
    assert.match(h,/connect-src 'none'/);
    assert.doesNotMatch(h, /(?:google-analytics|cloudflareinsights|pixel|stripe|iframe|fakeyou)/i);
  }
  assert.match(kidHtml,/\.\/family\.html/);
  assert.match(familyHtml,/\.\/kids\.html/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/focus-visible/);
});

test('all existing homepage and forum links point to the two real game pages',()=>{
  const landing=readFileSync('index.html','utf8');
  const forum=readFileSync('idea-hub/index.html','utf8');
  const mobile=readFileSync('idea-hub/mobile/index.html','utf8');
  assert.match(landing,/\/idea-hub\/family\/kids\.html/);
  assert.match(landing,/\/idea-hub\/family\/family\.html/);
  assert.match(forum,/\.\/family\/kids\.html/);
  assert.match(forum,/\.\/family\/family\.html/);
  assert.match(mobile,/\.\.\/family\/kids\.html/);
});

test('kids activities initialize with clickable matches, counts, patterns and words',()=>{
  const {ids,timeouts}=boot('kids');
  assert.equal(ids['memory-board'].children.length,12);
  ids['memory-board'].children[0].click();
  ids['memory-board'].children[1].click();
  assert.match(ids['memory-status'].textContent, /pairs|Keep looking|match/i);
  timeouts.forEach(cb=>cb());
  ids['memory-level'].value='challenge';
  ids['memory-level'].events.change();
  assert.equal(ids['memory-board'].children.length,16);
  assert.equal(ids['count-answers'].children.length,3);
  ids['count-answers'].children[0].click();
  assert.match(ids['count-status'].textContent,/counted|try/i);
  ids['count-next'].click();
  assert.equal(ids['pattern-answers'].children.length,3);
  ids['pattern-answers'].children[0].click();
  assert.match(ids['pattern-status'].textContent,/pattern|try/i);
  ids['pattern-next'].click();
  assert.ok(ids['word-letters'].textContent.length>=5);
  ids['word-guess'].value='wrongword';
  ids['word-form'].events.submit({preventDefault(){}});
  assert.match(ids['word-status'].textContent,/Try switching/i);
  ids['word-next'].click();
  assert.equal(ids['word-guess'].value,'');
});

test('memory game ignores late card timers after pressing New Game',()=>{
 const {ids,timeouts}=boot('kids');
 ids['memory-board'].children[0].click();
 ids['memory-board'].children[1].click();
 ids['memory-new'].click();
 timeouts.forEach(cb=>cb());
 assert.equal(ids['memory-board'].children.length,12);
 assert.match(ids['memory-status'].textContent,/Find 6 matching pairs/);
});

test('family trivia asks questions and moves between rounds',()=>{
 const {ids}=boot('family');
 assert.match(ids['trivia-progress'].textContent,/Question 1 of/);
 assert.equal(ids['trivia-answers'].children.length,4);
 ids['trivia-answers'].children[0].click();
 assert.match(ids['trivia-status'].textContent,/Correct|Nice try/);
 ids['trivia-next'].click();
 assert.match(ids['trivia-progress'].textContent,/Question 2 of/);
});

test('tic-tac-toe produces a winner and resets correctly',()=>{
 const {ids}=boot('family');
 const move=i=>ids['ttt-board'].children[i].click();
 [0,3,1,4,2].forEach(move);
 assert.match(ids['ttt-status'].textContent,/X wins/);
 ids['ttt-new'].click();
 assert.match(ids['ttt-status'].textContent,/X goes first/);
 assert.equal(ids['ttt-board'].children.length,9);
});

test('charades rotates prompts and timer finishes at zero',()=>{
 const {ids,intervals}=boot('family');
 ids['charades-next'].click();
 assert.notEqual(ids['charades-prompt'].textContent,'Press “New idea” to begin!');
 ids['charades-timer'].click();
 for(let i=0;i<45;i++) { const callback=[...intervals.values()][0]; if(callback) callback(); }
 assert.match(ids['charades-status'].textContent,/Time is up/);
 assert.equal(ids['charades-clock'].textContent,'Timer: 0:00');
 assert.equal(intervals.size,0);
});

test('sliding puzzle always offers legal moves and updates its counter',()=>{
 const {ids}=boot('family');
 const board=ids['slider-board'];
 assert.equal(board.children.length,9);
 assert.equal(board.children.filter(el=>el.textContent.trim()==='').length,1);
 const playable=board.children.find(el=>!el.disabled && el.textContent.trim()!=='');
 assert.ok(playable);
 playable.click();
 assert.match(ids['slider-status'].textContent,/moves|solved/i);
 ids['slider-shuffle'].click();
 assert.equal(board.children.length,9);
});

test('all game data is local and there are no social features on the child pages',()=>{
 for (const item of [kidHtml,familyHtml]) {
  assert.doesNotMatch(item,/<input[^>]*type=["'](?:email|file|password)["']/);
  assert.doesNotMatch(item,/<script[^>]*src=["']https?:/);
 }
 assert.doesNotMatch(code, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage/);
});
