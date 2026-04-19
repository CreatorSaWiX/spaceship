This project is an engineering exploration into high-fidelity 3D graphics within the browser. The primary objective was to achieve near-native performance (60 FPS / 16.6ms frame budget) while managing complex geometry and real-time physics.

### Core Architectural Features:
- **Geometry Instancing:** Implemented `InstancedMesh` logic to handle 345 geometric objects while reducing the overhead to only **17 draw calls**, minimizing CPU-to-GPU communication bottlenecks.
- **GLSL Shaders:** Developed custom procedural shaders for dynamic floor reflections and rhythmic particle systems. Calculations are performed on the GPU to ensure consistent frame rates.
- **Physics Engine:** Integrated **Rapier Physics (WASM)** for deterministic collision detection between the player entity and environment boundaries.
- **State Management:** Utilized **Zustand** for transient state updates, avoiding React render cycles for high-frequency gameplay data.

## Performance Metrics
| Metric | Measurement | Notes |
| :--- | :--- | :--- |
| **Target Frame Rate** | 60 FPS | Consistently maintained on mid-range hardware |
| **Typical CPU Time** | 3.2ms / frame | Efficient state and physics updates |
| **Typical GPU Time** | 5.5ms / frame | Optimized shader complexity and draw calls |
| **Draw Calls** | 17 | Optimized via manual instancing |
| **Asset Size** | ~1.2MB | Utilizing Draco compression and GLB optimization |

## Implementation Details
- **Optimization:** Environment objects are manually instanced to shared buffers.
- **Spatial Triggers:** Rhythmic events are triggered via spatial distance checks rather than time-based polling, improving reliability across different frame rates.
- **Lighting:** Hybrid lighting model using baked shadows combined with real-time procedural floor reflections.

## Development Environment
- **Runtime:** Node.js / Vite
- **Libraries:** Three.js, React Three Fiber (R3F), Rapier.rs, GLSL, Zustand
