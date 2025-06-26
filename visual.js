document.addEventListener("DOMContentLoaded", function () {
  // Canvas setup
  const canvas = document.getElementById("visualizer-canvas");
  const ctx = canvas.getContext("2d");
  const centerDisplay = document.getElementById("center-display");
  const modeDisplay = document.getElementById("visualization-mode");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorMessage = document.getElementById("error-message");
  const errorDetails = document.getElementById("error-details");
  const intensityValue = document.getElementById("intensity-value");
  const visSelector = document.getElementById("visualization-selector");
  const visButtons = visSelector.querySelectorAll(".vis-select-btn");

  let audioContext;
  let audioSource;
  let analyser;
  let animationId;
  let particles = [];
  let audioElement;
  let isPlaying = false;
  let currentMode = 2; // Start with Quantum Vortex
  let modeNames = [
    "GALACTIC WAVES",
    "NEURAL PATTERNS",
    "QUANTUM VORTEX",
    "COSMIC RHYTHMS",
    "STELLAR RESONANCE",
  ];

  // Audio data arrays
  let frequencyData;
  let timeDomainData;
  const bufferLength = 256;

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Tab functionality
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");

      // Hide all tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Show corresponding content
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });

  // Visualization selector
  visButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      visButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = parseInt(btn.getAttribute("data-mode"));
      modeDisplay.textContent = modeNames[currentMode];
      modeDisplay.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
      particles = [];
    });
  });

  // Fullscreen functionality
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  fullscreenBtn.addEventListener("click", function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Audio upload
  const uploadBtn = document.getElementById("upload-btn");
  const audioUpload = document.getElementById("audio-upload");
  uploadBtn.addEventListener("click", function () {
    audioUpload.click();
  });

  audioUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      loadAudio(url);
    }
  });

  // Demo buttons
  const demoBtn = document.getElementById("demo-btn");
  const demoBtn2 = document.getElementById("demo-btn2");
  demoBtn.addEventListener("click", loadDemo);
  demoBtn2.addEventListener("click", loadDemo);

  function loadDemo() {
    // Using a public domain music track for demo
    loadAudio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  }

  // YouTube functionality
  const youtubeBtn = document.getElementById("youtube-btn");
  youtubeBtn.addEventListener("click", function () {
    const youtubeUrl = document.getElementById("youtube-url").value;
    if (!youtubeUrl) {
      showError("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      showError("Invalid YouTube URL");
      return;
    }

    loadYouTube(videoId);
  });

  // Retry button
  const retryBtn = document.getElementById("retry-btn");
  retryBtn.addEventListener("click", function () {
    errorMessage.style.display = "none";
    centerDisplay.style.display = "block";
  });

  // Extract YouTube video ID from URL
  function extractVideoId(url) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  // Show error message
  function showError(message) {
    errorDetails.textContent = message;
    errorMessage.style.display = "block";
    centerDisplay.style.display = "none";
    loadingIndicator.style.display = "none";
  }

  // Hide UI elements and show loading
  function showLoading() {
    centerDisplay.style.opacity = "0";
    centerDisplay.style.pointerEvents = "none";
    centerDisplay.style.display = "none";
    loadingIndicator.style.display = "block";
    errorMessage.style.display = "none";
  }

  // Load audio from URL
  function loadAudio(url) {
    showLoading();

    try {
      // Create audio context if not exists
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Stop any existing audio
      if (audioSource) {
        audioSource.disconnect();
      }

      // Create audio element
      if (audioElement) {
        audioElement.pause();
        audioElement = null;
      }

      audioElement = new Audio();
      audioElement.crossOrigin = "anonymous";
      audioElement.src = url;

      // Create audio source
      audioSource = audioContext.createMediaElementSource(audioElement);

      // Create analyser
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      timeDomainData = new Uint8Array(analyser.frequencyBinCount);

      // Connect nodes
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);

      // Start playback
      const playPromise = audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            startVisualization();
            loadingIndicator.style.display = "none";
          })
          .catch((err) => {
            showError("Failed to play audio: " + err.message);
          });
      }
    } catch (err) {
      showError("Audio initialization error: " + err.message);
    }
  }

  // Generate fake frequency data for visualization
  function generateFakeFrequencyData() {
    const data = new Uint8Array(bufferLength);
    const time = Date.now() * 0.001;

    // Base pattern
    const base = Math.sin(time * 2) * 50 + 150;

    for (let i = 0; i < bufferLength; i++) {
      // Add patterns and noise
      const value =
        base +
        Math.sin(i * 0.1 + time * 5) * 30 +
        Math.sin(i * 0.05 + time * 2) * 20;

      data[i] = Math.min(255, Math.max(0, value));
    }
    return data;
  }

  // Load YouTube video
  function loadYouTube(videoId) {
    showLoading();

    // Remove existing player if exists
    if (window.YTPlayer) {
      window.YTPlayer.destroy();
      window.YTPlayer = null;
    }

    // Create YouTube player container
    const playerContainer = document.getElementById("youtube-player");
    playerContainer.innerHTML = '<div id="player"></div>';

    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Set up callback
      window.onYouTubeIframeAPIReady = function () {
        createYouTubePlayer(videoId);
      };
    } else {
      // If API is already loaded, create player
      createYouTubePlayer(videoId);
    }
  }

  // Create YouTube player
  function createYouTubePlayer(videoId) {
    window.YTPlayer = new YT.Player("player", {
      height: "0",
      width: "0",
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        enablejsapi: 1,
        autoplay: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  }

  function onPlayerReady(event) {
    event.target.playVideo();
    isPlaying = true;
    startVisualization();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      loadingIndicator.style.display = "none";
      startVisualization();
    } else if (event.data === YT.PlayerState.PAUSED) {
      isPlaying = false;
    } else if (event.data === YT.PlayerState.ENDED) {
      isPlaying = false;
    }
  }

  function onPlayerError(event) {
    showError("YouTube Player Error: " + event.data);
  }

  // Start visualization
  function startVisualization() {
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(visualize);
  }

  // Visualization function
  function visualize() {
    // Get audio data if available
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
    } else if (window.YTPlayer && window.YTPlayer.getPlayerState) {
      // Generate fake frequency data for YouTube
      frequencyData = generateFakeFrequencyData();
    } else {
      // Generate fake data for other cases
      frequencyData = generateFakeFrequencyData();
    }

    // Calculate intensity
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    const avg = sum / frequencyData.length;
    const intensity = Math.min(100, Math.round(avg / 2.55));
    intensityValue.textContent = `${intensity}%`;

    // Clear canvas
    ctx.fillStyle = "rgba(0, 5, 15, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update visualization mode every 15 seconds
    if (Math.floor(Date.now() / 15000) % 5 !== currentMode) {
      currentMode = Math.floor(Date.now() / 15000) % 5;
      modeDisplay.textContent = modeNames[currentMode];
      modeDisplay.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
      particles = [];

      // Update active button
      visButtons.forEach((btn) => {
        btn.classList.toggle(
          "active",
          parseInt(btn.getAttribute("data-mode")) === currentMode
        );
      });
    }

    // Draw visualization based on current mode
    switch (currentMode) {
      case 0:
        drawGalacticWaves();
        break;
      case 1:
        drawNeuralPatterns();
        break;
      case 2:
        drawQuantumVortex();
        break;
      case 3:
        drawCosmicRhythms();
        break;
      case 4:
        drawStellarResonance();
        break;
    }

    animationId = requestAnimationFrame(visualize);
  }

  // Visualization 1: Galactic Waves -- version 1 OG
  // function drawGalacticWaves() {
  //   const centerX = canvas.width / 2;
  //   const centerY = canvas.height / 2;
  //   const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
  //   const time = Date.now() * 0.001;
  //   const bassIntensity = frequencyData
  //     ? frequencyData[5] / 255
  //     : Math.sin(time) * 0.5 + 0.5;
  //   const trebleIntensity = frequencyData
  //     ? frequencyData[100] / 255
  //     : Math.cos(time * 1.3) * 0.5 + 0.5;

  //   // Draw main waveform
  //   ctx.beginPath();

  //   for (let i = 0; i < 360; i += 5) {
  //     const angle = (i * Math.PI) / 180;
  //     const wave = Math.sin(time * 2 + i * 0.05) * 0.5 + 0.5;
  //     const radius = maxRadius * (0.3 + wave * 0.4 * bassIntensity);

  //     const x = centerX + Math.cos(angle) * radius;
  //     const y = centerY + Math.sin(angle) * radius;

  //     if (i === 0) {
  //       ctx.moveTo(x, y);
  //     } else {
  //       ctx.lineTo(x, y);
  //     }
  //   }

  //   ctx.closePath();

  //   // Create gradient
  //   const gradient = ctx.createRadialGradient(
  //     centerX,
  //     centerY,
  //     0,
  //     centerX,
  //     centerY,
  //     maxRadius
  //   );
  //   gradient.addColorStop(
  //     0,
  //     `rgba(0, 168, 255, ${0.5 + bassIntensity * 0.3})`
  //   );
  //   gradient.addColorStop(
  //     1,
  //     `rgba(138, 43, 226, ${0.3 + trebleIntensity * 0.2})`
  //   );

  //   ctx.fillStyle = gradient;
  //   ctx.fill();

  //   // Add particles
  //   if (particles.length < 200 && Math.random() < 0.3) {
  //     particles.push(createParticle());
  //   }

  //   // Draw particles
  //   for (let i = 0; i < particles.length; i++) {
  //     const p = particles[i];

  //     // Update position with wave-like motion
  //     p.x += Math.sin(Date.now() * 0.001 + p.id) * (0.5 + bassIntensity);
  //     p.y += Math.cos(Date.now() * 0.001 + p.id) * (0.5 + bassIntensity);

  //     // Draw particle
  //     ctx.beginPath();
  //     ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  //     ctx.fillStyle = `hsla(${p.color}, 100%, 60%, ${p.alpha})`;
  //     ctx.fill();

  //     // Fade out particles
  //     p.alpha *= 0.99;
  //     p.size *= 0.995;

  //     // Remove particles that are too small
  //     if (p.size < 0.1) {
  //       particles.splice(i, 1);
  //       i--;
  //     }
  //   }
  // }

  function drawGalacticWaves() {
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layers = 4;
    const spacing = 30;
    const waveLength = 0.01;
    const baseAmplitude = 30;

    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      let previousY = centerY;

      for (let x = 0; x <= canvas.width; x += 4) {
        const audioIndex = Math.floor(
          (x / canvas.width) * frequencyData.length
        );
        const audioValue = frequencyData
          ? frequencyData[audioIndex] / 255
          : 0.5;

        const phaseShift = (l * Math.PI) / 8;
        const amplitude = baseAmplitude + l * 10;
        const y =
          centerY +
          Math.sin(x * waveLength + time * (0.6 + l * 0.1) + phaseShift) *
            amplitude *
            audioValue -
          spacing * (layers / 2 - l);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        previousY = y;
      }

      // Soft gradient for each ribbon
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(
        0,
        `rgba(${60 + l * 30}, ${200 - l * 20}, 255, ${0.15 + l * 0.1})`
      );
      gradient.addColorStop(
        1,
        `rgba(138, ${43 + l * 10}, 226, ${0.1 + l * 0.1})`
      );

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5 + l * 0.6;
      ctx.stroke();
    }

    // Optional: add some glimmering floating dots like drifting plankton
    if (particles.length < 100 && Math.random() < 0.2) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.5 + 0.2,
      });
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speed;
      p.alpha *= 0.995;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.fill();

      if (p.alpha < 0.02 || p.y < 0) {
        particles.splice(i, 1);
        i--;
      }
    }
  }

  // Visualization 2: Neural Patterns
  function drawNeuralPatterns() {
    const time = Date.now() * 0.001;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const layers = 6;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.05);

    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = (maxRadius / layers) * (layer + 1);
      const wave = Math.sin(time * 0.5 + layer) * 0.3 + 0.7;

      ctx.beginPath();
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = layerRadius + Math.sin(time * 2 + i * 0.3) * 10 * wave;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      const hue = 200 + layer * 10;
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.4)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Visualization 3: Quantum Vortex
  function drawQuantumVortex() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    const layers = 5;
    const particlesPerLayer = 40;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

    for (let l = 0; l < layers; l++) {
      const radius = (maxRadius / layers) * (l + 1);
      const angleOffset = time * 0.2 * (l + 1);
      for (let p = 0; p < particlesPerLayer; p++) {
        const angle = (p / particlesPerLayer) * Math.PI * 2 + angleOffset;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const size = 2 + Math.sin(time * 2 + p) * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${200 + l * 10}, 80%, 70%, 0.4)`;
        ctx.fill();
      }
    }
  }

  // Visualization 4: Cosmic Rhythms
  function drawCosmicRhythms() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    const rings = 5;

    for (let r = 1; r <= rings; r++) {
      const radius = r * 50 + Math.sin(time * 1.5 + r) * 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.1 + r * 0.05})`;
      ctx.lineWidth = 1 + r * 0.3;
      ctx.stroke();
    }

    const jellyCount = 20;
    for (let i = 0; i < jellyCount; i++) {
      const angle = (i / jellyCount) * Math.PI * 2 + time * 0.5;
      const radius = 80 + Math.sin(time + i) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(x, y, 5 + Math.sin(time * 2 + i) * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 208, 0.5)`;
      ctx.fill();
    }
  }

  // Visualization 5: Stellar Resonance
  function drawStellarResonance() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    const glowRadius = 60 + Math.sin(time * 2) * 10;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      glowRadius
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, 0.7)`);
    gradient.addColorStop(1, `rgba(0, 168, 255, 0.1)`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      const ringRadius = glowRadius + i * 30 + Math.sin(time + i) * 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(138, 43, 226, ${0.2 - i * 0.03})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const dots = 60;
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2 + time * 0.3;
      const r = glowRadius + Math.sin(time * 2 + i) * 30;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
      ctx.fill();
    }
  }

  // Create a single particle
  function createParticle() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;

    // For Cosmic Rhythms mode
    if (currentMode === 3) {
      return {
        x: centerX,
        y: centerY,
        size: Math.random() * 3 + 1,
        color: Math.random() * 360,
        alpha: Math.random() * 0.5 + 0.3,
        id: Math.random() * 1000,
        progress: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      };
    }

    return {
      x: centerX + (Math.random() - 0.5) * canvas.width * 0.8,
      y: centerY + (Math.random() - 0.5) * canvas.height * 0.8,
      size: Math.random() * 8 + 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: Math.random() * 360,
      alpha: Math.random() * 0.5 + 0.3,
      id: Math.random() * 1000,
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * maxRadius * 0.5 + maxRadius * 0.2,
    };
  }

  // Audio controls
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const volumeBtn = document.getElementById("volume-btn");
  let isMuted = false;

  playBtn.addEventListener("click", function () {
    if (window.YTPlayer && window.YTPlayer.playVideo) {
      window.YTPlayer.playVideo();
      isPlaying = true;
    } else if (audioElement) {
      audioElement.play();
      isPlaying = true;
    }
  });

  pauseBtn.addEventListener("click", function () {
    if (window.YTPlayer && window.YTPlayer.pauseVideo) {
      window.YTPlayer.pauseVideo();
      isPlaying = false;
    } else if (audioElement) {
      audioElement.pause();
      isPlaying = false;
    }
  });

  volumeBtn.addEventListener("click", function () {
    isMuted = !isMuted;

    if (window.YTPlayer && window.YTPlayer.setVolume) {
      window.YTPlayer.setVolume(isMuted ? 0 : 100);
    } else if (audioElement) {
      audioElement.volume = isMuted ? 0 : 1;
    }

    volumeBtn.innerHTML = isMuted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // Load YouTube API if needed
  if (!window.YT) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
});
