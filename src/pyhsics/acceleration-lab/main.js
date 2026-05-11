/**
 * Acceleration Lab - Physics Engine
 */

class AccelerationLab {
  constructor() {
    this.carMass = 1.0;
    this.hookMass = 0.2;
    this.friction = 0.05;
    this.g = 9.8;

    this.isRunning = false;
    this.time = 0;
    this.startTime = 0;
    this.velocity = 0;
    this.position = 0;
    this.accel = 0;

    // Tape state
    this.tapeCanvas = document.getElementById('tape-canvas');
    this.tapeCtx = this.tapeCanvas.getContext('2d');
    this.lastDotTime = 0;
    this.freq = 20;
    this.dotInterval = 1 / this.freq;

    // Data for graphs
    this.history = [];
    this.maxHistory = 200;

    this.init();
  }

  init() {
    this.setupListeners();
    this.setupCharts();
    this.updateTheoretical();
    this.animate();
  }

  setupListeners() {
    const inputs = ['mass-car', 'mass-hook', 'friction'];
    inputs.forEach(id => {
      document.getElementById(`param-${id}`).addEventListener('input', (e) => {
        this[id === 'mass-car' ? 'carMass' : id === 'mass-hook' ? 'hookMass' : 'friction'] = parseFloat(e.target.value);
        document.getElementById(`val-${id}`).textContent = e.target.value;
        this.updateTheoretical();
      });
    });

    document.getElementById('param-freq').addEventListener('input', (e) => {
      this.freq = parseInt(e.target.value);
      this.dotInterval = 1 / this.freq;
      document.getElementById('val-freq').textContent = this.freq;
    });

    document.getElementById('btn-run').addEventListener('click', () => {
      if (this.isRunning) {
        this.isRunning = false;
        document.getElementById('btn-run').textContent = '开始实验';
      } else {
        this.reset();
        this.isRunning = true;
        this.startTime = performance.now();
        this.lastDotTime = 0;
        document.getElementById('btn-run').textContent = '停止';
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
  }

  setupCharts() {
    this.vtCanvas = document.getElementById('chart-vt');
    this.stCanvas = document.getElementById('chart-st');
    this.resizeCharts();
    window.addEventListener('resize', () => this.resizeCharts());
  }

  resizeCharts() {
    [this.vtCanvas, this.stCanvas].forEach(canvas => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight - 30;
    });
    this.tapeCanvas.width = this.tapeCanvas.parentElement.clientWidth;
    this.tapeCanvas.height = this.tapeCanvas.parentElement.clientHeight;
  }

  updateTheoretical() {
    const force = this.hookMass * this.g;
    const frictionForce = this.friction * this.carMass * this.g;
    const netForce = Math.max(0, force - frictionForce);
    this.accel = netForce / (this.carMass + this.hookMass);
    document.getElementById('res-accel').textContent = this.accel.toFixed(2);
  }

  reset() {
    this.isRunning = false;
    this.time = 0;
    this.velocity = 0;
    this.position = 0;
    this.history = [];
    this.tapeCtx.clearRect(0, 0, this.tapeCanvas.width, this.tapeCanvas.height);
    document.getElementById('btn-run').textContent = '开始实验';
    this.updateUI();
  }

  animate() {
    if (this.isRunning) {
      const now = performance.now();
      this.time = (now - this.startTime) / 1000;
      
      // Kinematics
      this.velocity = this.accel * this.time;
      this.position = 0.5 * this.accel * this.time * this.time;

      // Check boundaries (end of track)
      if (this.position > 15) { // 15 meters track
        this.isRunning = false;
        document.getElementById('btn-run').textContent = '开始实验';
      }

      this.history.push({ t: this.time, v: this.velocity, s: this.position });
      if (this.history.length > this.maxHistory) this.history.shift();
    }

    this.updateUI();
    this.drawCharts();
    requestAnimationFrame(() => this.animate());
  }

  updateUI() {
    const pixelsPerMeter = 100;
    const carEl = document.getElementById('car');
    const hookEl = document.getElementById('hook');
    const stringEl = document.getElementById('string');

    // Car Position
    const carX = this.position * pixelsPerMeter;
    carEl.style.left = `${carX}px`;

    // Hook Position
    const hookY = 15 + (this.position * pixelsPerMeter);
    hookEl.style.top = `${hookY}px`;

    // String Length
    stringEl.style.left = `${80 + carX}px`;
    stringEl.style.width = `calc(100% - ${180 + carX}px)`;

    // Tape Dots (Adjustable Frequency)
    if (this.isRunning) {
        while (this.time >= this.lastDotTime + this.dotInterval) {
            this.lastDotTime += this.dotInterval;
            // Calculate EXACT position at the exact tick time for accuracy
            const exactPos = 0.5 * this.accel * this.lastDotTime * this.lastDotTime;
            this.drawDotOnTape(exactPos * pixelsPerMeter);
        }
    }
  }

  drawDotOnTape(x) {
    const ctx = this.tapeCtx;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    // Offset x slightly to align with the back of the car
    ctx.arc(x, this.tapeCanvas.height / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCharts() {
    this.drawChart(this.vtCanvas, 'v', '#38bdf8', 10); // Max v approx 10
    this.drawChart(this.stCanvas, 's', '#fbbf24', 20); // Max s approx 20
  }

  drawChart(canvas, key, color, maxVal) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.history.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const timeScale = 5; // 5 seconds max

    this.history.forEach((point, i) => {
      const x = (point.t / timeScale) * w;
      const y = h - (point[key] / maxVal) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const x = (i / 5) * w;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        const y = (i / 5) * h;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
}

new AccelerationLab();
