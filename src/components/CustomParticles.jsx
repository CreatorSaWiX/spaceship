import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

import particleVertexShader from '../shaders/particles/vertex.glsl';
import particleFragmentShader from '../shaders/particles/fragment.glsl';

const PARTICLE_COUNT = 1000;
const BOUNDS_X = 100;
const BOUNDS_Z = 300;
const Y_POSITION = -0.3;

export default function CustomParticles() {
    const textures = useLoader(TextureLoader, [
        '/particles/1.png',
        '/particles/2.png',
        '/particles/3.png',
    ]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uTexture1: { value: textures[0] },
        uTexture2: { value: textures[1] },
        uTexture3: { value: textures[2] },
    }), [textures]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();

        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const animationSpeeds = new Float32Array(PARTICLE_COUNT);
        const animationOffsets = new Float32Array(PARTICLE_COUNT);
        const textureIndices = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * BOUNDS_X;
            positions[i * 3 + 1] = Y_POSITION;
            positions[i * 3 + 2] = -(Math.random() - 0.1) * BOUNDS_Z;

            sizes[i] = 15 + Math.random() * 20;
            animationSpeeds[i] = Math.random() * 5;
            animationOffsets[i] = 2.0 + Math.random() * 3.0;
            textureIndices[i] = Math.floor(Math.random() * 3);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('aAnimationSpeed', new THREE.BufferAttribute(animationSpeeds, 1));
        geo.setAttribute('aAnimationOffset', new THREE.BufferAttribute(animationOffsets, 1));
        geo.setAttribute('aTextureIndex', new THREE.BufferAttribute(textureIndices, 1));

        return geo;
    }, []);

    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime();
    });

    return (
        <points geometry={geometry}>
            <shaderMaterial
                vertexShader={particleVertexShader}
                fragmentShader={particleFragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}