import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useMemo, Suspense } from 'react';
import Experience from './components/Experience.jsx';
import { getOptimalSettings } from './utils/deviceDetection.js';
import { useGameStore } from './stores/gameStore.js';

const keyMap = [
    { name: 'jump', keys: ['Space', 'ArrowUp', 'KeyW', 'click'] },
];

import Overlay from './components/Overlay.jsx';

export default function App() {
    const optimalSettings = useMemo(() => getOptimalSettings(), []);
    const phase = useGameStore((state) => state.phase);

    return (
        <KeyboardControls map={keyMap}>
            <Overlay />
            <Canvas
                className={`canvas-container`}
                camera={{ fov: optimalSettings.fov, position: [0, 0, 10] }}
                dpr={optimalSettings.pixelRatio}
                gl={{
                    antialias: optimalSettings.antialias,
                    powerPreference: "high-performance"
                }}
                performance={{ min: 0.5 }}
                frameloop="always"
            >
                <Suspense fallback={null}>
                    <Experience />
                </Suspense>
            </Canvas>
        </KeyboardControls>
    );
}