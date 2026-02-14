varying vec2 vUv;
varying vec3 vWorldPosition;

uniform vec3 uColorTopLeft;
uniform vec3 uColorTopRight;
uniform vec3 uColorBottomLeft;
uniform vec3 uColorBottomRight;

uniform float uBrightness;
uniform float uSaturation;
uniform float uHueShift; 
uniform float uLightningIntensity; // New Uniform

// Funció per convertir HSL a RGB
vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

void main() {
    // Interpolació bilineal per al degradat de color
    vec2 pos = vUv * 2.0; // Scale UVs if needed for more detail or keep as is
    vec3 colorTop = mix(uColorTopLeft, uColorTopRight, vUv.x);
    vec3 colorBottom = mix(uColorBottomLeft, uColorBottomRight, vUv.x);
    vec3 baseColor = mix(colorBottom, colorTop, vUv.y);

    // Ajustem la brillantor
    vec3 finalColor = baseColor * uBrightness;

    // AFEGIR LLAMP (Blanc pur sumat)
    finalColor += vec3(uLightningIntensity);

    gl_FragColor = vec4(finalColor, 1.0);
}