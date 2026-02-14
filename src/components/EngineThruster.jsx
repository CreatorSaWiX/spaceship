import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending } from 'three';

export default function EngineThruster({ color = "#00ffff" }) {
    const meshRef = useRef();
    const glowRef = useRef();

    useFrame((state) => {
        const time = state.clock.elapsedTime;

        if (meshRef.current) {
            // Rapid thrust flicker
            const scaleNoise = 1 + (Math.random() - 0.5) * 0.1;
            const pulse = 1 + Math.sin(time * 20) * 0.1;
            meshRef.current.scale.set(1, pulse * scaleNoise, 1);
        }

        if (glowRef.current) {
            // Slower glow pulsation
            const glowPulse = 1 + Math.sin(time * 5) * 0.1;
            glowRef.current.scale.set(1, glowPulse, 1);
            glowRef.current.material.opacity = 0.4 + Math.sin(time * 10) * 0.1;
        }
    });

    return (
        <group rotation={[0, 0, -Math.PI / 2]}>
            {/* Main Core */}
            <mesh ref={meshRef} position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.04, 0.0, 0.5, 8, 1, true]} />
                <meshBasicMaterial
                    color={new Color("#e0ffff").multiplyScalar(5)} // Boost for bloom
                    transparent
                    opacity={0.8}
                    blending={AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Outer Glow */}
            <mesh ref={glowRef} position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.15, 0.0, 1, 8, 1, true]} />
                <meshBasicMaterial
                    color={new Color(color).multiplyScalar(2)}
                    transparent
                    opacity={0.3}
                    blending={AdditiveBlending}
                    depthWrite={false}
                    side={2} // DoubleSide
                />
            </mesh>
        </group>
    );
}


