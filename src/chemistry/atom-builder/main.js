import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class AtomBuilder {
  constructor() {
    this.protons = 0;
    this.neutrons = 0;
    this.electrons = 0;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    this.nucleusGroup = new THREE.Group();
    this.electronGroup = new THREE.Group();
    this.shellGroup = new THREE.Group();

    this.elements = [
      { z: 0, s: '?', n: '无' },
      { z: 1, s: 'H', n: '氢 (Hydrogen)' },
      { z: 2, s: 'He', n: '氦 (Helium)' },
      { z: 3, s: 'Li', n: '锂 (Lithium)' },
      { z: 4, s: 'Be', n: '铍 (Beryllium)' },
      { z: 5, s: 'B', n: '硼 (Boron)' },
      { z: 6, s: 'C', n: '碳 (Carbon)' },
      { z: 7, s: 'N', n: '氮 (Nitrogen)' },
      { z: 8, s: 'O', n: '氧 (Oxygen)' },
      { z: 9, s: 'F', n: '氟 (Fluorine)' },
      { z: 10, s: 'Ne', n: '氖 (Neon)' }
    ];

    this.init();
  }

  init() {
    this.initThree();
    this.setupListeners();
    this.animate();
    this.updateAtom();
  }

  initThree() {
    const container = document.getElementById('three-viewport');
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050810);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    this.scene.add(this.nucleusGroup);
    this.scene.add(this.electronGroup);
    this.scene.add(this.shellGroup);

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  setupListeners() {
    document.getElementById('add-proton').addEventListener('click', () => {
      this.protons++;
      this.updateAtom();
    });
    document.getElementById('add-neutron').addEventListener('click', () => {
      this.neutrons++;
      this.updateAtom();
    });
    document.getElementById('add-electron').addEventListener('click', () => {
      this.electrons++;
      this.updateAtom();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.protons = 0;
      this.neutrons = 0;
      this.electrons = 0;
      this.updateAtom();
    });
  }

  updateAtom() {
    this.updateNucleus();
    this.updateElectrons();
    this.updateUI();
  }

  updateNucleus() {
    // Clear
    while(this.nucleusGroup.children.length > 0) {
      this.nucleusGroup.remove(this.nucleusGroup.children[0]);
    }

    const totalParticles = this.protons + this.neutrons;
    const radius = 0.4 * Math.pow(totalParticles || 1, 1/3);
    
    const pGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const nGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const pMat = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    const nMat = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });

    for (let i = 0; i < this.protons; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2
      );
      this.nucleusGroup.add(mesh);
    }

    for (let i = 0; i < this.neutrons; i++) {
      const mesh = new THREE.Mesh(nGeo, nMat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2
      );
      this.nucleusGroup.add(mesh);
    }
  }

  updateElectrons() {
    // Clear
    while(this.electronGroup.children.length > 0) this.electronGroup.remove(this.electronGroup.children[0]);
    while(this.shellGroup.children.length > 0) this.shellGroup.remove(this.shellGroup.children[0]);

    const shellConfigs = [
      { capacity: 2, radius: 3 },
      { capacity: 8, radius: 5 },
      { capacity: 8, radius: 7 }
    ];

    let remainingElectrons = this.electrons;
    const eGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const eMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.5 });

    shellConfigs.forEach((shell, shellIdx) => {
      const countInShell = Math.min(remainingElectrons, shell.capacity);
      if (countInShell > 0 || remainingElectrons > 0 || shellIdx === 0) {
        // Draw Shell Circle
        const shellRing = new THREE.Mesh(
          new THREE.RingGeometry(shell.radius - 0.02, shell.radius + 0.02, 64),
          new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide })
        );
        shellRing.rotation.x = Math.PI / 2;
        this.shellGroup.add(shellRing);

        for (let i = 0; i < countInShell; i++) {
          const eMesh = new THREE.Mesh(eGeo, eMat);
          const angle = (i / countInShell) * Math.PI * 2;
          eMesh.userData = { 
            radius: shell.radius, 
            angle: angle, 
            speed: 0.02 / (shellIdx + 1) 
          };
          this.electronGroup.add(eMesh);
        }
      }
      remainingElectrons -= countInShell;
    });
  }

  updateUI() {
    const element = this.elements.find(e => e.z === this.protons) || { z: this.protons, s: '?', n: '未知元素' };
    
    document.getElementById('val-atomic-num').textContent = this.protons;
    document.getElementById('val-symbol').textContent = element.s;
    document.getElementById('val-name').textContent = element.n;
    document.getElementById('val-mass').textContent = this.protons + this.neutrons;
    document.getElementById('val-charge').textContent = this.protons - this.electrons;
    
    // Stability Heuristic
    let stability = '稳定';
    if (this.protons > 0) {
        const ratio = this.neutrons / this.protons;
        if (ratio < 0.8 || ratio > 1.5) stability = '不稳定 (放射性)';
    } else if (this.neutrons > 0) {
        stability = '不稳定';
    } else {
        stability = '--';
    }
    document.getElementById('val-stability').textContent = stability;
    document.getElementById('val-stability').style.color = stability.includes('不稳定') ? '#ef4444' : '#22c55e';

    document.getElementById('count-proton').textContent = this.protons;
    document.getElementById('count-neutron').textContent = this.neutrons;
    document.getElementById('count-electron').textContent = this.electrons;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.controls.update();

    // Animate Electrons
    this.electronGroup.children.forEach(e => {
      e.userData.angle += e.userData.speed;
      e.position.x = Math.cos(e.userData.angle) * e.userData.radius;
      e.position.z = Math.sin(e.userData.angle) * e.userData.radius;
    });

    // Nucleus Jitter
    this.nucleusGroup.children.forEach(p => {
        p.position.x += (Math.random() - 0.5) * 0.01;
        p.position.y += (Math.random() - 0.5) * 0.01;
        p.position.z += (Math.random() - 0.5) * 0.01;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// Start
new AtomBuilder();
