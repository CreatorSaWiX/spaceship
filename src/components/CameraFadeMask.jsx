import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

export default function CameraFadeMask() {
    const fadePlaneRef = useRef();
    const { camera, viewport } = useThree(); // Obtenim viewport per fer fullscreen
    const phase = useGameStore((state) => state.phase);
    const audio = useGameStore((state) => state.audio);

    // Material simple negre constant
    const material = useMemo(() => new THREE.MeshBasicMaterial({
        color: 'black',
        transparent: true,
        opacity: 1, // Comença opac (negre)
        depthTest: false, // Sempre renderitza a sobre de tot l'escena 3D
        depthWrite: false
    }), []);

    // Estat local per al progrés del fade
    // Usem ref per no re-renderitzar el component React a cada frame, només el ThreeJS loop
    const state = useRef({
        fadeProgress: 0,
        isActive: false,
        delayTimer: 0 // Nou: temps d'espera abans de començar el fade
    });

    useFrame((stateThree, delta) => {
        if (!fadePlaneRef.current) return;

        // 1. Posicionament: Enganxat a la càmera (HUD)
        // El pla ha d'estar just davant la càmera
        fadePlaneRef.current.position.copy(camera.position);
        fadePlaneRef.current.quaternion.copy(camera.quaternion);
        // Movem lleugerament endavant (Z local -1) per no tallar amb near plane
        fadePlaneRef.current.translateZ(-0.5);

        // Escala per cobrir tot el camp de visió (basat en distància 0.5)
        // Tanmateix, fent-ho molt gran és més fàcil:
        fadePlaneRef.current.scale.set(viewport.width * 2, viewport.height * 2, 1);

        // 2. Lògica d'Activació
        // Quan entrem en playing, activem la màscara si no ho estava
        if (phase === 'playing' && !state.current.isActive) {
            state.current.isActive = true;
            fadePlaneRef.current.visible = true;
            state.current.fadeProgress = 0; // Reset
            state.current.delayTimer = 0; // Reset delay
            material.opacity = 1;
        }

        // 3. Animació del Fade
        if (state.current.isActive) {
            // A. Retard inicial: Mantenir negre absolut durant 2 segons
            state.current.delayTimer += delta;

            if (state.current.delayTimer < 2.0) {
                // Durant els primers 2 segons, opacitat màxima i sortim
                material.opacity = 1;
                return;
            }

            // B. Lògica d'àudio
            let beatImpulse = 0;
            // Optimització: Només comprovem analitzador si realment volem l'efecte rítmic
            if (audio.analyser) {
                const dataArray = new Uint8Array(16); // Molt petit, suficient per greus
                audio.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < 4; i++) sum += dataArray[i]; // Només els 4 primers bins (sub-bass)
                const normalized = (sum / 4) / 255;

                // Corba de resposta
                beatImpulse = Math.pow(normalized, 3) * 0.4;
            }

            // Avenç del temps (fade out molt lent: 5s per arribar al 70% opacitat -> significa baixar 0.3 en 5s approx)
            // Velocitat = 0.3 / 5 = 0.06 per segon.
            // Si volem que arribi a transparent total (0%), trigaria uns 16 segons a aquest ritme.
            // Ajustem el factor perquè sigui visualment agradable però lent com demana.
            if (state.current.fadeProgress < 1.0) {
                state.current.fadeProgress += delta * 0.06;
            }

            // Càlcul final d'opacitat
            // 1.0 (negre) -> 0.0 (transparent)
            // L'efecte de la música (beatImpulse) accelera momentàniament la transparència (cops de llum)
            let targetOpacity = 1.0 - (state.current.fadeProgress + beatImpulse);

            // Assegurem límits
            if (targetOpacity < 0) targetOpacity = 0;
            if (targetOpacity > 1) targetOpacity = 1;

            material.opacity = targetOpacity;

            // Finalització: quan el progrés base ja ha acabat del tot (i una mica més de marge), apaguem
            if (state.current.fadeProgress >= 1.2) {
                fadePlaneRef.current.visible = false;
                state.current.isActive = false;
            }
        } else {
            // Assegurar desactivat si no és playing
            if (fadePlaneRef.current.visible && phase !== 'playing') {
                fadePlaneRef.current.visible = false;
            }
        }
    });

    return (
        <mesh ref={fadePlaneRef} visible={false}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}
