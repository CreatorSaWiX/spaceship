import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore.js';

export function usePlayerControls(playerRef) {
    const [, get] = useKeyboardControls();
    const [isTouchJump, setIsTouchJump] = useState(false);

    // Add Touch/Mouse listeners for universal input
    useEffect(() => {
        const handleDown = (e) => setIsTouchJump(true);
        const handleUp = () => setIsTouchJump(false);

        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchstart', handleDown);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);

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

        // Cinematic End Sequence (Autopilot / Hover)
        if (phase === 'ended') {
            const body = playerRef.current;
            const currentVel = body.linvel();
            const time = state.clock.getElapsedTime();

            // 1. Slow down forward speed (Friction)
            const targetX = 0;
            // 2. Gentle hover motion
            const hoverY = Math.sin(time * 1.5) * 0.5;

            body.setLinvel({
                x: THREE.MathUtils.lerp(currentVel.x, targetX, 2 * delta),
                y: THREE.MathUtils.lerp(currentVel.y, hoverY, 2 * delta),
                z: 0
            }, true);

            // 3. Level out rotation
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);

            // Softly rotate back to neutral
            const q = body.rotation();
            const currentQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
            const targetQ = new THREE.Quaternion(0, 0, 0, 1); // Identity (Flat)

            // Slerp to flat
            currentQ.slerp(targetQ, 2 * delta);
            body.setRotation(currentQ, true);

            return;
        }

        if (phase !== 'playing') return;

        const { jump } = get();
        const isJumping = jump || isTouchJump;

        const body = playerRef.current;
        const currentTranslation = body.translation();

        let newYVelocity = body.linvel().y;

        // --- FLUID / SINUSOIDAL MOVEMENT ---
        // Instead of gravity/force (parabola), we interpolate velocity (sine-like)

        // Safety Fallbacks (in case store hasn't hot-reloaded properly)
        const speed = physicsParams.flightSpeed || 6;
        const handling = physicsParams.handling || 4;

        // 1. Determine Target Velocity based on Input
        const targetYVelocity = isJumping ? speed : -speed;

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

        // LOCK ROTATIONS: X (Pitch) and Y (Yaw) must strictly be 0 at all times.
        // We only want the ship to Roll (Z) slightly when moving up or down.
        currentEuler.x = 0;
        currentEuler.y = 0;

        body.setRotation(new THREE.Quaternion().setFromEuler(currentEuler), true);

        // KILL PHYSICS SPIN: Prevent Rapier from accumulating physics-based rotation causing zig-zags
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        if (Math.abs(currentTranslation.z) > 0.05) {
            body.setTranslation({ x: currentTranslation.x, y: currentTranslation.y, z: 0 }, true);
        }
    });
}