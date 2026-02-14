import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLES_COUNT = 5000
const AREA_X = 100
const AREA_Z = 200
const AREA_Y = 20 // Alçada del volum

// SHADERS
const vertexShader = `
  uniform float uTime;
  uniform float uHeight;
  
  attribute vec3 aPosition;
  attribute float aScale;
  attribute float aSpeed;
  attribute float aRandom;
  
  varying vec2 vUv;
  varying float vAlpha;

  // Funció simple de soroll pseudo-aleatori
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Soroll per al moviment orgànic
  float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(random(i.xy + vec2(0.0, 0.0)), random(i.xy + vec2(1.0, 0.0)), f.x),
                 mix(random(i.xy + vec2(0.0, 1.0)), random(i.xy + vec2(1.0, 1.0)), f.x), f.y),
                 mix(mix(random(i.xy + vec2(0.0, 0.0)), random(i.xy + vec2(1.0, 0.0)), f.x),
                 mix(random(i.xy + vec2(0.0, 1.0)), random(i.xy + vec2(1.0, 1.0)), f.x), f.y), f.z);
  }

  void main() {
    vUv = uv;
    
    // 1. Calcular nova posició Y (Ascendent)
    float yOffset = uTime * aSpeed; 
    float currentY = mod(aPosition.y + yOffset, uHeight); // Bucle infinit en alçada
    
    // Suavitzar l'aparició/desaparició als extrems (fade in/out)
    float normalizedY = currentY / uHeight;
    vAlpha = sin(normalizedY * 3.1415); // 0 -> 1 -> 0 (arc sinusoïdal)

    // 2. Afegir moviment lateral (Noise)
    // Usem la posició i el temps per generar turbulències
    float noiseFreq = 0.5;
    float noiseAmp = 2.0;
    float turbulenceX = sin(uTime * 0.5 + aRandom * 10.0 + currentY * 0.5) * noiseAmp;
    float turbulenceZ = cos(uTime * 0.3 + aRandom * 20.0 + currentY * 0.3) * noiseAmp;

    vec3 particlePos = vec3(aPosition.x + turbulenceX, currentY, aPosition.z + turbulenceZ);

    // 3. Billboarding (Sempre mirant a càmera)
    // El truc és fer ViewMatrix * InstancePos, i després sumar el VertexLocal esborrant la rotació
    vec4 viewPos = viewMatrix * vec4(particlePos, 1.0);
    
    // Sumem la posició del vèrtex (local) directament a l'espai de vista
    // Això fa que el pla estigui sempre alineat amb la càmera (com un sprite)
    viewPos.xyz += position * aScale;

    gl_Position = projectionMatrix * viewPos;
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    // Dibuixar un cercle suau
    float dist = distance(vUv, vec2(0.5));
    float strength = 1.0 - smoothstep(0.4, 0.5, dist);
    
    if (strength < 0.01) discard;

    vec3 color = vec3(0.8, 1.0, 1.0); // Blau ciàn clar
    gl_FragColor = vec4(color, strength * vAlpha * 0.6); // 0.6 opacitat màxima
  }
`

export default function FloatingParticles() {
    const meshRef = useRef()

    // Generar dades de les instàncies un sol cop
    const attributes = useMemo(() => {
        const positions = new Float32Array(PARTICLES_COUNT * 3)
        const scales = new Float32Array(PARTICLES_COUNT)
        const speeds = new Float32Array(PARTICLES_COUNT)
        const randoms = new Float32Array(PARTICLES_COUNT)

        for (let i = 0; i < PARTICLES_COUNT; i++) {
            // Posició aleatòria en la caixa BOUNDS (com el ModelViewer)
            // BOUNDS_X = 100, BOUNDS_Z = 300, però aquí ho farem centrat localment
            positions[i * 3 + 0] = (Math.random() - 0.5) * AREA_X
            positions[i * 3 + 1] = Math.random() * AREA_Y
            positions[i * 3 + 2] = - (Math.random() * AREA_Z * 0.5) + 40 // Offset més enrere

            scales[i] = Math.random() * 0.2 + 0.05 // Tamanys entre 0.05 i 0.25
            speeds[i] = Math.random() * 1.5 + 0.5  // Velocitat entre 0.5 i 2.0 m/s
            randoms[i] = Math.random()
        }

        return { positions, scales, speeds, randoms }
    }, [])

    // Uniforms del shader
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uHeight: { value: AREA_Y }
    }), [])

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value += delta
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[null, null, PARTICLES_COUNT]} frustumCulled={false}>
            <planeGeometry args={[1, 1]}>
                <instancedBufferAttribute attach="attributes-aPosition" args={[attributes.positions, 3]} />
                <instancedBufferAttribute attach="attributes-aScale" args={[attributes.scales, 1]} />
                <instancedBufferAttribute attach="attributes-aSpeed" args={[attributes.speeds, 1]} />
                <instancedBufferAttribute attach="attributes-aRandom" args={[attributes.randoms, 1]} />
            </planeGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false} // No escriure al depth buffer per evitar efectes quadrats en transparència
                blending={THREE.AdditiveBlending} // Additive per efecte brillant màgic
            />
        </instancedMesh>
    )
}
