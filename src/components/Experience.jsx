import { Physics } from '@react-three/rapier';
import { useRef, Suspense } from 'react';
import Lights from './Lights.jsx';
import Level from './Level.jsx';
import Player from './Player.jsx';
import { useCameraFollow } from '../hooks/useCameraFollow.js';
import { Perf } from 'r3f-perf';
import PlayerTrail from './PlayerCubeTrail.jsx';
import FloatingParticles from './FloatingParticles.jsx';
import ZoneTrigger from './triggers/ZoneTrigger.jsx';
import DebugPosition from './DebugPosition.jsx';

export default function Experience() {
    const playerRef = useRef();

    useCameraFollow(playerRef);

    return (
        <>
            {/* <Perf /> */}
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

// Configuració del Nivell - Aquí és on defineixes tot el que passa
const levelTriggers = [
    { x: 17, action: () => console.log('⚡ Start Music / Game') },
    { x: 72, action: () => console.log('📸 Camera Change -> Action View') },
    { x: 91, action: () => console.log('⚠️ Obstacle Wave 1') },
    { x: 160, action: () => console.log('🚀 Boost Speed') },
    { x: 165, action: () => console.log('🔥 Climax Sequence') },
    { x: 239, action: () => console.log('🧘 Calm Section') },
    { x: 313, action: () => console.log('🏁 End Level') },
];