import confetti from 'canvas-confetti';

/**
 * Dispara confettis festivos quando o aluno tira uma nota excelente (>= 17.5) ou bate a meta
 */
export function triggerCelebration() {
  try {
    // Left burst
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#0A84FF', '#30D158', '#FFD60A', '#BF5AF2', '#FF375F'],
    });

    // Right burst
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#0A84FF', '#30D158', '#FFD60A', '#BF5AF2', '#FF375F'],
    });
  } catch {
    // Silently ignore if canvas fails
  }
}
