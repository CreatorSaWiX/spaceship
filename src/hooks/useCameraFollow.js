import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.js';

export function useCameraFollow(playerRef) {
    const smoothedPos = useMemo(() => new THREE.Vector3(), []);
    const smoothedTarget = useMemo(() => new THREE.Vector3(), []);

    // Track phase for conditional camera movement
    const phase = useGameStore((state) => state.phase);

    useFrame((state, delta) => {
        // If not playing, orbit around the scene center
        if (phase !== 'playing') {
            const time = state.clock.getElapsedTime();

            if (phase === 'launching' && playerRef.current) {
                const playerPosition = playerRef.current.translation();

                // Target the exact same starting position as the 'playing' phase to ensure seamless transition
                // Playing offsets: Camera at (0, 0, 15), LookAt at (3, 0, 0) relative to player
                const targetPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z + 15);
                const targetLook = new THREE.Vector3(playerPosition.x + 3, playerPosition.y, 0);

                // Smoothly define launch transition speed
                const lerpSpeed = 3 * delta;

                // Move camera to start position
                state.camera.position.lerp(targetPos, lerpSpeed);

                // Smoothly adjust look target
                // If this is the first frame of launch, smoothedTarget might be at (0,0,0) from orbit
                smoothedTarget.lerp(targetLook, lerpSpeed);
                state.camera.lookAt(smoothedTarget);

                smoothedPos.copy(state.camera.position);
                return;
            }

            // Default Ready/Loading Orbit
            const radius = 22 + Math.sin(time * 0.1) * 2; // Breathing radius
            const x = Math.sin(time * 0.15) * radius;
            const z = Math.cos(time * 0.15) * radius;
            const y = 8 + Math.cos(time * 0.1) * 3;

            const orbitPos = new THREE.Vector3(x, y, z);
            const orbitTarget = new THREE.Vector3(0, 0, 0);

            state.camera.position.lerp(orbitPos, 1.5 * delta);
            state.camera.lookAt(orbitTarget);

            smoothedPos.copy(state.camera.position);
            smoothedTarget.copy(orbitTarget);
            return;
        }

        if (!playerRef.current) return;

        const playerPosition = playerRef.current.translation();

        // Side view configuration
        const offset = new THREE.Vector3(0, 0, 15); // Look slightly ahead (x+5), distance 15
        const cameraPosition = new THREE.Vector3(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        ).add(offset);

        // Look slightly ahead
        const cameraTarget = new THREE.Vector3(
            playerPosition.x + 3,
            playerPosition.y,
            0
        );

        const smoothness = 5 * delta;

        // Anti-snap initialization
        if (smoothedPos.lengthSq() === 0) {
            smoothedPos.copy(cameraPosition);
            smoothedTarget.copy(cameraTarget);
        }

        smoothedPos.lerp(cameraPosition, smoothness);
        smoothedTarget.lerp(cameraTarget, smoothness);

        state.camera.position.copy(smoothedPos);
        state.camera.lookAt(smoothedTarget);
    });
}