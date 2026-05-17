import confetti from 'canvas-confetti';

// Play a cheerful celebration chime using Web Audio API
export const playCelebrationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a sequence of ascending tones for a "success" feel
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (major chord arpeggio)
    
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + (index * 0.1);
      const duration = 0.3;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.log('Audio playback not supported');
  }
};

// Donation celebration - multi-burst effect
export const triggerDonationConfetti = () => {
  // Play celebration sound
  playCelebrationSound();
  
  // First burst - center
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: 0.5, y: 0.7 },
    colors: ['#ec4899', '#f43f5e', '#fbbf24', '#a855f7', '#3b82f6']
  });

  // Second burst - left side (delayed)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#ec4899', '#f43f5e', '#fbbf24']
    });
  }, 150);

  // Third burst - right side (delayed)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#a855f7', '#3b82f6', '#fbbf24']
    });
  }, 300);
};
