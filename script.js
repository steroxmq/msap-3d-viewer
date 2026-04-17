const cards = document.querySelectorAll('.card');
const viewerText =
    document.getElementById('viewer-status') ||
    document.querySelector('.viewer-overlay p');

const infoValues = document.querySelectorAll('.info-block p');
const controlButtons = document.querySelectorAll('.control-btn');
const viewerBox = document.querySelector('.viewer-box');
const viewerGlow = document.querySelector('.viewer-glow');
const viewerOverlay = document.querySelector('.viewer-overlay');
const canvasContainer = document.getElementById('viewer-canvas');
const pageBg = document.querySelector('.page-bg');

const modelData = [
    {
        name: 'Miestnosť',
        type: '3D model',
        description:
            'Priestorový model interiéru fakulty so zameraním na detail priestoru a orientáciu v scéne.',
        viewer: 'Zobrazuje sa náhľad modelu: Miestnosť'
    },
    {
        name: 'Osoba / Hlava',
        type: '3D model',
        description:
            'Model ľudskej hlavy alebo postavy pripravený na interaktívne prezretie priamo v prehliadači.',
        viewer: 'Zobrazuje sa náhľad modelu: Osoba / Hlava'
    },
    {
        name: 'Predmet',
        type: '3D model',
        description:
            'Samostatne nasnímaný objekt, ktorý bude možné otáčať, priblížiť a skúmať z rôznych uhlov.',
        viewer: 'Zobrazuje sa náhľad modelu: Predmet'
    }
];

let currentIndex = 0;
let isAutoRotate = false;
let targetRotationX = 0;
let targetRotationY = 0;
let targetScale = 1;

// --------------------
// THREE.JS
// --------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    canvasContainer.clientWidth / canvasContainer.clientHeight,
    0.1,
    100
);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x88ccff, 1.8);
directionalLight.position.set(3, 3, 4);
scene.add(directionalLight);

const rimLight = new THREE.DirectionalLight(0xff88cc, 1.2);
rimLight.position.set(-3, -2, 3);
scene.add(rimLight);

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 180;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
);

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.035,
    transparent: true,
    opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

function createGeometry(index) {
    if (index === 0) return new THREE.BoxGeometry(2.4, 1.6, 2.4);
    if (index === 1) return new THREE.SphereGeometry(1, 48, 48);
    return new THREE.BoxGeometry(1.6, 1.6, 1.6);
}

const material = new THREE.MeshStandardMaterial({
    color: 0x66ccff,
    metalness: 0.45,
    roughness: 0.2,
    emissive: 0x66ccff,
    emissiveIntensity: 0.18
});

const mesh = new THREE.Mesh(createGeometry(0), material);
scene.add(mesh);

// --------------------
// UI UPDATE
// --------------------
function updateModel(index) {
    currentIndex = index;

    cards.forEach((item) => item.classList.remove('active-card'));
    cards[index].classList.add('active-card');

    infoValues[0].textContent = modelData[index].name;
    infoValues[1].textContent = modelData[index].type;
    infoValues[2].textContent = modelData[index].description;
    viewerText.textContent = modelData[index].viewer;

    mesh.geometry.dispose();
    mesh.geometry = createGeometry(index);

    const colors = [0x7dd3fc, 0xff88cc, 0x7cffa1];
    material.color.setHex(colors[index]);
    material.emissive.setHex(colors[index]);


    const lightColors = [0x7dd3fc, 0xff88cc, 0x7cffa1];
    directionalLight.color.setHex(lightColors[index]);
    rimLight.color.setHex(lightColors[index]);

    particlesMaterial.color.setHex(lightColors[index]);

    const accentBorders = ['rgba(125, 211, 252, 0.45)', 'rgba(255, 136, 204, 0.45)', 'rgba(124, 255, 161, 0.45)'];
    const accentShadows = ['rgba(125, 211, 252, 0.22)', 'rgba(255, 136, 204, 0.22)', 'rgba(124, 255, 161, 0.22)'];
    const accentGlows = [
        'radial-gradient(circle, rgba(125, 211, 252, 0.35), rgba(125, 211, 252, 0.08), transparent 70%)',
        'radial-gradient(circle, rgba(255, 136, 204, 0.35), rgba(255, 136, 204, 0.08), transparent 70%)',
        'radial-gradient(circle, rgba(124, 255, 161, 0.35), rgba(124, 255, 161, 0.08), transparent 70%)'
    ];

    viewerBox.style.borderColor = accentBorders[index];
    viewerBox.style.boxShadow = `0 0 36px ${accentShadows[index]}`;
    viewerGlow.style.background = accentGlows[index];

    const pageBackgrounds = [
        `
        radial-gradient(circle at 15% 20%, rgba(125, 211, 252, 0.22), transparent 25%),
        radial-gradient(circle at 80% 30%, rgba(56, 189, 248, 0.18), transparent 25%),
        radial-gradient(circle at 50% 80%, rgba(14, 165, 233, 0.14), transparent 30%)
        `,
        `
        radial-gradient(circle at 15% 20%, rgba(255, 136, 204, 0.22), transparent 25%),
        radial-gradient(circle at 80% 30%, rgba(244, 114, 182, 0.18), transparent 25%),
        radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.14), transparent 30%)
        `,
        `
        radial-gradient(circle at 15% 20%, rgba(124, 255, 161, 0.22), transparent 25%),
        radial-gradient(circle at 80% 30%, rgba(74, 222, 128, 0.18), transparent 25%),
        radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.14), transparent 30%)
        `
    ];

    pageBg.style.background = pageBackgrounds[index];

    const statusBackgrounds = [
        'rgba(14, 165, 233, 0.18)',
        'rgba(236, 72, 153, 0.18)',
        'rgba(34, 197, 94, 0.18)'
    ];

    const statusBorders = [
        'rgba(125, 211, 252, 0.35)',
        'rgba(255, 136, 204, 0.35)',
        'rgba(124, 255, 161, 0.35)'
    ];

    viewerText.style.background = statusBackgrounds[index];
    viewerText.style.borderColor = statusBorders[index];

    material.wireframe = index === 0;
    material.transparent = index === 0;
    material.opacity = index === 0 ? 0.45 : 1;

    mesh.rotation.x = 0;
    mesh.rotation.y = 0;
    targetRotationX = 0;
    targetRotationY = 0;

    mesh.scale.set(0.72, 0.72, 0.72);
    targetScale = 1;
}

cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        updateModel(index);
    });
});

// --------------------
// CONTROLS
// --------------------
controlButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const action = button.textContent.trim();

        if (action === 'Reset') {
            isAutoRotate = false;
            mesh.rotation.x = 0;
            mesh.rotation.y = 0;
            targetRotationX = 0;
            targetRotationY = 0;
            viewerText.textContent = modelData[currentIndex].viewer;
            return;
        }

        if (action === 'Rotate') {
            isAutoRotate = !isAutoRotate;
            viewerText.textContent = isAutoRotate
                ? `Rotating preview: ${modelData[currentIndex].name}`
                : modelData[currentIndex].viewer;
            return;
        }

        if (action === 'Fullscreen') {
            if (!document.fullscreenElement) {
                viewerBox.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    });
});

// --------------------
// MOUSE EFFECT
// --------------------
viewerBox.addEventListener('mousemove', (e) => {
    const rect = viewerBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 0.6;
    const rotateX = ((centerY - y) / centerY) * 0.6;

    targetRotationX = rotateX;
    targetRotationY = rotateY;

    viewerOverlay.style.transform =
        `perspective(900px) rotateX(${rotateX * 8}deg) rotateY(${rotateY * 8}deg)`;

    viewerGlow.style.left = `${x - 130}px`;
    viewerGlow.style.top = `${y - 130}px`;
});

viewerBox.addEventListener('mouseleave', () => {
    viewerOverlay.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg)';

    viewerGlow.style.left = '50%';
    viewerGlow.style.top = '50%';
    viewerGlow.style.transform = 'translate(-50%, -50%)';

    if (!isAutoRotate) {
        targetRotationX = 0;
        targetRotationY = 0;
    }
});

// --------------------
// ANIMATION LOOP
// --------------------
function animate3D() {
    if (isAutoRotate) {
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.01;
    } else {
        mesh.rotation.x += (targetRotationX - mesh.rotation.x) * 0.08;
        mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.08;
    }

    particles.rotation.y += 0.0015;
    particles.rotation.x += 0.0005;

    mesh.scale.x += (targetScale - mesh.scale.x) * 0.08;
    mesh.scale.y += (targetScale - mesh.scale.y) * 0.08;
    mesh.scale.z += (targetScale - mesh.scale.z) * 0.08;
    mesh.position.y = Math.sin(Date.now() * 0.002) * 0.08;
    material.emissiveIntensity = 0.16 + (Math.sin(Date.now() * 0.004) + 1) * 0.08;

    renderer.render(scene, camera);
    requestAnimationFrame(animate3D);
}

animate3D();

// --------------------
// RESIZE
// --------------------
window.addEventListener('resize', () => {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// INITIAL STATE
updateModel(0);