/* QuoteCraft Studio Family Fun | Original mini-games, entirely on this device.
   No accounts, fetch requests, analytics, tracking, external assets, or uploads. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  function shuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function button(label, click, extraClass = '') {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    if (extraClass) element.className = extraClass;
    element.addEventListener('click', click);
    return element;
  }
  function initMemory() {
    const board = $('memory-board'), status = $('memory-status'), level = $('memory-level');
    if (!board) return;
    const symbols = ['🐢','🦋','🐝','🍓','🌻','🌙','🐳','🚀','🦊','🍀'];
    let cards = [], opened = [], found = new Set(), turns = 0, locked = false, generation = 0;
    function show() {
      [...board.children].forEach((el, i) => {
        const card = cards[i], visible = found.has(card.id) || opened.includes(i);
        el.textContent = visible ? card.symbol : '❔';
        el.setAttribute('aria-label', `Card ${i + 1}: ${visible ? card.symbol : 'face down'}`);
        el.setAttribute('aria-pressed', String(visible));
        el.classList.toggle('matched', found.has(card.id));
      });
    }
    function flip(index) {
      if (locked || opened.includes(index) || found.has(cards[index].id)) return;
      opened.push(index);
      show();
      if (opened.length !== 2) return;
      turns++;
      const [first, second] = opened;
      if (cards[first].id === cards[second].id) {
        found.add(cards[first].id);
        opened = [];
        show();
        status.textContent = found.size === cards.length / 2
          ? `🎉 You found all ${found.size} pairs in ${turns} turns! Great playing!`
          : `Nice match! ${found.size} pairs found • ${turns} turns.`;
      } else {
        locked = true;
        status.textContent = 'Keep looking! The cards will turn back over.';
        const token = generation;
        window.setTimeout(() => {
          if (token !== generation) return;
          opened = [];
          locked = false;
          show();
          status.textContent = `${found.size} pairs found • ${turns} turns. Try another pair!`;
        }, 850);
      }
    }
    function reset() {
      generation++;
      turns = 0;
      found = new Set();
      opened = [];
      locked = false;
      const numberOfPairs = level.value === 'challenge' ? 8 : 6;
      const unique = shuffle(symbols).slice(0, numberOfPairs);
      cards = shuffle(unique.flatMap((symbol, id) => [{id,symbol},{id,symbol}]));
      board.replaceChildren();
      cards.forEach((_card,i) => board.append(button('❔', () => flip(i))));
      status.textContent = `Find ${numberOfPairs} matching pairs. You can do it!`;
      show();
    }
    $('memory-new').addEventListener('click', reset);
    level.addEventListener('change', reset);
    reset();
  }

  function initCounting() {
    const picture = $('count-pictures'), answers = $('count-answers'), status = $('count-status');
    if (!picture) return;
    const emojis = ['🍎','🐱','⭐','🐸','🌻','🎈','🐝'];
    let correct = 0, answered = false;
    function newRound() {
      answered = false;
      correct = randomInt(2, 8);
      const emoji = pick(emojis);
      picture.replaceChildren();
      for (let i = 0; i < correct; i++) {
        const one = document.createElement('span');
        one.textContent = emoji;
        one.setAttribute('aria-hidden', 'true');
        picture.append(one);
      }
      picture.setAttribute('aria-label', `${correct} matching pictures`);
      answers.replaceChildren();
      shuffle([correct - 1, correct, correct + 1]).forEach(num => {
        const el = button(String(num), () => {
          if (answered) return;
          answered = true;
          el.setAttribute('aria-pressed', 'true');
          status.textContent = num === correct ? '🎉 You counted them! Great job!' : `Good try! There are ${correct}. Let's play another!`;
          [...answers.children].forEach(item => { item.disabled = true; });
        });
        answers.append(el);
      });
      status.textContent = 'Choose the number of pictures.';
    }
    $('count-next').addEventListener('click', newRound);
    newRound();
  }

  function initPatterns() {
    const question = $('pattern-question'), answers = $('pattern-answers'), status = $('pattern-status');
    if (!question) return;
    const patterns = [
      {items:['⭐','🌙','⭐','🌙'], answer:'⭐',choices:['⭐','🌙','☀️']},
      {items:['🔴','🟡','🔵','🔴','🟡'], answer:'🔵',choices:['🔵','🟡','🔴']},
      {items:['🐱','🐱','🐶','🐱','🐱'], answer:'🐶',choices:['🐶','🐱','🐸']},
      {items:['🌻','🍀','🌻','🍀'],answer:'🌻',choices:['🌻','🍀','🌸']},
      {items:['🚀','🪐','🌟','🚀','🪐'],answer:'🌟',choices:['🌟','🚀','🪐']},
      {items:['🔺','🔵','🔺','🔵'],answer:'🔺',choices:['🔺','🔵','🟢']}
    ];
    let previous = -1, correct = '', answered = false;
    function newRound() {
      let index = randomInt(0, patterns.length - 1);
      if (index === previous) index = (index + 1) % patterns.length;
      previous = index;
      answered = false;
      const p = patterns[index];
      correct = p.answer;
      question.textContent = p.items.join('  ') + '  ❔';
      answers.replaceChildren();
      shuffle(p.choices).forEach(value => {
        const el = button(value, () => {
          if (answered) return;
          answered = true;
          el.setAttribute('aria-pressed', 'true');
          status.textContent = value === correct ? '🎉 You spotted the pattern!' : `Good try! The next one is ${correct}.`;
          [...answers.children].forEach(item => { item.disabled = true; });
        });
        el.setAttribute('aria-label', 'Choose ' + value);
        answers.append(el);
      });
      status.textContent = 'Which picture should come next?';
    }
    $('pattern-next').addEventListener('click', newRound);
    newRound();
  }

  function initWords() {
    const letters = $('word-letters'), hint = $('word-hint'), status = $('word-status'), guess = $('word-guess');
    if (!letters) return;
    const words = [
      {word:'GARDEN',hint:'A place where flowers grow.'},
      {word:'PLANET',hint:'Earth is one of these.'},
      {word:'PENCIL',hint:'You can draw with it.'},
      {word:'PUZZLE',hint:'A game you solve piece by piece.'},
      {word:'RABBIT',hint:'A hopping animal with long ears.'},
      {word:'WINDOW',hint:'Look through this to see outside.'},
      {word:'ORANGE',hint:'A fruit and also a color.'},
      {word:'FRIEND',hint:'Someone who cares about you.'},
      {word:'BUTTON',hint:'You press one to start a game.'}
    ];
    let current = null, previous = -1;
    function next() {
      let index = randomInt(0, words.length - 1);
      if (index === previous) index = (index + 1) % words.length;
      previous = index; current = words[index];
      let mixed = shuffle([...current.word]).join('');
      if (mixed === current.word) mixed = current.word.slice(1) + current.word[0];
      letters.textContent = mixed;
      hint.textContent = 'Hint: ' + current.hint;
      guess.value = '';
      guess.disabled = false;
      status.textContent = 'Take your time!';
    }
    $('word-form').addEventListener('submit', event => {
      event.preventDefault();
      if (!current) return;
      const answer = guess.value.trim().toUpperCase();
      if (answer === current.word) {
        status.textContent = '🎉 Yes! You solved it!';
        guess.disabled = true;
      } else {
        status.textContent = 'Not quite! Try switching the letters around.';
      }
    });
    $('word-next').addEventListener('click', next);
    next();
  }

  function initTrivia() {
    const question = $('trivia-question'), choices = $('trivia-answers'), status = $('trivia-status'), progress = $('trivia-progress'), nextButton = $('trivia-next');
    if (!question) return;
    const questions = [
      ['Which planet is known as the Red Planet?',['Mars','Venus','Jupiter','Neptune'],0],
      ['How many days are in a leap year?',['365','366','364','360'],1],
      ['Which animal makes honey?',['Ant','Butterfly','Bee','Duck'],2],
      ['What is the largest ocean on Earth?',['Indian','Pacific','Atlantic','Arctic'],1],
      ['Which shape has exactly three sides?',['Square','Circle','Triangle','Hexagon'],2],
      ['What do plants take in from the air to help them grow?',['Oxygen only','Carbon dioxide','Helium','Steam'],1],
      ['What is the capital of Canada?',['Toronto','Vancouver','Ottawa','Calgary'],2],
      ['How many players are on the board in tic-tac-toe?',['Two','Three','Four','Six'],0],
      ['What is the first month of the year?',['March','December','January','June'],2],
      ['Which bird cannot fly?',['Eagle','Penguin','Sparrow','Robin'],1],
      ['Which instrument has black and white keys?',['Drum','Guitar','Piano','Flute'],2],
      ['Which fraction is the same as one half?',['1/4','2/4','1/3','3/4'],1]
    ];
    let order = shuffle(questions), index = 0, score = 0, answered = false;
    function render() {
      const [text, options, correct] = order[index];
      answered = false;
      progress.textContent = `Question ${index + 1} of ${order.length} • ${score} correct`;
      question.textContent = text;
      choices.replaceChildren();
      options.forEach((value, i) => {
        const el = button(value, () => {
          if (answered) return;
          answered = true;
          el.setAttribute('aria-pressed', 'true');
          if (i === correct) score++;
          status.textContent = i === correct ? '🎉 Correct!' : `Nice try! The answer is ${options[correct]}.`;
          progress.textContent = `Question ${index + 1} of ${order.length} • ${score} correct`;
          [...choices.children].forEach(item => { item.disabled = true; });
          nextButton.textContent = index === order.length - 1 ? 'Play a new round ↻' : 'Next question →';
        });
        choices.append(el);
      });
      nextButton.textContent = index === order.length - 1 ? 'Play a new round ↻' : 'Next question →';
      status.textContent = 'Choose an answer.';
    }
    nextButton.addEventListener('click', () => {
      if (index === order.length - 1) {
        order = shuffle(questions); index = 0; score = 0;
      } else index++;
      render();
    });
    render();
  }

  function initTicTacToe() {
    const board = $('ttt-board'), status = $('ttt-status');
    if (!board) return;
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let squares = [], turn = 'X', finished = false;
    function draw() {
      board.replaceChildren();
      squares.forEach((mark, index) => {
        const row = Math.floor(index / 3) + 1, col = index % 3 + 1;
        const el = button(mark || ' ', () => {
          if (finished || squares[index]) return;
          squares[index] = turn;
          const winner = lines.some(line => line.every(i => squares[i] === turn));
          if (winner) { finished = true; status.textContent = `🎉 ${turn} wins! Well played!`; }
          else if (squares.every(Boolean)) { finished = true; status.textContent = 'It's a tie! Play again?'; }
          else { turn = turn === 'X' ? 'O' : 'X'; status.textContent = `${turn}'s turn.`; }
          draw();
        });
        el.setAttribute('aria-label', `Row ${row}, column ${col}: ${mark || 'empty'}`);
        el.disabled = finished || !!mark;
        board.append(el);
      });
    }
    function reset() { squares = Array(9).fill(''); turn='X'; finished=false; status.textContent='X goes first. Take turns on one device.'; draw(); }
    $('ttt-new').addEventListener('click', reset);
    reset();
  }

  function initCharades() {
    const prompt = $('charades-prompt'), time = $('charades-clock'), status = $('charades-status'), timerButton = $('charades-timer');
    if (!prompt) return;
    const prompts = [
      'A sleepy kitten','Riding a bicycle','A very slow turtle','Blowing up a balloon',
      'Brushing your teeth','A dancing penguin','Making a sandwich','Opening a giant present',
      'Walking through snow','A robot learning to dance','Eating sour candy','A butterfly landing',
      'A superhero flying','Building a snowman','Playing a trumpet','A dog chasing its tail',
      'A monkey eating a banana','Carrying a heavy backpack','Jumping over a puddle','A friendly dinosaur',
      'Fishing for a giant fish','Singing into a hairbrush','Popping popcorn','A magician doing a trick'
    ];
    let previous = -1, seconds = 45, interval = null;
    function stopTimer() {
      if (interval !== null) { window.clearInterval(interval); interval = null; }
      timerButton.textContent = 'Start 45-sec timer';
    }
    function displayTime() { time.textContent = `Timer: 0:${String(seconds).padStart(2,'0')}`; }
    $('charades-next').addEventListener('click', () => {
      let index = randomInt(0,prompts.length-1);
      if (index === previous) index = (index + 1) % prompts.length;
      previous = index;
      prompt.textContent = prompts[index];
      stopTimer(); seconds = 45; displayTime();
      status.textContent = 'Ready? Act it out without saying the words!';
    });
    timerButton.addEventListener('click', () => {
      if (interval !== null) { stopTimer(); seconds = 45; displayTime(); status.textContent='Timer reset.'; return; }
      seconds = 45; displayTime(); status.textContent = 'Go!';
      timerButton.textContent = 'Reset timer';
      interval = window.setInterval(() => {
        seconds = Math.max(0,seconds-1);
        displayTime();
        if (seconds === 0) { stopTimer(); status.textContent = '⏰ Time is up! Whose turn is next?'; }
      }, 1000);
    });
  }

  function initSlidePuzzle() {
    const board = $('slider-board'), status = $('slider-status');
    if (!board) return;
    const solved = [1,2,3,4,5,6,7,8,0];
    let cells = [], moves = 0, complete = false;
    function neighbors(index) {
      const r = Math.floor(index / 3), c = index % 3;
      return [index-3,index+3,index-1,index+1].filter(i => i >= 0 && i < 9 &&
        Math.abs(Math.floor(i/3)-r) + Math.abs(i%3-c) === 1);
    }
    function draw() {
      board.replaceChildren();
      cells.forEach((value,i) => {
        const el = button(value ? String(value) : ' ', () => {
          if (complete) return;
          const blank = cells.indexOf(0);
          if (!neighbors(blank).includes(i)) return;
          [cells[i],cells[blank]] = [cells[blank],cells[i]];
          moves++;
          complete = cells.every((v,index)=>v===solved[index]);
          status.textContent = complete ? `🎉 Puzzle solved in ${moves} moves! Amazing!` : `${moves} moves • Keep going!`;
          draw();
        }, value ? '' : 'blank');
        el.setAttribute('aria-label', value ? `Tile ${value}` : 'Empty space');
        el.disabled = complete || !value || !neighbors(cells.indexOf(0)).includes(i);
        board.append(el);
      });
    }
    function reset() {
      cells = [...solved]; moves = 0; complete = false;
      let lastBlank = -1;
      for (let i = 0; i < 85; i++) {
        const blank = cells.indexOf(0);
        const options = neighbors(blank).filter(x=>x!==lastBlank);
        const move = pick(options.length ? options : neighbors(blank));
        [cells[move], cells[blank]] = [cells[blank], cells[move]];
        lastBlank = blank;
      }
      if (cells.every((v,i)=>v===solved[i])) { const blank=cells.indexOf(0); const move=neighbors(blank)[0]; [cells[move],cells[blank]]=[cells[blank],cells[move]]; }
      status.textContent='Move a tile beside the empty space.';
      draw();
    }
    $('slider-shuffle').addEventListener('click',reset);
    reset();
  }
  if (document.body?.dataset.page === 'kids') {
    initMemory(); initCounting(); initPatterns(); initWords();
  } else if (document.body?.dataset.page === 'family') {
    initTrivia(); initTicTacToe(); initCharades(); initSlidePuzzle();
  }
})();
