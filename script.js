// Piano App JavaScript
class PianoApp {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.startOctave = 2; // Start from octave 2
    this.numOctaves = 3; // Display 4 octaves
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
    pianoContainer.style.display = 'flex';
    pianoContainer.style.position = 'relative';
    pianoContainer.style.width = '100%';
    pianoContainer.style.height = '120px';
    
    // Create keys for all 4 octaves
    for (let octave = this.startOctave; octave < this.startOctave + this.numOctaves; octave++) {
      this.notes.forEach(note => {
        const isBlackKey = note.includes('#');
        const keyElement = document.createElement('button');
        
        const noteId = `${note}-${octave}`;
        keyElement.className = `key ${isBlackKey ? 'black-key' : 'white-key'}`;
        keyElement.textContent = '';
        keyElement.dataset.note = note;
        keyElement.dataset.octave = octave;
        keyElement.dataset.noteId = noteId;
        keyElement.dataset.frequency = this.getFrequency(note, octave);
        
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
  
  getFrequency(note, octave) {
    const baseFreq = this.noteFrequencies[note];
    const octaveMultiplier = Math.pow(2, octave);
    return baseFreq * octaveMultiplier;
  }
  
  playNote(note, octave, keyElement) {
    const noteId = `${note}-${octave}`;
    if (this.activeNotes.has(noteId)) return; // Prevent multiple simultaneous plays
    
    const frequency = this.getFrequency(note, octave);
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = this.volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    
    this.activeNotes.set(noteId, { oscillator, gainNode });
    keyElement.classList.add('active');
    
    // Update note display
    document.getElementById('note-display').textContent = `${note} ${octave}`;
  }
  
  stopNote(noteId, keyElement) {
    const noteData = this.activeNotes.get(noteId);
    if (!noteData) return;
    
    const { oscillator, gainNode } = noteData;
    
    // Fade out
    gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    setTimeout(() => oscillator.stop(), 100);
    
    this.activeNotes.delete(noteId);
    keyElement.classList.remove('active');
  }
  
  setupEventListeners() {
    // Octave controls - change starting octave
    document.getElementById('octave-down').addEventListener('click', () => this.shiftOctaves(-1));
    document.getElementById('octave-up').addEventListener('click', () => this.shiftOctaves(1));
    
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
      if (note) {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
          const octave = parseInt(keyElement.dataset.octave);
          const noteId = `${note}-${octave}`;
          if (!this.activeNotes.has(noteId)) {
            this.playNote(note, octave, keyElement);
          }
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      const note = this.keyboardMap[e.key.toLowerCase()];
      if (note) {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
          const octave = parseInt(keyElement.dataset.octave);
          const noteId = `${note}-${octave}`;
          this.stopNote(noteId, keyElement);
        }
      }
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
          setTimeout(() => this.stopNote(noteId, keyElement), 300);
        }
      }, delay);
      delay += 400;
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PianoApp();
});
