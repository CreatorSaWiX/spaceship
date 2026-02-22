import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';

// Optimized GPU Batching Components to avoid CPU suicide with "Fake Bloom"
function EdgesInstanced({ edges, materials }) {
    const mesh1 = useRef(null);
    const mesh2 = useRef(null);
    const mesh3 = useRef(null);

    const geometries = useMemo(() => ({
        g1: new THREE.CylinderGeometry(0.02, 0.02, 1, 4),
        g2: new THREE.CylinderGeometry(0.08, 0.08, 1, 6),
        g3: new THREE.CylinderGeometry(0.18, 0.18, 1, 6)
    }), []);

    useEffect(() => {
        if (!mesh1.current || !edges.length) return;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < edges.length; i++) {
            dummy.position.copy(edges[i].position);
            dummy.rotation.copy(edges[i].rotation);
            dummy.scale.set(1, edges[i].length, 1);
            dummy.updateMatrix();
            mesh1.current.setMatrixAt(i, dummy.matrix);
            mesh2.current.setMatrixAt(i, dummy.matrix);
            mesh3.current.setMatrixAt(i, dummy.matrix);
        }
        mesh1.current.instanceMatrix.needsUpdate = true;
        mesh2.current.instanceMatrix.needsUpdate = true;
        mesh3.current.instanceMatrix.needsUpdate = true;
    }, [edges]);

    if (!edges.length) return null;
    return (
        <group>
            <instancedMesh ref={mesh1} args={[geometries.g1, materials.edgeCenter, edges.length]} />
            <instancedMesh ref={mesh2} args={[geometries.g2, materials.edgeGlow1, edges.length]} />
            <instancedMesh ref={mesh3} args={[geometries.g3, materials.edgeGlow2, edges.length]} />
        </group>
    );
}

function NodesInstanced({ vertices, materials }) {
    const mesh1 = useRef(null);
    const mesh2 = useRef(null);

    const geometries = useMemo(() => ({
        g1: new THREE.SphereGeometry(0.08, 8, 8),
        g2: new THREE.SphereGeometry(0.25, 8, 8)
    }), []);

    useEffect(() => {
        if (!mesh1.current || !vertices.length) return;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < vertices.length; i++) {
            const v = vertices[i];
            dummy.position.set(v[0], v[1], v[2]);
            dummy.updateMatrix();
            mesh1.current.setMatrixAt(i, dummy.matrix);
            mesh2.current.setMatrixAt(i, dummy.matrix);
        }
        mesh1.current.instanceMatrix.needsUpdate = true;
        mesh2.current.instanceMatrix.needsUpdate = true;
    }, [vertices]);

    if (!vertices.length) return null;
    return (
        <group>
            <instancedMesh ref={mesh1} args={[geometries.g1, materials.nodeCenter, vertices.length]} />
            <instancedMesh ref={mesh2} args={[geometries.g2, materials.nodeGlow, vertices.length]} />
        </group>
    );
}

// 🚀 Aquest component processa qualsevol geometria i la converteix en un gràfic estil "Geometry Dash" amb nodes (esferes) i arestes (cilindres brillants)
export default function NeonObstacle({
    geometry,       // Ens entra qualsevol geometria de ThreeJS (Ex: BoxGeometry, TetrahedronGeometry)
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    color = '#00f0ff',   // Color cyan de les arestes
    coreOpacity = 0.15   // Transparència del vidre intern
}) {
    // Extraiem programàticament i a baix nivell les arestes i vèrtexs 
    const { edges, vertices } = useMemo(() => {
        // 1. Obtenir Arestes (EdgesGeometry ens dona les línies de només el perímetre, sense diagonals innecessàries)
        const edgesGeom = new THREE.EdgesGeometry(geometry);
        const edgePositions = edgesGeom.attributes.position.array;

        const lines = [];
        for (let i = 0; i < edgePositions.length; i += 6) {
            const start = new THREE.Vector3(edgePositions[i], edgePositions[i + 1], edgePositions[i + 2]);
            const end = new THREE.Vector3(edgePositions[i + 3], edgePositions[i + 4], edgePositions[i + 5]);

            const distance = start.distanceTo(end);
            const midpoint = start.clone().lerp(end, 0.5);

            // Càlcul vectorial simple per rotar el cilindre perquè miri a la mateixa direcció que la línia de l'aresta
            const direction = end.clone().sub(start).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            const euler = new THREE.Euler().setFromQuaternion(quaternion);

            lines.push({ position: midpoint, rotation: euler, length: distance });
        }

        // 2. Extreure només els Vèrtexs únics per a posar-hi els punts brillants (Nodes del Graf)
        const vArray = geometry.attributes.position.array;
        const vMap = new Map();
        for (let i = 0; i < vArray.length; i += 3) {
            // Arrodonim per detectar duplicats exactes generats pel render de les cares
            const key = `${vArray[i].toFixed(2)}_${vArray[i + 1].toFixed(2)}_${vArray[i + 2].toFixed(2)}`;
            if (!vMap.has(key)) {
                vMap.set(key, [vArray[i], vArray[i + 1], vArray[i + 2]]);
            }
        }
        const uniqueVertices = Array.from(vMap.values());

        return { edges: lines, vertices: uniqueVertices };
    }, [geometry]);

    // Crear Materials Prèviament per Rendiment
    const materials = useMemo(() => ({
        core: new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: coreOpacity,
            roughness: 0.1,
            metalness: 0.8,
            depthWrite: false
        }),
        edgeCenter: new THREE.MeshBasicMaterial({
            color: '#ffffff', // Blanc pur pel centre
        }),
        edgeGlow1: new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending, // La màgia del "FAKE BLOOM"
            depthWrite: false
        }),
        edgeGlow2: new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }),
        nodeCenter: new THREE.MeshBasicMaterial({
            color: '#ffffff',
        }),
        nodeGlow: new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    }), [color, coreOpacity]);

    return (
        // Creem la física convex de la colisió (S'adapta a l'envoltura geomètrica que li passem!)
        <RigidBody position={position} rotation={rotation} type="fixed" colliders="hull">
            <group scale={scale}>
                {/* 1. NUCLI DE CRISTALL: Un cos intern gairebé transparent */}
                <mesh geometry={geometry} material={materials.core} />

                {/* 2. ARESTES VINCULANTS BATXEJADES PER LA GPU (InstancedMesh) */}
                <EdgesInstanced edges={edges} materials={materials} />

                {/* 3. NODES ESFÈRICS BATXEJATS PER LA GPU (InstancedMesh) */}
                <NodesInstanced vertices={vertices} materials={materials} />
            </group>
        </RigidBody>
    );
}
