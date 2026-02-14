import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function HelloWorldTrigger({ position = [0, 0, 0], size = [2, 2, 2], playerRef }) {
    const triggered = useRef(false);

    const minX = position[0] - size[0] / 2;
    const maxX = position[0] + size[0] / 2;
    const minY = position[1] - size[1] / 2;
    const maxY = position[1] + size[1] / 2;
    const minZ = position[2] - size[2] / 2;
    const maxZ = position[2] + size[2] / 2;

    useFrame(() => {
        if (triggered.current || !playerRef?.current) return;
        const playerPos = playerRef.current.translation();

        if (playerPos.x < minX || playerPos.x > maxX) return;
        if (playerPos.y < minY || playerPos.y > maxY) return;
        if (playerPos.z < minZ || playerPos.z > maxZ) return;

        console.log("Hola");
        triggered.current = true;
    });

    return (
        <mesh position={position}>
            <boxGeometry args={size} />
            <meshBasicMaterial color={triggered.current ? "red" : "lime"} wireframe visible={true} />
        </mesh>
    );
}
