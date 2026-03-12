export function triggerHaptic(controller, intensity = 0.5, duration = 100) {
  if (!controller || !controller.gamepad) return;
  
  const gamepad = controller.gamepad;
  if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
    const hapticActuator = gamepad.hapticActuators[0];
    if (hapticActuator) {
      hapticActuator.pulse(intensity, duration);
    }
  }
}

export function triggerHapticPattern(controller, pattern = []) {
  if (!controller || !controller.gamepad) return;
  
  const gamepad = controller.gamepad;
  if (!gamepad.hapticActuators || gamepad.hapticActuators.length === 0) return;
  
  const hapticActuator = gamepad.hapticActuators[0];
  if (!hapticActuator) return;
  
  let delay = 0;
  for (const pulse of pattern) {
    setTimeout(() => {
      hapticActuator.pulse(pulse.intensity, pulse.duration);
    }, delay);
    delay += pulse.duration + pulse.gap || 0;
  }
}

export const HapticPatterns = {
  shoot: [
    { intensity: 0.8, duration: 50 }
  ],
  hit: [
    { intensity: 1.0, duration: 30, gap: 20 },
    { intensity: 0.5, duration: 30 }
  ],
  miss: [
    { intensity: 0.2, duration: 100 }
  ],
  reload: [
    { intensity: 0.3, duration: 50, gap: 50 },
    { intensity: 0.3, duration: 50, gap: 50 },
    { intensity: 0.5, duration: 100 }
  ],
  empty: [
    { intensity: 0.1, duration: 50 }
  ],
  waveComplete: [
    { intensity: 0.5, duration: 100, gap: 50 },
    { intensity: 0.7, duration: 100, gap: 50 },
    { intensity: 1.0, duration: 200 }
  ]
};
