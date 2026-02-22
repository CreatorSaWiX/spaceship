import * as THREE from 'three';
import { RigidBody, CuboidCollider, InstancedRigidBodies } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { create } from 'zustand';

import floorVertexShader from '../shaders/floor/vertex.glsl';
import floorFragmentShader from '../shaders/floor/fragment.glsl';
import {
    NeonTetra, NeonCube, NeonOcta, NeonDodeca, NeonIcosa,
    NeonTorusGrid, NeonCylinderGraph, NeonPrism, NeonTorusKnot
} from './NeonGraphs.jsx';

export const useFloorStore = create((set) => ({
    setFloorBrightness: (v) => { floorMaterial.uniforms.uBrightness.value = v; },
    setLightningIntensity: (v) => { floorMaterial.uniforms.uLightningIntensity.value = v; }, // NEW
    setFloorColors: (colors) => {
        for (const key in colors) {
            floorMaterial.uniforms[key].value.set(colors[key]);
        }
    },
}));

const floorMaterial = new THREE.ShaderMaterial({
    wireframe: true,
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
    uniforms: {
        uColorTopLeft: { value: new THREE.Color('#2ef7ff') },
        uColorTopRight: { value: new THREE.Color('#00bfff') },
        uColorBottomLeft: { value: new THREE.Color('#93ffca') },
        uColorBottomRight: { value: new THREE.Color('#0010ff') },
        uBrightness: { value: 0.6 },
        uLightningIntensity: { value: 0.0 }, // NEW
    },
});

function VisualFloor({ playerRef }) {
    const floorRef = useRef();
    const planeGeometry = useMemo(() => new THREE.PlaneGeometry(200, 200, 1, 1), []);

    useFrame(() => {
        if (playerRef.current && floorRef.current) {
            const playerPos = playerRef.current.translation();
            const dx = Math.abs(floorRef.current.position.x - playerPos.x);
            const dz = Math.abs(floorRef.current.position.z - playerPos.z);
            if (dx > 0.1 || dz > 0.1) {
                floorRef.current.position.x = playerPos.x;
                floorRef.current.position.z = playerPos.z;
            }
        }
    });

    return (
        <mesh ref={floorRef} material={floorMaterial} rotation-x={-Math.PI * 0.5} position-y={-0.51}>
            <primitive object={planeGeometry} attach="geometry" />
        </mesh>
    );
}

function PhysicsFloor({ playerRef }) {
    const floorRef = useRef();

    useFrame(() => {
        if (playerRef.current && floorRef.current) {
            const playerPos = playerRef.current.translation();
            floorRef.current.setTranslation({ x: playerPos.x, y: -0.5, z: playerPos.z }, true);
        }
    });

    return (
        <RigidBody ref={floorRef} type="kinematicPosition" friction={0} restitution={0}>
            <CuboidCollider args={[100, 0.1, 100]} />
        </RigidBody>
    );
}
function NeonObstacles() {
    return (
        <group>
            {/* 1. ELS SÒLIDS PLATÒNICS (Els 5 grafs regulars tridimensionals) */}
            <NeonTetra color="#00ffff" position={[420, 1.5, 4]} rotation={[Math.PI / 4, 0, 0]} />
            <NeonCube color="#00ffff" position={[435, 1.5, -3]} rotation={[0, Math.PI / 4, 0]} />
            <NeonOcta color="#00ffff" position={[450, 2, 2]} />
            <NeonDodeca color="#00ffff" position={[465, 2.5, -4]} />
            <NeonIcosa color="#00ffff" position={[480, 2, 3]} />

            {/* 2. GRAFS PRODUCTE (Molt recurrents en estructures i arquitectura de xarxes) */}
            {/* Prisma Pentagonal (C5 x K2) */}
            <NeonPrism sides={5} color="#00ffff" position={[500, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} />

            {/* Graella Cilíndrica (C10 x P4) */}
            <NeonCylinderGraph color="#00ffff" position={[525, 2, -2]} rotation={[Math.PI / 2, 0, Math.PI / 4]} />

            {/* Torus Grid (C16 x C6) */}
            <NeonTorusGrid color="#00ffff" position={[550, 3, 2]} rotation={[Math.PI / 3, 0, 0]} />

            {/* 3. LOCURES FRACTALS I NUSOS */}
            <NeonTorusKnot color="#00ffff" position={[580, 4, 0]} scale={1.5} />
        </group>
    );
}

export default function Level({ playerRef }) {
    return (
        <>
            <VisualFloor playerRef={playerRef} />
            <PhysicsFloor playerRef={playerRef} />
            <NeonObstacles />
        </>
    );
}