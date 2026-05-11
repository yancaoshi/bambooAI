/**
 * Prism Dispersion Lab - Physics Engine
 * Newton's experiment simulation
 */

class Vector2 {
  constructor(x, y) { this.x = x; this.y = y; }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() {
    const l = this.length();
    return l === 0 ? new Vector2(0, 0) : this.mul(1 / l);
  }
}

class PrismEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Prism parameters
    this.pos = new Vector2(0, 0);
    this.apexAngle = 60 * (Math.PI / 180);
    this.sideLength = 250;
    this.rotation = 0;
    this.material = 'crown';
    
    // Light parameters
    this.lightY = 0;
    
    // Interaction state
    this.dragging = false;
    this.rotating = false;
    this.handleRadius = 12;

    // Spectrum data
    this.materials = {
      crown: [ // n for Red to Violet
        { n: 1.512, color: '#ff4444' },
        { n: 1.515, color: '#ffaa44' },
        { n: 1.518, color: '#ffff44' },
        { n: 1.521, color: '#44ff44' },
        { n: 1.524, color: '#44aaff' },
        { n: 1.527, color: '#4444ff' },
        { n: 1.530, color: '#aa44ff' }
      ],
      flint: [
        { n: 1.613, color: '#ff4444' },
        { n: 1.621, color: '#ffaa44' },
        { n: 1.629, color: '#ffff44' },
        { n: 1.637, color: '#44ff44' },
        { n: 1.648, color: '#44aaff' },
        { n: 1.659, color: '#4444ff' },
        { n: 1.670, color: '#aa44ff' }
      ]
    };

    this.setupListeners();
    this.resize();
    this.animate();
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.pos = new Vector2(this.canvas.width * 0.45, this.canvas.height / 2);
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resize());
    
    document.getElementById('param-apex').addEventListener('input', (e) => {
      this.apexAngle = parseFloat(e.target.value) * (Math.PI / 180);
      document.getElementById('val-apex').textContent = e.target.value;
    });

    document.getElementById('param-y').addEventListener('input', (e) => {
      this.lightY = parseFloat(e.target.value);
      document.getElementById('val-y').textContent = this.lightY;
    });

    document.getElementById('param-material').addEventListener('change', (e) => {
      this.material = e.target.value;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const vertices = this.getVertices();
      const apex = vertices[0];
      const dApex = new Vector2(x - apex.x, y - apex.y).length();
      
      if (dApex < 25) {
        this.rotating = true;
      } else {
        const dCenter = new Vector2(x - this.pos.x, y - this.pos.y).length();
        if (dCenter < 50) this.dragging = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.dragging) {
        this.pos = new Vector2(x, y);
      } else if (this.rotating) {
        this.rotation = Math.atan2(y - this.pos.y, x - this.pos.x) + Math.PI / 2;
      }
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.rotating = false;
    });
  }

  getVertices() {
    const halfApex = this.apexAngle / 2;
    // Calculate triangle relative to center of mass or centroid
    // Centroid of isosceles triangle
    const h = this.sideLength * Math.cos(halfApex);
    const b = 2 * this.sideLength * Math.sin(halfApex);
    
    const rawVertices = [
      new Vector2(0, -h * 2/3), // Apex
      new Vector2(b/2, h/3),    // Bottom right
      new Vector2(-b/2, h/3)    // Bottom left
    ];

    return rawVertices.map(v => {
      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      return new Vector2(
        this.pos.x + v.x * cos - v.y * sin,
        this.pos.y + v.x * sin + v.y * cos
      );
    });
  }

  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPrism();
    this.traceSpectrum();
  }

  drawPrism() {
    const v = this.getVertices();
    this.ctx.save();
    
    // Body
    this.ctx.beginPath();
    this.ctx.moveTo(v[0].x, v[0].y);
    this.ctx.lineTo(v[1].x, v[1].y);
    this.ctx.lineTo(v[2].x, v[2].y);
    this.ctx.closePath();
    
    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Apex Handle
    this.ctx.beginPath();
    this.ctx.arc(v[0].x, v[0].y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#a855f7';
    this.ctx.fill();
    
    this.ctx.restore();
  }

  traceSpectrum() {
    const v = this.getVertices();
    const segments = [
      { p1: v[0], p2: v[2] }, // Left side
      { p1: v[2], p2: v[1] }, // Bottom
      { p1: v[1], p2: v[0] }  // Right side
    ];

    // Incoming White Beam
    const startY = this.pos.y + this.lightY;
    const startX = 0;
    const incomingDir = new Vector2(1, 0);
    const startPos = new Vector2(startX, startY);

    // Find intersection with first surface (usually left side)
    let firstHit = null;
    let firstNormal = null;
    
    segments.forEach(seg => {
      const hit = this.intersectRaySegment(startPos, incomingDir, seg.p1, seg.p2);
      if (hit && hit.dist > 0) {
        firstHit = hit.point;
        const vec = seg.p2.sub(seg.p1);
        let n = new Vector2(-vec.y, vec.x).normalize();
        if (n.dot(incomingDir) > 0) n = n.mul(-1);
        firstNormal = n;
      }
    });

    if (firstHit) {
      // Draw white beam to hit
      this.ctx.save();
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#fff';
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(0, startY);
      this.ctx.lineTo(firstHit.x, firstHit.y);
      this.ctx.stroke();
      this.ctx.restore();

      // Trace each color in spectrum
      const colors = this.materials[this.material];
      let avgDev = 0;

      colors.forEach((c, idx) => {
        // 1. First Refraction
        const r1 = this.refract(incomingDir, firstNormal, 1.0, c.n);
        if (!r1) return;

        // 2. Find exit hit
        let secondHit = null;
        let secondNormal = null;
        segments.forEach(seg => {
          const hit = this.intersectRaySegment(firstHit, r1, seg.p1, seg.p2);
          if (hit && hit.dist > 0.1) {
            secondHit = hit.point;
            const vec = seg.p2.sub(seg.p1);
            let n = new Vector2(-vec.y, vec.x).normalize();
            if (n.dot(r1) > 0) n = n.mul(-1);
            secondNormal = n;
          }
        });

        if (secondHit) {
          // 3. Second Refraction
          const r2 = this.refract(r1, secondNormal, c.n, 1.0);
          
          this.ctx.beginPath();
          this.ctx.strokeStyle = c.color;
          this.ctx.lineWidth = 2;
          this.ctx.moveTo(firstHit.x, firstHit.y);
          this.ctx.lineTo(secondHit.x, secondHit.y);
          this.ctx.stroke();

          if (r2) {
            const exitEnd = secondHit.add(r2.mul(1000));
            this.ctx.beginPath();
            this.ctx.moveTo(secondHit.x, secondHit.y);
            this.ctx.lineTo(exitEnd.x, exitEnd.y);
            this.ctx.globalAlpha = 0.6;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;

            if (idx === 3) { // Green ray for deviation calculation
                const angle = Math.atan2(r2.y, r2.x) * 180 / Math.PI;
                avgDev = angle;
            }
          }
        }
      });
      document.getElementById('stat-dev').textContent = Math.round(Math.abs(avgDev)) + '°';
    }
  }

  intersectRaySegment(p, d, a, b) {
    const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
    const x3 = p.x, y3 = p.y, x4 = p.x + d.x, y4 = p.y + d.y;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t >= 0 && t <= 1 && u > 0) return { point: new Vector2(x1 + t * (x2 - x1), y1 + t * (y2 - y1)), dist: u };
    return null;
  }

  refract(i, n, n1, n2) {
    const eta = n1 / n2;
    const cosI = -n.dot(i);
    const sin2T = eta * eta * (1 - cosI * cosI);
    if (sin2T > 1) return null;
    const cosT = Math.sqrt(1 - sin2T);
    return i.mul(eta).add(n.mul(eta * cosI - cosT)).normalize();
  }
}

const canvas = document.getElementById('prism-canvas');
const engine = new PrismEngine(canvas);
