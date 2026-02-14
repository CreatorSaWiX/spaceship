uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uTexture3;

varying float vTextureIndex;

void main(){
    vec4 textureColor;

    if (vTextureIndex < 0.5) {
        textureColor = texture2D(uTexture1, gl_PointCoord);
    } else if (vTextureIndex < 1.5) {
        textureColor = texture2D(uTexture2, gl_PointCoord);
    } else {
        textureColor = texture2D(uTexture3, gl_PointCoord);
    }

    float alpha = textureColor.r;
    if (alpha < 0.05) discard;
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}