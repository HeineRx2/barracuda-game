shader_type canvas_item;

uniform float scanline_count : hint_range(100.0, 1000.0) = 480.0;
uniform float scanline_intensity : hint_range(0.0, 1.0) = 0.08;
uniform float vignette_intensity : hint_range(0.0, 2.0) = 0.5;
uniform float noise_amount : hint_range(0.0, 0.1) = 0.02;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
    vec2 uv = UV;
    
    // Scanlines
    float scan = sin(uv.y * scanline_count * TAU) * 0.5 + 0.5;
    vec3 col = vec3(1.0) - vec3(scan * scanline_intensity);
    
    // Vignette
    float vig = smoothstep(1.4, 0.4, length(uv - vec2(0.5)));
    col *= mix(1.0, vig, vignette_intensity);
    
    // CRT Grain
    float n = (hash(uv + fract(TIME * 5.0)) - 0.5) * noise_amount;
    col += vec3(n);
    
    COLOR = vec4(col, 0.12);
}
