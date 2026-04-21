const cards = document.querySelectorAll('.card');
const viewerText = document.getElementById('viewer-status');
const controlButtons = document.querySelectorAll('.control-btn');
const viewerBox = document.getElementById('viewer-box');
const viewerGlow = document.querySelector('.viewer-glow');
const viewerOverlay = document.querySelector('.viewer-overlay');
const canvasContainer = document.getElementById('viewer-canvas');
const pageBg = document.querySelector('.page-bg');

const infoName = document.getElementById('info-name');
const infoType = document.getElementById('info-type');
const infoDescription = document.getElementById('info-description');
const infoRender = document.getElementById('info-render');
const infoViews = document.getElementById('info-views');
const infoDensity = document.getElementById('info-density');
const metricPoints = document.getElementById('metric-points');
const metricMode = document.getElementById('metric-mode');
const metricCapture = document.getElementById('metric-capture');
const hudQuality = document.getElementById('hud-quality');
const hudState = document.getElementById('hud-state');

const modelData = [
    {
        name: 'Lab room',
        type: 'Interior scan',
        description: 'Interior reconstruction concept focused on volume perception, open space and navigation feel.',
        viewer: 'Active dataset: Lab room',
        points: '48k',
        mode: 'Radiance',
        capture: '24 views',
        render: 'Radiance field',
        density: 'Dense',
        quality: 'High fidelity',
        state: 'Locked to dataset',
        color: 0x7dd3fc,
        accent: 'rgba(125, 211, 252, 0.35)',
        shadow: 'rgba(125, 211, 252, 0.20)',
        glow: 'radial-gradient(circle, rgba(125, 211, 252, 0.34), rgba(125, 211, 252, 0.08), transparent 70%)',
        bg: `
            radial-gradient(circle at 15% 20%, rgba(125, 211, 252, 0.2), transparent 25%),
            radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.15), transparent 23%),
            radial-gradient(circle at 50% 80%, rgba(14, 165, 233, 0.11), transparent 28%)
        `,
        shape: 'room'
    },
    {
        name: 'Head scan',
        type: 'Portrait scan',
        description: 'Dense portrait concept with compact silhouette, vertical structure and stronger highlight response.',
        viewer: 'Active dataset: Head scan',
        points: '92k',
        mode: 'Portrait',
        capture: '48 views',
        render: 'Anisotropic splats',
        density: 'Ultra dense',
        quality: 'Face priority',
        state: 'Orbit assisted',
        color: 0xff88cc,
        accent: 'rgba(255, 136, 204, 0.35)',
        shadow: 'rgba(255, 136, 204, 0.22)',
        glow: 'radial-gradient(circle, rgba(255, 136, 204, 0.34), rgba(255, 136, 204, 0.08), transparent 70%)',
        bg: `
            radial-gradient(circle at 15% 20%, rgba(255, 136, 204, 0.2), transparent 25%),
            radial-gradient(circle at 82% 18%, rgba(244, 114, 182, 0.15), transparent 23%),
            radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.11), transparent 28%)
        `,
        shape: 'head'
    },
    {
        name: 'Hero object',
        type: 'Artifact scan',
        description: 'Standalone object concept for turntable presentation, inspection passes and sharp contour reading.',
        viewer: 'Active dataset: Hero object',
        points: '61k',
        mode: 'Specular',
        capture: '36 views',
        render: 'Gloss splats',
        density: 'Medium+',
        quality: 'Object focus',
        state: 'Turntable ready',
        color: 0x7cffa1,
        accent: 'rgba(124, 255, 161, 0.35)',
        shadow: 'rgba(124, 255, 161, 0.20)',
        glow: 'radial-gradient(circle, rgba(124, 255, 161, 0.34), rgba(124, 255, 161, 0.08), transparent 70%)',
        bg: `
            radial-gradient(circle at 15% 20%, rgba(124, 255, 161, 0.18), transparent 25%),
            radial-gradient(circle at 82% 18%, rgba(74, 222, 128, 0.14), transparent 23%),
            radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.11), transparent 28%)
        `,
        shape: 'object'
    }
];

let currentIndex = 0;
let isAutoRotate = false;
let targetRotationX = 0.15;
let targetRotationY = 0.4;
let dragRotationX = 0.15;
let dragRotationY = 0.4;
let targetScale = 1;
let cameraDistance = 4.4;
let targetCameraDistance = 4.4;
let isDragging = false;
let previousX = 0;
let previousY = 0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    48,
    canvasContainer.clientWidth / canvasContainer.clientHeight,
    0.1,
    100
);
camera.position.set(0, 0, cameraDistance);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x7dd3fc, 1.8);
directionalLight.position.set(3, 4, 5);
scene.add(directionalLight);

const rimLight = new THREE.DirectionalLight(0xc084fc, 1.2);
rimLight.position.set(-4, 2, 3);
scene.add(rimLight);

const backLight = new THREE.PointLight(0x86efac, 1.6, 18);
backLight.position.set(0, -1.5, -4);
scene.add(backLight);

const root = new THREE.Group();
scene.add(root);

const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    metalness: 0.18,
    roughness: 0.22,
    emissive: 0x7dd3fc,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.24,
    wireframe: true
});

let coreMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 2.2), coreMaterial);
root.add(coreMesh);

const splatMaterial = new THREE.PointsMaterial({
    size: 0.055,
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.86,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});

let splatGeometry = new THREE.BufferGeometry();
let splatCloud = new THREE.Points(splatGeometry, splatMaterial);
root.add(splatCloud);

const haloGeometry = new THREE.BufferGeometry();
const haloCount = 180;
const haloPositions = new Float32Array(haloCount * 3);
for (let i = 0; i < haloCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.4 + Math.random() * 1.6;
    haloPositions[i * 3] = Math.cos(angle) * radius;
    haloPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
    haloPositions[i * 3 + 2] = Math.sin(angle) * radius;
}
haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
const haloMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.022,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
});
const haloParticles = new THREE.Points(haloGeometry, haloMaterial);
scene.add(haloParticles);

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function createRoomPoints(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const face = Math.floor(Math.random() * 6);
        let x = randomInRange(-1.6, 1.6);
        let y = randomInRange(-1.05, 1.05);
        let z = randomInRange(-1.6, 1.6);

        if (face === 0) x = -1.7;
        if (face === 1) x = 1.7;
        if (face === 2) y = -1.1;
        if (face === 3) y = 1.1;
        if (face === 4) z = -1.7;
        if (face === 5) z = 1.7;

        positions[i * 3] = x + randomInRange(-0.08, 0.08);
        positions[i * 3 + 1] = y + randomInRange(-0.08, 0.08);
        positions[i * 3 + 2] = z + randomInRange(-0.08, 0.08);
    }
    return positions;
}

function createHeadPoints(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 0.75 + Math.random() * 0.34;
        const x = Math.sin(phi) * Math.cos(theta) * 0.92 * radius;
        const y = Math.cos(phi) * 1.18 * radius + 0.05;
        const z = Math.sin(phi) * Math.sin(theta) * 0.84 * radius;
        const chinBias = y < -0.3 ? 0.78 : 1;

        positions[i * 3] = x * chinBias;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z * chinBias;
    }
    return positions;
}

function createObjectPoints(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.random() * Math.PI * 2;
        const radius = 0.8 + 0.35 * Math.sin(3 * t) * Math.cos(2 * p) + Math.random() * 0.18;
        positions[i * 3] = Math.cos(t) * Math.cos(p) * radius * 1.25;
        positions[i * 3 + 1] = Math.sin(p) * radius * 0.92;
        positions[i * 3 + 2] = Math.sin(t) * Math.cos(p) * radius * 1.25;
    }
    return positions;
}

function createCoreGeometry(shape) {
    if (shape === 'room') return new THREE.BoxGeometry(2.25, 1.65, 2.25, 8, 6, 8);
    if (shape === 'head') return new THREE.SphereGeometry(1, 34, 34);
    return new THREE.IcosahedronGeometry(1.12, 1);
}

function createSplatPositions(shape) {
    if (shape === 'room') return createRoomPoints(5200);
    if (shape === 'head') return createHeadPoints(7600);
    return createObjectPoints(6400);
}

function rebuildCloud(shape) {
    const positions = createSplatPositions(shape);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    splatGeometry.dispose();
    splatGeometry = geometry;
    splatCloud.geometry = geometry;

    coreMesh.geometry.dispose();
    coreMesh.geometry = createCoreGeometry(shape);

    coreMaterial.wireframe = shape !== 'head';
    coreMaterial.opacity = shape === 'head' ? 0.17 : 0.24;
}

function updateTheme(index) {
    const data = modelData[index];

    cards.forEach(card => card.classList.remove('active-card'));
    cards[index].classList.add('active-card');

    viewerText.textContent = data.viewer;
    infoName.textContent = data.name;
    infoType.textContent = data.type;
    infoDescription.textContent = data.description;
    infoRender.textContent = data.render;
    infoViews.textContent = data.capture.replace(' views', '');
    infoDensity.textContent = data.density;
    metricPoints.textContent = data.points;
    metricMode.textContent = data.mode;
    metricCapture.textContent = data.capture;
    hudQuality.textContent = data.quality;
    hudState.textContent = data.state;

    coreMaterial.color.setHex(data.color);
    coreMaterial.emissive.setHex(data.color);
    splatMaterial.color.setHex(data.color);
    directionalLight.color.setHex(data.color);
    rimLight.color.setHex(data.color);
    backLight.color.setHex(data.color);
    viewerBox.style.borderColor = data.accent;
    viewerBox.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 30px 100px ${data.shadow}`;
    viewerGlow.style.background = data.glow;
    pageBg.style.background = data.bg;

    rebuildCloud(data.shape);
    root.rotation.set(0.15, 0.4, 0);
    dragRotationX = 0.15;
    dragRotationY = 0.4;
    targetRotationX = 0.15;
    targetRotationY = 0.4;
    targetScale = 1;
    targetCameraDistance = 4.4;
}

cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        currentIndex = index;
        updateTheme(index);
    });
});

function setOrbitButtonState() {
    const orbitButton = document.querySelector('[data-action="orbit"]');
    orbitButton.classList.toggle('active', isAutoRotate);
}

controlButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;

        if (action === 'reset') {
            isAutoRotate = false;
            dragRotationX = 0.15;
            dragRotationY = 0.4;
            targetRotationX = 0.15;
            targetRotationY = 0.4;
            targetScale = 1;
            targetCameraDistance = 4.4;
            viewerText.textContent = modelData[currentIndex].viewer;
            hudState.textContent = 'Locked to dataset';
            setOrbitButtonState();
            return;
        }

        if (action === 'orbit') {
            isAutoRotate = !isAutoRotate;
            viewerText.textContent = isAutoRotate
                ? `Orbit mode: ${modelData[currentIndex].name}`
                : modelData[currentIndex].viewer;
            hudState.textContent = isAutoRotate ? 'Auto orbit active' : modelData[currentIndex].state;
            setOrbitButtonState();
            return;
        }

        if (action === 'focus') {
            targetScale = 1.08;
            targetCameraDistance = 3.7;
            viewerText.textContent = `Focused preview: ${modelData[currentIndex].name}`;
            hudState.textContent = 'Focus push';
            setTimeout(() => {
                targetScale = 1;
                targetCameraDistance = 4.4;
                viewerText.textContent = modelData[currentIndex].viewer;
                hudState.textContent = modelData[currentIndex].state;
            }, 950);
            return;
        }

        if (action === 'fullscreen') {
            if (!document.fullscreenElement) {
                viewerBox.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    });
});

viewerBox.addEventListener('pointerdown', (event) => {
    isDragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    viewerBox.setPointerCapture(event.pointerId);
    hudState.textContent = 'Manual inspection';
});

viewerBox.addEventListener('pointermove', (event) => {
    const rect = viewerBox.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    viewerBox.style.setProperty('--mx', `${x}px`);
    viewerBox.style.setProperty('--my', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltY = ((x - centerX) / centerX) * 0.22;
    const tiltX = ((centerY - y) / centerY) * 0.22;
    viewerOverlay.style.transform = `perspective(1100px) rotateX(${tiltX * 10}deg) rotateY(${tiltY * 12}deg)`;
    viewerGlow.style.left = `${x - 140}px`;
    viewerGlow.style.top = `${y - 140}px`;

    if (!isDragging) return;

    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    dragRotationY += deltaX * 0.008;
    dragRotationX += deltaY * 0.008;
    dragRotationX = Math.max(-1.1, Math.min(1.1, dragRotationX));

    targetRotationX = dragRotationX;
    targetRotationY = dragRotationY;

    previousX = event.clientX;
    previousY = event.clientY;
});

function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    viewerBox.releasePointerCapture?.(event.pointerId);
    if (!isAutoRotate) {
        hudState.textContent = modelData[currentIndex].state;
    }
}

viewerBox.addEventListener('pointerup', stopDragging);
viewerBox.addEventListener('pointerleave', () => {
    viewerOverlay.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
    viewerGlow.style.left = '50%';
    viewerGlow.style.top = '50%';
    viewerGlow.style.transform = 'translate(-50%, -50%)';
    if (!isDragging && !isAutoRotate) {
        hudState.textContent = modelData[currentIndex].state;
    }
});
viewerBox.addEventListener('pointercancel', stopDragging);

viewerBox.addEventListener('wheel', (event) => {
    event.preventDefault();
    targetCameraDistance += event.deltaY * 0.0025;
    targetCameraDistance = Math.max(2.9, Math.min(6.4, targetCameraDistance));
    hudState.textContent = targetCameraDistance < 4.1 ? 'Zoomed in' : 'Zoom adjusted';
}, { passive: false });

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'r') {
        isAutoRotate = !isAutoRotate;
        viewerText.textContent = isAutoRotate
            ? `Orbit mode: ${modelData[currentIndex].name}`
            : modelData[currentIndex].viewer;
        hudState.textContent = isAutoRotate ? 'Auto orbit active' : modelData[currentIndex].state;
        setOrbitButtonState();
    }
});

function animate3D() {
    if (isAutoRotate) {
        dragRotationY += 0.006;
        targetRotationY = dragRotationY;
    }

    root.rotation.x += (targetRotationX - root.rotation.x) * 0.08;
    root.rotation.y += (targetRotationY - root.rotation.y) * 0.08;

    root.scale.x += (targetScale - root.scale.x) * 0.08;
    root.scale.y += (targetScale - root.scale.y) * 0.08;
    root.scale.z += (targetScale - root.scale.z) * 0.08;

    const t = performance.now() * 0.001;
    root.position.y = Math.sin(t * 1.2) * 0.08;
    splatCloud.rotation.z += 0.0013;
    haloParticles.rotation.y += 0.0009;
    haloParticles.rotation.x += 0.00035;

    coreMaterial.emissiveIntensity = 0.11 + (Math.sin(t * 3.1) + 1) * 0.045;
    splatMaterial.opacity = 0.78 + (Math.sin(t * 2.6) + 1) * 0.05;

    cameraDistance += (targetCameraDistance - cameraDistance) * 0.08;
    camera.position.x += ((Math.sin(t * 0.8) * 0.14) - camera.position.x) * 0.035;
    camera.position.y += ((Math.cos(t * 0.6) * 0.08) - camera.position.y) * 0.035;
    camera.position.z += (cameraDistance - camera.position.z) * 0.08;
    camera.lookAt(0, root.position.y * 0.22, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate3D);
}

window.addEventListener('resize', () => {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

updateTheme(0);
setOrbitButtonState();
animate3D();
