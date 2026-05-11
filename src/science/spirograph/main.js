/**
 * Spirograph Science Tool
 * Mathematical hypotrochoid curve generation
 */

class Spirograph {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Parameters
    this.R = 150; // Outer Radius
    this.r = 52;  // Inner Radius
    this.d = 80;  // Pen Offset
    this.speed = 10;
    this.color = '#38bdf8';
    
    // Animation state
    this.theta = 0;
    this.points = [];
    this.isDrawing = false;
    this.animationId = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupListeners();
    this.drawPreview();
  }

  resize() {
    const size = Math.min(window.innerWidth - 350, window.innerHeight - 100);
    this.canvas.width = size;
    this.canvas.height = size;
    if (!this.isDrawing) this.drawPreview();
  }

  setupListeners() {
    // Inputs
    const inputs = ['R', 'r', 'd', 'speed'];
    inputs.forEach(id => {
      const el = document.getElementById(`param-${id}`);
      const valEl = document.getElementById(`val-${id}`);
      el.addEventListener('input', (e) => {
        this[id] = parseFloat(e.target.value);
        valEl.textContent = this[id];
        if (!this.isDrawing) this.drawPreview();
      });
    });

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.color = swatch.dataset.color;
        if (!this.isDrawing) this.drawPreview();
      });
    });

    // Buttons
    document.getElementById('btn-draw').addEventListener('click', () => this.startDrawing());
    document.getElementById('btn-clear').addEventListener('click', () => this.clear());
    document.getElementById('btn-random').addEventListener('click', () => this.randomize());
  }

  calculatePos(theta) {
    const { R, r, d } = this;
    const x = (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta);
    const y = (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta);
    
    return {
      x: x + this.canvas.width / 2,
      y: y + this.canvas.height / 2
    };
  }

  drawPreview() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.R, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw static pattern (faint)
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.color;
    this.ctx.globalAlpha = 0.3;
    this.ctx.lineWidth = 1;
    
    // Estimate completion
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const common = gcd(Math.round(this.R), Math.round(this.r));
    const maxTheta = (Math.PI * 2 * (this.r / common));

    for (let t = 0; t <= maxTheta; t += 0.05) {
      const pos = this.calculatePos(t);
      if (t === 0) this.ctx.moveTo(pos.x, pos.y);
      else this.ctx.lineTo(pos.x, pos.y);
    }
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
  }

  startDrawing() {
    if (this.isDrawing) return;
    this.isDrawing = true;
    this.theta = 0;
    this.points = [];
    document.getElementById('status-overlay').textContent = '正在绘制...';
    document.getElementById('btn-draw').disabled = true;
    document.getElementById('btn-draw').textContent = '绘制中';
    this.animate();
  }

  animate() {
    // Draw segments
    for (let i = 0; i < this.speed; i++) {
      const pos = this.calculatePos(this.theta);
      this.points.push(pos);
      this.theta += 0.05;
    }

    this.render();

    // Check completion (heuristic)
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const common = gcd(Math.round(this.R), Math.round(this.r));
    const maxTheta = (Math.PI * 2 * (this.r / common));

    if (this.theta < maxTheta + 0.1) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.isDrawing = false;
      document.getElementById('status-overlay').textContent = '绘制完成';
      document.getElementById('btn-draw').disabled = false;
      document.getElementById('btn-draw').textContent = '重新绘制';
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Final Line
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.color;
    
    if (this.points.length > 0) {
      this.ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        this.ctx.lineTo(this.points[i].x, this.points[i].y);
      }
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  clear() {
    cancelAnimationFrame(this.animationId);
    this.isDrawing = false;
    this.points = [];
    this.theta = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPreview();
    document.getElementById('status-overlay').textContent = '已清除';
    document.getElementById('btn-draw').disabled = false;
    document.getElementById('btn-draw').textContent = '开始绘制';
  }

  randomize() {
    this.R = 50 + Math.random() * 200;
    this.r = 1 + Math.random() * 150;
    this.d = 10 + Math.random() * 150;
    
    document.getElementById('param-R').value = this.R;
    document.getElementById('param-r').value = this.r;
    document.getElementById('param-d').value = this.d;
    
    document.getElementById('val-R').textContent = Math.round(this.R);
    document.getElementById('val-r').textContent = Math.round(this.r);
    document.getElementById('val-d').textContent = Math.round(this.d);
    
    this.clear();
  }
}

// Init
const canvas = document.getElementById('spiro-canvas');
const app = new Spirograph(canvas);
