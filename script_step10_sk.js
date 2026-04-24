window.__viewerAppStarted = true;
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cards = document.querySelectorAll('.card');
const stageButtons = document.querySelectorAll('.stage-btn');
const controlButtons = document.querySelectorAll('.control-btn');
const pathButtons = document.querySelectorAll('.path-btn');
const compareButtons = document.querySelectorAll('.compare-btn');

const viewerText = document.getElementById('viewer-status');
const viewerBox = document.getElementById('viewer-box');
const viewerGlow = document.querySelector('.viewer-glow');
const viewerOverlay = document.querySelector('.viewer-overlay');
const canvasContainer = document.getElementById('viewer-canvas');
const pageBg = document.querySelector('.page-bg');
const transitionFlash = document.getElementById('transition-flash');

const infoName = document.getElementById('info-name');
const infoType = document.getElementById('info-type');
const infoDescription = document.getElementById('info-description');
const infoRender = document.getElementById('info-render');
const infoViews = document.getElementById('info-views');
const infoDensity = document.getElementById('info-density');
const infoStability = document.getElementById('info-stability');
const infoSplatsState = document.getElementById('info-splats-state');

const metricPoints = document.getElementById('metric-points');
const metricMode = document.getElementById('metric-mode');
const metricCapture = document.getElementById('metric-capture');
const metricLatency = document.getElementById('metric-latency');

const hudQuality = document.getElementById('hud-quality');
const hudState = document.getElementById('hud-state');
const hudRecon = document.getElementById('hud-recon');
const diagStage = document.getElementById('diag-stage');
const diagFrame = document.getElementById('diag-frame');
const timelineCaption = document.getElementById('timeline-caption');
const timelineSteps = document.querySelectorAll('.timeline-step');

const bootOverlay = document.getElementById('boot-overlay');
const bootProgressBar = document.getElementById('boot-progress-bar');
const bootPercent = document.getElementById('boot-percent');
const bootPhase = document.getElementById('boot-phase');
const bootMessage = document.getElementById('boot-message');

const cameraPathName = document.getElementById('camera-path-name');
const comparisonStage = document.getElementById('comparison-stage');
const compareModeLabel = document.getElementById('compare-mode-label');
const compareLeftTitle = document.getElementById('compare-left-title');
const compareLeftText = document.getElementById('compare-left-text');
const compareRightTitle = document.getElementById('compare-right-title');
const compareRightText = document.getElementById('compare-right-text');
const compareConfidence = document.getElementById('compare-confidence');
const frameThumbs = Array.from(document.querySelectorAll('.frame-thumb'));
const viewerGuide = document.getElementById('viewer-guide');
const guideClose = document.getElementById('guide-close');
const guideToggle = document.getElementById('guide-toggle');

const stageProfiles = {
    capture: {
        label: 'Náhľad záznamu',
        modeLabel: 'Záznam',
        renderLabel: 'Oblak vstupných snímok',
        densityLabel: 'Riedka',
        qualityLabel: 'Rýchly náhľad',
        frameBudget: 'Ultra stabilné',
        latency: '8 ms',
        recon: '41%',
        caption: 'Zameranie fázy: náhľad vstupných snímok',
        timelineKey: 'capture',
        pointFactor: 0.32,
        pointSize: 0.04,
        pointOpacity: 0.48,
        coreOpacity: 0.32,
        wireframe: true,
        haloOpacity: 0.24,
        scale: 0.96,
        camera: 4.9,
        status: 'Aktívna fáza záznamu'
    },
    hybrid: {
        label: 'Hybridné zarovnanie',
        modeLabel: 'Hybrid',
        renderLabel: 'Mix sparse + splat',
        densityLabel: 'Stredná',
        qualityLabel: 'Vyvážená fáza',
        frameBudget: 'Vyvážené',
        latency: '11 ms',
        recon: '68%',
        caption: 'Zameranie fázy: zarovnanie a rast hustoty',
        timelineKey: 'align',
        pointFactor: 0.58,
        pointSize: 0.05,
        pointOpacity: 0.72,
        coreOpacity: 0.24,
        wireframe: true,
        haloOpacity: 0.34,
        scale: 1,
        camera: 4.35,
        status: 'Aktívna hybridná rekonštrukcia'
    },
    radiance: {
        label: 'Finálny radiance render',
        modeLabel: 'Radiancia',
        renderLabel: 'Pole radiancie',
        densityLabel: 'Hustá',
        qualityLabel: 'Vysoká vernosť',
        frameBudget: 'Realtime',
        latency: '14 ms',
        recon: '92%',
        caption: 'Zameranie fázy: finálny radiance render',
        timelineKey: 'render',
        pointFactor: 1,
        pointSize: 0.058,
        pointOpacity: 0.88,
        coreOpacity: 0.16,
        wireframe: false,
        haloOpacity: 0.45,
        scale: 1.03,
        camera: 4.15,
        status: 'Radiance fáza uzamknutá'
    }
};

const compareProfiles = {
    input: {
        label: 'Dôraz na vstup',
        leftTitle: 'Viacpohľadové vstupné snímky',
        rightTitle: 'Vznikajúci splat náhľad',
        state: 'Izolovaný vstupný režim',
        modeText: 'Dôraz na zdroj',
        confidenceFactor: 0.58
    },
    split: {
        label: 'Split porovnanie',
        leftTitle: 'Zdrojové snímky vs pokrytie póz',
        rightTitle: 'Realtime splat rekonštrukcia',
        state: 'Aktívne split porovnanie',
        modeText: 'Split porovnanie',
        confidenceFactor: 0.82
    },
    result: {
        label: 'Dôraz na výsledok',
        leftTitle: 'Zachovaný kontext záznamu',
        rightTitle: 'Pohľadovo závislý neurálny render',
        state: 'Zvýraznený finálny render',
        modeText: 'Dôraz na výsledok',
        confidenceFactor: 1
    }
};

const cameraProfiles = {
    hero: {
        name: 'Hero oblúk',
        hud: 'Hero dráha kamery'
    },
    inspect: {
        name: 'Orbit kontroly',
        hud: 'Presný orbit'
    },
    dolly: {
        name: 'Dolly prejazd',
        hud: 'Dolly prejazd'
    }
};

const modelData = [
    {
        name: 'Apartmán',
        type: 'Interiérový GLB asset',
        description: 'Interiérová scéna bytu načítaná lokálne ako test prehliadania priestoru.',
        viewer: 'Aktívny dataset: Apartmán',
        basePoints: 48000,
        capture: '24 pohľadov',
        stability: 'Lokálny asset',
        defaultStage: 'radiance',
        assetUrl: './models/aparts/apartment.glb',
        assetTargetSize: 6.2,
        assetCamera: 6.8,
        allowSplats: false,
        color: 0x7dd3fc,
        accent: 'rgba(125, 211, 252, 0.35)',
        shadow: 'rgba(125, 211, 252, 0.20)',
        glow: 'radial-gradient(circle, rgba(125, 211, 252, 0.34), rgba(125, 211, 252, 0.08), transparent 70%)',
        bg: `
        radial-gradient(circle at 15% 20%, rgba(125, 211, 252, 0.2), transparent 25%),
        radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.15), transparent 23%),
        radial-gradient(circle at 50% 80%, rgba(14, 165, 233, 0.11), transparent 28%)
    `,
        shape: 'room',
        frames: ['Vpredu-vľavo', 'Prechod 02', 'Prechod 03', 'Prechod 04'],
        compareInputText: 'Interiérová scéna bytu slúži ako lokálny test prehliadania priestoru a kontroly detailov.',
        compareResultText: 'Viewer umožňuje pohyb vo vizuálne bohatej interiérovej scéne načítanej z lokálneho GLB assetu.',
        confidence: 94,
        stageOverrides: {
            hybrid: { recon: '72%' },
            radiance: { recon: '94%' }
        }
    },
    {
        name: 'Sken hlavy / Lee Perry Smith',
        type: 'Sken hlavy človeka',
        description: 'Známy testovací head scan Lee Perry Smith použitý ako realistickejší asset samostatnej ľudskej hlavy.',
        viewer: 'Aktívny dataset: Sken hlavy / Lee Perry Smith',
        basePoints: 92000,
        capture: '48 pohľadov',
        stability: 'Externý asset',
        defaultStage: 'radiance',
        assetUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb',
        assetTargetSize: 2.2,
        assetCamera: 3.4,
        allowSplats: false,
        color: 0xff88cc,
        accent: 'rgba(255, 136, 204, 0.35)',
        shadow: 'rgba(255, 136, 204, 0.22)',
        glow: 'radial-gradient(circle, rgba(255, 136, 204, 0.34), rgba(255, 136, 204, 0.08), transparent 70%)',
        bg: `
            radial-gradient(circle at 15% 20%, rgba(255, 136, 204, 0.2), transparent 25%),
            radial-gradient(circle at 82% 18%, rgba(244, 114, 182, 0.15), transparent 23%),
            radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.11), transparent 28%)
        `,
        shape: 'head',
        frames: ['Vpredu', 'Profil L', 'Profil P', 'Čeľusť'],
        compareInputText: 'Samostatný head scan je vhodnejší na testovanie čitateľnosti detailov tváre, profilu a tvaru hlavy než plná postava.',
        compareResultText: 'Tento typ assetu lepšie sedí do kategórie sken hlavy, pretože viewer ukazuje priamo tvar a povrch ľudskej hlavy bez zbytočného tela.',
        confidence: 97,
        stageOverrides: {
            capture: { qualityLabel: 'Náhľad póz', frameBudget: 'Veľmi stabilné' },
            radiance: { qualityLabel: 'Priorita tváre', recon: '97%' }
        }
    },
    {
        name: 'Referenčný objekt / Lantern',
        type: 'Objektový GLB test',
        description: 'Oficiálny sample asset Lantern použitý ako čistý test samostatného objektu pre otáčanie a detailnú kontrolu.',
        viewer: 'Aktívny dataset: Referenčný objekt / Lantern',
        basePoints: 61000,
        capture: '36 pohľadov',
        stability: 'Externý asset',
        defaultStage: 'radiance',
        assetUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb',
        assetTargetSize: 2.2,
        assetCamera: 3.6,
        allowSplats: false,
        color: 0x7cffa1,
        accent: 'rgba(124, 255, 161, 0.35)',
        shadow: 'rgba(124, 255, 161, 0.20)',
        glow: 'radial-gradient(circle, rgba(124, 255, 161, 0.34), rgba(124, 255, 161, 0.08), transparent 70%)',
        bg: `
            radial-gradient(circle at 15% 20%, rgba(124, 255, 161, 0.18), transparent 25%),
            radial-gradient(circle at 82% 18%, rgba(74, 222, 128, 0.14), transparent 23%),
            radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.11), transparent 28%)
        `,
        shape: 'object',
        frames: ['Otočenie 01', 'Horný prechod', 'Prechod po hrane', 'Makro'],
        compareInputText: 'Kontrolované otáčacie prechody definujú kontúry, hrany a odrazové vlastnosti objektu.',
        compareResultText: 'Rekonštrukcia sa posúva do ostrejšieho prezentačného režimu navrhnutého na detailnú kontrolu a prezentáciu.',
        confidence: 93,
        stageOverrides: {
            radiance: { qualityLabel: 'Priorita objektu', recon: '93%' }
        }
    }
];

let currentIndex = 0;
let currentStageKey = 'radiance';
let currentCompareKey = 'split';
let currentPathKey = 'hero';
let isAutoRotate = false;
let isInspectLocked = false;
let isPanning = false;
let targetRotationX = 0.15;
let targetRotationY = 0.4;
let dragRotationX = 0.15;
let dragRotationY = 0.4;
let targetScale = 1.03;
let cameraDistance = 4.15;
let targetCameraDistance = 4.15;
let targetPanX = 0;
let targetPanY = 0;
let areSplatsVisible = true;
let isGuideVisible = true;
let hasGuideAutoCollapsed = false;
let isDragging = false;
let previousX = 0;
let previousY = 0;
let currentExternalModel = null;
let currentModelLoadToken = 0;

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

const externalModelRoot = new THREE.Group();
root.add(externalModelRoot);

const gltfLoader = new GLTFLoader();
gltfLoader.setCrossOrigin('anonymous');

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

    if (shape === 'head') {
        coreMaterial.wireframe = false;
        coreMaterial.opacity = 0.17;
    }
}

function flashStageTransition() {
    transitionFlash.classList.remove('active');
    void transitionFlash.offsetWidth;
    transitionFlash.classList.add('active');
}

function applyTimelineState(stageKey) {
    const profile = stageProfiles[stageKey];
    timelineSteps.forEach(step => {
        step.classList.toggle('active', step.dataset.flow === profile.timelineKey);
    });
    timelineCaption.textContent = profile.caption;
}

function mergedStageProfile() {
    const data = modelData[currentIndex];
    return {
        ...stageProfiles[currentStageKey],
        ...(data.stageOverrides?.[currentStageKey] || {})
    };
}

function formatPoints(value) {
    if (value >= 1000) {
        return `${Math.round(value / 100) / 10}k`;
    }
    return `${Math.round(value)}`;
}

function setOrbitButtonState() {
    const orbitButton = document.querySelector('[data-action="orbit"]');
    orbitButton.classList.toggle('active', isAutoRotate);
}

function setStageButtonsState() {
    stageButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.stage === currentStageKey);
    });
}

function setPathButtonsState() {
    pathButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.path === currentPathKey);
    });
}

function setCompareButtonsState() {
    compareButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.compare === currentCompareKey);
    });
}

function setInspectButtonState() {
    const inspectButton = document.querySelector('[data-action="inspect"]');
    inspectButton?.classList.toggle('active', isInspectLocked);
    viewerBox.classList.toggle('inspect-locked', isInspectLocked);
}


function currentDatasetAllowsSplats() {
    return modelData[currentIndex]?.allowSplats !== false;
}

function disposeMaterial(material) {
    if (!material) return;
    for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && value.isTexture) {
            value.dispose?.();
        }
    }
    material.dispose?.();
}

function disposeObject3D(object) {
    object.traverse((child) => {
        if (child.geometry) child.geometry.dispose?.();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
            else disposeMaterial(child.material);
        }
    });
}

function clearExternalModel() {
    if (currentExternalModel) {
        externalModelRoot.remove(currentExternalModel);
        disposeObject3D(currentExternalModel);
        currentExternalModel = null;
    }
}

function fitExternalModel(object, targetSize = 4.8) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;

    object.scale.setScalar(scale);
    object.position.sub(center.multiplyScalar(scale));

    const fittedBox = new THREE.Box3().setFromObject(object);
    const fittedSize = fittedBox.getSize(new THREE.Vector3());
    object.position.y += fittedSize.y * 0.1;
}

function styleExternalModel(object, accentColor) {
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
                material.side = THREE.FrontSide;
                if ('envMapIntensity' in material && material.envMapIntensity < 1) {
                    material.envMapIntensity = 1.1;
                }
                if ('metalness' in material && material.metalness === 0) {
                    material.metalness = 0.02;
                }
                if ('roughness' in material && material.roughness > 0.95) {
                    material.roughness = 0.92;
                }
                material.needsUpdate = true;
            });
        }
    });
}

function loadExternalModelForData(data) {
    currentModelLoadToken += 1;
    const token = currentModelLoadToken;

    clearExternalModel();
    externalModelRoot.visible = false;
    coreMesh.visible = true;

    if (!data.assetUrl) {
        return;
    }

    viewerText.textContent = `Načítava sa externý model: ${data.name}`;
    hudState.textContent = 'Načítava sa externý model';

    gltfLoader.load(
        data.assetUrl,
        (gltf) => {
            if (token !== currentModelLoadToken) {
                disposeObject3D(gltf.scene || gltf.scenes?.[0]);
                return;
            }

            const model = gltf.scene || gltf.scenes?.[0];
            if (!model) {
                hudState.textContent = 'Model sa nepodarilo vytvoriť';
                return;
            }

            styleExternalModel(model, data.color);
            fitExternalModel(model, data.assetTargetSize || 4.8);

            currentExternalModel = model;
            externalModelRoot.add(model);
            externalModelRoot.visible = true;
            coreMesh.visible = false;

            if (typeof data.assetCamera === 'number' && !isInspectLocked) {
                targetCameraDistance = data.assetCamera;
            }

            viewerText.textContent = `${data.viewer} · ${mergedStageProfile().label}`;
            hudState.textContent = 'Externý GLTF model načítaný';
        },
        undefined,
        (error) => {
            if (token !== currentModelLoadToken) return;
            console.error('GLTF load error:', error);
            externalModelRoot.visible = false;
            coreMesh.visible = true;
            viewerText.textContent = `Fallback náhľad: ${data.name}`;
            hudState.textContent = 'Chyba načítania externého modelu';
            console.warn('Táto verzia funguje spoľahlivo cez localhost / Live Server.');
        }
    );
}


function setGuideVisibility(visible) {
    isGuideVisible = visible;
    viewerGuide?.classList.toggle('is-hidden', !visible);
    guideToggle?.classList.toggle('is-visible', !visible);
}

function collapseGuideOnFirstInteraction() {
    if (hasGuideAutoCollapsed) return;
    hasGuideAutoCollapsed = true;
    setGuideVisibility(false);
}

function setButtonLabel(action, label) {
    const button = document.querySelector(`[data-action="${action}"]`);
    const labelNode = button?.querySelector('.btn-label');
    if (labelNode) labelNode.textContent = label;
}

function setSplatsButtonState() {
    const splatsButton = document.querySelector('[data-action="splats"]');
    if (!splatsButton) return;

    const allowed = currentDatasetAllowsSplats();
    splatsButton.disabled = !allowed;
    splatsButton.classList.toggle('is-disabled', !allowed);

    if (!allowed) {
        splatsButton.classList.remove('active', 'is-secondary-active');
        setButtonLabel('splats', 'Splaty N/A');
        return;
    }

    splatsButton.classList.toggle('active', !areSplatsVisible);
    splatsButton.classList.toggle('is-secondary-active', !areSplatsVisible);
    setButtonLabel('splats', areSplatsVisible ? 'Skryť splaty' : 'Zobraziť splaty');
}

function setSplatsVisibility(visible) {
    areSplatsVisible = visible;
    const allowed = currentDatasetAllowsSplats();
    splatCloud.visible = visible && allowed;
    if (infoSplatsState) {
        infoSplatsState.textContent = !allowed ? 'Nedostupná' : (visible ? 'Zapnutá' : 'Vypnutá');
    }
    setSplatsButtonState();
}

function toggleSplats() {
    if (!currentDatasetAllowsSplats()) {
        hudState.textContent = 'Pre tento test model nie sú splaty aktívne';
        viewerText.textContent = `${modelData[currentIndex].viewer} · externý GLTF asset`;
        return;
    }

    setSplatsVisibility(!areSplatsVisible);
    viewerText.textContent = areSplatsVisible
        ? `${modelData[currentIndex].viewer} · ${mergedStageProfile().label}`
        : `Čistý náhľad: ${modelData[currentIndex].name}`;
    hudState.textContent = areSplatsVisible
        ? (isInspectLocked ? 'Statické skúmanie' : mergedStageProfile().status)
        : 'Splaty vypnuté';
}


function zoomInStep() {
    activateInspectMode('Statické priblíženie');
    targetScale = Math.min(1.28, targetScale + 0.02);
    targetCameraDistance = Math.max(2.55, targetCameraDistance - 0.38);
    viewerText.textContent = `Priblížený náhľad: ${modelData[currentIndex].name}`;
}

function zoomOutStep() {
    activateInspectMode('Statické oddialenie');
    targetScale = Math.max(0.92, targetScale - 0.02);
    targetCameraDistance = Math.min(6.8, targetCameraDistance + 0.38);
    viewerText.textContent = `Oddialený náhľad: ${modelData[currentIndex].name}`;
}

function activateInspectMode(message = 'Statické skúmanie') {
    if (!isInspectLocked) {
        isInspectLocked = true;
        isAutoRotate = false;
        setOrbitButtonState();
    }
    hudState.textContent = message;
    setInspectButtonState();
}

function deactivateInspectMode() {
    isInspectLocked = false;
    targetPanX = 0;
    targetPanY = 0;
    setInspectButtonState();
    hudState.textContent = mergedStageProfile().status;
}

function setCameraPath(pathKey, { silent = false } = {}) {
    currentPathKey = pathKey;
    if (!silent && isInspectLocked) {
        deactivateInspectMode();
    }
    const profile = cameraProfiles[pathKey];
    cameraPathName.textContent = profile.name;
    setPathButtonsState();

    if (!silent) {
        hudState.textContent = isInspectLocked ? 'Statické skúmanie' : profile.hud;
        viewerText.textContent = `${modelData[currentIndex].viewer} · ${mergedStageProfile().label}`;
    }
}

function applyComparison(compareKey, { silent = false } = {}) {
    currentCompareKey = compareKey;
    const compareProfile = compareProfiles[compareKey];
    const data = modelData[currentIndex];

    comparisonStage.dataset.mode = compareKey;
    compareModeLabel.textContent = compareProfile.modeText;
    comparisonStage.textContent = compareProfile.label;
    compareLeftTitle.textContent = compareProfile.leftTitle;
    compareRightTitle.textContent = compareProfile.rightTitle;
    compareLeftText.textContent = data.compareInputText;
    compareRightText.textContent = data.compareResultText;
    compareConfidence.textContent = `${Math.round(data.confidence * compareProfile.confidenceFactor)}%`;

    frameThumbs.forEach((thumb, index) => {
        const label = data.frames[index] || `Snímka ${index + 1}`;
        const strong = thumb.querySelector('strong');
        if (strong) strong.textContent = label;
        thumb.style.opacity = compareKey === 'result' ? '0.78' : '1';
        thumb.style.transform = compareKey === 'input' && index === 0 ? 'translateY(-2px)' : 'translateY(0)';
    });

    setCompareButtonsState();

    if (!silent) {
        hudState.textContent = isInspectLocked ? 'Statické skúmanie' : compareProfile.state;
    }
}

function setExternalModelStageAppearance(stageKey) {
    if (!currentExternalModel) return;

    currentExternalModel.traverse((child) => {
        if (!child.isMesh) return;

        if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
        }

        if (stageKey === 'hybrid') {
            const baseMaterial = child.userData.originalMaterial;
            const wireMaterial = Array.isArray(baseMaterial)
                ? baseMaterial.map((mat) => {
                    const clone = mat.clone();
                    clone.wireframe = true;
                    clone.transparent = true;
                    clone.opacity = 0.55;
                    return clone;
                })
                : (() => {
                    const clone = baseMaterial.clone();
                    clone.wireframe = true;
                    clone.transparent = true;
                    clone.opacity = 0.55;
                    return clone;
                })();

            child.material = wireMaterial;
        } else {
            child.material = child.userData.originalMaterial;
        }
    });
}

function applyStage(stageKey, { silent = false } = {}) {
    currentStageKey = stageKey;
    const data = modelData[currentIndex];
    const profile = mergedStageProfile();

    const displayedPoints = Math.max(1200, Math.round(data.basePoints * profile.pointFactor));
    metricPoints.textContent = formatPoints(displayedPoints);
    metricMode.textContent = profile.modeLabel;
    metricCapture.textContent = data.capture;
    metricLatency.textContent = profile.latency;

    infoRender.textContent = profile.renderLabel;
    infoViews.textContent = data.capture.replace(' pohľadov', '');
    infoDensity.textContent = profile.densityLabel;
    infoStability.textContent = data.stability;
    if (infoSplatsState) infoSplatsState.textContent = areSplatsVisible ? 'Zapnutá' : 'Vypnutá';

    hudQuality.textContent = profile.qualityLabel;
    hudRecon.textContent = profile.recon;
    hudState.textContent = isInspectLocked ? 'Statické skúmanie' : profile.status;
    diagStage.textContent = profile.label;
    diagFrame.textContent = profile.frameBudget;

    splatMaterial.size = profile.pointSize;
    splatMaterial.opacity = profile.pointOpacity;
    coreMaterial.opacity = profile.coreOpacity;
    coreMaterial.wireframe = profile.wireframe && data.shape !== 'head';
    haloMaterial.opacity = profile.haloOpacity;
    setExternalModelStageAppearance(stageKey);

    if (!isInspectLocked) {
        targetScale = profile.scale;
        targetCameraDistance = modelData[currentIndex].assetCamera || profile.camera;
    }

    applyTimelineState(stageKey);
    setStageButtonsState();

    if (!silent) {
        viewerText.textContent = `${data.viewer} · ${profile.label}`;
        flashStageTransition();
    }
}

function updateTheme(index, { keepStage = false } = {}) {
    currentIndex = index;
    const data = modelData[index];

    cards.forEach(card => card.classList.remove('active-card'));
    cards[index].classList.add('active-card');

    infoName.textContent = data.name;
    infoType.textContent = data.type;
    infoDescription.textContent = data.description;

    directionalLight.color.setHex(data.color);
    rimLight.color.setHex(data.color);
    backLight.color.setHex(data.color);
    coreMaterial.color.setHex(data.color);
    coreMaterial.emissive.setHex(data.color);
    splatMaterial.color.setHex(data.color);

    viewerBox.style.borderColor = data.accent;
    viewerBox.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 30px 100px ${data.shadow}`;
    viewerGlow.style.background = data.glow;
    pageBg.style.background = data.bg;

    rebuildCloud(data.shape);
    loadExternalModelForData(data);
    setSplatsVisibility(areSplatsVisible);

    root.rotation.set(0.15, 0.4, 0);
    dragRotationX = 0.15;
    dragRotationY = 0.4;
    targetRotationX = 0.15;
    targetRotationY = 0.4;
    targetPanX = 0;
    targetPanY = 0;
    targetScale = stageProfiles[data.defaultStage].scale;
    targetCameraDistance = data.assetCamera || stageProfiles[data.defaultStage].camera;

    if (!keepStage) {
        currentStageKey = data.defaultStage;
    }

    applyStage(currentStageKey, { silent: true });
    applyComparison(currentCompareKey, { silent: true });
    setCameraPath(currentPathKey, { silent: true });
    setInspectButtonState();
    viewerText.textContent = `${data.viewer} · ${mergedStageProfile().label}`;
    flashStageTransition();
}

guideClose?.addEventListener('click', () => {
    setGuideVisibility(false);
});

guideToggle?.addEventListener('click', () => {
    setGuideVisibility(true);
});

cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        updateTheme(index);
    });
});

stageButtons.forEach(button => {
    button.addEventListener('click', () => {
        applyStage(button.dataset.stage);
    });
});

pathButtons.forEach(button => {
    button.addEventListener('click', () => {
        setCameraPath(button.dataset.path);
    });
});

compareButtons.forEach(button => {
    button.addEventListener('click', () => {
        applyComparison(button.dataset.compare);
    });
});

controlButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;

        if (action === 'reset') {
            isAutoRotate = false;
            dragRotationX = 0.15;
            dragRotationY = 0.4;
            targetRotationX = 0.15;
            targetRotationY = 0.4;
            const profile = mergedStageProfile();
            targetScale = profile.scale;
            targetCameraDistance = profile.camera;
            viewerText.textContent = `${modelData[currentIndex].viewer} · ${profile.label}`;
            hudState.textContent = isInspectLocked ? 'Statické skúmanie' : 'Uzamknuté na dataset';
            setOrbitButtonState();
            return;
        }

        if (action === 'orbit') {
            isAutoRotate = !isAutoRotate;
            if (isAutoRotate) {
                deactivateInspectMode();
            }
            viewerText.textContent = isAutoRotate
                ? `Orbit režim: ${modelData[currentIndex].name}`
                : `${modelData[currentIndex].viewer} · ${mergedStageProfile().label}`;
            hudState.textContent = isAutoRotate ? 'Aktívny automatický orbit' : (isInspectLocked ? 'Statické skúmanie' : mergedStageProfile().status);
            setOrbitButtonState();
            return;
        }

        if (action === 'inspect') {
            if (isInspectLocked) {
                deactivateInspectMode();
            } else {
                activateInspectMode('Statické skúmanie');
            }
            return;
        }

        if (action === 'focus') {
            zoomInStep();
            return;
        }

        if (action === 'splats') {
            toggleSplats();
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

viewerBox.addEventListener('contextmenu', (event) => event.preventDefault());

viewerBox.addEventListener('pointerdown', (event) => {
    collapseGuideOnFirstInteraction();
    isDragging = true;
    isPanning = event.button === 2 || event.shiftKey;
    previousX = event.clientX;
    previousY = event.clientY;
    viewerBox.setPointerCapture(event.pointerId);
    activateInspectMode(isPanning ? 'Posun scény' : 'Ručná kontrola');
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

    if (isPanning) {
        targetPanX += deltaX * 0.0045;
        targetPanY -= deltaY * 0.0045;
        targetPanX = Math.max(-1.3, Math.min(1.3, targetPanX));
        targetPanY = Math.max(-1.1, Math.min(1.1, targetPanY));
    } else {
        dragRotationY += deltaX * 0.008;
        dragRotationX += deltaY * 0.008;
        dragRotationX = Math.max(-1.1, Math.min(1.1, dragRotationX));

        targetRotationX = dragRotationX;
        targetRotationY = dragRotationY;
    }

    previousX = event.clientX;
    previousY = event.clientY;
});

function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    isPanning = false;
    viewerBox.releasePointerCapture?.(event.pointerId);
    if (!isAutoRotate) {
        hudState.textContent = isInspectLocked ? 'Statické skúmanie' : mergedStageProfile().status;
    }
}

viewerBox.addEventListener('pointerup', stopDragging);
viewerBox.addEventListener('pointerleave', () => {
    viewerOverlay.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
    viewerGlow.style.left = '50%';
    viewerGlow.style.top = '50%';
    viewerGlow.style.transform = 'translate(-50%, -50%)';
    if (!isDragging && !isAutoRotate) {
        hudState.textContent = isInspectLocked ? 'Statické skúmanie' : mergedStageProfile().status;
    }
});
viewerBox.addEventListener('pointercancel', stopDragging);

viewerBox.addEventListener('wheel', (event) => {
    collapseGuideOnFirstInteraction();
    event.preventDefault();
    activateInspectMode(event.deltaY < 0 ? 'Statické priblíženie' : 'Upravená vzdialenosť');
    targetCameraDistance += event.deltaY * 0.0025;
    targetCameraDistance = Math.max(2.55, Math.min(6.8, targetCameraDistance));
}, { passive: false });

window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const code = event.code;
    const collapseCodes = [
        'KeyX', 'KeyO', 'KeyT', 'KeyP', 'KeyF',
        'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract',
        'Digit1', 'Digit2', 'Digit3',
        'KeyQ', 'KeyW', 'KeyE',
        'KeyA', 'KeyS', 'KeyD',
        'KeyR'
    ];

    if (collapseCodes.includes(code)) {
        collapseGuideOnFirstInteraction();
    }

    const toggleOnly = ['KeyX', 'KeyO', 'KeyT', 'KeyP', 'KeyF', 'KeyR'];
    if (event.repeat && toggleOnly.includes(code)) return;

    if (code === 'KeyX') {
        isAutoRotate = false;
        dragRotationX = 0.15;
        dragRotationY = 0.4;
        targetRotationX = 0.15;
        targetRotationY = 0.4;
        const profile = mergedStageProfile();
        targetScale = profile.scale;
        targetCameraDistance = modelData[currentIndex].assetCamera || profile.camera;
        targetPanX = 0;
        targetPanY = 0;
        viewerText.textContent = `${modelData[currentIndex].viewer} · ${profile.label}`;
        hudState.textContent = isInspectLocked ? 'Statické skúmanie' : 'Uzamknuté na dataset';
        setOrbitButtonState();
        return;
    }

    if (code === 'KeyO' || code === 'KeyR') {
        isAutoRotate = !isAutoRotate;
        if (isAutoRotate) {
            deactivateInspectMode();
        }
        viewerText.textContent = isAutoRotate
            ? `Orbit režim: ${modelData[currentIndex].name}`
            : `${modelData[currentIndex].viewer} · ${mergedStageProfile().label}`;
        hudState.textContent = isAutoRotate ? 'Aktívny automatický orbit' : (isInspectLocked ? 'Statické skúmanie' : mergedStageProfile().status);
        setOrbitButtonState();
        return;
    }

    if (code === 'KeyT') {
        if (isInspectLocked) deactivateInspectMode();
        else activateInspectMode('Statické skúmanie');
        return;
    }

    if (code === 'KeyP') {
        toggleSplats();
        return;
    }

    if (code === 'KeyF') {
        if (!document.fullscreenElement) viewerBox.requestFullscreen();
        else document.exitFullscreen();
        return;
    }

    if (code === 'Equal' || code === 'NumpadAdd') {
        event.preventDefault();
        zoomInStep();
        return;
    }

    if (code === 'Minus' || code === 'NumpadSubtract') {
        event.preventDefault();
        zoomOutStep();
        return;
    }

    if (code === 'Digit1') { applyStage('capture'); return; }
    if (code === 'Digit2') { applyStage('hybrid'); return; }
    if (code === 'Digit3') { applyStage('radiance'); return; }

    if (code === 'KeyQ') { applyComparison('input'); return; }
    if (code === 'KeyW') { applyComparison('split'); return; }
    if (code === 'KeyE') { applyComparison('result'); return; }

    if (code === 'KeyA') { setCameraPath('hero'); return; }
    if (code === 'KeyS') { setCameraPath('inspect'); return; }
    if (code === 'KeyD') { setCameraPath('dolly'); return; }
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
    const stagePulse = currentStageKey === 'capture' ? 0.8 : currentStageKey === 'hybrid' ? 1 : 1.22;

    if (isInspectLocked) {
        root.position.x += (targetPanX - root.position.x) * 0.12;
        root.position.y += (targetPanY - root.position.y) * 0.12;
        coreMaterial.emissiveIntensity = 0.12;
    } else {
        root.position.x += (0 - root.position.x) * 0.08;
        root.position.y += ((Math.sin(t * 1.2) * 0.08) - root.position.y) * 0.08;
        splatCloud.rotation.z += 0.0012 * stagePulse;
        haloParticles.rotation.y += 0.0009;
        haloParticles.rotation.x += 0.00035;
        coreMaterial.emissiveIntensity = 0.1 + (Math.sin(t * 3.1) + 1) * 0.045 * stagePulse;
    }

    cameraDistance += (targetCameraDistance - cameraDistance) * 0.08;

    let targetCamX = 0;
    let targetCamY = 0;
    if (!isInspectLocked) {
        if (currentPathKey === 'hero') {
            targetCamX = Math.sin(t * 0.8) * 0.14;
            targetCamY = Math.cos(t * 0.6) * 0.08;
        } else if (currentPathKey === 'inspect') {
            targetCamX = Math.sin(t * 1.18) * 0.08;
            targetCamY = Math.sin(t * 0.92) * 0.05;
        } else {
            targetCamX = Math.sin(t * 0.52) * 0.34;
            targetCamY = Math.cos(t * 0.45) * 0.03;
        }
    }

    camera.position.x += (targetCamX - camera.position.x) * 0.035;
    camera.position.y += (targetCamY - camera.position.y) * 0.035;
    camera.position.z += (cameraDistance - camera.position.z) * 0.08;
    camera.lookAt(root.position.x * 0.18, root.position.y * 0.22, 0);

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

function runBootSequence() {
    const phases = [
        { percent: 16, phase: 'Synchronizácia záznamu', message: 'Načítavajú sa metadáta záznamu...' },
        { percent: 38, phase: 'Zarovnanie póz', message: 'Registrujú sa pohľady kamier a riedka štruktúra...' },
        { percent: 64, phase: 'Rast hustoty', message: 'Rozširuje sa pole splatov a optimalizuje hustota...' },
        { percent: 84, phase: 'Výpočet radiancie', message: 'Počíta sa odozva svetla a pohľadovo závislá farba...' },
        { percent: 100, phase: 'Prehliadač pripravený', message: 'Realtime scéna je pripravená na kontrolu.' }
    ];

    phases.forEach((item, index) => {
        setTimeout(() => {
            bootProgressBar.style.width = `${item.percent}%`;
            bootPercent.textContent = `${item.percent}%`;
            bootPhase.textContent = item.phase;
            bootMessage.textContent = item.message;
        }, index * 360);
    });

    setTimeout(() => {
        bootOverlay.classList.add('hidden');
    }, phases.length * 360 + 280);
}

updateTheme(0);
applyComparison('split', { silent: true });
setCameraPath('hero', { silent: true });
setOrbitButtonState();
setInspectButtonState();
setSplatsVisibility(true);
setGuideVisibility(true);
animate3D();
runBootSequence();
