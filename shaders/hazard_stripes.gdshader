shader_type canvas_item;

uniform vec4 stripe_color_1 : source_color = vec4(0.85, 0.70, 0.0, 1.0); // Hazard Yellow
uniform vec4 stripe_color_2 : source_color = vec4(0.05, 0.05, 0.05, 1.0); // Warning Black
uniform float stripe_scale : hint_range(5.0, 50.0) = 24.0;
uniform float scroll_speed : hint_range(-5.0, 5.0) = 1.0;
uniform bool is_active = false;
uniform float corner_radius : hint_range(0.0, 0.2) = 0.04;

float rounded_box(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

void fragment() {
    vec2 uv = UV;
    vec2 p = uv - vec2(0.5);
    float d = rounded_box(p, vec2(0.5, 0.5), corner_radius);
    if (d > 0.0) {
        discard;
    }
    
    float pos = (uv.x + uv.y) * stripe_scale + (is_active ? TIME * scroll_speed : 0.0);
    float pattern = step(0.5, fract(pos));
    vec4 col = mix(stripe_color_1, stripe_color_2, pattern);
    
    if (!is_active) {
        // Dim and grayscale disabled state
        col.rgb *= 0.35;
        col.a = 0.6;
    } else {
        // Neon pulse glow when active
        float pulse = 0.8 + 0.2 * sin(TIME * 6.0);
        col.rgb *= pulse;
        
        // Red edge warning
        if (abs(d) < 0.03) {
            col = mix(col, vec4(1.0, 0.1, 0.1, 1.0), 0.8);
        }
    }
    
    COLOR = col;
}
