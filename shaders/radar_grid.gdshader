shader_type canvas_item;

uniform vec4 grid_color : source_color = vec4(0.0, 1.0, 0.4, 0.35);
uniform vec4 sweep_color : source_color = vec4(0.0, 1.0, 0.5, 0.8);
uniform float sweep_speed : hint_range(0.1, 5.0) = 1.2;
uniform float ring_count : hint_range(1.0, 10.0) = 4.0;
uniform float grid_line_thickness : hint_range(0.0005, 0.01) = 0.002;
uniform vec2 radar_center = vec2(0.5, 0.5);

void fragment() {
    vec2 uv = UV;
    vec2 p = uv - radar_center;
    float dist = length(p);
    float angle = atan(p.y, p.x); // -PI to PI
    
    // Concentric Range Rings
    float ring_pattern = fract(dist * ring_count);
    float ring_line = smoothstep(grid_line_thickness * ring_count, 0.0, abs(ring_pattern - 0.5) - (0.5 - grid_line_thickness * ring_count));
    
    // Crosshair axes
    float axis_x = smoothstep(grid_line_thickness, 0.0, abs(p.y));
    float axis_y = smoothstep(grid_line_thickness, 0.0, abs(p.x));
    float axes = max(axis_x, axis_y);
    
    // Rotating Sweeper Beam with Phosphor Trail
    float sweep_angle = mod(-TIME * sweep_speed, TAU) - PI;
    float angle_diff = mod(angle - sweep_angle + TAU, TAU);
    float trail = clamp(1.0 - (angle_diff / (PI * 0.75)), 0.0, 1.0);
    trail = pow(trail, 2.5); // phosphor fade
    
    // Thin leading sweep line
    float sweep_line = smoothstep(0.04, 0.0, angle_diff) * step(0.001, dist);
    
    vec4 final_color = vec4(0.0);
    
    // Outer boundary mask
    if (dist < 0.48) {
        // Grid & rings
        final_color += grid_color * (ring_line * 0.6 + axes * 0.8 + 0.05);
        // Sweep glow
        final_color += sweep_color * (trail * 0.25 + sweep_line * 0.7) * smoothstep(0.48, 0.45, dist);
    } else if (dist < 0.485) {
        // Border perimeter ring
        final_color += grid_color * 1.5;
    }
    
    COLOR = final_color;
}
