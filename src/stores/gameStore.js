import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
    phase: 'init', // 'init', 'loading', 'ready', 'launching', 'playing', 'ended'
    isBlackout: false, // Controls the iris wipe effect

    setPhase: (phase) => {
        const { audio } = get();
        if (audio.context) {
            if (phase === 'paused') {
                audio.context.suspend();
            } else if (phase === 'playing' && audio.context.state === 'suspended') {
                audio.context.resume();
            }
        }
        set({ phase });
    },

    setBlackout: (value) => set({ isBlackout: value }),

    physicsParams: {
        jumpForce: 15,
        forwardSpeed: 5.5,
        gravity: -20,
        // Fluid/Sine movement params
        flightSpeed: 6, // Max vertical speed
        handling: 4.0,   // How snappy the turn is (Agility)
    },

    setPhysicsParams: (params) => set((state) => ({
        physicsParams: { ...state.physicsParams, ...params }
    })),

    // Audio Management
    audio: {
        context: null,
        buffer: null,
        analyser: null,
        filter: null
    },

    // Camera View State ('side', 'chase')
    cameraView: 'side',
    setCameraView: (view) => set({ cameraView: view }),

    setAudioContext: (ctx) => set((state) => ({ audio: { ...state.audio, context: ctx } })),

    setAudioBuffer: (buffer) => set((state) => ({
        audio: { ...state.audio, buffer, isLoaded: true }
    })),

    startGame: () => {
        const { audio, phase } = get();
        if (phase !== 'ready' && phase !== 'launching') return;

        // Resume context if suspended (browser policy)
        if (audio.context && audio.context.state === 'suspended') {
            audio.context.resume();
        }

        // Play Music
        if (audio.context && audio.buffer) {
            const source = audio.context.createBufferSource();
            source.buffer = audio.buffer;

            // Create a gain node for volume control (optional but good practice)
            const gainNode = audio.context.createGain();
            gainNode.gain.value = 0.5; // Set volume to 50% to avoid blasting ears

            // Create Analyser for reactive visuals
            const analyser = audio.context.createAnalyser();
            analyser.fftSize = 256; // 128 bins

            // Create Filter for cinematic transitions (Low Pass)
            const filterNode = audio.context.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 22000; // Open fully initially

            // Chain: Source -> Filter -> Gain -> Analyser -> Destination
            source.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(analyser); // Connect gain to analyser
            analyser.connect(audio.context.destination); // Analyser to speakers

            source.loop = true;

            // Ensure context is running before start
            const startPlayback = () => {
                source.start(0);
                set((state) => ({
                    audio: { ...state.audio, source, analyser, filter: filterNode },
                    phase: 'playing'
                }));
            };

            if (audio.context.state === 'suspended') {
                audio.context.resume().then(() => {
                    startPlayback();
                });
            } else {
                startPlayback();
            }

        } else {
            // Fallback if no audio
            set({ phase: 'playing' });
        }
    },

    triggerLevelEnd: () => {
        const { audio } = get();
        if (!audio.context || !audio.source || !audio.filter) return;

        const now = audio.context.currentTime;
        // Transició molt lenta (10s) només amb filtre ("underwater")
        const duration = 10.0;

        // 1. Filter Sweep (Low Pass Closing) - "Underwater" effect
        // Deixar només els greus profunds i anar tancant
        audio.filter.frequency.cancelScheduledValues(now);
        audio.filter.frequency.setValueAtTime(audio.filter.frequency.value, now);
        audio.filter.frequency.exponentialRampToValueAtTime(10, now + duration); // Baixar fins a 10Hz (gairebé silenci)

        // 2. (OPCIONAL) Fade out de volum si tinguéssim accés al gainNode, 
        // però el filtre a 10Hz ja silencia molt.

        // 3. Stop after effect
        try {
            audio.source.stop(now + duration + 1.0);
        } catch (e) { /* Ignore if already stopped */ }
    },

    resetGame: (targetPhase = 'ready') => {
        const { audio } = get();
        const now = audio.context ? audio.context.currentTime : 0;

        // 1. Reset Audio
        if (audio.source) {
            try {
                audio.source.stop();
            } catch (e) { }
            // Disconnect old source to be GC'd?
        }

        if (audio.filter) {
            audio.filter.frequency.cancelScheduledValues(now);
            audio.filter.frequency.setValueAtTime(22000, now);
        }

        // 2. Reset Game State
        set({
            phase: targetPhase,
            cameraView: 'side',
            isBlackout: false,
        });
    }
}));