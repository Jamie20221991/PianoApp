// Piano App JavaScript
class PianoApp {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.currentOctave = 4;
    this.volume = 0.72;
    this.activeNotes = new Map();
    
    // Note frequencies for A0 (27.5 Hz) and above
    this.noteFrequencies = {
      'C': 16.35, 'C#': 17.32, 'D': 18.35, 'D#': 19.45, 'E': 20.60, 'F': 21.83,
      'F#': 23.12, 'G': 24.50, 'G#': 25.96, 'A': 27.50, 'A#': 29.14, 'B': 30.87
    };
    
    this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.keyboardMap = {
      'z': 'C', 's': 'C#', 'x': 'D', 'd': 'D#', 'c': 'E', 'v': 'F',
      'g': 'F#', 'b': 'G', 'h': 'G#', 'n': 'A', 'j': 'A#', 'm': 'B'
    };
    
    this.init();
  }
  
  init() {
    this.renderPiano();
    this.setupEventListeners();
  }
  
  renderPiano() {
    const pianoContainer = document.getElementById('piano');
    pianoContainer.innerHTML = '';
    
    // Create keys for current octave
    this.notes.forEach(note => {
      const isBlackKey = note.includes('#');
      const keyElement = document.createElement('button');
      keyElement.className = `key ${isBlackKey ? 'black-key' : 'white-key'}`;
      keyElement.textContent = note;
      keyElement.dataset.note = note;
      keyElement.dataset.frequency = this.getFrequency(note);
      
      keyElement.addEventListener('mousedown', () => this.playNote(note, keyElement));
      keyElement.addEventListener('mouseup', () => this.stopNote(note, keyElement));
      keyElement.addEventListener('mouseleave', () => this.stopNote(note, keyElement));
      keyElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.playNote(note, keyElement);
      });
      keyElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.stopNote(note, keyElement);
      });
      
      pianoContainer.appendChild(keyElement);
    });
  }
  
  getFrequency(note) {
    const baseFreq = this.noteFrequencies[note];
    const octaveMultiplier = Math.pow(2, this.currentOctave);
    return baseFreq * octaveMultiplier;
  }
  
  playNote(note, keyElement) {
    if (this.activeNotes.has(note)) return; // Prevent multiple simultaneous plays
    
    const frequency = this.getFrequency(note);
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = this.volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    
    this.activeNotes.set(note, { oscillator, gainNode });
    keyElement.classList.add('active');
    
    // Update note display
    document.getElementById('note-display').textContent = `${note} ${this.currentOctave}`;
  }
  
  stopNote(note, keyElement) {
    const noteData = this.activeNotes.get(note);
    if (!noteData) return;
    
    const { oscillator, gainNode } = noteData;
    
    // Fade out
    gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    setTimeout(() => oscillator.stop(), 100);
    
    this.activeNotes.delete(note);
    keyElement.classList.remove('active');
  }
  
  setupEventListeners() {
    // Octave controls
    document.getElementById('octave-down').addEventListener('click', () => this.changeOctave(-1));
    document.getElementById('octave-up').addEventListener('click', () => this.changeOctave(1));
    
    // Volume control
    document.getElementById('volume').addEventListener('input', (e) => {
      this.volume = e.target.value / 100;
      // Update all active notes
      this.activeNotes.forEach(({ gainNode }) => {
        gainNode.gain.value = this.volume;
      });
    });
    
    // Demo button
    document.getElementById('demo-btn').addEventListener('click', () => this.playDemo());
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      const note = this.keyboardMap[e.key.toLowerCase()];
      if (note && !this.activeNotes.has(note)) {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) this.playNote(note, keyElement);
      }
    });
    
    document.addEventListener('keyup', (e) => {
      const note = this.keyboardMap[e.key.toLowerCase()];
      if (note) {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) this.stopNote(note, keyElement);
      }
    });
  }
  
  changeOctave(direction) {
    this.currentOctave += direction;
    this.currentOctave = Math.max(1, Math.min(8, this.currentOctave));
    document.getElementById('octave-label').textContent = `Octave ${this.currentOctave}`;
    this.renderPiano();
  }
  
  playDemo() {
    const demoSequence = ['C', 'E', 'G', 'C'];
    let delay = 0;
    
    demoSequence.forEach((note) => {
      setTimeout(() => {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        this.playNote(note, keyElement);
        setTimeout(() => this.stopNote(note, keyElement), 300);
      }, delay);
      delay += 400;
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PianoApp();
});
