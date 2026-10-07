class PianoApp {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.startOctave = 2;
    this.numOctaves = 3;
    this.volume = 0.72;
    this.sustain = 0.4;
    this.reverbAmount = 0.3;
    this.tone = 'piano';
    this.activeNotes = new Map();

    // Scale settings
    this.currentScale = 'major';
    this.rootNote = 'C';
    this.pianoStyle = 'classic';

    this.whiteKeyWidth = 60;
    this.blackKeyWidth = 28.5;
    this.blackKeyOffsetMap = {
      'C#': 0.5,
      'D#': 1.5,
      'F#': 3.5,
      'G#': 4.5,
      'A#': 5.5
    };

    this.noteFrequencies = {
      'C': 16.35, 'C#': 17.32, 'D': 18.35, 'D#': 19.45, 'E': 20.60, 'F': 21.83,
      'F#': 23.12, 'G': 24.50, 'G#': 25.96, 'A': 27.50, 'A#': 29.14, 'B': 30.87
    };

    this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.keyboardMap = {
      'z': 'C', 's': 'C#', 'x': 'D', 'd': 'D#', 'c': 'E', 'v': 'F',
      'g': 'F#', 'b': 'G', 'h': 'G#', 'n': 'A', 'j': 'A#', 'm': 'B'
    };

    this.styleThemes = {
      classic: {
        'bg-1': '#1a0f09',
        'bg-2': '#2d1b12',
        'bg-3': '#3c2617',
        'app-shell-top': 'rgba(111, 71, 49, 0.92)',
        'app-shell-mid': 'rgba(56, 31, 18, 0.92)',
        'app-shell-bottom': 'rgba(28, 16, 11, 0.96)',
        'topbar-top': 'rgba(77, 49, 32, 0.9)',
        'topbar-bottom': 'rgba(46, 27, 17, 0.75)',
        'toolbar-bg-top': 'rgba(101, 63, 42, 0.8)',
        'toolbar-bg-bottom': 'rgba(89, 56, 38, 0.72)',
        'panel-bg-top': 'rgba(53, 31, 22, 0.9)',
        'panel-bg-bottom': 'rgba(29, 17, 12, 0.8)',
        'piano-top': 'rgba(69,42,27,0.98)',
        'piano-mid': 'rgba(42,27,18,0.96)',
        'piano-bottom': 'rgba(21,12,9,0.98)',
        'white-key': '#fefaf4',
        'white-key-2': '#f4ecdf',
        'white-key-3': '#e8dcc4',
        'black-key-1': '#120b08',
        'black-key-2': '#1f130f',
        'black-key-3': '#2d1d15',
        'gold-soft': '#f3d8a6',
        'muted': '#d7b98a',
        'button-grad-1': '#ab6d43',
        'button-grad-2': '#d49d5d',
        'scale-glow': 'rgba(248, 218, 165, 0.45)'
      },
      concert: {
        'bg-1': '#0b1015',
        'bg-2': '#18202a',
        'bg-3': '#202d3d',
        'app-shell-top': 'rgba(18, 24, 32, 0.98)',
        'app-shell-mid': 'rgba(25, 31, 41, 0.96)',
        'app-shell-bottom': 'rgba(9, 12, 18, 1)',
        'topbar-top': 'rgba(24, 32, 42, 0.96)',
        'topbar-bottom': 'rgba(15, 20, 27, 0.9)',
        'toolbar-bg-top': 'rgba(37, 46, 58, 0.92)',
        'toolbar-bg-bottom': 'rgba(20, 28, 35, 0.86)',
        'panel-bg-top': 'rgba(17, 22, 29, 0.9)',
        'panel-bg-bottom': 'rgba(10, 14, 18, 0.92)',
        'piano-top': 'rgba(16, 18, 22, 0.98)',
        'piano-mid': 'rgba(24, 29, 35, 0.98)',
        'piano-bottom': 'rgba(8, 10, 14, 1)',
        'white-key': '#f7f7f9',
        'white-key-2': '#edf0f5',
        'white-key-3': '#dfe5ed',
        'black-key-1': '#05080d',
        'black-key-2': '#111821',
        'black-key-3': '#1b2430',
        'gold-soft': '#dfeaf8',
        'muted': '#b9c8d9',
        'button-grad-1': '#5a7ca8',
        'button-grad-2': '#93b8d9',
        'scale-glow': 'rgba(140, 200, 255, 0.55)'
      },
      vintage: {
        'bg-1': '#230d0b',
        'bg-2': '#3c1b15',
        'bg-3': '#5a2e22',
        'app-shell-top': 'rgba(95, 53, 41, 0.95)',
        'app-shell-mid': 'rgba(73, 37, 29, 0.94)',
        'app-shell-bottom': 'rgba(42, 19, 15, 0.96)',
        'topbar-top': 'rgba(84, 45, 36, 0.92)',
        'topbar-bottom': 'rgba(54, 28, 22, 0.8)',
        'toolbar-bg-top': 'rgba(110, 63, 48, 0.78)',
        'toolbar-bg-bottom': 'rgba(83, 48, 39, 0.74)',
        'panel-bg-top': 'rgba(68, 39, 31, 0.9)',
        'panel-bg-bottom': 'rgba(34, 20, 17, 0.82)',
        'piano-top': 'rgba(58, 31, 24, 0.98)',
        'piano-mid': 'rgba(42, 24, 18, 0.96)',
        'piano-bottom': 'rgba(24, 12, 10, 0.98)',
        'white-key': '#f9f2e8',
        'white-key-2': '#ecddd0',
        'white-key-3': '#dcc4b3',
        'black-key-1': '#120907',
        'black-key-2': '#1b0f0d',
        'black-key-3': '#2b1715',
        'gold-soft': '#f4d5a8',
        'muted': '#d3a07a',
        'button-grad-1': '#a75c3e',
        'button-grad-2': '#d39b63',
        'scale-glow': 'rgba(255, 185, 100, 0.42)'
      },
      modern: {
        'bg-1': '#111720',
        'bg-2': '#1a2430',
        'bg-3': '#2a3340',
        'app-shell-top': 'rgba(31, 39, 48, 0.96)',
        'app-shell-mid': 'rgba(21, 27, 34, 0.94)',
        'app-shell-bottom': 'rgba(12, 17, 22, 0.98)',
        'topbar-top': 'rgba(41, 52, 64, 0.96)',
        'topbar-bottom': 'rgba(25, 34, 41, 0.88)',
        'toolbar-bg-top': 'rgba(60, 72, 82, 0.88)',
        'toolbar-bg-bottom': 'rgba(35, 45, 52, 0.82)',
        'panel-bg-top': 'rgba(21, 28, 35, 0.9)',
        'panel-bg-bottom': 'rgba(12, 17, 21, 0.88)',
        'piano-top': 'rgba(26, 31, 37, 0.98)',
        'piano-mid': 'rgba(19, 23, 28, 0.96)',
        'piano-bottom': 'rgba(8, 11, 15, 1)',
        'white-key': '#f3f6f9',
        'white-key-2': '#e6edf3',
        'white-key-3': '#d7e0e9',
        'black-key-1': '#090d12',
        'black-key-2': '#141c24',
        'black-key-3': '#202d38',
        'gold-soft': '#dfe9f6',
        'muted': '#a9b7c8',
        'button-grad-1': '#6d7f90',
        'button-grad-2': '#adc3d8',
        'scale-glow': 'rgba(170, 214, 255, 0.5)'
      }
    };

    // Scale definitions (intervals from root note in semitones)
    this.scalePatterns = {
      'major': [0, 2, 4, 5, 7, 9, 11],
      'minor': [0, 2, 3, 5, 7, 8, 10],
      'pentatonic-major': [0, 2, 4, 7, 9],
      'pentatonic-minor': [0, 3, 5, 7, 10],
      'blues': [0, 3, 5, 6, 7, 10],
      'dorian': [0, 2, 3, 5, 7, 9, 10],
      'phrygian': [0, 1, 3, 5, 7, 8, 10],
      'lydian': [0, 2, 4, 6, 7, 9, 11],
      'mixolydian': [0, 2, 4, 5, 7, 9, 10]
    };

    this.initAudio();
    this.init();
  }

  applyTheme() {
    const theme = this.styleThemes[this.pianoStyle] || this.styleThemes.classic;
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  initAudio() {
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;

    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = this.reverbAmount;

    this.convolver = this.audioContext.createConvolver();
    const sampleRate = this.audioContext.sampleRate;
    const reverbLength = 2.5;
    const buffer = this.audioContext.createBuffer(2, sampleRate * reverbLength, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      }
    }

    this.convolver.buffer = buffer;
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  init() {
    this.applyTheme();
    this.renderPiano();
    this.setupEventListeners();
  }

  getBlackKeyLeft(note, octave) {
    const whiteOffset = this.blackKeyOffsetMap[note] ?? 0;
    const octaveOffset = (octave - this.startOctave) * 7;
    return ((octaveOffset + whiteOffset) * this.whiteKeyWidth) - (this.blackKeyWidth / 2);
  }

  // Check if a note is in the current scale
  isNoteInScale(note, octave) {
    const noteIndex = this.notes.indexOf(note);
    const rootIndex = this.notes.indexOf(this.rootNote);
    const pattern = this.scalePatterns[this.currentScale];

    // Calculate the semitone distance from the root note
    let distance = (noteIndex - rootIndex + 12) % 12;

    return pattern.includes(distance);
  }

  renderPiano() {
    const pianoContainer = document.getElementById('piano');
    pianoContainer.innerHTML = '';
    pianoContainer.style.display = 'flex';
    pianoContainer.style.position = 'relative';
    pianoContainer.style.width = '100%';
    pianoContainer.style.gap = '0';

    for (let octave = this.startOctave; octave < this.startOctave + this.numOctaves; octave++) {
      this.notes.forEach(note => {
        const isBlackKey = note.includes('#');
        const keyElement = document.createElement('button');
        const noteId = `${note}-${octave}`;
        const inScale = this.isNoteInScale(note, octave);

        keyElement.className = `key ${isBlackKey ? 'black-key' : 'white-key'} ${inScale ? 'in-scale' : 'out-of-scale'}`;
        keyElement.dataset.note = note;
        keyElement.dataset.octave = octave;
        keyElement.dataset.noteId = noteId;

        if (isBlackKey) {
          keyElement.style.left = `${this.getBlackKeyLeft(note, octave)}px`;
        }

        keyElement.addEventListener('mousedown', () => this.playNote(note, octave, keyElement));
        keyElement.addEventListener('mouseup', () => this.stopNote(noteId, keyElement));
        keyElement.addEventListener('mouseleave', () => this.stopNote(noteId, keyElement));
        keyElement.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.playNote(note, octave, keyElement);
        });
        keyElement.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.stopNote(noteId, keyElement);
        });

        pianoContainer.appendChild(keyElement);
      });
    }
  }

  getToneSettings() {
    if (this.tone === 'bright') {
      return {
        attack: 0.006,
        decay: 0.18,
        release: 1.2 + this.sustain * 2.6,
        harmonicMix: 0.82,
        filterCutoff: 5200
      };
    }

    if (this.tone === 'warm') {
      return {
        attack: 0.01,
        decay: 0.24,
        release: 1.6 + this.sustain * 3.2,
        harmonicMix: 0.46,
        filterCutoff: 3000
      };
    }

    return {
      attack: 0.008,
      decay: 0.15,
      release: 1.3 + this.sustain * 3,
      harmonicMix: 0.68,
      filterCutoff: 3600
    };
  }

  playNote(note, octave, keyElement) {
    const noteId = `${note}-${octave}`;
    if (this.activeNotes.has(noteId)) return;

    const frequency = this.getFrequency(note, octave);
    const settings = this.getToneSettings();
    const now = this.audioContext.currentTime;

    const masterGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const mixGain = this.audioContext.createGain();

    filter.type = 'lowpass';
    filter.frequency.value = settings.filterCutoff;
    filter.Q.value = 0.7;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc3.type = 'sine';

    osc1.frequency.value = frequency;
    osc2.frequency.value = frequency * 2;
    osc3.frequency.value = frequency * 3;

    osc2.detune.value = 4;
    osc3.detune.value = -2;

    const oscGain1 = this.audioContext.createGain();
    const oscGain2 = this.audioContext.createGain();
    const oscGain3 = this.audioContext.createGain();

    const energy = 0.7 + this.volume * 0.8;

    oscGain1.gain.setValueAtTime(0.0001, now);
    oscGain2.gain.setValueAtTime(0.0001, now);
    oscGain3.gain.setValueAtTime(0.0001, now);

    oscGain1.gain.exponentialRampToValueAtTime(energy * 0.9, now + settings.attack);
    oscGain2.gain.exponentialRampToValueAtTime(energy * settings.harmonicMix, now + settings.attack + settings.decay);
    oscGain3.gain.exponentialRampToValueAtTime(energy * 0.42, now + settings.attack + settings.decay * 0.7);

    osc1.connect(oscGain1);
    osc2.connect(oscGain2);
    osc3.connect(oscGain3);

    oscGain1.connect(filter);
    oscGain2.connect(filter);
    oscGain3.connect(filter);

    filter.connect(mixGain);
    mixGain.connect(this.convolver);
    mixGain.connect(this.masterGain);

    const voice = {
      oscillators: [osc1, osc2, osc3],
      gain: mixGain
    };

    this.activeNotes.set(noteId, voice);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    keyElement.classList.add('active');
    document.getElementById('note-display').textContent = `${note} ${octave}`;
  }

  stopNote(noteId, keyElement) {
    const voice = this.activeNotes.get(noteId);
    if (!voice) return;

    const now = this.audioContext.currentTime;
    const release = 1 + this.sustain * 3.2;

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value || 0.0001, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    voice.oscillators.forEach(osc => {
      osc.stop(now + release + 0.2);
    });

    this.activeNotes.delete(noteId);
    keyElement.classList.remove('active');
  }

  getFrequency(note, octave) {
    const baseFreq = this.noteFrequencies[note];
    const octaveMultiplier = Math.pow(2, octave);
    return baseFreq * octaveMultiplier;
  }

  setupEventListeners() {
    document.getElementById('scale-select').addEventListener('change', (e) => {
      this.currentScale = e.target.value;
      this.renderPiano();
    });

    document.getElementById('root-note-select').addEventListener('change', (e) => {
      this.rootNote = e.target.value;
      this.renderPiano();
    });

    document.getElementById('style-select').addEventListener('change', (e) => {
      this.pianoStyle = e.target.value;
      this.applyTheme();
      this.renderPiano();
    });

    document.getElementById('volume').addEventListener('input', (e) => {
      this.volume = e.target.value / 100;
      this.masterGain.gain.value = this.volume;
    });

    document.getElementById('sustain').addEventListener('input', (e) => {
      this.sustain = e.target.value / 100;
    });

    document.getElementById('reverb').addEventListener('input', (e) => {
      this.reverbAmount = e.target.value / 100;
      this.reverbGain.gain.value = this.reverbAmount;
    });

    document.getElementById('tone').addEventListener('change', (e) => {
      this.tone = e.target.value;
    });

    document.getElementById('demo-btn').addEventListener('click', () => this.playDemo());

    document.addEventListener('keydown', (e) => {
      const note = this.keyboardMap[e.key.toLowerCase()];
      if (!note) return;

      const keyElement = document.querySelector(`[data-note="${note}"]`);
      if (!keyElement) return;

      const octave = parseInt(keyElement.dataset.octave, 10);
      const noteId = `${note}-${octave}`;
      if (!this.activeNotes.has(noteId)) {
        this.playNote(note, octave, keyElement);
      }
    });

    document.addEventListener('keyup', (e) => {
      const note = this.keyboardMap[e.key.toLowerCase()];
      if (!note) return;

      const keyElement = document.querySelector(`[data-note="${note}"]`);
      if (!keyElement) return;

      const octave = parseInt(keyElement.dataset.octave, 10);
      const noteId = `${note}-${octave}`;
      this.stopNote(noteId, keyElement);
    });
  }

  playDemo() {
    const demoSequence = [
      { note: 'C', octave: this.startOctave },
      { note: 'E', octave: this.startOctave },
      { note: 'G', octave: this.startOctave },
      { note: 'C', octave: this.startOctave + 1 }
    ];

    let delay = 0;

    demoSequence.forEach(({ note, octave }) => {
      setTimeout(() => {
        const noteId = `${note}-${octave}`;
        const keyElement = document.querySelector(`[data-noteId="${noteId}"]`);
        if (keyElement) {
          this.playNote(note, octave, keyElement);
          setTimeout(() => this.stopNote(noteId, keyElement), 300 + this.sustain * 600);
        }
      }, delay);
      delay += 400;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PianoApp();
});
