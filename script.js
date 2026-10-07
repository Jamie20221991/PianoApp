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

    this.initAudio();
    this.init();
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
    this.renderPiano();
    this.setupEventListeners();
  }

  getBlackKeyLeft(note, octave) {
    const whiteOffset = this.blackKeyOffsetMap[note] ?? 0;
    const octaveOffset = (octave - this.startOctave) * 7;
    return ((octaveOffset + whiteOffset) * this.whiteKeyWidth) - (this.blackKeyWidth / 2);
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

        keyElement.className = `key ${isBlackKey ? 'black-key' : 'white-key'}`;
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
    document.getElementById('octave-down').addEventListener('click', () => this.shiftOctaves(-1));
    document.getElementById('octave-up').addEventListener('click', () => this.shiftOctaves(1));

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

  shiftOctaves(direction) {
    this.startOctave += direction;
    this.startOctave = Math.max(1, Math.min(5, this.startOctave));
    document.getElementById('octave-label').textContent = `Octaves ${this.startOctave}-${this.startOctave + this.numOctaves - 1}`;
    this.renderPiano();
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
