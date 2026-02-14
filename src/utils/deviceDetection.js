export const getDeviceCapabilities = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // Device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
    const isLowEnd = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

    // GPU
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const isIntegratedGPU = /Intel|Integrated/i.test(renderer);

    return {
        isMobile,
        isTablet,
        isLowEnd,
        isIntegratedGPU,
        // Performance level: 0 = low, 1 = medium, 2 = high
        performanceLevel: isMobile || isLowEnd || isIntegratedGPU ? 0 : window.innerWidth > 1920 ? 2 : 1
    };
};

export const getOptimalSettings = () => {
    const capabilities = getDeviceCapabilities();

    const settings = {
        // Sparkles
        sparklesCount: capabilities.performanceLevel === 0 ? 15 : capabilities.performanceLevel === 1 ? 25 : 30,
        sparklesSize: capabilities.performanceLevel === 0 ? 2 : 10,
        sparklesScale: capabilities.performanceLevel === 0 ? [10, 5, 10] : [20, 10, 20],

        // Cube trail
        cubeTrailCount: capabilities.performanceLevel === 0 ? 4 : capabilities.performanceLevel === 1 ? 6 : 8,
        cubeTrailSize: capabilities.performanceLevel === 0 ? 0.08 : 0.12,

        // Effects
        enableBloom: capabilities.performanceLevel >= 1,
        bloomIntensity: capabilities.performanceLevel === 0 ? 0.05 : 0.1,

        // Physics
        physicsDebug: false,

        // Anti-aliasing
        antialias: capabilities.performanceLevel >= 1,

        // Camera
        fov: capabilities.isMobile ? 60 : 45,

        // Pixel ratio
        pixelRatio: capabilities.isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio
    };

    return settings;
};