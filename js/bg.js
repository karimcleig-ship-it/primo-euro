/* ============================================================
   PRIMO — sfondo WebGL
   Fragment shader "aurora": tre campi di colore che derivano
   lentamente su base inchiostro, con warp organico e dithering.
   Renderizzato a mezza risoluzione, in pausa se la tab è nascosta.
   ============================================================ */

(function () {
  const canvas = document.getElementById("bg");
  const gl = canvas.getContext("webgl", { antialias: false, depth: false, stencil: false, powerPreference: "low-power" });

  if (!gl) {
    canvas.style.background = "radial-gradient(120% 90% at 20% 10%, #1a1430 0%, #0b0b12 55%), radial-gradient(80% 60% at 85% 85%, #12211a 0%, transparent 60%)";
    return;
  }

  const VERT = `
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float blob(vec2 uv, vec2 c, float r){
      float d = length(uv - c);
      return smoothstep(r, 0.0, d);
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p = uv;
      p.x *= u_res.x / u_res.y;
      float t = u_time * 0.05;

      /* warp organico */
      p += 0.14 * vec2(
        noise(p * 1.6 + t) - 0.5,
        noise(p * 1.6 - t + 7.0) - 0.5
      );

      /* leggerissima attrazione verso il mouse */
      vec2 m = u_mouse;
      m.x *= u_res.x / u_res.y;

      vec3 col = vec3(0.043, 0.043, 0.07); // inchiostro

      /* violetto — alto sinistra, deriva lenta */
      vec2 c1 = vec2(0.28 + 0.12 * sin(t * 1.3), 0.75 + 0.1 * cos(t * 0.9)) ;
      c1.x *= u_res.x / u_res.y;
      col += vec3(0.29, 0.2, 0.62) * blob(p, c1 + (m - c1) * 0.04, 0.75) * 0.42;

      /* lime — basso destra, molto tenue */
      vec2 c2 = vec2(0.78 + 0.1 * cos(t * 1.1 + 2.0), 0.2 + 0.12 * sin(t * 0.8));
      c2.x *= u_res.x / u_res.y;
      col += vec3(0.55, 0.75, 0.16) * blob(p, c2 + (m - c2) * 0.03, 0.62) * 0.16;

      /* teal — centro alto */
      vec2 c3 = vec2(0.62 + 0.14 * sin(t * 0.7 + 4.0), 0.85 + 0.08 * cos(t * 1.2));
      c3.x *= u_res.x / u_res.y;
      col += vec3(0.12, 0.42, 0.4) * blob(p, c3, 0.55) * 0.28;

      /* vignetta */
      float vig = smoothstep(1.25, 0.35, distance(uv, vec2(0.5, 0.45)));
      col *= mix(0.75, 1.0, vig);

      /* dithering anti-banding */
      col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mouse = [0.5, 0.5], target = [0.5, 0.5];
  let raf = null, start = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5; // mezza risoluzione
    canvas.width = Math.max(2, Math.floor(innerWidth * dpr));
    canvas.height = Math.max(2, Math.floor(innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function frame(now) {
    mouse[0] += (target[0] - mouse[0]) * 0.03;
    mouse[1] += (target[1] - mouse[1]) * 0.03;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mouse[0], 1 - mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => { resize(); if (reduced) frame(performance.now()); });
  window.addEventListener("pointermove", (e) => {
    target = [e.clientX / innerWidth, e.clientY / innerHeight];
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (!reduced && !raf) { raf = requestAnimationFrame(frame); }
  });

  resize();
  frame(performance.now());
})();
