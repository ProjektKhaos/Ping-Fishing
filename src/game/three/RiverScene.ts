/**
 * Three.js 3D River & World Scene for Ping Flood Angler 3D
 * Recreates the Chiang Mai Iron Bridge (Saphan Lek), swollen muddy Ping floodwaters,
 * the riverside angler with Ashino gear, bending fishing rod, and leaping 3D river monsters.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FishSpecies } from '../types';

export interface RiverSceneCallbacks {
  onBiteTrigger?: () => void;
}

export class RiverScene {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animId: number = 0;
  private isDestroyed: boolean = false;

  // Key visual objects
  public waterMesh!: THREE.Mesh;
  public waterMaterial!: THREE.ShaderMaterial;
  public fishermanGroup!: THREE.Group;
  public rodGroup!: THREE.Group;
  public rodSegments: THREE.Mesh[] = [];
  public rodTipMarker!: THREE.Object3D;
  public floatMesh!: THREE.Group;
  public fishingLineMesh!: THREE.Line;
  public fishGroup!: THREE.Group;
  public fishTailJoint!: THREE.Group;
  public fishBodyMesh!: THREE.Mesh;
  public floatingDebrisGroup!: THREE.Group;
  public splashParticles!: THREE.Points;
  public splashPositions!: Float32Array;
  public splashVelocities!: Float32Array;
  public splashLifes!: Float32Array;
  public targetIndicator!: THREE.Group;

  // Dynamic animation values
  public rodFlex: number = 0; // 0 to 1
  public rodAngleOffset: number = 0; // pull left/right
  public floatPosition: THREE.Vector3 = new THREE.Vector3(0, 0.1, -16);
  public fishPosition: THREE.Vector3 = new THREE.Vector3(0, -0.5, -16);
  public isFloatActive: boolean = false;
  public isFishVisible: boolean = false;
  public fishLeapHeight: number = 0;
  public cameraShakeIntensity: number = 0;
  public cameraViewMode: 'angler' | 'side' | 'bridge' = 'angler';

  // Math reuse to ensure 0 GC during render tick
  private _vec1 = new THREE.Vector3();
  private _vec2 = new THREE.Vector3();
  private _linePoints: THREE.Vector3[] = [];
  private baseCameraPos = new THREE.Vector3(0, 4.2, 7.8);
  private baseCameraTarget = new THREE.Vector3(0, 1.2, -12);

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbdd5ea); // Monsoon tropical sky
    this.scene.fog = new THREE.FogExp2(0xbdd5ea, 0.012);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 500);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.baseCameraTarget);

    // 3. Renderer setup
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Lighting rig
    this.setupLighting();

    // 6. World Elements
    this.createEnvironment();
    this.createIronBridge();
    this.createWaterSurface();
    this.createRiverbankAndProps();
    this.createFisherman();
    this.createFishingGear();
    this.createFishActor();
    this.createDebrisSystem();
    this.createSplashSystem();
    this.createTargetIndicator();

    // 7. Event listeners
    window.addEventListener('resize', this.onResize);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);
  }

  private setupLighting() {
    // Warm tropical Chiang Mai sunlight
    const sunLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 120;
    const d = 28;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool sky / earthy river bounce
    const hemiLight = new THREE.HemisphereLight(0x90caf9, 0x8d6e63, 1.1);
    this.scene.add(hemiLight);

    // Gentle bank fill light
    const bankFill = new THREE.DirectionalLight(0xffe0b2, 0.6);
    bankFill.position.set(-20, 15, 10);
    this.scene.add(bankFill);
  }

  /**
   * Distant Chiang Mai Mountain (Doi Suthep), city skyline & jungle banks
   */
  private createEnvironment() {
    const envGroup = new THREE.Group();

    // 1. Doi Suthep Mountain Range in background
    const mtnGeo = new THREE.CylinderGeometry(80, 160, 50, 16, 4, true);
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x476355,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const mountain = new THREE.Mesh(mtnGeo, mtnMat);
    mountain.position.set(-30, 15, -130);
    mountain.scale.set(1.4, 0.8, 0.8);
    envGroup.add(mountain);

    // 2. Distant city buildings along Ping riverbank (East bank)
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xd6ccc2,
      roughness: 0.8,
      metalness: 0.1,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x588157,
      roughness: 0.3,
      metalness: 0.4,
    });

    const bldgGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const w = 4 + Math.random() * 5;
      const h = 8 + Math.random() * 16;
      const d = 5 + Math.random() * 6;
      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bldg = new THREE.Mesh(bGeo, Math.random() > 0.4 ? buildingMat : windowMat);
      const x = -65 + i * 8 + (Math.random() * 2 - 1);
      const z = -75 - Math.random() * 20;
      bldg.position.set(x, h / 2 - 1, z);
      bldg.castShadow = true;
      bldgGroup.add(bldg);
    }
    envGroup.add(bldgGroup);

    // 3. Golden Temple Chedi Spire in distance
    const spireGroup = new THREE.Group();
    const spireBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 4.5, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.85 })
    );
    const spireTop = new THREE.Mesh(
      new THREE.ConeGeometry(3, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.3, metalness: 0.9 })
    );
    spireTop.position.y = 8;
    spireGroup.add(spireBase, spireTop);
    spireGroup.position.set(-15, 6, -85);
    envGroup.add(spireGroup);

    // 4. Far riverbank jungle trees (instanced or grouped)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const foliageLightMat = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.85 });

    for (let i = 0; i < 28; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 6), trunkMat);
      trunk.position.y = 2;
      const canopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.8 + Math.random() * 1.2),
        Math.random() > 0.5 ? foliageMat : foliageLightMat
      );
      canopy.position.y = 4.5;
      tree.add(trunk, canopy);
      const tx = -55 + i * 4.2 + (Math.random() * 2 - 1);
      const tz = -52 + (Math.sin(i) * 3);
      tree.position.set(tx, 0.5, tz);
      tree.scale.setScalar(0.8 + Math.random() * 0.5);
      envGroup.add(tree);
    }

    this.scene.add(envGroup);
  }

  /**
   * Iconic Chiang Mai Iron Bridge (Saphan Lek) spanning the Ping River
   */
  private createIronBridge() {
    const bridge = new THREE.Group();
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1f2421,
      roughness: 0.65,
      metalness: 0.85,
    });
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x8d8780,
      roughness: 0.92,
      metalness: 0.05,
    });
    const floodStainMat = new THREE.MeshStandardMaterial({
      color: 0x6f4e37,
      roughness: 0.98,
      metalness: 0.0,
    });

    // Bridge deck (spans across from x: -70 to +70)
    const bridgeZ = -38;
    const deckHeight = 7.5;
    const deckLength = 120;
    const deckWidth = 7.2;

    const deckGeo = new THREE.BoxGeometry(deckLength, 0.6, deckWidth);
    const deck = new THREE.Mesh(deckGeo, ironMat);
    deck.position.set(0, deckHeight, bridgeZ);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridge.add(deck);

    // Concrete flood piers in the river
    const pierPositions = [-30, 0, 30];
    pierPositions.forEach((px) => {
      const pierGroup = new THREE.Group();
      // Main concrete column
      const pierBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 9, 8.5), concreteMat);
      pierBase.position.y = 3.5;
      pierBase.castShadow = true;
      pierBase.receiveShadow = true;

      // High flood watermark line
      const floodBand = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.8, 8.6), floodStainMat);
      floodBand.position.y = 1.0;
      pierGroup.add(pierBase, floodBand);

      // Angled cutwater on upstream side (water rushes from right to left / left to right)
      const wedgeGeo = new THREE.ConeGeometry(2.5, 9, 4);
      wedgeGeo.rotateY(Math.PI / 4);
      const cutwater = new THREE.Mesh(wedgeGeo, concreteMat);
      cutwater.position.set(-2.5, 3.5, 0);
      pierGroup.add(cutwater);

      pierGroup.position.set(px, 0, bridgeZ);
      bridge.add(pierGroup);
    });

    // Steel Pratt Truss framework spans
    const trussSpans = [
      { startX: -55, endX: -5 },
      { startX: -5, endX: 45 },
    ];

    trussSpans.forEach((span) => {
      const spanWidth = span.endX - span.startX;
      const spanCenter = (span.startX + span.endX) / 2;
      const trussHeight = 8.5;
      const trussZOffset = deckWidth / 2 - 0.2;

      // Build two parallel trusses (front and back of deck)
      [-trussZOffset, trussZOffset].forEach((zOff) => {
        const trussGroup = new THREE.Group();
        // Top chord
        const topChord = new THREE.Mesh(new THREE.BoxGeometry(spanWidth, 0.35, 0.35), ironMat);
        topChord.position.set(spanCenter, deckHeight + trussHeight, bridgeZ + zOff);
        trussGroup.add(topChord);

        // Vertical posts & diagonal cross-braces
        const panels = 6;
        const panelW = spanWidth / panels;
        for (let p = 0; p <= panels; p++) {
          const vx = span.startX + p * panelW;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, trussHeight, 0.3), ironMat);
          post.position.set(vx, deckHeight + trussHeight / 2, bridgeZ + zOff);
          trussGroup.add(post);

          // Diagonal cross
          if (p < panels) {
            const diagLen = Math.hypot(panelW, trussHeight);
            const diag = new THREE.Mesh(new THREE.BoxGeometry(0.25, diagLen, 0.25), ironMat);
            const angle = Math.atan2(panelW, trussHeight);
            diag.position.set(vx + panelW / 2, deckHeight + trussHeight / 2, bridgeZ + zOff);
            diag.rotation.z = p % 2 === 0 ? -angle : angle;
            trussGroup.add(diag);
          }
        }
        bridge.add(trussGroup);
      });

      // Overhead sway bracing connecting top chords
      const panels = 6;
      const panelW = spanWidth / panels;
      for (let p = 0; p <= panels; p++) {
        const vx = span.startX + p * panelW;
        const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, deckWidth), ironMat);
        crossBeam.position.set(vx, deckHeight + trussHeight, bridgeZ);
        bridge.add(crossBeam);
      }
    });

    // Vintage street lanterns along the bridge
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffeeaa,
      emissive: 0xffaa44,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 7; i++) {
      const lx = -45 + i * 15;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3, 6), ironMat);
      pole.position.set(lx, deckHeight + 1.5, bridgeZ - deckWidth / 2 + 0.2);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampMat);
      bulb.position.set(lx, deckHeight + 3.1, bridgeZ - deckWidth / 2 + 0.2);
      bridge.add(pole, bulb);
    }

    this.scene.add(bridge);
  }

  /**
   * Procedural muddy swollen floodwaters of the Ping River with dynamic shader
   */
  private createWaterSurface() {
    const waterGeo = new THREE.PlaneGeometry(160, 100, 96, 64);
    waterGeo.rotateX(-Math.PI / 2);

    // Custom water shader reproducing the churning, terracotta-brown monsoon Ping flood
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x75431d) }, // Muddy sediment brown
        uShallowColor: { value: new THREE.Color(0xa77443) }, // Sunlit silt terracotta
        uFoamColor: { value: new THREE.Color(0xe9dbca) }, // Yellowish churning foam
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vNormalVec;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Rapid flood current surge from right-to-left
          float surge = sin(pos.x * 0.12 + uTime * 3.8) * cos(pos.z * 0.1 + uTime * 1.5) * 0.22;
          float chop = sin(pos.x * 0.35 - uTime * 4.5 + pos.z * 0.2) * 0.11;
          float eddy = sin(pos.z * 0.45 + uTime * 2.2) * 0.08;

          pos.y += surge + chop + eddy;
          vElevation = pos.y;
          vNormalVec = normal;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          float depthFactor = smoothstep(-0.35, 0.35, vElevation);
          vec3 waterCol = mix(uDeepColor, uShallowColor, depthFactor);

          // Flowing foam streaks
          float foamLines = sin((vUv.x * 75.0) - (uTime * 5.0) + sin(vUv.y * 30.0) * 3.0);
          foamLines = smoothstep(0.72, 0.98, foamLines);

          // Crest highlights
          float crest = smoothstep(0.18, 0.34, vElevation);
          vec3 finalColor = mix(waterCol, uFoamColor, max(foamLines * 0.35, crest * 0.45));

          // Subtle sun reflection glint
          gl_FragColor = vec4(finalColor, 0.94);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.position.set(0, 0, -25);
    this.scene.add(this.waterMesh);
  }

  /**
   * The riverbank where the angler is stationed, complete with grass, rocks,
   * folding Ashino chair, tackle boxes, and bait jars as seen in reference photos.
   */
  private createRiverbankAndProps() {
    const bankGroup = new THREE.Group();

    // 1. Muddy grass slope (playable bank)
    const bankGeo = new THREE.BoxGeometry(90, 4.5, 24);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x476228, // Lush wet monsoon grass
      roughness: 0.9,
      metalness: 0.05,
    });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.position.set(0, 0.5, 12);
    bankMesh.receiveShadow = true;
    bankGroup.add(bankMesh);

    // Mud waterline rim
    const rimGeo = new THREE.BoxGeometry(90, 1.2, 3);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e2b,
      roughness: 0.95,
      metalness: 0.0,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, 0.2, 0.2);
    bankGroup.add(rimMesh);

    // Riverbank rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.85 });
    for (let i = 0; i < 14; i++) {
      const rGeo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.5);
      const rock = new THREE.Mesh(rGeo, rockMat);
      rock.position.set(-18 + i * 2.8 + Math.random() * 0.8, 0.2, 0.5 + Math.random() * 1.5);
      rock.scale.set(1 + Math.random() * 0.4, 0.6, 1);
      rock.castShadow = true;
      bankGroup.add(rock);
    }

    // 2. Ashino Folding Camping Chair (exact styling from reference image)
    const chairGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.85, roughness: 0.3 });
    const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.6 });
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    // Crossed aluminum chair legs
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), frameMat);
    leg1.rotation.z = 0.45;
    leg1.position.set(-0.3, 0.5, 0);
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), frameMat);
    leg2.rotation.z = -0.45;
    leg2.position.set(0.3, 0.5, 0);
    const jointRed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), redAccentMat);
    jointRed.position.set(0, 0.5, 0);

    // Seat & backrest
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.85), fabricMat);
    seat.position.set(0, 0.85, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.05), fabricMat);
    back.position.set(0, 1.3, 0.4);
    back.rotation.x = 0.15;

    chairGroup.add(leg1, leg2, jointRed, seat, back);
    chairGroup.position.set(-2.8, 1.8, 3.2);
    chairGroup.rotation.y = 0.4;
    bankGroup.add(chairGroup);

    // 3. "ASHINO TYCOON 3000" Tackle Box
    const boxGroup = new THREE.Group();
    const boxBaseMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.4, metalness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });

    const boxBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.55), boxBaseMat);
    boxBase.position.y = 0.24;
    boxBase.castShadow = true;
    const corner1 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.1, 0.58), chromeMat);
    corner1.position.y = 0.45;
    boxGroup.add(boxBase, corner1);

    boxGroup.position.set(-2.2, 2.2, 1.8);
    boxGroup.rotation.y = 0.25;
    bankGroup.add(boxGroup);

    // 4. Tackle packets & lead sinkers laid out on ground (like in photo)
    const tacklePackMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.5 });
    const shimanoBlueMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.4 });
    const wormMat = new THREE.MeshStandardMaterial({ color: 0xbc6c25, roughness: 0.85 });

    const pack1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.4), tacklePackMat);
    pack1.position.set(-1.4, 2.3, 1.5);
    const pack2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.45), shimanoBlueMat);
    pack2.position.set(-1.0, 2.3, 1.6);
    const wormBag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), wormMat);
    wormBag.position.set(-0.6, 2.3, 1.4);

    bankGroup.add(pack1, pack2, wormBag);

    // Contact shadow plane beneath bank equipment
    const contactShadowGeo = new THREE.PlaneGeometry(5, 4);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactMat = new THREE.MeshBasicMaterial({
      color: 0x1b2818,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactMat);
    contactShadow.position.set(-1.5, 2.26, 2.4);
    bankGroup.add(contactShadow);

    this.scene.add(bankGroup);
  }

  /**
   * Composite 3D Fisherman character based on the user's reference images
   * (Cool guy with bucket hat, beard, black "PUNKROCK" tee, jeans/shorts, focused stance)
   */
  private createFisherman() {
    this.fishermanGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfa07e, roughness: 0.75 });
    const hairBeardMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.85 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x212529, roughness: 0.8 });

    // 1. Legs & Shoes
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.55), shoesMat);
    leftShoe.position.set(-0.35, 0.1, 0.1);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.55), shoesMat);
    rightShoe.position.set(0.35, 0.1, 0.1);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 1.2, 8), pantsMat);
    leftLeg.position.set(-0.35, 0.75, 0);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 1.2, 8), pantsMat);
    rightLeg.position.set(0.35, 0.75, 0);

    // 2. Torso & Graphic T-Shirt
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.65), shirtMat);
    torso.position.set(0, 1.85, 0);
    torso.castShadow = true;

    // "PUNKROCK" Chest Emblem (procedural canvas texture)
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 256;
    logoCanvas.height = 128;
    const lctx = logoCanvas.getContext('2d')!;
    lctx.fillStyle = '#181818';
    lctx.fillRect(0, 0, 256, 128);
    lctx.fillStyle = '#f8f9fa';
    lctx.font = 'bold 36px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText('PUNKROCK', 128, 60);
    lctx.font = 'bold 18px sans-serif';
    lctx.fillText('CHIANG MAI 1970', 128, 95);

    const logoTex = new THREE.CanvasTexture(logoCanvas);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
    const logoPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.32), logoMat);
    logoPlate.position.set(0, 2.0, 0.33);
    this.fishermanGroup.add(logoPlate);

    // 3. Arms holding the rod
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.85, 8), skinMat);
    leftArm.position.set(-0.52, 1.8, 0.3);
    leftArm.rotation.x = -Math.PI / 3;
    leftArm.rotation.z = -0.2;

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.85, 8), skinMat);
    rightArm.position.set(0.52, 1.8, 0.3);
    rightArm.rotation.x = -Math.PI / 3;
    rightArm.rotation.z = 0.2;

    // 4. Head & Face with Beard
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), skinMat);
    head.position.set(0, 2.65, 0.05);

    // Full beard & mustache
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.36), hairBeardMat);
    beard.position.set(0, 2.52, 0.18);

    // 5. Bucket Hat (Iconic black angler hat)
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.38, 12), hatMat);
    hatCrown.position.set(0, 2.9, 0.05);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 16), hatMat);
    hatBrim.position.set(0, 2.75, 0.05);

    this.fishermanGroup.add(
      leftShoe, rightShoe, leftLeg, rightLeg,
      torso, leftArm, rightArm,
      head, beard, hatCrown, hatBrim
    );

    // Fisherman placement on the bank
    this.fishermanGroup.position.set(0, 2.25, 2.2);
    this.scene.add(this.fishermanGroup);
  }

  /**
   * 3D Fishing Rod with Dynamic Inverse Flex Curve and Spinning Reel
   */
  private createFishingGear() {
    this.rodGroup = new THREE.Group();

    // Rod Handle (Cork & EVA Foam)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xcca573, roughness: 0.9 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.7, roughness: 0.3 });
    const goldRingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });

    const butt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.6, 8), corkMat);
    butt.position.set(0, 0, 0);

    // Ashino spinning reel
    const reelBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.12), handleMat);
    reelBody.position.set(0, 0.35, -0.09);
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), goldRingMat);
    spool.rotation.z = Math.PI / 2;
    spool.position.set(0, 0.35, -0.09);
    const handleCrank = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.04), goldRingMat);
    handleCrank.position.set(0.1, 0.35, -0.09);
    this.rodGroup.add(butt, reelBody, spool, handleCrank);

    // Multi-segment flexible carbon blank
    const segCount = 6;
    let parentObj: THREE.Object3D = this.rodGroup;
    this.rodSegments = [];

    for (let i = 0; i < segCount; i++) {
      const segGroup = new THREE.Group();
      const segLen = 0.55;
      const rTop = 0.035 - i * 0.005;
      const rBot = 0.04 - i * 0.005;

      const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segLen, 8), carbonMat);
      segMesh.position.y = segLen / 2;
      segMesh.castShadow = true;

      // Line guide ring
      const guide = new THREE.Mesh(new THREE.TorusGeometry(0.03 - i * 0.003, 0.006, 6, 12), goldRingMat);
      guide.position.set(0, segLen * 0.85, -0.03);
      guide.rotation.x = Math.PI / 2;

      segGroup.add(segMesh, guide);
      segGroup.position.y = i === 0 ? 0.3 : segLen;

      parentObj.add(segGroup);
      this.rodSegments.push(segGroup as unknown as THREE.Mesh);
      parentObj = segGroup;
    }

    // Rod Tip marker for line attachment
    this.rodTipMarker = new THREE.Object3D();
    this.rodTipMarker.position.set(0, 0.55, 0);
    parentObj.add(this.rodTipMarker);

    // Initial rod orientation (pointed forward towards river)
    this.rodGroup.position.set(0.3, 1.85, 0.4);
    this.rodGroup.rotation.x = -Math.PI / 3.5;
    this.rodGroup.rotation.y = -0.15;
    this.fishermanGroup.add(this.rodGroup);

    // 3D Fishing Float / Bobber (High-vis Red & White)
    this.floatMesh = new THREE.Group();
    const floatTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.3 })
    );
    floatTop.position.y = 0.12;
    const floatBot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 })
    );
    const floatStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0xffd60a })
    );
    floatStem.position.y = 0.25;

    this.floatMesh.add(floatTop, floatBot, floatStem);
    this.floatMesh.position.copy(this.floatPosition);
    this.floatMesh.visible = false;
    this.scene.add(this.floatMesh);

    // Dynamic 3D Fishing Line
    const lineGeo = new THREE.BufferGeometry();
    const linePointsCount = 20;
    this._linePoints = [];
    for (let i = 0; i < linePointsCount; i++) {
      this._linePoints.push(new THREE.Vector3());
    }
    lineGeo.setFromPoints(this._linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffeeaa,
      transparent: true,
      opacity: 0.85,
      linewidth: 1,
    });
    this.fishingLineMesh = new THREE.Line(lineGeo, lineMat);
    this.fishingLineMesh.frustumCulled = false;
    this.scene.add(this.fishingLineMesh);
  }

  /**
   * 3D Articulated Fish Actor for underneath water and thrilling leaps!
   */
  private createFishActor() {
    this.fishGroup = new THREE.Group();

    const fishMat = new THREE.MeshStandardMaterial({
      color: 0x495867,
      roughness: 0.4,
      metalness: 0.3,
    });
    const finMat = new THREE.MeshStandardMaterial({
      color: 0xe76f51,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    // Fish Head & Torso
    const bodyGeo = new THREE.ConeGeometry(0.65, 2.2, 10);
    bodyGeo.rotateZ(Math.PI / 2);
    this.fishBodyMesh = new THREE.Mesh(bodyGeo, fishMat);
    this.fishBodyMesh.castShadow = true;

    // Tail joint (animates back and forth)
    this.fishTailJoint = new THREE.Group();
    this.fishTailJoint.position.set(-1.1, 0, 0);

    const tailFinGeo = new THREE.BoxGeometry(0.08, 0.9, 0.7);
    const tailFin = new THREE.Mesh(tailFinGeo, finMat);
    tailFin.position.set(-0.45, 0, 0);
    this.fishTailJoint.add(tailFin);

    // Dorsal fin
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.06), finMat);
    dorsalFin.position.set(-0.2, 0.5, 0);
    dorsalFin.rotation.z = -0.3;

    // Whiskers (for Catfish)
    const whiskerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.8, 6), finMat);
    whiskerLeft.position.set(0.9, -0.15, 0.35);
    whiskerLeft.rotation.y = 0.5;
    whiskerLeft.rotation.z = -0.3;

    const whiskerRight = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.8, 6), finMat);
    whiskerRight.position.set(0.9, -0.15, -0.35);
    whiskerRight.rotation.y = -0.5;
    whiskerRight.rotation.z = -0.3;

    this.fishGroup.add(this.fishBodyMesh, this.fishTailJoint, dorsalFin, whiskerLeft, whiskerRight);
    this.fishGroup.position.copy(this.fishPosition);
    this.fishGroup.visible = false;
    this.scene.add(this.fishGroup);
  }

  /**
   * Update fish visual appearance according to caught/fighting species
   */
  public updateFishSkin(species: FishSpecies) {
    if (!this.fishBodyMesh) return;
    (this.fishBodyMesh.material as THREE.MeshStandardMaterial).color.set(species.color);
    const finMat = (this.fishTailJoint.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    finMat.color.set(species.finColor);
  }

  /**
   * Floating flood debris drifting down the Ping River
   * (driftwood logs, clumps of water hyacinth, bamboo poles)
   */
  private createDebrisSystem() {
    this.floatingDebrisGroup = new THREE.Group();
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

    for (let i = 0; i < 9; i++) {
      const isLog = i % 2 === 0;
      let mesh: THREE.Mesh;
      if (isLog) {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 3.5 + Math.random() * 2, 6), logMat);
        mesh.rotation.z = Math.PI / 2 + (Math.random() * 0.4 - 0.2);
      } else {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.5), plantMat);
      }
      mesh.position.set(-60 + Math.random() * 120, -0.1, -12 - Math.random() * 22);
      mesh.castShadow = true;
      this.floatingDebrisGroup.add(mesh);
    }
    this.scene.add(this.floatingDebrisGroup);
  }

  /**
   * Particle burst system for water splashes, leap foam, and strikes
   */
  private createSplashSystem() {
    const pCount = 120;
    const geo = new THREE.BufferGeometry();
    this.splashPositions = new Float32Array(pCount * 3);
    this.splashVelocities = new Float32Array(pCount * 3);
    this.splashLifes = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      this.splashPositions[i * 3 + 1] = -100; // hide below
      this.splashLifes[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    this.splashParticles = new THREE.Points(geo, mat);
    this.splashParticles.frustumCulled = false;
    this.scene.add(this.splashParticles);
  }

  public triggerSplash(x: number, y: number, z: number, count: number = 35) {
    const pCount = this.splashLifes.length;
    let spawned = 0;

    for (let i = 0; i < pCount && spawned < count; i++) {
      if (this.splashLifes[i] <= 0) {
        this.splashPositions[i * 3] = x + (Math.random() - 0.5) * 0.6;
        this.splashPositions[i * 3 + 1] = y + 0.1;
        this.splashPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;

        this.splashVelocities[i * 3] = (Math.random() - 0.5) * 4.5;
        this.splashVelocities[i * 3 + 1] = 3.5 + Math.random() * 4.5;
        this.splashVelocities[i * 3 + 2] = (Math.random() - 0.5) * 4.5;

        this.splashLifes[i] = 0.5 + Math.random() * 0.5;
        spawned++;
      }
    }
  }

  /**
   * Target Aiming Ring indicator on water
   */
  private createTargetIndicator() {
    this.targetIndicator = new THREE.Group();

    const ringGeo = new THREE.RingGeometry(0.7, 0.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);

    const innerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      new THREE.MeshBasicMaterial({ color: 0xef476f, side: THREE.DoubleSide })
    );
    innerDot.rotation.x = -Math.PI / 2;
    innerDot.position.y = 0.02;

    this.targetIndicator.add(ring, innerDot);
    this.targetIndicator.position.set(0, 0.15, -16);
    this.targetIndicator.visible = false;
    this.scene.add(this.targetIndicator);
  }

  /**
   * Apply dynamic rod flex curve based on fighting tension & reel pull
   */
  public updateRodBend(tensionNorm: number, sidePull: number, dt: number) {
    this.rodFlex = THREE.MathUtils.damp(this.rodFlex, tensionNorm, 12, dt);
    this.rodAngleOffset = THREE.MathUtils.damp(this.rodAngleOffset, sidePull * 0.35, 10, dt);

    const curveAmount = this.rodFlex * 0.28;

    this.rodSegments.forEach((seg, idx) => {
      // Each segment curves progressively more toward the tip
      const factor = (idx + 1) / this.rodSegments.length;
      seg.rotation.x = -curveAmount * factor;
      seg.rotation.z = -this.rodAngleOffset * factor;
    });
  }

  /**
   * Render tick
   */
  public update(dt: number, elapsedTime: number) {
    if (this.isDestroyed) return;

    // 1. Water shader time
    if (this.waterMaterial.uniforms) {
      this.waterMaterial.uniforms.uTime.value = elapsedTime;
    }

    // 2. Drift floating flood debris down the Ping River
    if (this.floatingDebrisGroup) {
      const riverSpeed = 4.2; // Ping flood current velocity
      this.floatingDebrisGroup.children.forEach((debris) => {
        debris.position.x += riverSpeed * dt;
        debris.rotation.y += 0.4 * dt;
        if (debris.position.x > 65) {
          debris.position.x = -65;
          debris.position.z = -12 - Math.random() * 24;
        }
      });
    }

    // 3. Fish thrash & swim animation
    if (this.isFishVisible && this.fishGroup) {
      this.fishGroup.visible = true;
      this.fishTailJoint.rotation.y = Math.sin(elapsedTime * 18) * 0.45;

      if (this.fishLeapHeight > 0) {
        // Leaping out of the muddy water!
        this.fishGroup.position.set(
          this.fishPosition.x,
          this.fishLeapHeight,
          this.fishPosition.z
        );
        this.fishGroup.rotation.x = -Math.sin(elapsedTime * 8) * 0.8;
        this.fishGroup.rotation.y = Math.cos(elapsedTime * 6) * 0.5;
      } else {
        // Beneath water shadow
        this.fishGroup.position.copy(this.fishPosition);
        this.fishGroup.rotation.set(0, Math.sin(elapsedTime * 2) * 0.3, 0);
      }
    } else if (this.fishGroup) {
      this.fishGroup.visible = false;
    }

    // 4. Update Splash particles
    if (this.splashParticles) {
      const pCount = this.splashLifes.length;
      let needsUpdate = false;

      for (let i = 0; i < pCount; i++) {
        if (this.splashLifes[i] > 0) {
          this.splashLifes[i] -= dt;
          this.splashPositions[i * 3] += this.splashVelocities[i * 3] * dt;
          this.splashPositions[i * 3 + 1] += this.splashVelocities[i * 3 + 1] * dt;
          this.splashPositions[i * 3 + 2] += this.splashVelocities[i * 3 + 2] * dt;

          this.splashVelocities[i * 3 + 1] -= 9.8 * dt; // Gravity

          if (this.splashLifes[i] <= 0 || this.splashPositions[i * 3 + 1] < 0) {
            this.splashPositions[i * 3 + 1] = -100;
            this.splashLifes[i] = 0;
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        this.splashParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 5. Update Float & Fishing Line
    if (this.isFloatActive && this.floatMesh) {
      this.floatMesh.visible = true;
      // Float bobs in river current
      const bob = Math.sin(elapsedTime * 5 + this.floatPosition.x) * 0.08;
      this.floatMesh.position.set(
        this.floatPosition.x,
        this.floatPosition.y + bob,
        this.floatPosition.z
      );

      // Line from Rod Tip to Float
      this.rodTipMarker.getWorldPosition(this._vec1);
      const start = this._vec1;
      const end = this.floatMesh.position;

      // Draw sagging or tight line curve
      const lineLen = this._linePoints.length;
      const sagAmount = Math.max(0.05, 0.4 - this.rodFlex * 0.35);

      for (let i = 0; i < lineLen; i++) {
        const alpha = i / (lineLen - 1);
        this._linePoints[i].lerpVectors(start, end, alpha);
        // Catinary sag
        const sag = Math.sin(alpha * Math.PI) * sagAmount;
        this._linePoints[i].y -= sag;
      }
      this.fishingLineMesh.geometry.setFromPoints(this._linePoints);
      this.fishingLineMesh.visible = true;
    } else {
      if (this.floatMesh) this.floatMesh.visible = false;
      if (this.fishingLineMesh) this.fishingLineMesh.visible = false;
    }

    // 6. Camera Damping & Shake
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.5);
    }
    const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.3;
    const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.3;

    if (this.cameraViewMode === 'angler') {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.baseCameraPos.x + shakeX, 6, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.baseCameraPos.y + shakeY, 6, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.baseCameraPos.z, 6, dt);
      this.camera.lookAt(this.baseCameraTarget);
    } else if (this.cameraViewMode === 'side') {
      this.camera.position.set(12, 3.8, 1.5);
      this.camera.lookAt(-2, 1.8, -10);
    } else if (this.cameraViewMode === 'bridge') {
      this.camera.position.set(0, 11, -34);
      this.camera.lookAt(0, 2, 2);
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  public applyCameraShake(intensity: number = 1.0) {
    this.cameraShakeIntensity = Math.min(2.5, this.cameraShakeIntensity + intensity);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
