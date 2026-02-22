import { CuboidCollider } from '@react-three/rapier';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore.js';

/**
 * ZoneTrigger optimitzat utilitzant Sensors de Rapier.
 * Només executa codi quan el motor de físiques detecta una entrada.
 * 
 * @param {Array} position - [x, y, z] Posició del trigger
 * @param {Array} size - [width, height, depth] Mida de la zona
 * @param {Function} onEnter - Funció a executar quan el jugador entra
 * @param {boolean} debug - Si és true, mostra una caixa verda/vermella
 */
export default function ZoneTrigger({
    position,
    size = [1, 10, 10],
    onEnter,
    debug = true
}) {
    const [triggered, setTriggered] = useState(false);
    const phase = useGameStore((state) => state.phase);

    // Reset trigger state on game restart
    useEffect(() => {
        if (phase === 'ready' || phase === 'loading' || phase === 'launching') {
            setTriggered(false);
        }
    }, [phase]);

    // Gestor de l'esdeveniment d'entrada
    const handleEnter = ({ other }) => {
        // Verifiquem que sigui el jugador qui entra (mirant el userData del Player.jsx)
        if (other.rigidBodyObject?.userData?.tag === 'player' && !triggered) {
            setTriggered(true);
            console.log(`Trigger activat a x:${position[0]}`);
            if (onEnter) onEnter();
        }
    };

    return (
        <group position={position}>
            {/* Visualització Debug (només visual, sense física) */}
            {debug && (
                <mesh>
                    <boxGeometry args={size} />
                    <meshBasicMaterial
                        color={triggered ? "red" : "#00ff00"}
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}

            {/* Sensor Físic Invisible */}
            {/* Rapier utilitza "half-extents" (meitat de la mida) per als colliders, per això dividim per 2 */}
            <CuboidCollider
                args={[size[0] / 2, size[1] / 2, size[2] / 2]}
                sensor={true}
                onIntersectionEnter={handleEnter}
            />
        </group>
    );
}
