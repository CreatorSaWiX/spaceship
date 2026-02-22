import * as THREE from 'three';
import { useMemo } from 'react';
import NeonObstacle from './NeonObstacle.jsx';

// ==========================================
// 1. GRAFS COMPLETS I PLATÒNICS (Regulars)
// ==========================================

// K4 (Graf Complet de 4 nodes). Cada node connecta amb tots els altres.
export function NeonTetra({ color = '#00ffff', scale = 1, ...props }) {
    const geometry = useMemo(() => new THREE.TetrahedronGeometry(1), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Q3 (Graf hipercub 3D). Producte cartesià de 3 arestes (K2 ◻ K2 ◻ K2).
export function NeonCube({ color = '#ff0055', scale = 1, ...props }) {
    const geometry = useMemo(() => new THREE.BoxGeometry(1.5, 1.5, 1.5), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Graf Octaèdric (Regular de grau 4). 
export function NeonOcta({ color = '#93ffca', scale = 1, ...props }) {
    const geometry = useMemo(() => new THREE.OctahedronGeometry(1.2), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Graf Dodecaèdric (Regular de grau 3, 20 vèrtexs). 
export function NeonDodeca({ color = '#ffbb00', scale = 1, ...props }) {
    const geometry = useMemo(() => new THREE.DodecahedronGeometry(1.5), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Graf Icosaèdric (Regular de grau 5, 12 vèrtexs).
export function NeonIcosa({ color = '#ff00ff', scale = 1, ...props }) {
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.5), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// ==========================================
// 2. GRAFS PRODUCTE (Cartesian Products)
// ==========================================

// Torus Grid (Producte Cartesià de dos cicles: Cm ◻ Cn).
// Crea una graella tancada sobre si mateixa com un dònut (Torus).
export function NeonTorusGrid({ color = '#00ffaa', scale = 1, tube = 0.4, radial = 6, tubular = 16, ...props }) {
    const geometry = useMemo(() => new THREE.TorusGeometry(1.5, tube, radial, tubular), [tube, radial, tubular]);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Cilindre Mesh (Producte Cartesià d'un cicle i un camí: Cn ◻ Pm).
// 'openEnded' fa que no hi hagi tapes, sent purament l'esquelet producte.
export function NeonCylinderGraph({ color = '#0055ff', scale = 1, radius = 1, height = 3, radialSegments = 8, heightSegments = 4, ...props }) {
    const geometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments, true), [radius, height, radialSegments, heightSegments]);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// Prism Graph (Graf Prisma). És un cas especial de Cn ◻ K2.
export function NeonPrism({ color = '#ff3300', scale = 1, sides = 5, height = 2, ...props }) {
    const geometry = useMemo(() => new THREE.CylinderGeometry(1, 1, height, sides, 1, false), [sides, height]);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}

// ==========================================
// 3. GRAFS COMPLEXES ESPACIALS
// ==========================================

// Torus Knot (Matemàtica de Nusos). Geometria extremadament complexa.
export function NeonTorusKnot({ color = '#ffaa00', scale = 1, ...props }) {
    // P i Q determinen les voltes que fa el nus abans de tancar-se.
    const geometry = useMemo(() => new THREE.TorusKnotGeometry(1.2, 0.3, 64, 8, 2, 3), []);
    return <NeonObstacle geometry={geometry} color={color} scale={scale} {...props} />;
}
