import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { forwardRef, useMemo, useEffect } from 'react';
import EngineThruster from './EngineThruster.jsx';
import { usePlayerControls } from '../hooks/usePlayerControls.js';
import * as THREE from 'three';

const Player = forwardRef((props, ref) => {
    const { scene } = useGLTF('/ship.glb');

    const whiteMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#0070ff',
        emissiveIntensity: 2,
        toneMapped: false
    }), []);

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.material = whiteMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene, whiteMaterial]);

    usePlayerControls(ref);

    return (
        <RigidBody
            ref={ref}
            colliders={false} // Manually adding collider
            position={[0, 1, 0]}
            linearDamping={0}
            angularDamping={0}
            restitution={0}
            friction={0}
            canSleep={false}
            enabledRotations={[false, false, false]} // Lock physics rotations completely!
            userData={{ tag: 'player' }}
        >
            <CuboidCollider args={[1, 0.3, 0.4]} position={[-0.1, -0.2, 0]} />

            {/* Ship Model */}
            <primitive
                object={scene}
                scale={0.35}
                position={[0, -0.25, 0]}
                rotation={[0, -Math.PI / 2, 0]}
            />

            {/* Thruster Effects - Dual Engines */}
            {/* Left Engine */}
            <group position={[-1.2, -0.25, 0.43]}>
                <EngineThruster color="#00ffff" />
            </group>

            {/* Right Engine */}
            <group position={[-1.2, -0.25, -0.43]}>
                <EngineThruster color="#00ffff" />
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/ship.glb');

export default Player;