// src/shaders/particles/vertex.glsl

uniform float uTime;

attribute float aSize;
attribute float aAnimationSpeed;
attribute float aAnimationOffset; 
attribute float aTextureIndex;

varying float vTextureIndex;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    float lifeDuration = aAnimationOffset; 
    float time = mod(uTime + aAnimationSpeed, lifeDuration);
    float progress = time / lifeDuration;
    float scale = sin(progress * 3.14159); 

    gl_PointSize = aSize * scale * 4.0; 
    gl_PointSize *= (10.0 / -viewPosition.z);

    gl_Position = projectedPosition;

    vTextureIndex = aTextureIndex;
}