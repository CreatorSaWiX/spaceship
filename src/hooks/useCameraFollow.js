import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.js';

export function useCameraFollow(playerRef) {
    const smoothedPos = useMemo(() => new THREE.Vector3(), []);
    const smoothedTarget = useMemo(() => new THREE.Vector3(), []);

    // Track phase for conditional camera movement
    const phase = useGameStore((state) => state.phase);
    // Track dynamic camera view mode
    const cameraView = useGameStore((state) => state.cameraView);

    useFrame((state, delta) => {
        // If not playing, orbit around the scene center
        if (phase !== 'playing') {
            const time = state.clock.getElapsedTime();

            if (phase === 'launching' && playerRef.current) {
                const playerPosition = playerRef.current.translation();

                // Dramatic Launch Zoom: Move camera close behind the engine
                // Playing view is side (z+15), Launch view is rear-chase (z+4, x-3)
                // Use a closer offset to feel the speed
                const targetPos = new THREE.Vector3(playerPosition.x - 3, playerPosition.y + 0.5, playerPosition.z + 4);
                const targetLook = new THREE.Vector3(playerPosition.x + 20, playerPosition.y, 0);

                // Smoothly define launch transition speed (Faster for impact)
                const lerpSpeed = 4 * delta;

                // Move camera to chase position
                state.camera.position.lerp(targetPos, lerpSpeed);

                // Look ahead
                smoothedTarget.lerp(targetLook, lerpSpeed);
                state.camera.lookAt(smoothedTarget);

                smoothedPos.copy(state.camera.position);
                return;
            }

            // Default Ready/Loading/Ended Orbit

            // Determinar el centre de l'òrbita
            let centerPos = new THREE.Vector3(0, 0, 0);
            if (phase === 'ended' && playerRef.current) {
                const pp = playerRef.current.translation();
                centerPos.set(pp.x, pp.y, pp.z);
            }

            // Paràmetres d'òrbita
            const radius = 22 + Math.sin(time * 0.1) * 2; // Breathing radius
            const x = Math.sin(time * 0.15) * radius;
            const z = Math.cos(time * 0.15) * radius;
            const y = 8 + Math.cos(time * 0.1) * 3;

            // Posició absoluta: Centre + Offset orbital
            const orbitPos = new THREE.Vector3(x, y, z).add(centerPos);
            const orbitTarget = centerPos.clone();

            // Lerp suau cap a l'òrbita
            // En 'ended', venint de 'playing' ràpid, potser volem un lerp més lent per suavitzar la frenada
            const lerpFactor = phase === 'ended' ? 1.0 * delta : 1.5 * delta;

            state.camera.position.lerp(orbitPos, lerpFactor);
            state.camera.lookAt(orbitTarget);

            smoothedPos.copy(state.camera.position);
            smoothedTarget.copy(orbitTarget);
            return;
        }

        if (!playerRef.current) return;

        const playerPosition = playerRef.current.translation();

        // --- CAMERA VIEW LOGIC (SIDE vs CHASE) ---
        let offset;
        let lookTarget;

        if (cameraView === 'chase') {
            // VISTA 3a PERSONA (Darrere/Cul)
            // Càmera darrere de la nau (X menys) i una mica amunt (Y plus)
            // LookAt molt endavant (X plus)
            offset = new THREE.Vector3(-6, 3, 0);
            lookTarget = new THREE.Vector3(playerPosition.x + 20, playerPosition.y, 0); // Mira lluny endavant
        } else {
            // VISTA LATERAL (Defecte)
            // Càmera al costat (Z plus)
            offset = new THREE.Vector3(0, 0, 15);
            lookTarget = new THREE.Vector3(playerPosition.x + 3, playerPosition.y, 0); // Mira una mica endavant
        }

        const cameraPosition = new THREE.Vector3(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        ).add(offset);

        // Interpolació de posició i objectiu per suavitzar el canvi
        // Ajustem suavitzat segons el mode:
        // - 'side': Ràpid (5.0) per seguir bé els moviments laterals sense perdre la nau.
        // - 'chase': Més lent (1.2) per fer la transició cinemàtica (takes 2-3s) i donar "pes" al vol.
        const baseSmoothness = cameraView === 'side' ? 5.0 : 1.2;
        const smoothness = baseSmoothness * delta;

        // Anti-snap initialization (si és el primer frame o canvi brusc)
        if (smoothedPos.lengthSq() === 0) {
            smoothedPos.copy(cameraPosition);
            smoothedTarget.copy(lookTarget);
        }

        smoothedPos.lerp(cameraPosition, smoothness);
        smoothedTarget.lerp(lookTarget, smoothness);

        state.camera.position.copy(smoothedPos);
        state.camera.lookAt(smoothedTarget);
    });
}