import { Physics } from '@react-three/rapier';
import { useRef, useEffect, Suspense } from 'react';
import Lights from './Lights.jsx';
import Level from './Level.jsx';
import Player from './Player.jsx';
import { useCameraFollow } from '../hooks/useCameraFollow.js';
import { useGameStore } from '../stores/gameStore.js';
import { Perf } from 'r3f-perf';
import PlayerTrail from './PlayerCubeTrail.jsx';
import FloatingParticles from './FloatingParticles.jsx';
import CameraFadeMask from './CameraFadeMask.jsx';
import ZoneTrigger from './triggers/ZoneTrigger.jsx';
import DebugPosition from './DebugPosition.jsx';

export default function Experience() {
    const playerRef = useRef();
    const phase = useGameStore((state) => state.phase);

    useCameraFollow(playerRef);

    // Handle Launch Sequence (Transition from Launching -> Playing)
    useEffect(() => {
        if (phase === 'launching') {
            const timer = setTimeout(() => {
                useGameStore.getState().startGame(); // This plays music & sets phase to 'playing'
            }, 1500); // 1.5s to allow for the zoom & blackout animation
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Teleport player to the new "sector" when game starts (hidden by blackout)
    useEffect(() => {
        if (phase === 'playing' && playerRef.current) {
            playerRef.current.setTranslation({ x: 400, y: 1, z: 0 }, true);
            // Kickstart movement immediately to prevent "stuck" feeling
            playerRef.current.setLinvel({ x: 5.5, y: 0, z: 0 }, true);
            playerRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            playerRef.current.wakeUp();
            return;
        }

        // Reset player to start if resetting game
        if ((phase === 'ready' || phase === 'launching') && playerRef.current) {
            const t = playerRef.current.translation();
            // If we are far away (end level), teleport back
            if (t.x > 50) {
                playerRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
                playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                playerRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
                playerRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
            }
        }
    }, [phase]);

    return (
        <>
            {/* <Perf /> */}
            <CameraFadeMask />
            {/* <DebugPosition playerRef={playerRef} /> */}
            <FloatingParticles />
            <Lights />
            <PlayerTrail playerRef={playerRef} />

            <Physics gravity={[0, 0, 0]} debug={false}>
                <Level playerRef={playerRef} />
                <Player ref={playerRef} />

                {/* Level Triggers System */}
                {levelTriggers.map((trigger, index) => (
                    <ZoneTrigger
                        key={index}
                        position={[trigger.x, 0, 0]}
                        size={[0.5, 10, 4]}
                        onEnter={trigger.action}
                        debug={true}
                    />
                ))}
            </Physics>
        </>
    );
}

// Configuració del Nivell - Offset +400 unitats (Després de la transició)
const levelTriggers = [
    { x: 417, action: () => { console.log('⚡ Fade Out Blackout'); useGameStore.getState().setBlackout(false); } }, // 17 + 400
    { x: 472, action: () => { console.log('📸 Camera Change -> Action View (Chase)'); useGameStore.getState().setCameraView('chase'); } }, // 72 + 400
    { x: 491, action: () => console.log('⚠️ Obstacle Wave 1') }, // 91 + 400
    { x: 560, action: () => console.log('🚀 Boost Speed') }, // 160 + 400
    { x: 565, action: () => console.log('🔥 Climax Sequence') }, // 165 + 400
    { x: 639, action: () => console.log('🧘 Calm Section') }, // 239 + 400
    {
        x: 713, action: () => {
            console.log('🏁 End Level (Tape Stop & Orbit)');
            useGameStore.getState().triggerLevelEnd();
            useGameStore.getState().setPhase('ended');
        }
    }, // 313 + 400
];