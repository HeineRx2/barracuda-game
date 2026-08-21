shader_type canvas_item;

uniform vec4 deep_ocean_color : source_color = vec4(0.015, 0.04, 0.07, 1.0);
uniform vec4 shallow_ocean_color : source_color = vec4(0.03, 0.08, 0.12, 1.0);
uniform vec4 foam_color : source_color = vec4(0.35, 0.55, 0.65, 0.6);
uniform float wave_speed : hint_range(0.1, 5.0) = 0.8;
uniform float wave_frequency : hint_range(1.0, 50.0) = 18.0;
uniform float storm_intensity : hint_range(0.0, 2.0) = 1.2;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float wave_height(vec2 uv, float t) {
    float w1 = sin(uv.x * wave_frequency + t * wave_speed) * 0.5 + 0.5;
    float w2 = cos(uv.y * (wave_frequency * 0.7) - t * (wave_speed * 1.3)) * 0.5 + 0.5;
    float w3 = sin((uv.x + uv.y) * (wave_frequency * 0.5) + t * (wave_speed * 0.9)) * 0.5 + 0.5;
    float n = noise(uv * 12.0 + vec2(t * 0.3, -t * 0.2));
    return (w1 * 0.4 + w2 * 0.3 + w3 * 0.3) * storm_intensity + n * 0.2;
}

void fragment() {
    vec2 uv = UV;
    float t = TIME * wave_speed;
    
    float h = wave_height(uv, t);
    float h2 = wave_height(uv + vec2(0.01, 0.01), t);
    
    // Normal estimation for dynamic specular glint
    vec3 normal = normalize(vec3(h - h2, 0.02, h - h2));
    vec3 light_dir = normalize(vec3(0.3, 0.8, -0.5));
    float spec = pow(max(dot(normal, light_dir), 0.0), 16.0);
    
    vec4 base_water = mix(deep_ocean_color, shallow_ocean_color, h);
    
    // Foam threshold on rough wave crests
    float foam_factor = smoothstep(0.72, 0.88, h);
    vec4 water_with_foam = mix(base_water, foam_color, foam_factor);
    
    // Specular storm glint
    water_with_foam.rgb += spec * 0.3 * vec3(0.4, 0.7, 0.9);
    
    // Subtle vignette
    float vig = smoothstep(1.3, 0.4, length(uv - vec2(0.5)));
    COLOR = vec4(water_with_foam.rgb * vig, 1.0);
}
