/**
 * Optics Lab - Reflection Experiment
 * Enhanced for Touch/Rotation Handles and Multiple Lasers
 */

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() {
    const len = this.length();
    return len === 0 ? new Vector2(0, 0) : this.mul(1 / len);
  }
}

class Mirror {
  constructor(x, y, length = 150, angle = 0) {
    this.pos = new Vector2(x, y);
    this.length = length;
    this.angle = angle;
    this.selected = false;
    this.handleRadius = 12;
  }

  getBounds() {
    const dx = Math.cos(this.angle) * this.length / 2;
    const dy = Math.sin(this.angle) * this.length / 2;
    return {
      p1: new Vector2(this.pos.x - dx, this.pos.y - dy),
      p2: new Vector2(this.pos.x + dx, this.pos.y + dy)
    };
  }

  getRotationHandlePos() {
    const { p2 } = this.getBounds();
    // Offset handle slightly further out
    const dir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
    return p2.add(dir.mul(20));
  }

  getNormal() {
    return new Vector2(-Math.sin(this.angle), Math.cos(this.angle));
  }

  draw(ctx) {
    const { p1, p2 } = this.getBounds();
    
    // Draw mirror surface
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = 6;
    ctx.strokeStyle = this.selected ? '#38bdf8' : '#94a3b8';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw back pattern
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 2;
    ctx.moveTo(p1.x, p1.y + 4);
    ctx.lineTo(p2.x, p2.y + 4);
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.selected) {
      // Rotation Handle
      const hPos = this.getRotationHandlePos();
      ctx.beginPath();
      ctx.arc(hPos.x, hPos.y, this.handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      // Line to handle
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(hPos.x, hPos.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  isPointNear(x, y) {
    const { p1, p2 } = this.getBounds();
    const d = this.distToSegment(new Vector2(x, y), p1, p2);
    return d < 20;
  }

  isRotationHandle(x, y) {
    if (!this.selected) return false;
    const hPos = this.getRotationHandlePos();
    const dx = x - hPos.x;
    const dy = y - hPos.y;
    return Math.sqrt(dx * dx + dy * dy) < this.handleRadius + 5;
  }

  distToSegment(p, a, b) {
    const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(p.x - a.x, 2) + Math.pow(p.y - a.y, 2));
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(Math.pow(p.x - (a.x + t * (b.x - a.x)), 2) + Math.pow(p.y - (a.y + t * (b.y - a.y)), 2));
  }
}

class Laser {
  constructor(x, y, angle = 0, color = '#ff0000') {
    this.pos = new Vector2(x, y);
    this.angle = angle;
    this.color = color;
    this.selected = false;
    this.handleRadius = 12;
  }

  getRotationHandlePos() {
    const dir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
    return this.pos.add(dir.mul(45));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Body
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = this.selected ? '#38bdf8' : '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-25, -12, 50, 24, 6);
    ctx.fill();
    ctx.stroke();

    // Lens
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(20, -6, 6, 12);
    ctx.fill();

    ctx.restore();

    if (this.selected) {
      const hPos = this.getRotationHandlePos();
      ctx.beginPath();
      ctx.arc(hPos.x, hPos.y, this.handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#f87171';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(this.pos.x + Math.cos(this.angle) * 25, this.pos.y + Math.sin(this.angle) * 25);
      ctx.lineTo(hPos.x, hPos.y);
      ctx.strokeStyle = '#f87171';
      ctx.stroke();
    }
  }

  isPointNear(x, y) {
    const dx = x - this.pos.x;
    const dy = y - this.pos.y;
    return Math.sqrt(dx * dx + dy * dy) < 30;
  }

  isRotationHandle(x, y) {
    if (!this.selected) return false;
    const hPos = this.getRotationHandlePos();
    const dx = x - hPos.x;
    const dy = y - hPos.y;
    return Math.sqrt(dx * dx + dy * dy) < this.handleRadius + 5;
  }
}

class OpticsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mirrors = [];
    this.lasers = [];
    this.draggingObj = null;
    this.isRotating = false;
    this.maxBounces = 12;
    this.snapAngle = 15 * (Math.PI / 180); // 15 degrees in radians

    this.setupListeners();
    this.resize();
    this.animate();

    // Initial setup
    this.lasers.push(new Laser(100, 300, 0, '#ff0000'));
    this.mirrors.push(new Mirror(500, 300, 150, Math.PI / 4));
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resize());

    const handleInputDown = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      let found = false;

      // Check for rotation handles first
      const allObjects = [...this.lasers, ...this.mirrors];
      for (const obj of allObjects) {
        if (obj.isRotationHandle(x, y)) {
          this.draggingObj = obj;
          this.isRotating = true;
          found = true;
          break;
        }
      }

      if (!found) {
        // Check for dragging
        for (const laser of this.lasers) {
          if (laser.isPointNear(x, y)) {
            this.draggingObj = laser;
            this.isRotating = false;
            this.select(laser);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        for (const mirror of this.mirrors) {
          if (mirror.isPointNear(x, y)) {
            this.draggingObj = mirror;
            this.isRotating = false;
            this.select(mirror);
            found = true;
            break;
          }
        }
      }

      if (!found) this.select(null);
    };

    const handleInputMove = (clientX, clientY) => {
      if (!this.draggingObj) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (this.isRotating) {
        const dx = x - this.draggingObj.pos.x;
        const dy = y - this.draggingObj.pos.y;
        let angle = Math.atan2(dy, dx);
        
        // Snapping
        angle = Math.round(angle / this.snapAngle) * this.snapAngle;
        this.draggingObj.angle = angle;
      } else {
        this.draggingObj.pos.x = x;
        this.draggingObj.pos.y = y;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleInputDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleInputMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.draggingObj = null);

    // Touch Support
    this.canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleInputDown(touch.clientX, touch.clientY);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      handleInputMove(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchend', () => this.draggingObj = null);

    // UI Listeners
    document.getElementById('add-laser').addEventListener('click', () => {
      this.lasers.push(new Laser(this.canvas.width / 4, this.canvas.height / 2, 0, '#ff0000'));
    });

    document.getElementById('add-mirror').addEventListener('click', () => {
      this.mirrors.push(new Mirror(this.canvas.width / 2, this.canvas.height / 2));
    });

    document.getElementById('global-color-picker').querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const selectedObj = [...this.lasers, ...this.mirrors].find(o => o.selected);
        if (selectedObj instanceof Laser) {
          selectedObj.color = dot.dataset.color;
          document.getElementById('global-color-picker').querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
        }
      });
    });
  }

  select(obj) {
    this.lasers.forEach(l => l.selected = false);
    this.mirrors.forEach(m => m.selected = false);
    
    if (obj) {
      obj.selected = true;
      if (obj instanceof Laser) {
        document.getElementById('laser-color-control').style.display = 'flex';
        // Sync color picker
        document.getElementById('global-color-picker').querySelectorAll('.color-dot').forEach(d => {
          d.classList.toggle('active', d.dataset.color === obj.color);
        });
      } else {
        document.getElementById('laser-color-control').style.display = 'none';
      }
    } else {
      document.getElementById('laser-color-control').style.display = 'none';
    }
  }

  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.mirrors.forEach(m => m.draw(this.ctx));
    this.lasers.forEach(l => l.draw(this.ctx));
    this.lasers.forEach(l => this.traceRay(l));
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < this.canvas.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  traceRay(laser) {
    let currentPos = new Vector2(
      laser.pos.x + Math.cos(laser.angle) * 25,
      laser.pos.y + Math.sin(laser.angle) * 25
    );
    let currentDir = new Vector2(Math.cos(laser.angle), Math.sin(laser.angle));
    let bounces = 0;
    const path = [currentPos];

    while (bounces < this.maxBounces) {
      let closestDist = Infinity;
      let closestHit = null;
      let closestMirror = null;

      this.mirrors.forEach(mirror => {
        const { p1, p2 } = mirror.getBounds();
        const hit = this.raySegmentIntersection(currentPos, currentDir, p1, p2);
        if (hit && hit.dist < closestDist && hit.dist > 0.1) {
          closestDist = hit.dist;
          closestHit = hit.point;
          closestMirror = mirror;
        }
      });

      if (closestHit) {
        path.push(closestHit);
        const normal = closestMirror.getNormal();
        const dot = currentDir.dot(normal);
        const reflection = currentDir.sub(normal.mul(2 * dot));
        currentDir = reflection.normalize();
        currentPos = closestHit;
        bounces++;
        
        if (bounces === 1 && laser.selected) {
           this.updateAngles(laser, closestMirror);
        }
      } else {
        path.push(currentPos.add(currentDir.mul(2000)));
        if (bounces === 0 && laser.selected) {
          document.getElementById('incident-angle').textContent = '0';
          document.getElementById('reflection-angle').textContent = '0';
        }
        break;
      }
    }
    this.drawLaserPath(path, laser.color);
  }

  raySegmentIntersection(rayPos, rayDir, p1, p2) {
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
    const x3 = rayPos.x, y3 = rayPos.y, x4 = rayPos.x + rayDir.x, y4 = rayPos.y + rayDir.y;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t >= 0 && t <= 1 && u > 0) return { point: new Vector2(x1 + t * (x2 - x1), y1 + t * (y2 - y1)), dist: u };
    return null;
  }

  drawLaserPath(path, color) {
    this.ctx.save();
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  updateAngles(laser, mirror) {
    // Incident angle is the angle between the ray direction and the mirror normal
    const rayDir = new Vector2(Math.cos(laser.angle), Math.sin(laser.angle));
    const normal = mirror.getNormal();
    
    // Dot product gives cos(theta)
    const dot = Math.abs(rayDir.dot(normal));
    const incidentRad = Math.acos(Math.min(1, dot));
    const incidentDeg = Math.round(incidentRad * 180 / Math.PI);
    
    document.getElementById('incident-angle').textContent = incidentDeg;
    document.getElementById('reflection-angle').textContent = incidentDeg;
  }
}

const canvas = document.getElementById('lab-canvas');
const engine = new OpticsEngine(canvas);
