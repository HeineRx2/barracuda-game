shader_type canvas_item;

uniform vec4 bg_color : source_color = vec4(0.02, 0.05, 0.04, 0.55);
uniform vec4 border_color : source_color = vec4(0.0, 1.0, 0.4, 0.9);
uniform float border_width : hint_range(0.0, 0.05) = 0.006;
uniform float corner_radius : hint_range(0.0, 0.1) = 0.02;
uniform float noise_grain : hint_range(0.0, 0.2) = 0.04;

float rounded_box(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void fragment() {
    vec2 uv = UV;
    vec2 p = uv - vec2(0.5);
    vec2 half_size = vec2(0.5, 0.5);
    
    float dist = rounded_box(p, half_size, corner_radius);
    
    // Inside panel vs outside
    if (dist > 0.0) {
        discard;
    }
    
    float grain = (rand(uv * 100.0 + fract(TIME * 0.1)) - 0.5) * noise_grain;
    vec4 col = bg_color + vec4(grain, grain, grain, 0.0);
    
    // Glowing border (2px)
    float border_dist = abs(dist);
    if (border_dist < border_width) {
        float glow = 1.0 - (border_dist / border_width);
        col = mix(col, border_color, glow * 0.95);
    }
    
    // Subtle internal scanline
    float scanline = sin(uv.y * 400.0) * 0.03;
    col.rgb += scanline;
    
    COLOR = col;
}
