(function() {
  'use strict';

  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // Get canvas element
    const canvas = document.getElementById('logo-canvas');
    if (!canvas) {
      console.error('Logo canvas element not found');
      return;
    }

    // Configuration
    const config = {
      backfaceTexts: [
        'Fullstack Consultant',
        'Had a lot of fun making this',
        'Despises React',
        'Cats > Dogs',
        'Prefers KnockoutJS',
        'Friends are like family',
        'Bun is awesome!',
        'Happiness comes from gratitude',
        'uv is awesome!',
        "Earth's diameter is 12,756 km",
        'Elixir is awesome!',
        "Where's the Level 5 self driving Mr. Musk?",
        'Made w/ Zdog and Zfont',
      ],
      rotationSpeed: 0.008,
    };

    try {
      // Initialize Zfont plugin
      Zfont.init(Zdog);

      // Load font
      const font = new Zdog.Font({
        src: '/fonts/Roboto-Regular.ttf'
      });

      await Zdog.waitForFonts();
      console.log('Font loaded successfully');

      // Create Zdog scene
      const illo = new Zdog.Illustration({
        element: canvas,
        dragRotate: false,
        resize: true,
        rotate: { x: -0.2 }, // Slight tilt for depth
      });

      // Create oval backdrop (middle layer)
      const oval = new Zdog.Ellipse({
        addTo: illo,
        width: 150 * Math.PI,
        height: 150,
        stroke: 30,
        color: '#4e7ad4',
        fill: true,
      });

      // Create front text (always visible)
      const frontText = new Zdog.Text({
        addTo: illo,
        font: font,
        value: 'Gonzalo Andreani',
        fontSize: 48,
        color: '#333',
        fill: true,
        translate: { z: 50 },
        textAlign: 'center',
      });

      // Create back text (rotates through list)
      const backText = new Zdog.Text({
        addTo: illo,
        font: font,
        value: config.backfaceTexts[0],
        fontSize: 32,
        color: '#333',
        fill: true,
        translate: { z: -50 },
        rotate: { y: Math.PI },  // Flip 180° so it reads correctly when scene rotates
        textAlign: 'center',
      });

      // Animation state
      let lastSpinCount = 0;

      // Animation loop
      function animate() {
        // Rotate scene
        illo.rotate.y += config.rotationSpeed;

        // Calculate number of full rotations (spins)
        const currentSpinCount = Math.floor(illo.rotate.y / (Math.PI * 2));

        // Switch text every 2 full spins (when back text is hidden by ellipse)
        if (currentSpinCount !== lastSpinCount) {
          backText.value = config.backfaceTexts[Math.floor(Math.random() * config.backfaceTexts.length)];
          lastSpinCount = currentSpinCount;
        }

        // Update scene
        illo.updateRenderGraph();

        // Continue animation
        requestAnimationFrame(animate);
      }

      // Start animation
      animate();

    } catch (error) {
      console.error('Error initializing logo animation:', error);
      // Fallback: just render a static canvas or leave it blank
    }
  }
})();
