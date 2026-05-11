import * as THREE from 'three';

const container = document.getElementById("viewport");

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1.5);
renderer.setSize(container.clientWidth, container.clientHeight);
if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

// --- Lights ---
const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
sunLight.position.set(-10, 0, 0);
scene.add(sunLight);

// --- Camera & Controls ---
const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 2, 5.656);

let camRadius = camera.position.length();
let camAzimuth = Math.atan2(camera.position.x, camera.position.z);
let camPolar = Math.acos(camera.position.y / camRadius);

function updateCamera() {
  camera.position.set(
    camRadius * Math.sin(camPolar) * Math.sin(camAzimuth),
    camRadius * Math.cos(camPolar),
    camRadius * Math.sin(camPolar) * Math.cos(camAzimuth)
  );
  camera.lookAt(0, 0, 0);
}
updateCamera();

// Interaction
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;

renderer.domElement.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastMouseX = e.clientX; lastMouseY = e.clientY;
  renderer.domElement.style.cursor = "grabbing";
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  renderer.domElement.style.cursor = "grab";
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const deltaX = (e.clientX - lastMouseX) * 0.005;
  spinGroup.rotation.y += deltaX;

  lastMouseX = e.clientX; lastMouseY = e.clientY;
  updateCamera();
});
renderer.domElement.addEventListener("wheel", (e) => {
  e.preventDefault();
  camRadius = Math.max(2, Math.min(15, camRadius + e.deltaY * 0.01));
  toggles.zoom.value = (15 + 2) - camRadius;
  updateCamera();
}, { passive: false });

// --- Earth & Space ---
const AXIAL_TILT = THREE.MathUtils.degToRad(23.4);
const earthTiltGroup = new THREE.Group();
earthTiltGroup.rotation.z = -AXIAL_TILT;
scene.add(earthTiltGroup);

const spinGroup = new THREE.Group();
earthTiltGroup.add(spinGroup);

const loader = new THREE.TextureLoader();
const EARTH_RADIUS = 1;

// 使用 URL 对象或直接引用路径，Vite 会自动处理
const earthMat = new THREE.MeshPhongMaterial({
  map: loader.load(new URL('./earth_atmos_2048.jpg', import.meta.url).href),
  normalMap: loader.load(new URL('./earth_normal_2048.jpg', import.meta.url).href),
  normalScale: new THREE.Vector2(0.2, 0.2),
  specularMap: loader.load(new URL('./earth_specular_2048.jpg', import.meta.url).href),
  shininess: 5
});

const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, 64, 64), earthMat);
spinGroup.add(earthMesh);

// Stars
const starVertices = [];
for (let i = 0; i < 5000; i++) {
  const v = new THREE.Vector3().setFromSphericalCoords(200, Math.random() * Math.PI, Math.random() * Math.PI * 2);
  starVertices.push(v.x, v.y, v.z);
}
const starGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.6 })));

// Helpers... (Keeping original logic)
function createCircleTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color); grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const polaris = new THREE.Sprite(new THREE.SpriteMaterial({ map: createCircleTexture("#facc15") }));
polaris.position.set(0, 3, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -AXIAL_TILT);
polaris.scale.set(0.4, 0.4, 1);
polaris.userData = { msg: "北极星：地轴北极指向的恒星，是北半球导航的重要参照。" };
scene.add(polaris);

const cruxGroup = new THREE.Group();
[{ p: [0, -3, 0], s: 0.35 }, { p: [-0.15, -2.8, 0.1], s: 0.3 }, { p: [0, -2.6, 0], s: 0.25 }, { p: [0.18, -2.9, -0.1], s: 0.2 }, { p: [0.08, -3.0, 0.05], s: 0.15 }].forEach(s => {
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: createCircleTexture("#ffffff") }));
  star.position.set(...s.p); star.scale.set(s.s, s.s, 1);
  cruxGroup.add(star);
});
cruxGroup.rotation.z = -AXIAL_TILT;
cruxGroup.userData = { msg: "南十字星：南半球著名的星座，常用于指明正南方向。" };
scene.add(cruxGroup);

const grid = new THREE.Group();
const gridMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15 });
for (let i = -75; i <= 75; i += 15) {
  const r = Math.cos(i * Math.PI / 180) * EARTH_RADIUS, y = Math.sin(i * Math.PI / 180) * EARTH_RADIUS;
  const pts = []; for (let j = 0; j <= 64; j++) { const a = (j / 64) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
}
for (let i = 0; i < 360; i += 15) {
  const rad = i * Math.PI / 180, pts = [];
  for (let j = 0; j <= 32; j++) { const a = (j / 32) * Math.PI - Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * Math.cos(rad), Math.sin(a), Math.cos(a) * Math.sin(rad))); }
  grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts).scale(EARTH_RADIUS, EARTH_RADIUS, EARTH_RADIUS), gridMat));
}
spinGroup.add(grid);

const equator = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 1.01, 1.01).getPoints(100)), new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 2 }));
equator.rotation.x = Math.PI / 2;
spinGroup.add(equator);

const ecliptic = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 1.5, 1.5).getPoints(100)), new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.5 }));
ecliptic.rotation.x = Math.PI / 2;
scene.add(ecliptic);

const nightOverlay = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * 1.01, 64, 64, 0, Math.PI, 0, Math.PI),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
);
const nightPivot = new THREE.Group(); nightPivot.add(nightOverlay); scene.add(nightPivot);

// --- UI Logic ---
const toggles = {
  equator: document.getElementById("toggle-equator"),
  grid: document.getElementById("toggle-grid"),
  ecliptic: document.getElementById("toggle-ecliptic"),
  terminator: document.getElementById("toggle-terminator"),
  polaris: document.getElementById("toggle-polaris"),
  crux: document.getElementById("toggle-crux"),
  rotation: document.getElementById("toggle-rotation"),
  zoom: document.getElementById("zoom-slider")
};

const updateVisibility = () => {
  equator.visible = toggles.equator.checked;
  grid.visible = toggles.grid.checked;
  ecliptic.visible = toggles.ecliptic.checked;
  nightPivot.visible = toggles.terminator.checked;
  polaris.visible = toggles.polaris.checked;
  cruxGroup.visible = toggles.crux.checked;

  if (toggles.terminator.checked) {
    ambLight.intensity = 0.05;
    sunLight.intensity = 1.4;
  } else {
    ambLight.intensity = 0.9;
    sunLight.intensity = 0.5;
  }
};

Object.values(toggles).forEach(t => {
  if (t && t.type === "checkbox") t.onchange = updateVisibility;
});

if (toggles.zoom) {
  toggles.zoom.oninput = (e) => {
    const val = parseFloat(e.target.value);
    camRadius = (15 + 2) - val;
    updateCamera();
  };
}

updateVisibility();

// --- Countries ---
const countries = [
  { n: "中国", la: 35, lo: 105 },
  { n: "美国", la: 39, lo: -98 },
  { n: "巴西", la: -10, lo: -55 },
  { n: "阿根廷", la: -34, lo: -64 },
  { n: "智利", la: -33, lo: -71 },
  { n: "哥伦比亚", la: 4, lo: -72 },
  { n: "秘鲁", la: -9, lo: -75 },
  { n: "澳大利亚", la: -25, lo: 133 },
  { n: "俄罗斯", la: 60, lo: 100 }
];
const markers = countries.map(c => {
  const phi = (90 - c.la) * Math.PI / 180, theta = (c.lo + 180) * Math.PI / 180;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.02), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
  m.position.set(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
  spinGroup.add(m); return { m, n: c.n };
});

const label = document.createElement("div");
label.className = "hint-overlay"; label.style.display = "none"; label.style.pointerEvents = "none";
document.body.appendChild(label);

renderer.domElement.onclick = (e) => {
  const rect = container.getBoundingClientRect();
  const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, camera);

  const starHits = ray.intersectObjects([polaris, ...cruxGroup.children], true);
  if (starHits.length > 0) {
    const obj = starHits[0].object;
    const msg = (obj === polaris) ? polaris.userData.msg : cruxGroup.userData.msg;
    showInfo(msg, e.clientX, e.clientY);
    return;
  }

  const hits = ray.intersectObject(earthMesh);
  if (hits.length > 0) {
    const lp = spinGroup.worldToLocal(hits[0].point.clone());
    let best = null, dMin = 0.15;
    markers.forEach(m => { const d = m.m.position.distanceTo(lp); if (d < dMin) { dMin = d; best = m; } });
    if (best) {
      showInfo(`国家：${best.n} (${countries.find(c => c.n === best.n).la}°, ${countries.find(c => c.n === best.n).lo}°)`, e.clientX, e.clientY);
      return;
    }
  }
  label.style.display = "none";
};

function showInfo(text, x, y) {
  label.textContent = text;
  label.style.display = "block";
  label.style.left = `${x}px`;
  label.style.top = `${y}px`;
}

function animate() {
  requestAnimationFrame(animate);
  if (toggles.rotation && toggles.rotation.checked) spinGroup.rotation.y += 0.005;
  const shadowDir = sunLight.position.clone().negate().normalize();
  nightPivot.lookAt(shadowDir);
  renderer.render(scene, camera);
}
window.onresize = () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};
animate();
