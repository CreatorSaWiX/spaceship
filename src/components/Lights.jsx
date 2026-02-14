import { memo } from 'react';

function Lights() {
    return <>
        <directionalLight position={[4, 10, 3]} intensity={2.5} />
        <ambientLight intensity={0.5} />
    </>
}

export default memo(Lights);