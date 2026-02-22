import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState, useMemo } from 'react';
import { Trail } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore.js';

const ROTATION_OFFSET = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

// Helper to create a gradient texture dynamically
function useGradientTexture(colorStart, colorEnd) {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Low res is fine for gradient
        canvas.height = 1;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 128, 0);
        gradient.addColorStop(0, colorStart); // Head
        gradient.addColorStop(1, colorEnd); // Tail
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 1);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, [colorStart, colorEnd]);
    return texture;
}

export default function PlayerTrail({ playerRef, colorStart = "#00ffff", colorEnd = "#0055ff" }) {
    const targetRefLeft = useRef();
    const targetRefRight = useRef();
    const groupRef = useRef();

    // Audio
    const analyser = useGameStore((state) => state.audio.analyser);
    const phase = useGameStore((state) => state.phase);
    const dataArray = useMemo(() => new Uint8Array(128), []);

    // Simulation
    const lastPosLeft = useRef(new THREE.Vector3());
    const lastPosRight = useRef(new THREE.Vector3());
    const [trailElements] = useState(() => []);

    // Width State
    const [trailWidth, setTrailWidth] = useState(2);
    const lastWidthRef = useRef(2);
    const [trailOpacity, setTrailOpacity] = useState(0.8);

    // Gradient Texture
    const gradientMap = useGradientTexture(colorStart, colorEnd);

    // Config
    const trailConfig = {
        sizeCheck: 0.15,
        lifetime: 30, // Frames
        // Reseting offsets to match the Thruster cones again
        offsetLeft: new THREE.Vector3(-1, -0.25, 0.43),
        offsetRight: new THREE.Vector3(-1, -0.25, -0.43),
    };

    // Particles: Small additive octahedrons (glints)
    const particleGeo = new THREE.OctahedronGeometry(0.1, 0);
    // Reuse material to avoid reallocation
    const particleMat = useMemo(() => new THREE.MeshBasicMaterial({
        color: new THREE.Color("#00ffff"),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }), []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (!playerRef.current || !targetRefLeft.current) return;

        // 1. Audio Analysis
        let energy = 0;
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            // Focus on bass/kick
            for (let i = 0; i < 10; i++) sum += dataArray[i];
            energy = sum / 10 / 255;
        }

        // 2. Dynamic Width - High Contrast Pulse
        let targetWidth;
        let targetOpacity;

        if (phase === 'launching') {
            // MAX WIDTH FOR HYPERSPACE EFFECT
            targetWidth = 7.5;
            targetOpacity = 1;
        } else if (phase === 'ended') {
            targetWidth = 0;
            targetOpacity = 0;
        } else {
            const pulse = Math.pow(energy, 3);
            targetWidth = 0.6 + pulse * 15.0; // Increased min size to prevent "cut" effect
            targetOpacity = 0.3 + pulse * 0.7;
        }

        // Smooth width transition to avoid jagged geometry
        lastWidthRef.current = THREE.MathUtils.lerp(lastWidthRef.current, targetWidth, 0.1);
        setTrailWidth(lastWidthRef.current);
        setTrailOpacity(targetOpacity);

        // 3. Update Target Positions
        const translation = playerRef.current.translation();
        const rotation = playerRef.current.rotation();
        const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        const vLeft = trailConfig.offsetLeft.clone().applyQuaternion(quaternion).add(translation);
        const vRight = trailConfig.offsetRight.clone().applyQuaternion(quaternion).add(translation);

        targetRefLeft.current.position.copy(vLeft);
        targetRefRight.current.position.copy(vRight);

        const finalQuat = quaternion.clone().multiply(ROTATION_OFFSET);
        targetRefLeft.current.quaternion.copy(finalQuat);
        targetRefRight.current.quaternion.copy(finalQuat);

        // 4. Particles Spawning
        const handleParticles = (emissionPos, lastPosRef) => {
            const spawnDist = trailConfig.sizeCheck / (1 + energy * 3.0);

            if (lastPosRef.current.distanceTo(emissionPos) > spawnDist) {
                const count = energy > 0.5 ? 2 : 1;

                for (let k = 0; k < count; k++) {
                    const mesh = new THREE.Mesh(particleGeo, particleMat.clone());

                    const spread = 0.05 + (energy * 0.2);
                    mesh.position.copy(emissionPos).add(new THREE.Vector3(
                        (Math.random() - 0.5) * spread,
                        (Math.random() - 0.5) * spread,
                        (Math.random() - 0.5) * spread
                    ));

                    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

                    const scaleBase = 0.5 + Math.random() * 0.5;
                    mesh.scale.setScalar(scaleBase * (1 + energy));

                    // Drift away from engine
                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05
                    );

                    mesh.userData = {
                        velocity,
                        rotationSpeed: { x: Math.random() * 0.2, y: Math.random() * 0.2, z: 0 }
                    };

                    groupRef.current.add(mesh);
                    trailElements.push({ mesh, age: 0, initialScale: scaleBase });
                }
                lastPosRef.current.copy(emissionPos);
            }
        };

        if (phase !== 'ended') {
            handleParticles(vLeft, lastPosLeft);
            handleParticles(vRight, lastPosRight);
        }

        // 5. Update Particles
        for (let i = trailElements.length - 1; i >= 0; i--) {
            const el = trailElements[i];
            const mesh = el.mesh;
            el.age++;
            const lifeRatio = el.age / trailConfig.lifetime;

            if (lifeRatio >= 1) {
                groupRef.current.remove(mesh);
                trailElements.splice(i, 1);
            } else {
                const currentScale = el.initialScale * (1 - lifeRatio);
                mesh.scale.setScalar(currentScale);
                if (mesh.material) mesh.material.opacity = 0.8 * (1 - lifeRatio);

                mesh.position.add(mesh.userData.velocity);
                mesh.rotation.x += mesh.userData.rotationSpeed.x;
            }
        }
    });

    return (
        <>
            <group ref={groupRef} />

            <group ref={targetRefLeft}><mesh visible={false} /></group>
            <group ref={targetRefRight}><mesh visible={false} /></group>

            {/* Reverting to Single Gradient Trail per engine */}
            <Trail
                width={trailWidth}
                length={12} // Longer trail for smoother look at speed
                attenuation={(t) => t} // Linear attenuation (smoother fade than t*t)
                target={targetRefLeft}
                color={'#08adff'}
                transparent
                map={gradientMap}
                useMap={1}
                opacity={trailOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                interval={1} // Force update every frame
                renderOrder={1}
            />

            <Trail
                width={trailWidth}
                length={12}
                attenuation={(t) => t}
                target={targetRefRight}
                color={'#08adff'}
                transparent
                map={gradientMap}
                useMap={1}
                opacity={trailOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                interval={1}
                renderOrder={1}
            />

            {/* NEON CORE EFFECT (White Center) */}
            <Trail
                width={Math.max(0.4, trailWidth * 0.3)}
                length={12}
                attenuation={(t) => t}
                target={targetRefLeft}
                color={'#ffffff'}
                transparent
                opacity={trailOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                interval={1}
                renderOrder={2}
            />
            <Trail
                width={Math.max(0.4, trailWidth * 0.3)}
                length={12}
                attenuation={(t) => t}
                target={targetRefRight}
                color={'#ffffff'}
                transparent
                opacity={trailOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                interval={1}
                renderOrder={2}
            />
        </>
    );
}
