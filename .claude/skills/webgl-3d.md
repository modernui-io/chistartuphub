# WebGL & 3D Skill

> Create immersive 3D experiences for hero sections, product showcases, and interactive backgrounds.

**Risk Level:** L1 (escalates to L2 if memory/performance-critical or mobile support required)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Building immersive hero sections
- Creating 3D product viewers
- Adding interactive backgrounds
- Building data visualizations in 3D
- "three.js" or "webgl" or "3D" in request

REVIEW PATTERNS:
- 3D scene showing black screen
- Performance issues with 3D
- Memory leaks from 3D resources
- Mobile can't handle 3D effects
- "3D not rendering"

KEYWORDS:
- three.js, react three fiber, r3f
- webgl, canvas, 3D
- mesh, geometry, material
- camera, scene, renderer
- particles, shaders, postprocessing
```

**DO NOT activate for:**
- CSS 3D transforms (use Motion Design)
- 2D canvas animations (use Motion Design)
- Text animation (use Kinetic Typography)
- Basic scroll effects (use Scroll Animation)

---

## Exit Conditions

### Success
- Scene renders correctly
- Camera and lights configured
- Pixel ratio capped at 2
- Resources disposed on cleanup
- Mobile fallback provided
- Reduced motion respected

### Failure (Escalate)
- WebGL not supported on target devices
- Performance requirements can't be met
- 3D model assets not available

### Handoff
- If general animation needed → **Motion Design**
- If scroll-driven 3D → **Scroll Animation**
- If 3D text → **Kinetic Typography**
- If building 3D component system → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Setting up 3D scene?
│   │   └─→ JUMP TO: Scene Setup
│   │
│   ├─→ Creating particle effects?
│   │   └─→ JUMP TO: Particles
│   │
│   ├─→ Loading 3D models?
│   │   └─→ JUMP TO: Model Loading
│   │
│   ├─→ Adding post-processing?
│   │   └─→ JUMP TO: Post-Processing
│   │
│   ├─→ Fixing 3D issues?
│   │   └─→ JUMP TO: 3D Diagnosis
│   │
│   └─→ Connecting to scroll?
│       └─→ JUMP TO: Scroll-Driven 3D
│
├─→ [2] Implement 3D effect
│
├─→ [3] VERIFY
│   ├─→ Scene renders?
│   ├─→ Performance acceptable?
│   ├─→ Resources cleaned up?
│   ├─→ Mobile optimized?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → diagnose and fix
```

---

## Procedures

### Scene Setup

**Vanilla Three.js:**
```javascript
import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,                                      // FOV
  window.innerWidth / window.innerHeight,  // Aspect
  0.1,                                     // Near
  1000                                     // Far
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true  // Transparent background
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

**React Three Fiber:**
```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls enableZoom={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />

      {/* Your 3D content */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </Canvas>
  );
}
```

---

### Particles

**Vanilla Three.js:**
```javascript
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 10;     // x
  positions[i + 1] = (Math.random() - 0.5) * 10; // y
  positions[i + 2] = (Math.random() - 0.5) * 10; // z
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  size: 0.02,
  color: 0x3b82f6,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Animate
function animate() {
  particles.rotation.y += 0.001;
  particles.rotation.x += 0.0005;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

**React Three Fiber:**
```jsx
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';

function Particles({ count = 1000 }) {
  const mesh = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 10;
      pos[i + 1] = (Math.random() - 0.5) * 10;
      pos[i + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    mesh.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#3b82f6" transparent opacity={0.8} />
    </points>
  );
}
```

---

### Model Loading

```jsx
import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect } from 'react';

function Model({ url }) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    actions['idle']?.play();
  }, [actions]);

  return <primitive object={scene} />;
}

// Preload for better UX
useGLTF.preload('/model.glb');
```

---

### Post-Processing

```jsx
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

function Scene() {
  return (
    <Canvas>
      {/* Scene content */}
      <mesh>
        <sphereGeometry />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
        />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
```

---

### Scroll-Driven 3D

```jsx
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function ScrollScene() {
  const scroll = useScroll();
  const mesh = useRef();

  useFrame(() => {
    const scrollProgress = scroll.offset; // 0 to 1

    mesh.current.rotation.y = scrollProgress * Math.PI * 2;
    mesh.current.position.y = scrollProgress * 5 - 2.5;
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

// Wrap in ScrollControls
<ScrollControls pages={3}>
  <ScrollScene />
</ScrollControls>
```

**With GSAP:**
```javascript
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.to(camera.position, {
  z: 2,
  ease: "none",
  scrollTrigger: {
    trigger: ".canvas-container",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  }
});

gsap.to(mesh.rotation, {
  y: Math.PI * 2,
  ease: "none",
  scrollTrigger: {
    trigger: ".canvas-container",
    scrub: true
  }
});
```

---

### Mouse-Following

```jsx
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

function FollowMouse() {
  const mesh = useRef();
  const { mouse } = useThree();

  useFrame(() => {
    mesh.current.rotation.x += (mouse.y * 0.5 - mesh.current.rotation.x) * 0.05;
    mesh.current.rotation.y += (mouse.x * 0.5 - mesh.current.rotation.y) * 0.05;
  });

  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshNormalMaterial />
    </mesh>
  );
}
```

---

### 3D Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| Black screen | No lights or camera wrong | Add lights, check camera position |
| Pixelated | Low pixel ratio | Increase to Math.min(dpr, 2) |
| Memory leak | Resources not disposed | Dispose geometry/materials |
| Slow on mobile | Too complex | Reduce geometry, particles |
| Object invisible | Wrong scale or position | Check scale, camera frustum |
| No interaction | Missing controls | Add OrbitControls or pointer events |

---

## Performance Optimization

```jsx
// 1. Limit pixel ratio
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Use instancing for many objects
<instancedMesh args={[geometry, material, count]}>

// 3. Dispose unused resources
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);

// 4. Use Suspense for loading
<Suspense fallback={<Loader />}>
  <Model />
</Suspense>

// 5. Reduce geometry on mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const segments = isMobile ? 32 : 128;
```

---

## Accessibility

```jsx
// Provide fallback for no-WebGL
function Scene() {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setWebglSupported(!!gl);
  }, []);

  if (!webglSupported) {
    return <StaticImage src="/fallback.jpg" alt="3D scene preview" />;
  }

  return <Canvas>{/* ... */}</Canvas>;
}

// Respect reduced motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

useFrame(() => {
  if (!prefersReducedMotion) {
    mesh.current.rotation.y += 0.01;
  }
});
```

---

## Proof / Verification

### Render Verification
```markdown
- [ ] Scene renders (not black screen)
- [ ] Camera positioned correctly
- [ ] Lights illuminate scene
- [ ] Objects visible at expected scale
```

### Performance Checks (Critical)
```markdown
- [ ] Pixel ratio capped at 2
- [ ] Resources disposed on cleanup
- [ ] Memory stable (no leaks over time)
- [ ] Mobile framerate acceptable (or fallback)
```

### Memory Leak Check
```bash
# Chrome DevTools > Memory > Heap snapshot
# Take snapshot before/after scene interaction
# Look for:
# - Growing geometry objects
# - Growing texture objects
# - Detached DOM nodes
```

### Cleanup Verification
```markdown
- [ ] Geometry disposed on unmount
- [ ] Materials disposed on unmount
- [ ] Textures disposed on unmount
- [ ] Renderer disposed on unmount
- [ ] Animation frame cancelled
```

### Accessibility
```markdown
- [ ] WebGL fallback for unsupported browsers
- [ ] Static image fallback for prefers-reduced-motion
- [ ] Alt text/aria-label for 3D content
```

### Definition of Done
```markdown
- [ ] Scene renders correctly
- [ ] Camera and lights configured
- [ ] Pixel ratio capped at 2
- [ ] Resources disposed on cleanup
- [ ] Mobile fallback provided
- [ ] Reduced motion respected
- [ ] No memory leaks
```

---

## State Tracking

```markdown
## WebGL/3D Session

### Task Type
- [ ] Scene setup
- [ ] Particles
- [ ] Model loading
- [ ] Post-processing
- [ ] Scroll-driven
- [ ] Fix/diagnose

### Scene Config
| Property | Value |
|----------|-------|
| Renderer | [Three.js/R3F] |
| Camera | [Perspective/Ortho] |
| Lights | [list] |

### Performance
- [ ] Pixel ratio capped at 2
- [ ] Resources disposed
- [ ] Mobile geometry reduced
- [ ] Suspense for loading

### Accessibility
- [ ] WebGL fallback
- [ ] Reduced motion respected

### Issues Found
1. [issue] → [fix]
2. ...
```

---

## Output Format

```markdown
## WebGL/3D Report

### Scene Setup
| Property | Value |
|----------|-------|
| Renderer | [Three.js/R3F] |
| Camera | [type + position] |
| Lights | [count + types] |

### Content
- Objects: [list]
- Particles: [count]
- Models: [list]
- Post-processing: [effects]

### Performance
- Pixel ratio: [value]
- Mobile optimized: [Yes/No]
- Resources disposed: [Yes/No]

### Accessibility
- WebGL fallback: [Implemented/Not]
- Reduced motion: [Respected/Not]

### Issues Fixed
| Issue | Solution |
|-------|----------|
| [issue] | [fix] |

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Motion Design:** When general animation principles needed
- **Handoff TO Scroll Animation:** When connecting to scroll
- **Handoff TO Kinetic Typography:** When 3D text needed
- **Handoff TO Design Systems:** When building 3D component patterns
- **Handoff FROM all:** When their domain needs 3D enhancement
