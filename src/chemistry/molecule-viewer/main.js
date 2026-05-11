import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MoleculeViewer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    this.moleculeGroup = new THREE.Group();
    this.atomMeshes = [];
    this.bondMeshes = [];
    
    // State
    this.currentPreset = 'water';
    this.displayMode = 'ball-stick';
    this.bondScale = 1.0;
    this.vibration = 0;
    this.time = 0;

    // Element data (CPK Colors & Van der Waals radii)
    this.elements = {
      H: { color: 0xffffff, radius: 1.2, atomSize: 0.3 },
      C: { color: 0x64748b, radius: 1.7, atomSize: 0.5 },
      O: { color: 0xef4444, radius: 1.52, atomSize: 0.5 },
      N: { color: 0x3b82f6, radius: 1.55, atomSize: 0.5 }
    };

    // Molecule Presets (Approximate coordinates in Angstroms)
    this.presets = {
      water: {
        name: '水 (Water)', formula: 'H₂O', desc: '极性分子，生命之源。键角约 104.5°。',
        atoms: [
          { type: 'O', pos: [0, 0, 0] },
          { type: 'H', pos: [0.96, 0.75, 0] },
          { type: 'H', pos: [-0.96, 0.75, 0] }
        ],
        bonds: [[0, 1], [0, 2]]
      },
      methane: {
        name: '甲烷 (Methane)', formula: 'CH₄', desc: '最简单的烃，正四面体结构。',
        atoms: [
          { type: 'C', pos: [0, 0, 0] },
          { type: 'H', pos: [1.1, 1.1, 1.1] },
          { type: 'H', pos: [-1.1, -1.1, 1.1] },
          { type: 'H', pos: [-1.1, 1.1, -1.1] },
          { type: 'H', pos: [1.1, -1.1, -1.1] }
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
      },
      co2: {
        name: '二氧化碳 (CO₂)', formula: 'CO₂', desc: '线性分子，温室气体。',
        atoms: [
          { type: 'C', pos: [0, 0, 0] },
          { type: 'O', pos: [1.16, 0, 0] },
          { type: 'O', pos: [-1.16, 0, 0] }
        ],
        bonds: [[0, 1], [0, 2]]
      },
      ammonia: {
        name: '氨气 (Ammonia)', formula: 'NH₃', desc: '三角锥形结构，由于孤电子对的存在。',
        atoms: [
          { type: 'N', pos: [0, 0.2, 0] },
          { type: 'H', pos: [0.94, -0.4, 0] },
          { type: 'H', pos: [-0.47, -0.4, 0.81] },
          { type: 'H', pos: [-0.47, -0.4, -0.81] }
        ],
        bonds: [[0, 1], [0, 2], [0, 3]]
      },
      ethanol: {
        name: '乙醇 (Ethanol)', formula: 'C₂H₅OH', desc: '酒精的主要成分。',
        atoms: [
          { type: 'C', pos: [-0.5, 0, 0] },
          { type: 'C', pos: [1.0, 0, 0] },
          { type: 'O', pos: [1.6, 1.2, 0] },
          { type: 'H', pos: [2.5, 1.2, 0] },
          { type: 'H', pos: [-0.8, -1.0, 0] },
          { type: 'H', pos: [-0.8, 0.5, 0.9] },
          { type: 'H', pos: [-0.8, 0.5, -0.9] },
          { type: 'H', pos: [1.3, -0.5, 0.9] },
          { type: 'H', pos: [1.3, -0.5, -0.9] }
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8]]
      }
    };

    this.init();
  }

  init() {
    this.initThree();
    this.setupListeners();
    this.loadMolecule(this.currentPreset);
    this.animate();
  }

  initThree() {
    const container = document.getElementById('three-viewport');
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 10, 10);
    this.scene.add(mainLight);

    this.scene.add(this.moleculeGroup);

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  setupListeners() {
    document.getElementById('preset-select').addEventListener('change', (e) => {
      this.loadMolecule(e.target.value);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.displayMode = btn.dataset.mode;
        this.loadMolecule(this.currentPreset);
      });
    });

    document.getElementById('param-bond-length').addEventListener('input', (e) => {
      this.bondScale = parseFloat(e.target.value);
      document.getElementById('val-bond-length').textContent = this.bondScale.toFixed(1);
      this.updateMoleculeGeometry();
    });

    document.getElementById('param-vibration').addEventListener('input', (e) => {
      this.vibration = parseFloat(e.target.value);
      document.getElementById('val-vibration').textContent = this.vibration.toFixed(1);
    });
  }

  loadMolecule(presetKey) {
    this.currentPreset = presetKey;
    const data = this.presets[presetKey];
    
    // Clear old meshes
    while(this.moleculeGroup.children.length > 0) {
      this.moleculeGroup.remove(this.moleculeGroup.children[0]);
    }
    this.atomMeshes = [];
    this.bondMeshes = [];

    // Create Atoms
    data.atoms.forEach((atomData, idx) => {
      const el = this.elements[atomData.type];
      const size = this.displayMode === 'space-filling' ? el.radius * 0.6 : el.atomSize;
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: el.color, shininess: 100 });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.userData = { 
        basePos: new THREE.Vector3(...atomData.pos),
        type: atomData.type 
      };
      
      this.moleculeGroup.add(mesh);
      this.atomMeshes.push(mesh);
    });

    // Create Bonds (only for ball-stick)
    if (this.displayMode === 'ball-stick') {
      data.bonds.forEach(bondIndices => {
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
        const material = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { indices: bondIndices };
        this.moleculeGroup.add(mesh);
        this.bondMeshes.push(mesh);
      });
    }

    // Update UI Card
    document.getElementById('info-formula').textContent = data.formula;
    document.getElementById('info-name').textContent = data.name;
    document.getElementById('info-desc').textContent = data.desc;

    this.updateMoleculeGeometry();
  }

  updateMoleculeGeometry() {
    // Position Atoms based on scale
    this.atomMeshes.forEach(mesh => {
      mesh.position.copy(mesh.userData.basePos).multiplyScalar(this.bondScale);
    });

    // Update Bonds
    this.bondMeshes.forEach(mesh => {
      const [i1, i2] = mesh.userData.indices;
      const p1 = this.atomMeshes[i1].position;
      const p2 = this.atomMeshes[i2].position;
      
      const distance = p1.distanceTo(p2);
      mesh.scale.set(1, distance, 1);
      
      mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.time += 0.05;

    if (this.vibration > 0) {
      this.atomMeshes.forEach((mesh, i) => {
        const offset = Math.sin(this.time * 5 + i) * 0.05 * this.vibration;
        mesh.position.add(new THREE.Vector3(offset, offset, offset));
      });
      if (this.displayMode === 'ball-stick') {
        this.updateBondsOnly();
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  updateBondsOnly() {
    this.bondMeshes.forEach(mesh => {
      const [i1, i2] = mesh.userData.indices;
      const p1 = this.atomMeshes[i1].position;
      const p2 = this.atomMeshes[i2].position;
      const distance = p1.distanceTo(p2);
      mesh.scale.set(1, distance, 1);
      mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
    });
  }
}

new MoleculeViewer();
