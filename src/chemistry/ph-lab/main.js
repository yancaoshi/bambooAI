/**
 * pH Laboratory - Logic Engine
 * Titration and Indicator Color Mapping
 */

class PHLab {
  constructor() {
    // Chemical State
    this.initialVolume = 200; // ml
    this.currentVolume = 200;
    this.molesH = 0.0000001 * 0.2; // Neutral (pH 7)
    this.molesOH = 0.0000001 * 0.2;
    this.reagentConc = 0.1; // 0.1M
    this.dropVolume = 2; // ml per drop for faster experiment
    
    // UI State
    this.selectedReagent = 'acid'; // 'acid' or 'base'
    this.isStreaming = false;
    this.streamInterval = null;

    this.init();
  }

  init() {
    this.setupListeners();
    this.updateUI();
  }

  setupListeners() {
    // Reagent selection
    document.querySelectorAll('.reagent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.reagent-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedReagent = btn.dataset.type;
      });
    });

    // Drop button
    document.getElementById('btn-drop').addEventListener('click', () => {
      this.addDrop();
    });

    // Stream button
    const streamBtn = document.getElementById('btn-stream');
    streamBtn.addEventListener('mousedown', () => {
      this.isStreaming = true;
      this.streamInterval = setInterval(() => this.addDrop(), 150);
      streamBtn.textContent = '停止滴加';
    });
    
    const stopStream = () => {
      if (this.isStreaming) {
        this.isStreaming = false;
        clearInterval(this.streamInterval);
        streamBtn.textContent = '连续流出';
      }
    };

    streamBtn.addEventListener('mouseup', stopStream);
    streamBtn.addEventListener('mouseleave', stopStream);

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.currentVolume = 200;
      this.molesH = 0.0000001 * 0.2;
      this.molesOH = 0.0000001 * 0.2;
      this.updateUI();
    });
  }

  addDrop() {
    if (this.currentVolume >= 500) return;

    // Create drop animation
    this.createDrop();

    // Chemical update
    const molesToAdd = (this.reagentConc * this.dropVolume) / 1000;
    this.currentVolume += this.dropVolume;

    if (this.selectedReagent === 'acid') {
      this.molesH += molesToAdd;
    } else {
      this.molesOH += molesToAdd;
    }

    // Neutralization
    const neutralized = Math.min(this.molesH, this.molesOH);
    // Note: We keep a tiny bit of H/OH based on Kw = 1e-14
    // Simplified for simulation
    if (this.molesH > this.molesOH) {
      this.molesH -= this.molesOH;
      this.molesOH = 1e-14 / (this.molesH / (this.currentVolume / 1000));
    } else {
      this.molesOH -= this.molesH;
      this.molesH = 1e-14 / (this.molesOH / (this.currentVolume / 1000));
    }

    setTimeout(() => this.updateUI(), 400); // Sync with drop fall
  }

  createDrop() {
    const drop = document.createElement('div');
    drop.className = 'drop';
    document.getElementById('workspace').appendChild(drop);
    setTimeout(() => drop.remove(), 600);
  }

  calculatePH() {
    const volLiters = this.currentVolume / 1000;
    if (this.molesH > this.molesOH) {
      const concH = this.molesH / volLiters;
      return -Math.log10(concH);
    } else {
      const concOH = this.molesOH / volLiters;
      return 14 + Math.log10(concOH);
    }
  }

  getIndicatorColor(ph) {
    // Universal Indicator Scale
    if (ph <= 3) return '#ef4444'; // Strong Acid
    if (ph <= 5) return '#f97316'; // Weak Acid
    if (ph <= 6.5) return '#eab308'; // Very Weak Acid
    if (ph <= 7.5) return '#22c55e'; // Neutral
    if (ph <= 9) return '#3b82f6'; // Weak Base
    if (ph <= 12) return '#6366f1'; // Base
    return '#a855f7'; // Strong Base
  }

  getStatus(ph) {
    if (ph < 6.5) return 'Acidic (酸性)';
    if (ph > 7.5) return 'Basic (碱性)';
    return 'Neutral (中性)';
  }

  updateUI() {
    const ph = this.calculatePH();
    const color = this.getIndicatorColor(ph);
    
    // Update liquid
    const liquidEl = document.getElementById('solution-liquid');
    liquidEl.style.height = `${(this.currentVolume / 500) * 100}%`;
    liquidEl.style.background = color;
    
    // Update Meter
    const phValEl = document.getElementById('val-ph');
    phValEl.textContent = ph.toFixed(2);
    phValEl.style.color = color;
    phValEl.style.textShadow = `0 0 10px ${color}`;
    
    document.getElementById('val-status').textContent = this.getStatus(ph);
    
    // Global CSS var for meter border etc if needed
    document.documentElement.style.setProperty('--ph-color', color);
  }
}

// Start
new PHLab();
