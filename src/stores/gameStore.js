import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
    phase: 'loading', // 'loading', 'ready', 'launching', 'playing', 'ended'
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
        source: null,
        isLoaded: false,
    },

    setAudioContext: (context) => set((state) => ({
        audio: { ...state.audio, context }
    })),

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

            source.connect(gainNode);
            gainNode.connect(analyser); // Connect gain to analyser
            analyser.connect(audio.context.destination); // Analyser to speakers

            source.loop = true;

            // Ensure context is running before start
            if (audio.context.state === 'suspended') {
                audio.context.resume().then(() => {
                    source.start(0);
                });
            } else {
                source.start(0);
            }

            set((state) => ({
                audio: { ...state.audio, source, analyser }, // Store analyser
                phase: 'playing'
            }));

            set((state) => ({
                audio: { ...state.audio, source },
                phase: 'playing' // Set playing immediately 
            }));

        } else {
            // Fallback if no audio
            set({ phase: 'playing' });
        }
    }
}));