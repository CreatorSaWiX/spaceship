import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import { useNPCBrain } from '../hooks/useNPCBrain';
import { useGameStore } from '../stores/gameStore';
import { ObjectCubeTrail } from './ObjectCubeTrail';

export default function NPC({ playerRef, position = [5, 1, 5], color = "#FF4081", traits = {} }) {
    const npcRef = useRef();
    useNPCBrain(npcRef, playerRef, traits);

    const linearDamping = useGameStore((state) => state.physicsParams.linearDamping);
    const friction = useGameStore((state) => state.physicsParams.friction);

    return (
        <>
            <RigidBody
                ref={npcRef}
                colliders="cuboid"
                position={position}
                linearDamping={linearDamping}
                angularDamping={1.5}
                restitution={0}
                friction={friction}
                enabledRotations={[false, true, false]}
                canSleep={false}
                userData={{ tag: 'npc' }}
            >
                <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
                    <meshStandardMaterial
                        color="#FFFFFF"
                        emissive={color}
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                </RoundedBox>
            </RigidBody>
            <ObjectCubeTrail targetRef={npcRef} color={color} />
        </>
    );
}
