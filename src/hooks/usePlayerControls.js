import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore.js';

export function usePlayerControls(playerRef) {
    const [, get] = useKeyboardControls();

    useFrame((state, delta) => {
        const { phase, physicsParams } = useGameStore.getState();

        if (!playerRef.current) return;

        // Reset if we are resetting (transition)
        if (phase === 'loading') return;

        // Force high speed during launch
        if (phase === 'launching') {
            const body = playerRef.current;
            body.setLinvel({ x: 50, y: 0, z: 0 }, true); // HYPER SPEED
            return;
        }

        // Force freeze if paused
        if (phase === 'paused') {
            const body = playerRef.current;
            body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        if (phase !== 'playing') return;

        const { jump } = get();
        const body = playerRef.current;
        const currentTranslation = body.translation();

        let newYVelocity = body.linvel().y;

        // --- FLUID / SINUSOIDAL MOVEMENT ---
        // Instead of gravity/force (parabola), we interpolate velocity (sine-like)

        // Safety Fallbacks (in case store hasn't hot-reloaded properly)
        const speed = physicsParams.flightSpeed || 6;
        const handling = physicsParams.handling || 4;

        // 1. Determine Target Velocity based on Input
        const targetYVelocity = jump ? speed : -speed;

        // 2. Smoothly interpolate current velocity towards target (this creates the curve)
        newYVelocity = THREE.MathUtils.lerp(
            newYVelocity,
            targetYVelocity,
            handling * delta
        );

        // 3. Apply Velocity
        body.setLinvel({
            x: physicsParams.forwardSpeed,
            y: newYVelocity,
            z: 0
        }, true);

        // Ease Out Quad for "snappy" initial rotation
        // t is normalized speed (0 to 1)
        const maxVerticalSpeed = 4;
        const t = Math.min(Math.abs(newYVelocity) / maxVerticalSpeed, 1);
        const easedT = t * (2 - t); // Quad Out: 1 - (1-t)^2
        const targetRotationZ = Math.sign(newYVelocity) * easedT * 0.6; // Max angle ~20 degrees (0.35 rads)

        const q = body.rotation();
        const currentEuler = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion(q.x, q.y, q.z, q.w)
        );

        // Lower lerp speed for smoother, longer rotation (less abrupt)
        currentEuler.z = THREE.MathUtils.lerp(currentEuler.z, targetRotationZ, 6 * delta);

        currentEuler.x = 0;
        currentEuler.y = 0;

        body.setRotation(new THREE.Quaternion().setFromEuler(currentEuler), true);

        if (Math.abs(currentTranslation.z) > 0.05) {
            body.setTranslation({ x: currentTranslation.x, y: currentTranslation.y, z: 0 }, true);
        }
    });
}