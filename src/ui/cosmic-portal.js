// Cosmic Portal - Three.js Implementation
// Adapted from https://inspira-ui.com/docs/components/backgrounds/cosmic-portal

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export class CosmicPortal {
    constructor(canvas, params = {}) {
        this.canvas = canvas;
        this.params = {
            portalComplexity: params.portalComplexity || 4,
            crystalCount: params.crystalCount || 12,
            primaryColor: params.primaryColor || '#9b59b6',
            secondaryColor: params.secondaryColor || '#3498db',
            accentColor: params.accentColor || '#e74c3c',
            vortexColor: params.vortexColor || '#2ecc71',
            rotationSpeed: params.rotationSpeed || 0.3,
            bloomStrength: params.bloomStrength || 1.2,
            bloomRadius: params.bloomRadius || 0.7,
            bloomThreshold: params.bloomThreshold || 0.2,
            dimensionShift: params.dimensionShift || 4
        };

        // Three.js core objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.bloomPass = null;
        this.fxaaPass = null;
        this.clock = null;

        // Portal objects
        this.meshes = [];
        this.materials = [];
        this.portalMaterials = [];
        this.portalLights = [];
        this.animationId = null;
        this.time = 0;

        this.resizeObserver = null;
    }

    init() {
        this.initThreeJS();
        this.createPortalScene();
        this.setupResizeObserver();
        this.animate();
    }

    initThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0015);
        this.scene.fog = new THREE.FogExp2(0x1a0033, 0.001);

        // Camera setup
        const container = this.canvas.parentElement;
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 15);

        // Lighting
        this.scene.add(new THREE.AmbientLight(0x330066, 0.2));
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(10, 10, 5);
        this.scene.add(mainLight);

        // Portal lights
        const lightColors = [
            this.params.primaryColor,
            this.params.secondaryColor,
            this.params.accentColor,
            this.params.vortexColor
        ];
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(new THREE.Color(lightColors[i % 4]), 0.8, 20);
            this.scene.add(light);
            this.portalLights.push(light);
        }

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Controls - Interactive zoom and rotation
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.autoRotate = false; // Disable auto-rotate for manual control
        this.controls.autoRotateSpeed = 0.5;
        this.controls.enableZoom = true; // Enable mouse wheel zoom
        this.controls.enablePan = true; // Enable right-click pan
        this.controls.enableRotate = true; // Enable left-click rotate
        this.controls.minDistance = 5; // Allow closer zoom
        this.controls.maxDistance = 50; // Allow further zoom
        this.controls.zoomSpeed = 1.0;
        this.controls.rotateSpeed = 0.5;
        this.controls.panSpeed = 0.5;
        this.controls.screenSpacePanning = true;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold
        );
        this.composer.addPass(this.bloomPass);

        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.set(
            1 / (width * pixelRatio),
            1 / (height * pixelRatio)
        );
        this.composer.addPass(this.fxaaPass);

        this.clock = new THREE.Clock();
    }

    addPortalShader(material) {
        material.onBeforeCompile = (shader) => {
            shader.uniforms.time = { value: 0 };
            shader.uniforms.pulseTime = { value: -1000 };
            shader.uniforms.portalSpeed = { value: 8.0 };
            shader.uniforms.portalColor = { value: new THREE.Color(this.params.accentColor) };
            shader.uniforms.dimensionShift = { value: 0 };

            shader.vertexShader = `varying vec3 vWorldPosition;\n` + shader.vertexShader;

            shader.fragmentShader = `
                uniform float time;
                uniform float pulseTime;
                uniform float portalSpeed;
                uniform vec3 portalColor;
                uniform float dimensionShift;
                varying vec3 vWorldPosition;\n` + shader.fragmentShader;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                float timeSincePortal = time - pulseTime;
                if(timeSincePortal > 0.0 && timeSincePortal < 3.0) {
                    float portalRadius = timeSincePortal * portalSpeed;
                    float currentRadius = length(vWorldPosition);
                    float portalWidth = 1.5;
                    float portalEffect = smoothstep(portalRadius - portalWidth, portalRadius, currentRadius) -
                                       smoothstep(portalRadius, portalRadius + portalWidth, currentRadius);
                    vec3 dimensionalColor = mix(portalColor, vec3(1.0, 0.5, 1.0), sin(dimensionShift * 3.14159) * 0.5 + 0.5);
                    totalEmissiveRadiance += dimensionalColor * portalEffect * 4.0;
                }`
            );
            this.portalMaterials.push(shader);
        };
    }

    createCosmicBackground() {
        const count = 4000;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = 80 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const temp = Math.random();
            const color = new THREE.Color();
            if (temp < 0.15) color.setHSL(0.8, 0.8, 0.9);
            else if (temp < 0.4) color.setHSL(0.6, 0.6, 0.8);
            else if (temp < 0.7) color.setHSL(0.1, 0.3, 0.9);
            else color.setHSL(0.3, 0.7, 0.6);

            color.toArray(colors, i3);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        const stars = new THREE.Points(geo, mat);
        this.scene.add(stars);
        this.meshes.push(stars);
        this.materials.push(mat);
    }

    createPortalCore() {
        const geo = new THREE.SphereGeometry(0.8, 32, 32);
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pulseTime: { value: -1000 },
                dimensionShift: { value: 0 },
                color1: { value: new THREE.Color(this.params.primaryColor) },
                color2: { value: new THREE.Color(this.params.secondaryColor) },
                color3: { value: new THREE.Color(this.params.accentColor) }
            },
            vertexShader: `
                uniform float time;
                uniform float dimensionShift;
                varying vec3 vPos;
                varying vec3 vNorm;
                void main() {
                    vPos = position;
                    vNorm = normal;
                    float warp = sin(position.x * 10.0 + time * 3.0) * 0.1;
                    float shift = sin(dimensionShift * 6.28318) * 0.3;
                    vec3 p = position * (1.0 + warp + shift);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float pulseTime;
                uniform float dimensionShift;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                varying vec3 vPos;
                varying vec3 vNorm;
                void main() {
                    float noise = sin(vPos.x * 20.0 + time * 4.0) * cos(vPos.z * 15.0 + time * 3.0);
                    vec3 baseColor = mix(color1, color2, 0.5 + 0.5 * sin(time * 2.0 + dimensionShift));
                    vec3 finalColor = mix(baseColor, color3, noise * 0.3);
                    
                    float fresnel = pow(1.0 - abs(dot(vNorm, normalize(cameraPosition - vPos))), 3.0);
                    finalColor = mix(finalColor, vec3(1.0), fresnel * 0.5);
                    
                    float timeSincePortal = time - pulseTime;
                    if(timeSincePortal > 0.0 && timeSincePortal < 1.0) {
                        float burst = 1.0 - timeSincePortal;
                        finalColor += vec3(1.0) * burst * 3.0;
                    }
                    
                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true
        });

        this.portalMaterials.push(mat);
        const mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.meshes.push(mesh);
    }

    createVortexRings() {
        const colors = [
            this.params.primaryColor,
            this.params.secondaryColor,
            this.params.accentColor,
            this.params.vortexColor
        ];

        for (let ring = 0; ring < 5; ring++) {
            const radius = 2 + ring * 0.8;
            const geo = new THREE.TorusGeometry(radius, 0.05, 16, 64);
            const mat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(colors[ring % colors.length]),
                transparent: true,
                opacity: 0.7,
                metalness: 0.8,
                roughness: 0.2,
                clearcoat: 0.8,
                clearcoatRoughness: 0.1,
                emissive: new THREE.Color(colors[ring % colors.length]).multiplyScalar(0.2)
            });

            this.addPortalShader(mat);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = Math.PI * 0.1 * ring;
            mesh.rotation.z = Math.PI * 0.15 * ring;
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }
    }

    createFloatingCrystals() {
        const colors = [
            this.params.accentColor,
            this.params.vortexColor,
            this.params.primaryColor,
            this.params.secondaryColor
        ];

        for (let i = 0; i < this.params.crystalCount; i++) {
            const geo = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.4, 1);
            const mat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(colors[i % colors.length]),
                transparent: true,
                opacity: 0.8,
                metalness: 0.9,
                roughness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                emissive: new THREE.Color(colors[i % colors.length]).multiplyScalar(0.3)
            });

            this.addPortalShader(mat);
            const mesh = new THREE.Mesh(geo, mat);
            const angle = (i / this.params.crystalCount) * Math.PI * 2;
            const radius = 6 + Math.random() * 4;
            mesh.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 8,
                Math.sin(angle) * radius
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }
    }

    createDimensionalStreams() {
        const colors = [
            this.params.vortexColor,
            this.params.primaryColor,
            this.params.secondaryColor
        ];

        for (let i = 0; i < 8; i++) {
            const points = [];
            const segments = 120;

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const angle = t * Math.PI * 12 + i * Math.PI * 0.25;
                const radius = 3 + Math.sin(t * Math.PI * 6) * 1.5;
                const height = (t - 0.5) * 15;

                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                ));
            }

            const curve = new THREE.CatmullRomCurve3(points);
            const geo = new THREE.TubeGeometry(curve, segments, 0.02, 8, false);
            const mat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(colors[i % colors.length]),
                transparent: true,
                opacity: 0.6,
                metalness: 1.0,
                roughness: 0.0,
                emissive: new THREE.Color(colors[i % colors.length]).multiplyScalar(0.4)
            });

            this.addPortalShader(mat);
            const stream = new THREE.Mesh(geo, mat);
            this.scene.add(stream);
            this.meshes.push(stream);
        }
    }

    createPortalFrame() {
        const frameGeo = new THREE.TorusGeometry(7, 0.2, 16, 64);
        const frameMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(this.params.primaryColor),
            transparent: true,
            opacity: 0.4,
            metalness: 1.0,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            emissive: new THREE.Color(this.params.primaryColor).multiplyScalar(0.5)
        });

        this.addPortalShader(frameMat);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        this.scene.add(frame);
        this.meshes.push(frame);
    }

    createEnergyParticles() {
        const count = 1500;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const r = 2 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.08,
            color: this.params.vortexColor,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(geo, mat);
        this.scene.add(particles);
        this.meshes.push(particles);
        this.materials.push(mat);
    }

    createSpaceDistortion() {
        const geo = new THREE.SphereGeometry(12, 64, 64);
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                dimensionShift: { value: 0 },
                color1: { value: new THREE.Color(this.params.primaryColor) },
                color2: { value: new THREE.Color(this.params.vortexColor) }
            },
            vertexShader: `
                uniform float time;
                uniform float dimensionShift;
                varying vec3 vNorm;
                varying vec3 vPos;
                void main() {
                    vNorm = normal;
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float dimensionShift;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec3 vNorm;
                varying vec3 vPos;
                void main() {
                    vec3 viewDir = normalize(cameraPosition - vPos);
                    float fresnel = pow(1.0 - abs(dot(vNorm, viewDir)), 4.0);
                    
                    float distortion = sin(vPos.x * 0.5 + time * 2.0) * cos(vPos.y * 0.7 + time * 1.5);
                    vec3 color = mix(color1, color2, distortion * 0.5 + 0.5 + dimensionShift * 0.3);
                    
                    gl_FragColor = vec4(color, fresnel * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const distortion = new THREE.Mesh(geo, mat);
        this.scene.add(distortion);
        this.meshes.push(distortion);
        this.materials.push(mat);
    }

    createPortalScene() {
        // Clean up existing meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.materials.forEach(mat => mat.dispose());
        this.meshes = [];
        this.materials = [];
        this.portalMaterials = [];

        // Create portal components
        this.createCosmicBackground();
        this.createPortalCore();
        this.createVortexRings();
        this.createFloatingCrystals();
        this.createDimensionalStreams();
        this.createPortalFrame();
        this.createEnergyParticles();
        this.createSpaceDistortion();
    }

    handleResize() {
        if (!this.camera || !this.renderer || !this.composer || !this.canvas) return;

        const container = this.canvas.parentElement;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer and composer
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        // Update FXAA pass
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.set(
            1 / (width * pixelRatio),
            1 / (height * pixelRatio)
        );
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        this.time = this.clock.getElapsedTime();

        // Update shader uniforms
        this.portalMaterials.forEach(shader => {
            if (shader.uniforms) {
                if (shader.uniforms.time) shader.uniforms.time.value = this.time;
                if (shader.uniforms.dimensionShift) 
                    shader.uniforms.dimensionShift.value = this.params.dimensionShift;
            }
        });

        this.materials.forEach(mat => {
            if (mat.uniforms) {
                if (mat.uniforms.time) mat.uniforms.time.value = this.time;
                if (mat.uniforms.dimensionShift)
                    mat.uniforms.dimensionShift.value = this.params.dimensionShift;
            }
        });

        // Animate portal lights
        this.portalLights.forEach((light, i) => {
            const angle = this.time * 0.3 + (i / 6) * Math.PI * 2;
            const radius = 10 + Math.sin(this.time * 0.5 + i) * 3;
            light.position.x = Math.cos(angle) * radius;
            light.position.z = Math.sin(angle) * radius;
            light.position.y = Math.sin(this.time * 0.4 + i * 0.7) * 5;
        });

        // Animate meshes
        this.meshes.forEach((mesh, i) => {
            if (!mesh.rotation) return;
            const speed = this.params.rotationSpeed;
            mesh.rotation.y += delta * speed * (i % 2 ? -1 : 1) * 0.3;
            mesh.rotation.x += delta * speed * 0.1;

            // Animate particle positions
            if (mesh.geometry && mesh.geometry.attributes.position && 
                mesh.material && mesh.material.type === 'PointsMaterial') {
                const positions = mesh.geometry.attributes.position.array;
                for (let j = 0; j < positions.length; j += 3) {
                    positions[j] += Math.sin(this.time + j) * 0.001;
                    positions[j + 1] += Math.cos(this.time + j) * 0.001;
                    positions[j + 2] += Math.sin(this.time * 0.7 + j) * 0.001;
                }
                mesh.geometry.attributes.position.needsUpdate = true;
            }
        });

        this.controls.update();
        this.composer.render();
    }

    setupResizeObserver() {
        if (this.canvas?.parentElement) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            this.resizeObserver.observe(this.canvas.parentElement);
        }
    }

    activatePortal() {
        this.portalMaterials.forEach(mat => {
            if (mat.uniforms && mat.uniforms.pulseTime) {
                mat.uniforms.pulseTime.value = this.time;
            }
        });
    }

    shiftDimensions() {
        const colors = [
            '#9b59b6', '#3498db', '#e74c3c', '#2ecc71',
            '#f39c12', '#e67e22', '#1abc9c', '#34495e'
        ];
        this.params.primaryColor = colors[Math.floor(Math.random() * colors.length)];
        this.params.secondaryColor = colors[Math.floor(Math.random() * colors.length)];
        this.params.accentColor = colors[Math.floor(Math.random() * colors.length)];
        this.params.vortexColor = colors[Math.floor(Math.random() * colors.length)];
        this.params.dimensionShift = Math.random();
        this.createPortalScene();
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Dispose of Three.js objects
        this.meshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });

        this.materials.forEach(mat => mat.dispose());

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    destroy() {
        this.cleanup();
    }
}
