// StaffReel: shows the notes you play on a scrolling grand staff (treble + bass clef).
// New notes appear on the right and scroll left, like a tape.
// This file starts itself (see the bottom), so script.js does not need any changes.

const CLEF_FONT = '"Noto Music", "Segoe UI Symbol", "Apple Symbols", serif';

class StaffReel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.events = [];        // { t, step, sharp, name, octave }
    this.showNames = true;
    this.speed = 100;        // pixels per second
    this.groupWindow = 90;   // ms: notes pressed this close together are drawn as a chord
    this.lastGroupTime = 0;
    this.raf = null;
    this.clefs = [];
    this.clefEnd = 70;
    this.w = 0;
    this.h = 0;
    this.letters = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

    this.updateColors();

    if (window.ResizeObserver) {
      new ResizeObserver(() => this.resize()).observe(canvas);
    } else {
      window.addEventListener('resize', () => this.resize());
    }
    this.resize();

    // The clef symbols come from the Noto Music web font: redraw once it has loaded.
    if (document.fonts && document.fonts.load) {
      document.fonts.load('40px "Noto Music"', '\u{1D11E}\u{1D122}')
        .then(() => { this.layoutClefs(); this.draw(); })
        .catch(() => {});
    }
  }

  // ---- public API -------------------------------------------------------

  addNote(note, octave) {
    const now = performance.now();
    let t = now;
    if (now - this.lastGroupTime < this.groupWindow) {
      t = this.lastGroupTime;      // joins the chord that just started
    } else {
      this.lastGroupTime = now;
    }
    this.events.push({
      t,
      // Position on the staff, counted in letter steps: C4 (middle C) = 28
      step: octave * 7 + this.letters[note[0]],
      sharp: note.includes('#'),
      name: note,
      octave
    });
    this.start();
  }

  setShowNames(value) {
    this.showNames = value;
    this.draw();
  }

  clear() {
    this.events = [];
    this.draw();
  }

  updateColors() {
    const style = getComputedStyle(document.documentElement);
    this.ink = style.getPropertyValue('--black-key-1').trim() || '#120b08';
    this.accent = style.getPropertyValue('--button-grad-1').trim() || '#ab6d43';
  }

  // ---- layout -----------------------------------------------------------

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.w = w;
    this.h = h;
    this.half = h / 45.5;   // half a line gap: the distance of one letter step
    this.top = h * 0.28;    // y of the top treble line
    this.layoutClefs();
    this.draw();
  }

  // y position of a letter step. Treble lines are steps 30-38, bass lines 18-26.
  y(step) {
    return this.top + (38 - step) * this.half;
  }

  // Scales a clef glyph so it covers the given vertical range, whatever the font's metrics.
  fitGlyph(ch, yTop, yBottom) {
    const ctx = this.ctx;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = `100px ${CLEF_FONT}`;
    const m = ctx.measureText(ch);
    const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    if (!height) return null;

    const k = (yBottom - yTop) / height;
    const x = 12 + m.actualBoundingBoxLeft * k;
    return {
      ch,
      size: 100 * k,
      x,
      y: yTop + m.actualBoundingBoxAscent * k,
      right: x + m.actualBoundingBoxRight * k
    };
  }

  layoutClefs() {
    this.clefs = [
      this.fitGlyph('\u{1D11E}', this.y(43), this.y(27)),    // treble clef
      this.fitGlyph('\u{1D122}', this.y(26.3), this.y(19.5)) // bass clef
    ];
    const rights = this.clefs.filter(Boolean).map(c => c.right);
    this.clefEnd = rights.length ? Math.max(...rights) + 16 : 70;
  }

  // ---- animation --------------------------------------------------------

  start() {
    if (!this.raf) this.raf = requestAnimationFrame(() => this.tick());
  }

  tick() {
    this.raf = null;
    this.draw();
    if (this.events.length) this.start(); // keeps running only while notes are on screen
  }

  // ---- drawing ----------------------------------------------------------

  draw() {
    const { ctx, w, h } = this;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.ink;
    ctx.strokeStyle = this.ink;
    ctx.globalAlpha = 1;

    this.drawStaff();

    const now = performance.now();
    const entryX = w - 36;
    const gone = this.clefEnd - 10;

    // Drop notes that have scrolled past the clefs
    this.events = this.events.filter(e => entryX - (now - e.t) * this.speed / 1000 > gone);

    // Group by press time so chords share one x position
    const groups = new Map();
    for (const e of this.events) {
      if (!groups.has(e.t)) groups.set(e.t, []);
      groups.get(e.t).push(e);
    }

    groups.forEach((list, t) => {
      const x = entryX - (now - t) * this.speed / 1000;
      const alpha = Math.max(0, Math.min(1, (x - this.clefEnd) / 50));
      list.sort((a, b) => a.step - b.step);

      // Notes a second apart (or on the same step) would overlap: nudge every other one sideways
      let prevStep = null;
      let prevShifted = false;
      list.forEach(e => {
        const shifted = prevStep !== null && e.step - prevStep <= 1 && !prevShifted;
        this.drawNote(e, x + (shifted ? this.half * 2.5 : 0), alpha);
        prevStep = e.step;
        prevShifted = shifted;
      });
    });

    ctx.globalAlpha = 1;
  }

  drawStaff() {
    const { ctx, w } = this;
    const left = 8;
    const right = w - 8;

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    [[30, 38], [18, 26]].forEach(([low, high]) => {
      for (let s = low; s <= high; s += 2) {
        const y = Math.round(this.y(s)) + 0.5;
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
      }
    });
    // Barline joining the two staves
    ctx.moveTo(left, this.y(38));
    ctx.lineTo(left, this.y(18));
    ctx.stroke();

    this.clefs.forEach(c => {
      if (!c) return;
      ctx.font = `${c.size}px ${CLEF_FONT}`;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText(c.ch, c.x, c.y);
    });
  }

  drawNote(e, x, alpha) {
    const { ctx, half } = this;
    const y = this.y(e.step);
    const rx = half * 1.3;
    const ry = half * 0.95;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.ink;
    ctx.strokeStyle = this.ink;

    // Ledger lines: middle C, above the treble staff, below the bass staff
    const ledgers = [];
    if (e.step === 28) ledgers.push(28);
    for (let s = 40; s <= e.step; s += 2) ledgers.push(s);
    for (let s = 16; s >= e.step; s -= 2) ledgers.push(s);
    if (ledgers.length) {
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ledgers.forEach(s => {
        const ly = Math.round(this.y(s)) + 0.5;
        ctx.moveTo(x - rx * 1.7, ly);
        ctx.lineTo(x + rx * 1.7, ly);
      });
      ctx.stroke();
    }

    // Note head
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (e.sharp) this.drawSharp(x - rx - half * 2.2, y);

    if (this.showNames) {
      ctx.globalAlpha = alpha * 0.7;
      ctx.font = `600 ${Math.max(10, half * 2.3)}px Inter, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(`${e.name}${e.octave}`, x + rx + half * 1.2, y);
    }
    ctx.globalAlpha = 1;
  }

  // Sharp sign drawn from lines, so it does not depend on any font
  drawSharp(x, y) {
    const { ctx, half: s } = this;

    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 2);
    ctx.lineTo(x - s * 0.45, y + s * 2.2);
    ctx.moveTo(x + s * 0.45, y - s * 2.2);
    ctx.lineTo(x + s * 0.45, y + s * 2);
    ctx.stroke();

    ctx.lineWidth = s * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s * 0.3);
    ctx.lineTo(x + s, y - s * 1.0);
    ctx.moveTo(x - s, y + s * 1.05);
    ctx.lineTo(x + s, y + s * 0.35);
    ctx.stroke();
  }
}

// ---- Start-up: connects the staff to the page and to the piano keys ---------

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('staff');
  const piano = document.getElementById('piano');
  if (!canvas || !piano) return;

  const staff = new StaffReel(canvas);

  // "Show note names" checkbox and "Clear" button
  const names = document.getElementById('show-names');
  if (names) {
    names.addEventListener('change', (e) => {
      staff.setShowNames(e.target.checked);
      e.target.blur(); // so the computer-keyboard keys keep working
    });
  }
  const clear = document.getElementById('staff-clear');
  if (clear) {
    clear.addEventListener('click', (e) => {
      staff.clear();
      e.currentTarget.blur();
    });
  }

  // A piano key that gains the "active" class has just been played
  // (mouse, touch, computer keyboard or the demo all do this).
  new MutationObserver((records) => {
    records.forEach((r) => {
      const key = r.target;
      if (!key.classList || !key.classList.contains('active')) return;
      if ((r.oldValue || '').split(/\s+/).includes('active')) return; // was already held
      staff.addNote(key.dataset.note, Number(key.dataset.octave));
    });
  }).observe(piano, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true
  });

  // Changing the Finish rewrites the page's colour variables: redraw in the new colours
  new MutationObserver(() => {
    staff.updateColors();
    staff.draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
});
