/**
 * Rainbow Lab - Physics Engine
 * Raytracing chromatic dispersion in a spherical raindrop
 */

class Vector2 {
  constructor(x, y) { this.x = x; this.y = y; }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() {
    const l = this.length();
    return l === 0 ? new Vector2(0, 0) : this.mul(1 / l);
  }
}

class RainbowEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Droplet properties
    this.radius = 180;
    this.center = new Vector2(0, 0); // Will be updated on resize
    
    // Light properties
    this.h = 0.7; // Impact parameter (relative to radius, -1 to 1)
    this.isDragging = false;
    
    // Spectrum colors and their refractive indices (Water)
    this.spectrum = [
      { name: 'Red', n: 1.331, color: '#ff4444' },
      { name: 'Orange', n: 1.333, color: '#ffaa44' },
      { name: 'Yellow', n: 1.335, color: '#ffff44' },
      { name: 'Green', n: 1.337, color: '#44ff44' },
      { name: 'Blue', n: 1.340, color: '#44aaff' },
      { name: 'Indigo', n: 1.343, color: '#4444ff' },
      { name: 'Violet', n: 1.345, color: '#aa44ff' }
    ];

    this.setupListeners();
    this.resize();
    this.animate();
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.center = new Vector2(this.canvas.width * 0.45, this.canvas.height / 2);
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resize());
    
    const inputH = document.getElementById('param-h');
    inputH.addEventListener('input', (e) => {
      this.h = parseFloat(e.target.value);
      document.getElementById('val-h').textContent = this.h.toFixed(2);
    });

    this.canvas.addEventListener('mousedown', (e) => this.handleDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.isDragging = false);
  }

  handleDown(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Check if clicking near incoming beam
    const beamY = this.center.y - this.h * this.radius;
    if (Math.abs(y - beamY) < 30 && x < this.center.x) {
      this.isDragging = true;
    }
  }

  handleMove(clientX, clientY) {
    if (!this.isDragging) return;
    const rect = this.canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    this.h = (this.center.y - y) / this.radius;
    this.h = Math.max(-0.95, Math.min(0.95, this.h));
    
    document.getElementById('param-h').value = this.h;
    document.getElementById('val-h').textContent = this.h.toFixed(2);
  }

  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawDroplet();
    this.drawIncomingBeam();
    this.traceSpectrum();
    this.drawAnnotations();
  }

  drawDroplet() {
    this.ctx.save();
    
    // Glassy effect
    const grad = this.ctx.createRadialGradient(
      this.center.x - this.radius/3, this.center.y - this.radius/3, 0,
      this.center.x, this.center.y, this.radius
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
    
    this.ctx.beginPath();
    this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = grad;
    this.ctx.fill();
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawIncomingBeam() {
    const y = this.center.y - this.h * this.radius;
    this.ctx.save();
    
    // Beam glow
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#fff';
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    const hitX = this.center.x - Math.sqrt(this.radius**2 - (this.h * this.radius)**2);
    this.ctx.lineTo(hitX, y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  traceSpectrum() {
    // Current Y of impact
    const impactY = this.h * this.radius;
    const impactX = -Math.sqrt(this.radius**2 - impactY**2);
    const p1 = new Vector2(this.center.x + impactX, this.center.y - impactY);
    
    // Normal at p1
    const n1 = p1.sub(this.center).normalize();
    const incomingDir = new Vector2(1, 0);

    let primaryRainbowAngle = 0;
    let deviationAngle = 0;

    this.spectrum.forEach((color, idx) => {
      // 1. First Refraction (Entry)
      const r1 = this.refract(incomingDir, n1, 1.0, color.n);
      if (!r1) return;

      // 2. Intersection with back of sphere
      const p2 = this.intersectSphere(p1, r1, this.center, this.radius);
      const n2 = p2.sub(this.center).normalize().mul(-1); // Normal facing inward

      // 3. Internal Reflection (Back)
      const dot = r1.dot(n2);
      const r2 = r1.sub(n2.mul(2 * dot)).normalize();

      // 4. Intersection with exit point
      const p3 = this.intersectSphere(p2, r2, this.center, this.radius);
      const n3 = p3.sub(this.center).normalize();

      // 5. Second Refraction (Exit)
      const r3 = this.refract(r2, n3, color.n, 1.0);
      if (!r3) return;

      // Draw Path
      this.ctx.beginPath();
      this.ctx.strokeStyle = color.color;
      this.ctx.lineWidth = 2;
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.stroke();

      // Draw Exiting Ray
      const exitRayEnd = p3.add(r3.mul(800));
      this.ctx.beginPath();
      this.ctx.moveTo(p3.x, p3.y);
      this.ctx.lineTo(exitRayEnd.x, exitRayEnd.y);
      this.ctx.globalAlpha = 0.6;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;

      // Calculate Angles for UI
      if (idx === 0) { // Using Red as reference
        const exitAngle = Math.atan2(r3.y, r3.x);
        deviationAngle = (exitAngle * 180 / Math.PI);
        primaryRainbowAngle = Math.abs(deviationAngle + 180) % 360;
        if (primaryRainbowAngle > 180) primaryRainbowAngle = 360 - primaryRainbowAngle;
      }
    });

    document.getElementById('dev-angle').textContent = Math.abs(Math.round(deviationAngle)) + '°';
    document.getElementById('rainbow-angle').textContent = Math.round(primaryRainbowAngle) + '°';
  }

  refract(i, n, n1, n2) {
    const eta = n1 / n2;
    const cosTheta1 = -n.dot(i);
    const sin2Theta2 = eta * eta * (1 - cosTheta1 * cosTheta1);
    if (sin2Theta2 > 1) return null;
    const cosTheta2 = Math.sqrt(1 - sin2Theta2);
    return i.mul(eta).add(n.mul(eta * cosTheta1 - cosTheta2)).normalize();
  }

  intersectSphere(p, d, center, r) {
    const oc = p.sub(center);
    const a = d.dot(d);
    const b = 2 * oc.dot(d);
    const c = oc.dot(oc) - r * r;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    const t = (-b + Math.sqrt(discriminant)) / (2 * a); // Use second intersection
    return p.add(d.mul(t));
  }

  drawAnnotations() {
    this.ctx.save();
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    
    // Horizontal center line
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.center.y);
    this.ctx.lineTo(this.canvas.width, this.center.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }
}

const canvas = document.getElementById('rainbow-canvas');
const engine = new RainbowEngine(canvas);
