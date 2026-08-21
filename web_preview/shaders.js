// WebGL Shader Canvas for Storm Ocean and Rotating Green Radar Grid Overlay
class TacticalShaderRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      console.warn("WebGL not supported, falling back to 2D canvas");
      this.init2DFallback();
      return;
    }
    this.initGL();
  }

  initGL() {
    const gl = this.gl;

    const vsSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_resolution;

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

      float waveHeight(vec2 uv, float t) {
        float w1 = sin(uv.x * 14.0 + t * 1.2) * 0.5 + 0.5;
        float w2 = cos(uv.y * 11.0 - t * 1.6) * 0.5 + 0.5;
        float w3 = sin((uv.x + uv.y) * 8.0 + t * 1.0) * 0.5 + 0.5;
        float n = noise(uv * 10.0 + vec2(t * 0.2, -t * 0.15));
        return (w1 * 0.4 + w2 * 0.3 + w3 * 0.3) + n * 0.25;
      }

      void main() {
        vec2 uv = v_uv;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = uv - vec2(0.5);
        p.x *= aspect;

        float t = u_time * 0.8;
        float h = waveHeight(uv, t);

        // Dark stormy ocean base colors
        vec3 deepColor = vec3(0.012, 0.035, 0.055);
        vec3 shallowColor = vec3(0.025, 0.075, 0.11);
        vec3 foamColor = vec3(0.35, 0.55, 0.65);

        vec3 water = mix(deepColor, shallowColor, h);
        float foam = smoothstep(0.72, 0.88, h);
        water = mix(water, foamColor, foam * 0.45);

        // Specular glint
        float spec = pow(max(sin(h * 6.28 + t), 0.0), 12.0);
        water += spec * 0.18 * vec3(0.4, 0.8, 1.0);

        // Tactical Green Radar Grid Overlay
        float dist = length(p);
        float angle = atan(p.y, p.x); // -PI to PI
        
        vec3 radarCol = vec3(0.0, 1.0, 0.4);
        
        // Concentric Rings
        float rings = fract(dist * 3.5);
        float ringLine = smoothstep(0.01, 0.0, abs(rings - 0.5) - 0.48);
        
        // Axes
        float axisX = smoothstep(0.002, 0.0, abs(p.y));
        float axisY = smoothstep(0.002, 0.0, abs(p.x));
        float axes = max(axisX, axisY);

        // Rotating Sweeper Beam
        float sweepAngle = mod(-u_time * 1.5, 6.28318) - 3.14159;
        float angleDiff = mod(angle - sweepAngle + 6.28318, 6.28318);
        float trail = clamp(1.0 - (angleDiff / 2.5), 0.0, 1.0);
        trail = pow(trail, 2.5);

        float sweepLine = smoothstep(0.03, 0.0, angleDiff) * step(0.001, dist);

        if (dist < 0.75) {
          water += radarCol * (ringLine * 0.18 + axes * 0.25);
          water += radarCol * (trail * 0.18 + sweepLine * 0.45) * smoothstep(0.75, 0.70, dist);
        }

        // Vignette
        float vig = smoothstep(1.3, 0.4, length(uv - vec2(0.5)));
        gl_FragColor = vec4(water * vig, 1.0);
      }
    `;

    const compileShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;

    // Quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uTime = gl.getUniformLocation(program, 'u_time');
    this.uResolution = gl.getUniformLocation(program, 'u_resolution');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render(t = 0) {
    if (this.gl) {
      this.gl.uniform1f(this.uTime, t * 0.001);
      this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame((ts) => this.render(ts));
  }

  init2DFallback() {
    const ctx = this.canvas.getContext('2d');
    const draw = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      ctx.fillStyle = '#020905';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      requestAnimationFrame(draw);
    };
    draw();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tacticalRenderer = new TacticalShaderRenderer('shader-canvas');
});
