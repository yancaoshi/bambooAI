/**
 * Flame Test Laboratory - Interaction Engine
 */

class FlameTest {
  constructor() {
    this.loop = document.getElementById('wire-loop');
    this.tip = document.getElementById('loop-tip');
    this.flameOuter = document.querySelector('.flame.outer');
    this.flameInner = document.querySelector('.flame.inner');
    this.statusEl = document.getElementById('loop-status');
    
    this.currentChemical = null; // { element: 'Na', color: '#fbbf24' }
    this.isDragging = false;
    this.offset = { x: 0, y: 0 };
    
    // Config
    this.baseFlameColorOuter = 'rgba(56, 189, 248, 0.4)';
    this.baseFlameColorInner = 'rgba(56, 189, 248, 0.8)';
    
    this.chemicals = {
      'Na': { name: '钠 (Sodium)', color: '#fbbf24', flame: '#fbbf24' },
      'Cu': { name: '铜 (Copper)', color: '#4ade80', flame: '#4ade80' },
      'Sr': { name: '锶 (Strontium)', color: '#ff0000', flame: '#ff0000' },
      'K':  { name: '钾 (Potassium)', color: '#a855f7', flame: '#c084fc' }
    };

    this.init();
  }

  init() {
    this.setupDraggable();
    // Set initial position
    this.loop.style.left = '400px';
    this.loop.style.top = '200px';
  }

  setupDraggable() {
    const onDown = (e) => {
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      
      const rect = this.loop.getBoundingClientRect();
      this.offset.x = clientX - rect.left;
      this.offset.y = clientY - rect.top;
      this.isDragging = true;
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      
      let x = clientX - this.offset.x;
      let y = clientY - this.offset.y;

      this.loop.style.left = `${x}px`;
      this.loop.style.top = `${y}px`;

      this.checkCollisions();
    };

    const onUp = () => {
      this.isDragging = false;
      this.resetFlame();
    };

    this.loop.addEventListener('mousedown', onDown);
    this.loop.addEventListener('touchstart', onDown, { passive: false });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });

    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  checkCollisions() {
    const tipRect = this.tip.getBoundingClientRect();
    const cx = tipRect.left + tipRect.width / 2;
    const cy = tipRect.top + tipRect.height / 2;

    // 1. Check Flame
    const flameZone = document.getElementById('flame-zone').getBoundingClientRect();
    if (this.isPointInRect(cx, cy, flameZone)) {
      this.updateFlame();
    } else {
      this.resetFlame();
    }

    // 2. Check Wash Jar
    const washJar = document.getElementById('jar-wash').getBoundingClientRect();
    if (this.isPointInRect(cx, cy, washJar)) {
      this.cleanLoop();
    }

    // 3. Check Powder Jars
    document.querySelectorAll('.powder-jar').forEach(jar => {
      const jarRect = jar.getBoundingClientRect();
      if (this.isPointInRect(cx, cy, jarRect)) {
        this.dipLoop(jar.dataset.element);
      }
    });
  }

  isPointInRect(x, y, rect) {
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
  }

  dipLoop(element) {
    if (this.currentChemical && this.currentChemical.element === element) return;
    
    const chem = this.chemicals[element];
    this.currentChemical = { element, ...chem };
    this.tip.style.background = chem.color;
    this.tip.style.borderColor = chem.color;
    this.tip.style.boxShadow = `0 0 10px ${chem.color}`;
    this.statusEl.textContent = `带有 ${chem.name} 粉末`;
  }

  cleanLoop() {
    if (!this.currentChemical) return;
    this.currentChemical = null;
    this.tip.style.background = 'transparent';
    this.tip.style.borderColor = '#94a3b8';
    this.tip.style.boxShadow = 'none';
    this.statusEl.textContent = '干净';
  }

  updateFlame() {
    if (this.currentChemical) {
      const color = this.currentChemical.flame;
      this.flameOuter.style.background = color;
      this.flameOuter.style.filter = 'blur(15px)';
      this.flameInner.style.background = '#fff'; // Hot core
      
      // Burning effect on the loop tip
      this.tip.style.filter = 'brightness(2)';
    }
  }

  resetFlame() {
    this.flameOuter.style.background = this.baseFlameColorOuter;
    this.flameOuter.style.filter = 'blur(5px)';
    this.flameInner.style.background = this.baseFlameColorInner;
    this.tip.style.filter = 'none';
  }
}

// Start
new FlameTest();
