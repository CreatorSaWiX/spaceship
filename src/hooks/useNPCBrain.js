import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Vectors reutilitzables per no generar escombraries de memòria
const _npcWorldPos = new THREE.Vector3();
const _playerWorldPos = new THREE.Vector3();
const _moveDirection = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDirection = new THREE.Vector3(0, -1, 0); // Cap avall

// Rotation globals
const _worldUp = new THREE.Vector3(0, 1, 0);
const _currentRotation = new THREE.Quaternion();
const _targetRotation = new THREE.Quaternion();

export function useNPCBrain(npcRef, playerRef, traits = {}) {
    const {
        speedMultiplier = 1.0,
        jumpForceMultiplier = 1.0,
        smartJump = true,
        panicThreshold = 35
    } = traits;

    const { world, rapier } = useRapier();

    const brainState = useRef({
        mode: 'IDLE',
        nextDecisionTime: 0,
        targetDirection: new THREE.Vector3(0, 0, 1),
        isJumping: false,
        jumpCooldown: 0,
        lastStuckPos: new THREE.Vector3(),
        stuckCheckTime: 0,
        // Cached Sensor Data
        isSafeFloor: true,
        isObstacleAhead: false
    });

    // Frame Throttling
    const frameCounter = useRef(Math.floor(Math.random() * 10));

    const physicsParams = useGameStore((state) => state.physicsParams);

    useFrame((state, delta) => {
        if (!npcRef.current || !playerRef.current) return;

        const time = state.clock.getElapsedTime();
        const npcBody = npcRef.current;
        frameCounter.current += 1;

        // 1. INPUTS SENSORIALS (On soc? On és el jugador?)
        _npcWorldPos.copy(npcBody.translation());
        _playerWorldPos.copy(playerRef.current.translation());

        let playerPos = _playerWorldPos;
        if (playerRef.current.translation) {
            playerPos = playerRef.current.translation();
        } else if (playerRef.current.position) {
            playerPos = playerRef.current.position;
        }

        const distanceToPlayer = _npcWorldPos.distanceTo(playerPos);

        // 2. PRESA DE DECISIONS (Cervell)
        if (distanceToPlayer > 35) {
            brainState.current.mode = 'PANIC';
        } else if (time > brainState.current.nextDecisionTime) {
            brainState.current.nextDecisionTime = time + 1 + Math.random() * 2;

            const rand = Math.random();
            if (rand < 0.6) {
                brainState.current.mode = 'ROAM'; // Passejar
                const angle = Math.random() * Math.PI * 2;
                brainState.current.targetDirection.set(Math.sin(angle), 0, Math.cos(angle));
            } else if (rand < 0.9) {
                brainState.current.mode = 'IDLE'; // Quedar-se quiet
            } else {
                brainState.current.mode = 'FOLLOW'; // Seguir al jugador
            }
        }

        // 3. EXECUCIÓ (Moure les cames)
        _moveDirection.set(0, 0, 0);

        if (brainState.current.mode === 'PANIC' || brainState.current.mode === 'FOLLOW') {
            _moveDirection.subVectors(playerPos, _npcWorldPos).normalize();
        } else if (brainState.current.mode === 'ROAM') {
            _moveDirection.copy(brainState.current.targetDirection);
        }

        // 2. SENSORS PESATS (OPTIMITZACIÓ)

        // A) SENSOR DE BUIT: Cada 10 frames
        if (frameCounter.current % 10 === 0) {
            _rayOrigin.copy(_npcWorldPos).addScaledVector(_moveDirection, 1.5).y += 1;
            const ray = new rapier.Ray(_rayOrigin, _rayDirection);
            brainState.current.isSafeFloor = !!world.castRay(ray, 5, true);
        }

        // B) SENSOR D'OBSTACLES: Cada 4 frames
        if (smartJump && frameCounter.current % 4 === 0) {
            _rayOrigin.copy(_npcWorldPos).y += 0.5;
            const obstacleRayDirection = _moveDirection.clone().normalize();
            const ray = new rapier.Ray(_rayOrigin, obstacleRayDirection);
            brainState.current.isObstacleAhead = !!world.castRay(ray, 1.5, true);
        }

        // REACCIÓ AL PERILL (Buit)
        if (!brainState.current.isSafeFloor) {
            _moveDirection.negate();
            brainState.current.targetDirection.negate();
            brainState.current.mode = 'ROAM';
            brainState.current.isSafeFloor = true; // Assumim seguretat fins al proper check
        }

        const currentVel = npcBody.linvel();

        // SALT INTEL·LIGENT (Obstacle)
        if (brainState.current.isObstacleAhead && brainState.current.mode !== 'IDLE' && time > brainState.current.jumpCooldown) {
            npcBody.applyImpulse({ x: 0, y: physicsParams.jumpForce * 1.2 * jumpForceMultiplier, z: 0 }, true);
            brainState.current.jumpCooldown = time + 1.0;
            brainState.current.isObstacleAhead = false;
        }

        // STUCK DETECTION (Si intento moure'm però no avanço -> SALTAR)
        if (time > brainState.current.stuckCheckTime) {
            const distMoved = _npcWorldPos.distanceTo(brainState.current.lastStuckPos);
            const isTryingToMove = _moveDirection.lengthSq() > 0.01;

            if (isTryingToMove && distMoved < 0.2) {
                npcBody.applyImpulse({ x: (Math.random() - 0.5) * 2, y: physicsParams.jumpForce * 1.5, z: (Math.random() - 0.5) * 2 }, true);
                brainState.current.jumpCooldown = time + 1.0;

                // Canviar d'idea/direcció
                brainState.current.mode = 'ROAM';
                brainState.current.targetDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }

            brainState.current.lastStuckPos.copy(_npcWorldPos);
            brainState.current.stuckCheckTime = time + 0.5;
        }

        // Aplicar Moviment
        const desiredVel = _moveDirection.multiplyScalar(
            physicsParams.maxSpeed * (brainState.current.mode === 'PANIC' ? 1.5 : 0.8) * speedMultiplier
        );

        // Suavitzat (Lerp)
        const smoothedVelX = THREE.MathUtils.lerp(currentVel.x, desiredVel.x, 5 * delta);
        const smoothedVelZ = THREE.MathUtils.lerp(currentVel.z, desiredVel.z, 5 * delta);

        npcBody.setLinvel({ x: smoothedVelX, y: currentVel.y, z: smoothedVelZ }, true);

        // Rotació Suau (Slerp)
        if (_moveDirection.lengthSq() > 0.1) {
            const targetAngle = Math.atan2(_moveDirection.x, _moveDirection.z);
            _targetRotation.setFromAxisAngle(_worldUp, targetAngle);

            _currentRotation.copy(npcBody.rotation()).slerp(_targetRotation, 10 * delta);
            npcBody.setRotation(_currentRotation, true);
        }

        // Salts Aleatoris
        if (brainState.current.mode !== 'IDLE' && time > brainState.current.jumpCooldown) {
            const jumpProb = 0.005 * jumpForceMultiplier;
            if (Math.random() < jumpProb) {
                npcBody.applyImpulse({ x: 0, y: physicsParams.jumpForce * jumpForceMultiplier, z: 0 }, true);
                brainState.current.jumpCooldown = time + 1.5;
            }
        }
    });
}
