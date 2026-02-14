import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { motion, AnimatePresence } from 'framer-motion';

const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
};



const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.2 }
    }
};

const loadingtext = [
    "INITIALIZING SYSTEMS...",
    "CALIBRATING SENSORS...",
    "LOADING ASSETS...",
    "ESTABLISHING LINK...",
    "READY FOR LAUNCH"
];

export default function Overlay() {
    const phase = useGameStore((state) => state.phase);
    const setAudioContext = useGameStore((state) => state.setAudioContext);
    const setAudioBuffer = useGameStore((state) => state.setAudioBuffer);
    const setPhase = useGameStore((state) => state.setPhase);
    const startGame = useGameStore((state) => state.startGame);

    const [progress, setProgress] = useState(0);
    const [loadingTextIndex, setLoadingTextIndex] = useState(0);

    const [showControls, setShowControls] = useState(false);

    const [audioContext, setLocalAudioContext] = useState(null);

    // Audio Init
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Resume context on user interaction (handled in handleStart)
        setLocalAudioContext(ctx);
        setAudioContext(ctx); // Sync to store if needed, though local usage is fine

        // Helper to handle user interaction startup
        const unlockAudio = () => {
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            // Do not close context to avoid StrictMode double-mount issues killing the active context
        };
    }, []);

    const playSound = (type = 'hover') => {
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === 'hover') {
            // High-pitched blip
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'click') {
            // Low confirmation thud + sci-fi shimmer
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            // Add a second layer for richness
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.type = 'square';
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.setValueAtTime(100, now);
            osc2.frequency.linearRampToValueAtTime(60, now + 0.3);
            gain2.gain.setValueAtTime(0.05, now);
            gain2.gain.linearRampToValueAtTime(0, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.2);
            osc2.start(now);
            osc2.stop(now + 0.3);
        }
    };

    // Audio Loading Logic
    useEffect(() => {
        const loadAudio = async () => {
            if (!audioContext) return;

            try {
                // Start loading animation
                let progressInterval;
                const startFakeProgress = () => {
                    progressInterval = setInterval(() => {
                        setProgress(prev => {
                            if (prev >= 90) return prev;
                            // Update text based on progress chunks
                            if (prev % 20 === 0) {
                                setLoadingTextIndex(i => (i + 1) % loadingtext.length);
                            }
                            return prev + 1;
                        });
                    }, 50);
                };
                startFakeProgress();

                const response = await fetch('/blank.mp3');
                const arrayBuffer = await response.arrayBuffer();
                const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);

                setAudioBuffer(decodedAudio);

                // Complete loading
                clearInterval(progressInterval);
                setProgress(100);
                setTimeout(() => setPhase('ready'), 500);
            } catch (error) {
                console.error("Audio initialization failed:", error);
                // Fallback to ready anyway
                setProgress(100);
                setPhase('ready');
            }
        };

        if (phase === 'loading' && audioContext) {
            loadAudio();
        }
    }, [phase, audioContext]);

    const handleStart = () => {
        playSound('click');
        setPhase('launching'); // Trigger camera zoom

        // Wait for camera zoom sequence 
        setTimeout(() => {
            startGame(); // This sets phase to 'playing' in store and starts music
        }, 1200);
    };

    return (
        <div className="overlay" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', // Changed to manage per-element pointer events
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            zIndex: 100, overflow: 'hidden',
            fontFamily: '"Inter", sans-serif'
        }}>
            {/* Now Playing Notification */}
            <AnimatePresence>
                {phase === 'playing' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: 2, duration: 0.8 }}
                        style={{
                            position: 'absolute', bottom: '40px', right: '40px',
                            display: 'flex', alignItems: 'center', gap: '16px',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>Now Playing</span>
                            <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500, letterSpacing: '1px' }}>Blank — Disfigure</span>
                        </div>
                        <div style={{ width: '2px', height: '30px', background: 'rgba(255,255,255,0.3)' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Modal */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', inset: 0, zIndex: 50,
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            pointerEvents: 'auto'
                        }}
                        onClick={() => setShowControls(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel"
                            style={{
                                padding: '40px 60px', borderRadius: '2px', // Sharper corners
                                display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                minWidth: '300px'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <h2 style={{
                                fontSize: '12px', letterSpacing: '4px', color: '#94a3b8', fontWeight: 600,
                                textTransform: 'uppercase', marginBottom: '10px'
                            }}>
                                Flight Controls
                            </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                                {/* Action */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>THRUST</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>Action</div>
                                </div>

                                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                                {/* Inputs */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {['SPACE', 'W', 'CLICK'].map((key) => (
                                        <div key={key} style={{
                                            padding: '8px 12px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '4px',
                                            color: '#e0f2fe',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            minWidth: '24px',
                                            textAlign: 'center'
                                        }}>
                                            {key}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                            <button
                                onClick={() => { playSound('click'); setShowControls(false); }}
                                onMouseEnter={() => playSound('hover')}
                                className="btn-secondary"
                                style={{
                                    padding: '12px 30px', borderRadius: '2px', fontSize: '11px',
                                    letterSpacing: '2px', textTransform: 'uppercase',
                                    border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Brand (Top Left) */}
            <AnimatePresence>
                {(phase === 'ready' || phase === 'loading') && !showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 10 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '2px', height: '20px', background: '#fff' }} />
                            <h3 className="font-body" style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '2px' }}>
                                CREATORSAWIX
                            </h3>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {phase === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        className="glass-panel"
                        style={{
                            padding: '60px', borderRadius: '24px', textAlign: 'center', width: '380px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <div className="font-display" style={{
                            fontSize: '12px', letterSpacing: '4px', color: '#94a3b8', fontWeight: 600,
                            marginBottom: '4px'
                        }}>
                            SYSTEM INITIALIZATION
                        </div>

                        {/* Tech-styled Progress Bar */}
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                            <motion.div
                                style={{ width: '100%', height: '100%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }}
                                initial={{ scaleX: 0, transformOrigin: 'left' }}
                                animate={{ scaleX: progress / 100 }}
                                transition={{ ease: "linear", duration: 0.1 }} // Smooth steps
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>
                            <span>REQ_ID: {Math.floor(Math.random() * 9999)}</span>
                            <span>{progress}%</span>
                        </div>

                        <motion.div
                            key={loadingTextIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}
                        >
                            [{loadingtext[loadingTextIndex]}]
                        </motion.div>
                    </motion.div>
                )}

                {phase === 'ready' && !showControls && (
                    <motion.div
                        key="ready"
                        style={{ textAlign: 'center', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {/* Status Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '8px 20px', borderRadius: '4px', marginBottom: '40px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                background: 'rgba(15, 23, 42, 0.6)'
                            }}
                        >
                            <span className="animate-pulse" style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                            <span className="font-body" style={{ fontSize: '11px', fontWeight: 600, color: '#fff', letterSpacing: '3px' }}>
                                IMMERSIVE
                            </span>
                        </motion.div>

                        {/* Title Staggered */}
                        <motion.h1
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="font-display"
                            style={{
                                fontSize: 'clamp(4rem, 12vw, 9rem)', fontWeight: 800, margin: '0 0 20px 0',
                                lineHeight: 0.9, letterSpacing: '-0.05em',
                                display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap'
                            }}
                        >
                            <span className="text-gradient" style={{ cursor: 'default' }}>
                                {"SPACESHIP".split("").map((char, index) => (
                                    <motion.span key={index} variants={letterVariants} style={{ display: 'inline-block' }}>
                                        {char}
                                    </motion.span>
                                ))}
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            style={{
                                fontSize: '14px', color: 'rgba(255,255,255,0.6)', letterSpacing: '8px', marginBottom: '80px', textTransform: 'uppercase',
                                borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', width: '100%',
                                fontFamily: '"Inter", sans-serif'
                            }}
                        >
                            Beyond the horizon
                        </motion.p>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, type: "spring" }}
                            style={{
                                display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center',
                                pointerEvents: 'auto' // Re-enable clicks
                            }}
                        >
                            <button
                                onClick={handleStart}
                                onMouseEnter={() => playSound('hover')}
                                className="btn-primary"
                                style={{
                                    padding: '24px 80px', fontSize: '16px', borderRadius: '2px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)'
                                }}
                            >
                                Launch
                            </button>

                            <button
                                onMouseEnter={() => playSound('hover')}
                                onClick={() => { playSound('click'); setShowControls(true); }}
                                className="btn-secondary"
                                style={{
                                    padding: '12px 30px', borderRadius: '2px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
                                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                Controls
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <AnimatePresence>
                {(phase === 'ready') && !showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '2px' }}
                    >
                        DESIGNED BY CREATORSAWIX
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
