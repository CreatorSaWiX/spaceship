import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore.js';

export default function DebugPosition({ playerRef }) {
    const debugTextRef = useRef(null);

    useEffect(() => {
        // 1. Create Container (strictly non-blocking)
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed', // Use fixed to ensure it's relative to viewport, not canvas
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            zIndex: '9999',
            pointerEvents: 'none', // GLOBAL PASSTHROUGH
        });

        // 2. Debug Text
        const text = document.createElement('div');
        Object.assign(text.style, {
            color: 'lime',
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 4px black',
        });
        text.innerText = "X: 0.00";
        debugTextRef.current = text;
        container.appendChild(text);

        // 3. Pause Button
        const btn = document.createElement('button');
        btn.innerText = "PAUSE";
        Object.assign(btn.style, {
            padding: "5px 10px",
            fontSize: "12px",
            cursor: "pointer",
            background: "#333",
            color: "white",
            border: "1px solid white",
            pointerEvents: "auto", // Re-enable clicks ONLY for button
        });

        // FIXED: Access FRESH state directly from store instance
        btn.onclick = () => {
            const currentPhase = useGameStore.getState().phase;
            const setPhase = useGameStore.getState().setPhase;

            if (currentPhase === 'playing') {
                setPhase('paused');
            } else if (currentPhase === 'paused') {
                setPhase('playing');
            }
        };

        container.appendChild(btn);
        document.body.appendChild(container);

        // 4. Subscribe to state changes to update UI
        const unsubscribe = useGameStore.subscribe((state) => {
            if (state.phase === 'paused') {
                btn.innerText = "RESUME";
                btn.style.background = "red";
            } else {
                btn.innerText = "PAUSE";
                btn.style.background = "#333";
            }
        });

        // Cleanup
        return () => {
            unsubscribe();
            if (container) document.body.removeChild(container);
        };
    }, []);

    // Loop for Position Update
    useFrame(() => {
        if (playerRef.current && debugTextRef.current) {
            const pos = playerRef.current.translation();
            debugTextRef.current.innerText = `X: ${pos.x.toFixed(2)}`;
        }
    });

    return null;
}
