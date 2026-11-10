import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// ========== 1. SCÈNE ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // Fond sombre bleu nuit

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 0); // Hauteur des yeux

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Activer les ombres
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// ========== 2. ÉCLAIRAGE ==========
// Lumière ambiante (éclairage de base)
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Lumière principale (simule l'éclairage du plafond)
const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
mainLight.position.set(2, 5, 3);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(1024, 1024);
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
scene.add(mainLight);

// Lumière d'appoint chaude (simule l'ambiance de lampes)
const fillLight = new THREE.PointLight(0xffaa66, 0.8, 15);
fillLight.position.set(-3, 2.5, 2);
scene.add(fillLight);

// ========== 3. CONSTRUCTION DU RESTAURANT ==========
const restaurant = new THREE.Group();

// --- Sol (parquet) ---
const floorGeo = new THREE.PlaneGeometry(14, 12);
const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x8B5A2B,  // Brun bois
    roughness: 0.7,
    metalness: 0.1
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
restaurant.add(floor);

// --- Murs (3 murs, côté ouvert vers l'utilisateur) ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.9 }); // Beige
const wallHeight = 3;

// Mur du fond
const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, wallHeight, 0.2), wallMat);
backWall.position.set(0, wallHeight / 2, -6);
backWall.receiveShadow = true;
restaurant.add(backWall);

// Mur gauche
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallHeight, 12), wallMat);
leftWall.position.set(-7, wallHeight / 2, 0);
leftWall.receiveShadow = true;
restaurant.add(leftWall);

// Mur droit
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallHeight, 12), wallMat);
rightWall.position.set(7, wallHeight / 2, 0);
rightWall.receiveShadow = true;
restaurant.add(rightWall);

// --- Plafond ---
const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e8, side: THREE.DoubleSide })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = wallHeight;
restaurant.add(ceiling);

// --- Tapis central (décoration) ---
const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 3),
    new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 1 }) // Rouge foncé
);
carpet.rotation.x = -Math.PI / 2;
carpet.position.set(0, 0.01, -2);
carpet.receiveShadow = true;
restaurant.add(carpet);

// ========== 4. FONCTION DE CRÉATION DE TABLE ==========
const tablesGroup = new THREE.Group();

function createTable(x, z, status = 'available') {
    const group = new THREE.Group();
    
    // Couleur selon l'état
    let color;
    switch(status) {
        case 'available': color = 0x00cc00; break;  // Vert
        case 'occupied':  color = 0xcc0000; break;  // Rouge
        case 'reserved':  color = 0xcccc00; break;  // Jaune
        default:          color = 0x888888; break;  // Gris
    }
    
    // Plateau de table (bois)
    const topMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.6 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), topMat);
    top.position.y = 0.75;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    
    // Pied de table
    const legMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.6 });
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 16), legMat);
    leg.position.y = 0.36;
    leg.castShadow = true;
    group.add(leg);
    
    // Marqueur d'état (petit cylindre coloré sur le dessus, indique la disponibilité)
    const markerMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), markerMat);
    marker.position.y = 0.82;
    group.add(marker);
    
    // Stocker les données pour la détection de sélection
    group.userData = { isTable: true, status: status, id: `Table_${x}_${z}` };
    
    // Ajouter 4 chaises autour de la table
    const chairPositions = [
        { x: 0.7, z: 0, rot: Math.PI },
        { x: -0.7, z: 0, rot: 0 },
        { x: 0, z: 0.7, rot: -Math.PI / 2 },
        { x: 0, z: -0.7, rot: Math.PI / 2 }
    ];
    
    chairPositions.forEach(cp => {
        const chair = createChair();
        chair.position.set(cp.x, 0, cp.z);
        chair.rotation.y = cp.rot;
        group.add(chair);
    });
    
    group.position.set(x, 0, z);
    return group;
}

function createChair() {
    const chair = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
    
    // Assise
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.35), mat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    chair.add(seat);
    
    // Dossier
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.05), mat);
    back.position.set(0, 0.65, -0.15);
    back.castShadow = true;
    chair.add(back);
    
    // Pieds (simplifiés)
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
    [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(px, 0.225, pz);
        leg.castShadow = true;
        chair.add(leg);
    });
    
    return chair;
}

// Créer 6 tables
tablesGroup.add(createTable(-3, -3, 'available'));
tablesGroup.add(createTable(0, -3, 'occupied'));
tablesGroup.add(createTable(3, -3, 'reserved'));
tablesGroup.add(createTable(-3, 1, 'available'));
tablesGroup.add(createTable(0, 1, 'unavailable'));
tablesGroup.add(createTable(3, 1, 'available'));

restaurant.add(tablesGroup);
scene.add(restaurant);

// ========== 5. DÉCORATIONS MURALES (tableaux, lampes) ==========
// Tableaux aux murs
const artMat1 = new THREE.MeshStandardMaterial({ color: 0x2E4053 });
const art1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), artMat1);
art1.position.set(-4, 2, -5.88);
art1.castShadow = true;
restaurant.add(art1);

const artMat2 = new THREE.MeshStandardMaterial({ color: 0x922B21 });
const art2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.05), artMat2);
art2.position.set(4, 2, -5.88);
art2.castShadow = true;
restaurant.add(art2);

// Lampes suspendues (simplifiées : sphères émettrices)
function createLamp(x, z) {
    const lampGroup = new THREE.Group();
    
    // Fil
    const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    wire.position.y = 2.6;
    lampGroup.add(wire);
    
    // Abat-jour
    const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.3, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc, side: THREE.DoubleSide })
    );
    shade.position.y = 2.2;
    lampGroup.add(shade);
    
    // Ampoule (émettrice)
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa44, emissiveIntensity: 1 })
    );
    bulb.position.y = 2.1;
    lampGroup.add(bulb);
    
    // Petite lumière ponctuelle
    const pointLight = new THREE.PointLight(0xffaa66, 0.5, 5);
    pointLight.position.y = 2.0;
    lampGroup.add(pointLight);
    
    lampGroup.position.set(x, 0, z);
    return lampGroup;
}

restaurant.add(createLamp(-2, -1));
restaurant.add(createLamp(2, -1));

// ========== 6. CONTRÔLES VR ==========
document.body.appendChild(VRButton.createButton(renderer));

const controllerModelFactory = new XRControllerModelFactory();

// Contrôleur principal (droit)
const controller = renderer.xr.getController(0);
controller.addEventListener('selectstart', onSelect);
scene.add(controller);

// Modèle 3D de la manette
const grip = renderer.xr.getControllerGrip(0);
grip.add(controllerModelFactory.createControllerModel(grip));
scene.add(grip);

// Ligne de visée
const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5)
]);
const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
controller.add(line);

// ========== 7. LOGIQUE DE SÉLECTION ==========
function onSelect(event) {
    const ctrl = event.target;
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(ctrl.matrixWorld);
    
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // Intersection avec les tables (récursif pour atteindre le plateau)
    const intersects = raycaster.intersectObjects(tablesGroup.children, true);
    
    const statusEl = document.getElementById('status');
    
    if (intersects.length > 0) {
        // Remonter jusqu'au groupe de la table
        let hit = intersects[0].object;
        while (hit.parent && !hit.userData.isTable) {
            hit = hit.parent;
        }
        
        if (hit.userData && hit.userData.isTable) {
            const data = hit.userData;
            const statusText = {
                'available': 'Disponible',
                'occupied': 'Occupée',
                'reserved': 'Réservée',
                'unavailable': 'Indisponible'
            }[data.status] || data.status;
            
            statusEl.textContent = `Table sélectionnée : ${data.id} — ${statusText}`;
            statusEl.style.color = data.status === 'available' ? '#00ff00' : '#ff6666';
            
            // Si disponible, la marquer comme "réservée" (simulation)
            if (data.status === 'available') {
                data.status = 'reserved';
                // Changer la couleur du marqueur
                const marker = hit.children.find(c => c.geometry && c.geometry.type === 'CylinderGeometry' && c.position.y > 0.8);
                if (marker) {
                    marker.material.color.set(0xcccc00);
                    marker.material.emissive.set(0xcccc00);
                }
                statusEl.textContent += ' → Réservée !';
            }
        }
    } else {
        statusEl.textContent = 'Aucune table visée';
        statusEl.style.color = '#ffffff';
    }
}

// ========== 8. BOUCLE DE RENDU ==========
renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});

// ========== 9. REDIMENSIONNEMENT ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});