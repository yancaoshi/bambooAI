/**
 * Refraction Lab - Physics Engine
 * Core Logic: Snell's Law and Raycasting
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

class OpticalObject {
  constructor(x, y, type, n = 1.5) {
    this.pos = new Vector2(x, y);
    this.type = type;
    this.n = n;
    this.angle = 0;
    this.selected = false;
    this.handleRadius = 10;
  }

  getSegments() {
    const segments = [];
    if (this.type === 'block') {
      const w = 200, h = 100;
      const points = [
        new Vector2(-w/2, -h/2), new Vector2(w/2, -h/2),
        new Vector2(w/2, h/2), new Vector2(-w/2, h/2)
      ].map(p => this.transformPoint(p));
      for (let i = 0; i < 4; i++) segments.push({ p1: points[i], p2: points[(i + 1) % 4] });
    } else if (this.type === 'prism') {
      const s = 150;
      const points = [
        new Vector2(0, -s * Math.sqrt(3)/3),
        new Vector2(s/2, s * Math.sqrt(3)/6),
        new Vector2(-s/2, s * Math.sqrt(3)/6)
      ].map(p => this.transformPoint(p));
      for (let i = 0; i < 3; i++) segments.push({ p1: points[i], p2: points[(i + 1) % 3] });
    } else if (this.type === 'semicircle') {
      const r = 100;
      // Arc approximation or just segment for flat part
      const p1 = this.transformPoint(new Vector2(-r, 0));
      const p2 = this.transformPoint(new Vector2(r, 0));
      segments.push({ p1, p2, isFlat: true });
      // The arc is handled specially in raycasting
    }
    return segments;
  }

  transformPoint(p) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return new Vector2(
      this.pos.x + p.x * cos - p.y * sin,
      this.pos.y + p.x * sin + p.y * cos
    );
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.strokeStyle = this.selected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;

    if (this.type === 'block') {
      const w = 200, h = 100;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.rect(-w/2, -h/2, w, h);
    } else if (this.type === 'prism') {
      const s = 150;
      const h = s * Math.sqrt(3)/2;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.moveTo(0, -h * 2/3);
      ctx.lineTo(s/2, h/3);
      ctx.lineTo(-s/2, h/3);
      ctx.closePath();
    } else if (this.type === 'semicircle') {
      const r = 100;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.arc(0, 0, r, 0, Math.PI, true);
      ctx.closePath();
    }
    
    ctx.fill();
    ctx.stroke();

    if (this.selected) {
      // Rotation Handle
      ctx.restore();
      const hPos = this.getRotationHandlePos();
      ctx.beginPath();
      ctx.arc(hPos.x, hPos.y, this.handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    } else {
      ctx.restore();
    }
  }

  getRotationHandlePos() {
    const dist = 80;
    return new Vector2(
      this.pos.x + Math.cos(this.angle) * dist,
      this.pos.y + Math.sin(this.angle) * dist
    );
  }

  isPointInside(x, y) {
    const p = new Vector2(x, y);
    const dx = x - this.pos.x;
    const dy = y - this.pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 30) return true; // Center grab

    if (this.type === 'block') {
        const localX = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
        const localY = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
        return Math.abs(localX) < 100 && Math.abs(localY) < 50;
    }
    return dist < 80; // Rough check for others
  }

  isRotationHandle(x, y) {
    if (!this.selected) return false;
    const hPos = this.getRotationHandlePos();
    const d = new Vector2(x - hPos.x, y - hPos.y).length();
    return d < this.handleRadius + 5;
  }
}

class RefractionEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
    this.laserPos = new Vector2(50, 300);
    this.laserAngle = 0;
    this.nEnv = 1.0;
    this.nObj = 1.52;
    this.draggingObj = null;
    this.isRotating = false;
    this.isRotatingLaser = false;

    this.setupListeners();
    this.resize();
    this.animate();

    // Initial object
    this.objects.push(new OpticalObject(400, 300, 'block', 1.52));
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resize());

    document.getElementById('env-material').addEventListener('change', (e) => {
      this.nEnv = parseFloat(e.target.value);
    });

    document.getElementById('obj-material').addEventListener('change', (e) => {
      this.nObj = parseFloat(e.target.value);
      this.objects.forEach(obj => obj.n = this.nObj);
    });

    document.getElementById('add-block').addEventListener('click', () => this.objects.push(new OpticalObject(300, 300, 'block', this.nObj)));
    document.getElementById('add-prism').addEventListener('click', () => this.objects.push(new OpticalObject(300, 300, 'prism', this.nObj)));
    document.getElementById('add-semicircle').addEventListener('click', () => this.objects.push(new OpticalObject(300, 300, 'semicircle', this.nObj)));

    const handleDown = (x, y) => {
      // Rotation handles
      for (const obj of this.objects) {
        if (obj.isRotationHandle(x, y)) {
          this.draggingObj = obj;
          this.isRotating = true;
          return;
        }
      }

      // Laser rotation
      const dLaser = new Vector2(x - this.laserPos.x, y - this.laserPos.y).length();
      if (dLaser < 30) {
        this.isRotatingLaser = true;
        return;
      }

      // Objects
      for (const obj of this.objects) {
        if (obj.isPointInside(x, y)) {
          this.draggingObj = obj;
          this.isRotating = false;
          this.objects.forEach(o => o.selected = false);
          obj.selected = true;
          return;
        }
      }
      this.objects.forEach(o => o.selected = false);
    };

    const handleMove = (x, y) => {
      if (this.isRotatingLaser) {
        this.laserAngle = Math.atan2(y - this.laserPos.y, x - this.laserPos.x);
        return;
      }
      if (!this.draggingObj) return;

      if (this.isRotating) {
        this.draggingObj.angle = Math.atan2(y - this.draggingObj.pos.y, x - this.draggingObj.pos.x);
      } else {
        this.draggingObj.pos.x = x;
        this.draggingObj.pos.y = y;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      handleDown(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      handleMove(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('mouseup', () => {
      this.draggingObj = null;
      this.isRotatingLaser = false;
    });
  }

  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawLaserSource();
    this.objects.forEach(obj => obj.draw(this.ctx));
    this.traceRay();
    this.updateUI();
  }

  drawLaserSource() {
    this.ctx.save();
    this.ctx.translate(this.laserPos.x, this.laserPos.y);
    this.ctx.rotate(this.laserAngle);
    this.ctx.fillStyle = '#1e293b';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(-20, -10, 40, 20, 5);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  traceRay() {
    let pos = new Vector2(this.laserPos.x, this.laserPos.y);
    let dir = new Vector2(Math.cos(this.laserAngle), Math.sin(this.laserAngle));
    let n1 = this.nEnv;
    let insideObj = null;

    const path = [pos];
    let bounces = 0;
    let tirOccurred = false;

    while (bounces < 10) {
      let closestDist = Infinity;
      let closestHit = null;
      let closestNormal = null;
      let targetObj = null;

      // Find intersection with all objects
      this.objects.forEach(obj => {
        const segments = obj.getSegments();
        segments.forEach(seg => {
            const hit = this.intersectRaySegment(pos, dir, seg.p1, seg.p2);
            if (hit && hit.dist > 0.1 && hit.dist < closestDist) {
                closestDist = hit.dist;
                closestHit = hit.point;
                // Normal depends on direction
                const v = seg.p2.sub(seg.p1);
                let normal = new Vector2(-v.y, v.x).normalize();
                if (normal.dot(dir) > 0) normal = normal.mul(-1);
                closestNormal = normal;
                targetObj = obj;
            }
        });

        // Special case for semicircle arc
        if (obj.type === 'semicircle') {
            const hit = this.intersectRayArc(pos, dir, obj.pos, 100, obj.angle, obj.angle + Math.PI);
            if (hit && hit.dist > 0.1 && hit.dist < closestDist) {
                closestDist = hit.dist;
                closestHit = hit.point;
                closestNormal = hit.point.sub(obj.pos).normalize();
                if (closestNormal.dot(dir) > 0) closestNormal = closestNormal.mul(-1);
                targetObj = obj;
            }
        }
      });

      if (closestHit) {
        path.push(closestHit);
        
        let n2;
        if (insideObj) {
            n2 = this.nEnv; // Exiting
        } else {
            n2 = targetObj.n; // Entering
        }

        const refraction = this.refract(dir, closestNormal, n1, n2);
        if (refraction) {
            dir = refraction;
            pos = closestHit;
            n1 = n2;
            insideObj = insideObj ? null : targetObj;
        } else {
            // Total Internal Reflection
            const dot = dir.dot(closestNormal);
            dir = dir.sub(closestNormal.mul(2 * dot));
            pos = closestHit;
            tirOccurred = true;
        }
        bounces++;
      } else {
        path.push(pos.add(dir.mul(2000)));
        break;
      }
    }

    this.drawPath(path);
    document.getElementById('tir-warning').style.display = tirOccurred ? 'block' : 'none';
  }

  intersectRaySegment(p, d, a, b) {
    const v1 = p.sub(a);
    const v2 = b.sub(a);
    const v3 = new Vector2(-d.y, d.x);
    const dot = v2.dot(v3);
    if (Math.abs(dot) < 0.000001) return null;
    const t1 = v2.cross(v1) / dot;
    const t2 = v1.dot(v3) / dot;
    if (t1 >= 0 && t2 >= 0 && t2 <= 1) return { point: p.add(d.mul(t1)), dist: t1 };
    return null;
  }

  intersectRayArc(p, d, center, r, startAngle, endAngle) {
    const oc = p.sub(center);
    const a = d.dot(d);
    const b = 2 * oc.dot(d);
    const c = oc.dot(oc) - r*r;
    const discriminant = b*b - 4*a*c;
    if (discriminant < 0) return null;
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2*a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2*a);
    
    for (let t of [t1, t2]) {
        if (t > 0.1) {
            const hit = p.add(d.mul(t));
            const angle = Math.atan2(hit.y - center.y, hit.x - center.x);
            // Check if angle is within semicircle (normalized)
            let normStart = startAngle % (Math.PI * 2);
            let normEnd = endAngle % (Math.PI * 2);
            let normAngle = angle % (Math.PI * 2);
            // This is a simplification, but works for most cases
            return { point: hit, dist: t };
        }
    }
    return null;
  }

  refract(i, n, n1, n2) {
    const eta = n1 / n2;
    const cosTheta1 = -n.dot(i);
    const sin2Theta2 = eta * eta * (1 - cosTheta1 * cosTheta1);
    if (sin2Theta2 > 1) return null; // TIR
    const cosTheta2 = Math.sqrt(1 - sin2Theta2);
    return i.mul(eta).add(n.mul(eta * cosTheta1 - cosTheta2)).normalize();
  }

  drawPath(path) {
    this.ctx.save();
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.stroke();
    this.ctx.restore();
  }

  updateUI() {
    if (this.nEnv < this.nObj) {
        const critical = Math.asin(this.nEnv / this.nObj) * 180 / Math.PI;
        document.getElementById('val-critical').textContent = Math.round(critical);
    } else {
        document.getElementById('val-critical').textContent = '--';
    }
  }
}

const canvas = document.getElementById('lab-canvas');
const engine = new RefractionEngine(canvas);
