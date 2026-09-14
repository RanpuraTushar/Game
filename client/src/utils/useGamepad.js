// client/src/utils/useGamepad.js
// HTML5 Gamepad API Controller Engine for Neon Arcade
// Maps Xbox & PlayStation controllers to synthetic keyboard events so ALL games work out-of-the-box!

import { useState, useEffect, useRef } from 'react';

const AXIS_THRESHOLD = 0.45;

export function useGamepad() {
  const [controllerName, setControllerName] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const activeKeysRef = useRef(new Set());
  const rAFRef = useRef(null);

  useEffect(() => {
    const handleGamepadConnected = (e) => {
      const pad = e.gamepad;
      const name = pad.id.replace(/\(.*?\)/g, '').trim() || 'Standard Controller';
      setControllerName(name);
      setToastMessage(`🎮 Controller Connected: ${name}`);
      setTimeout(() => setToastMessage(null), 3500);
    };

    const handleGamepadDisconnected = () => {
      setControllerName(null);
      setToastMessage('🎮 Controller Disconnected');
      setTimeout(() => setToastMessage(null), 3000);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Continuous Polling Loop
    const dispatchKey = (code, key, isDown) => {
      const hasKey = activeKeysRef.current.has(code);
      if (isDown && !hasKey) {
        activeKeysRef.current.add(code);
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));
      } else if (!isDown && hasKey) {
        activeKeysRef.current.delete(code);
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true }));
      }
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activePad = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          activePad = gamepads[i];
          break;
        }
      }

      if (activePad) {
        const b = activePad.buttons;
        const axes = activePad.axes;

        // D-Pad or Left Stick - Left / Right
        const leftDown = (b[14] && b[14].pressed) || (axes[0] && axes[0] < -AXIS_THRESHOLD);
        const rightDown = (b[15] && b[15].pressed) || (axes[0] && axes[0] > AXIS_THRESHOLD);
        dispatchKey('ArrowLeft', 'ArrowLeft', leftDown);
        dispatchKey('KeyA', 'a', leftDown);
        dispatchKey('ArrowRight', 'ArrowRight', rightDown);
        dispatchKey('KeyD', 'd', rightDown);

        // D-Pad or Left Stick - Up / Down
        const upDown = (b[12] && b[12].pressed) || (axes[1] && axes[1] < -AXIS_THRESHOLD);
        const downDown = (b[13] && b[13].pressed) || (axes[1] && axes[1] > AXIS_THRESHOLD);
        dispatchKey('ArrowUp', 'ArrowUp', upDown);
        dispatchKey('KeyW', 'w', upDown);
        dispatchKey('ArrowDown', 'ArrowDown', downDown);
        dispatchKey('KeyS', 's', downDown);

        // Action Buttons:
        // A Button (Btn 0) or Right Trigger (Btn 7) -> Space
        const spaceDown = (b[0] && b[0].pressed) || (b[7] && b[7].pressed);
        dispatchKey('Space', ' ', spaceDown);

        // B Button (Btn 1) -> Escape / Back
        const bDown = b[1] && b[1].pressed;
        dispatchKey('Escape', 'Escape', bDown);

        // X Button (Btn 2) -> KeyK / KeyE (Slash / Item)
        const xDown = b[2] && b[2].pressed;
        dispatchKey('KeyK', 'k', xDown);
        dispatchKey('KeyE', 'e', xDown);

        // Y Button (Btn 3) -> KeyC (Hold piece)
        const yDown = b[3] && b[3].pressed;
        dispatchKey('KeyC', 'c', yDown);
      }

      rAFRef.current = requestAnimationFrame(pollGamepad);
    };

    rAFRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, []);

  return { controllerName, toastMessage };
}
