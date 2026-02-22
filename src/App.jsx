import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useMemo, Suspense } from 'react';
import { Perf } from 'r3f-perf';
import Experience from './components/Experience.jsx';
import { getOptimalSettings } from './utils/deviceDetection.js';
import { useGameStore } from './stores/gameStore.js';
import Overlay from './components/Overlay.jsx';

const keyMap = [
    { name: 'jump', keys: ['Space', 'ArrowUp', 'KeyW', 'click'] },
];



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
                <Perf position="top-left" />
                <Suspense fallback={null}>
                    <Experience />
                </Suspense>
            </Canvas>
        </KeyboardControls>
    );
}