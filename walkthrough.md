# Cinematic Typography Sequence Walkthrough

A premium, single-file cinematic typography overlay has been designed and implemented in [index.html](file:///c:/Users/prath/OneDrive/Desktop/Netra_Again/index.html). It matches the required tech-cyber aesthetic, offering visual presentation layers and complete control over navigation.

---

## 💎 Features & Implementation Details

### 1. Slide-Based Crossfade Transitions
- Transitions use hardware-accelerated CSS transforms (`translateY`, `scale`) and filters (`blur`, `opacity`).
- **Dynamic Directional Physics**:
  - Moving **forward** (Next) slides the old text upward, and brings the new text up from the bottom.
  - Moving **backward** (Prev) slides the old text downward, and pulls the new text down from the top.
- **Transition Locks**: Keyboard and input events are debounced and locked during the 800ms transition to prevent overlapping animations or rapid skip glitches.

### 2. Live Golden Particle Simulation (Embers/Bokeh)
- An optimized canvas loops continuously at **60 FPS** in the background.
- Embers drift upward with horizontal sine-wave oscillation (drift) and varied vertical speeds.
- Particles are rate-adjusted using delta-time normalization, ensuring the speed is identical on **60Hz, 120Hz, or 144Hz** monitors.
- Larger particles feature an out-of-focus bokeh blur and lower opacity for cinematic depth.
- Embers fade in at the bottom and fade out near the top 25% of the screen.

### 3. Multi-Modal Navigation
- **Keyboard**: Right Arrow (→), Space, or Enter to go forward; Left Arrow (←) to go backward.
- **Mouse Wheel / Trackpad**: Scroll vertically or horizontally to transition slides (with delta-threshold filter to prevent bounce triggers).
- **Touch Screen Swipes**: Slide left/up for next, and right/down for previous.
- **Interactive UI**: Custom, sleek progress indicator dots at the bottom of the viewport that highlight the current slide and allow instant jumping to any index. Hover-revealed side navigation arrows are also available.

### 4. Special Final Logo Reveal
- The final slide features a sequential reveal sequence for **NETRA**:
  1. Title **NETRA** fades in and scales down to normal size with a blue backing glow.
  2. Subtitle **Network Enabled Tracking & Reconnaissance Analysis** blurs in after 1.0s.
  3. A horizontal divider expands from the center at 1.4s.
  4. Tagline **Seeing Beyond the Visible.** fades in at 2.1s.
  5. An elegant **Restart Sequence** button fades in last at 3.0s, allowing the user to replay the sequence.

### 5. Preview Background Toggle
- Since the text is white and the background must be transparent for video overlay usage, opening the file directly in a web browser can make the text invisible on default white pages.
- A clean, low-profile **Preview BG** toggle is placed in the top right corner.
  - **ON** (default): Renders a deep royal blue radial gradient that matches the provided background image.
  - **OFF**: Sets the page background to `transparent`, allowing it to serve as a clean source file for OBS overlays, video embeds, or custom frames.

### 6. Embedded Security Slide
- Integrated **"Protected by Secured Coding layer"** as Slide 13 in the main cinematic sequence.
- This slide blends naturally with the rest of the text overlays, fading in with the custom scale/blur animation before transitioning into "From Images... to Intelligence." and the final NETRA reveal.

---

## 🛠️ Verification & Usage

You can open the standalone file directly:
- **Location**: [index.html](file:///c:/Users/prath/OneDrive/Desktop/Netra_Again/index.html)

No build steps are required. Simply open `index.html` in Chrome, Safari, Edge, or Firefox.
