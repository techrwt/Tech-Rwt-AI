/* ============================================
   TECH RWT AI — welcome.js
   Robot intro + Hindi typing effect + auto-transition
   Runs EVERY time index.html loads (no storage flag)
   ============================================ */

(function () {
  "use strict";

  const overlay = document.getElementById("welcome-overlay");
  if (!overlay) return; // safety: only runs if overlay markup exists (homepage only)

  const typingEl = document.getElementById("welcome-typing-text");
  const cursorEl = document.getElementById("welcome-cursor");

  const MESSAGE = "टेक रावत AI की दुनिया में आपका स्वागत है";
  const TYPE_SPEED_MS = 65;      // per character
  const PAUSE_AFTER_TYPE_MS = 900;  // pause before transitioning
  const FADE_DURATION_MS = 600;     // must match CSS transition duration

  document.body.classList.add("welcome-active");

  let index = 0;

  function typeNextChar() {
    if (index < MESSAGE.length) {
      typingEl.textContent += MESSAGE.charAt(index);
      index++;
      setTimeout(typeNextChar, TYPE_SPEED_MS);
    } else {
      // typing complete -> pause -> transition to homepage
      setTimeout(finishWelcome, PAUSE_AFTER_TYPE_MS);
    }
  }

  function finishWelcome() {
    if (cursorEl) cursorEl.style.display = "none";
    overlay.classList.add("hide");
    document.body.classList.remove("welcome-active");

    // Remove overlay from DOM after fade-out completes
    setTimeout(() => {
      overlay.remove();
    }, FADE_DURATION_MS);
  }

  // Kick off typing after a short beat so the robot animation is visible first
  setTimeout(typeNextChar, 500);
})();
