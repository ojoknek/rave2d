import * as THREE from 'three';
import { HINGE as CD_HINGE, trayGeometry as cdTrayGeometry, lidGeometry as cdLidGeometry, discGeometry as cdDiscGeometry } from './cdcase-geometry.js?dev=2';

var canvas = document.getElementById('cd-hero-canvas');

/* same z-up -> y-up remap used by the mix catalog's CD viewer, see js/mix-case-3d.js */
var CD_ORIENT = new THREE.Matrix4().set(
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 0, 0, 0,
    0, 0, 0, 1
);

function buildBrandDiscTexture() {
    var size = 1024;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    function paint() {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        for (var rr = size * 0.49; rr > size * 0.22; rr -= 7) {
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 64px "Unbounded", sans-serif';
        ctx.fillText('RAVE 2D', 0, -size * 0.3);
        ctx.fillStyle = '#0022FF';
        ctx.font = '700 22px "Unbounded", sans-serif';
        ctx.fillText('T O K Y O', 0, -size * 0.3 + 40);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.065, 0, Math.PI * 2);
        ctx.fillStyle = '#050505';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();

        tex.needsUpdate = true;
    }

    paint();
    /* LP visitors usually land cold from social links, so Unbounded is often
       still loading on first paint -- redraw once it's actually available */
    if (document.fonts && document.fonts.load) {
        Promise.all([
            document.fonts.load('900 64px "Unbounded"'),
            document.fonts.load('700 22px "Unbounded"')
        ]).then(paint).catch(function () {});
    }

    return tex;
}

function buildBackdropTexture() {
    /* a lit backdrop near the page's own near-black so the transmissive case has
       something to refract, while still reading as part of the dark page */
    var c = document.createElement('canvas');
    c.width = c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(256, 210, 0, 256, 210, 420);
    g.addColorStop(0, '#242a5c');
    g.addColorStop(0.55, '#121226');
    g.addColorStop(1, '#050505');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function buildShadowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.5)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function buildEnvironment(renderer) {
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envScene = new THREE.Scene();
    var geo = new THREE.BoxGeometry();
    geo.deleteAttribute('uv');

    var room = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x14141a }));
    room.scale.set(10, 10, 10);
    envScene.add(room);

    var top = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    top.position.set(0, 4, 0);
    top.scale.set(5, 0.2, 5);
    envScene.add(top);

    var blue = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3355ff }));
    blue.position.set(-4, 1, -3);
    blue.scale.set(0.3, 3, 3);
    envScene.add(blue);

    var warm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    warm.position.set(4, 2, 3);
    warm.scale.set(0.3, 3, 2);
    envScene.add(warm);

    var rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
}

function buildCaseModel() {
    var root = new THREE.Group();
    var S = 0.8 / 60;

    var caseMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0.05,
        transmission: 1, thickness: 0.05 / S, ior: 1.49,
        attenuationColor: new THREE.Color(0xeef3fa), attenuationDistance: 0.8 / S,
        clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 1.2, side: THREE.DoubleSide
    });
    var lidMat = new THREE.MeshPhysicalMaterial({
        color: 0xeef3fa, transparent: true, opacity: 0.32, depthWrite: false,
        metalness: 0, roughness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.08,
        envMapIntensity: 1.2, side: THREE.DoubleSide
    });

    function orientedGroup(geoPair, material) {
        var g = new THREE.Group();
        g.setRotationFromMatrix(CD_ORIENT);
        g.scale.setScalar(S);
        g.add(new THREE.Mesh(geoPair.rods, material));
        g.add(new THREE.Mesh(geoPair.sheets, material));
        return g;
    }

    root.add(orientedGroup(cdTrayGeometry(), caseMat));

    var sideMat = new THREE.MeshPhysicalMaterial({
        color: 0xb7bfcc, metalness: 0.8, roughness: 0.2, envMapIntensity: 1.2, clearcoat: 0.6
    });
    var labelMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0.1, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.08,
        envMapIntensity: 1.1, map: buildBrandDiscTexture()
    });
    var backMat = new THREE.MeshPhysicalMaterial({
        color: 0xd7dadf, metalness: 0.85, roughness: 0.16, envMapIntensity: 1.4, clearcoat: 0.7,
        iridescence: 0.7, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420]
    });
    var disc = new THREE.Mesh(cdDiscGeometry(), [labelMat, backMat, sideMat]);
    disc.setRotationFromMatrix(CD_ORIENT);
    disc.scale.setScalar(S);
    root.add(disc);

    var hingeWorld = new THREE.Vector3(0, S * CD_HINGE.z, S * CD_HINGE.x);
    var hingeGroup = new THREE.Group();
    hingeGroup.position.copy(hingeWorld);
    root.add(hingeGroup);

    var lidGroup = orientedGroup(cdLidGeometry(), lidMat);
    lidGroup.position.copy(hingeWorld).negate();
    hingeGroup.add(lidGroup);

    /* fixed display pose: lid fully open, matching the catalog viewer's open angle */
    hingeGroup.rotation.x = -2.6;

    return root;
}

function init() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    var scene = new THREE.Scene();
    scene.environment = buildEnvironment(renderer);
    scene.background = buildBackdropTexture();

    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    var camDir = new THREE.Vector3(0, 2.35, 2.15).normalize();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a40, 1.1));
    var key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(2.2, 4.2, 2.0);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 1.2);
    fill.position.set(-2.2, 2.4, -1.4);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0x3355ff, 1.3);
    rim.position.set(-2.6, 1.8, 2.6);
    scene.add(rim);

    var shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 4.2),
        new THREE.MeshBasicMaterial({ map: buildShadowTexture(), transparent: true, depthWrite: false })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.12;
    scene.add(shadowMesh);

    var rig = new THREE.Group();
    rig.rotation.y = -0.4;
    rig.rotation.x = 0.08;
    scene.add(rig);

    var caseModel = buildCaseModel();
    rig.add(caseModel);

    /* the open lid swings back/up off the tray's local origin, so spinning the
       rig around Y would otherwise orbit the whole case through the frame
       instead of turning in place -- recenter on the model's own footprint
       (X/Z only; Y is left alone so it still sits on the floor shadow) */
    caseModel.updateMatrixWorld(true);
    var modelBox = new THREE.Box3().setFromObject(caseModel);
    var modelCenter = modelBox.getCenter(new THREE.Vector3());
    caseModel.position.x -= modelCenter.x;
    caseModel.position.z -= modelCenter.z;
    caseModel.updateMatrixWorld(true);
    modelBox.setFromObject(caseModel);
    var modelSphere = modelBox.getBoundingSphere(new THREE.Sphere());

    function fitCamera() {
        var vf = THREE.MathUtils.degToRad(camera.fov / 2);
        var hf = Math.atan(Math.tan(vf) * camera.aspect);
        var dist = modelSphere.radius / Math.sin(Math.min(vf, hf)) * 0.92;
        camera.position.copy(camDir).multiplyScalar(dist).add(modelSphere.center);
        camera.lookAt(modelSphere.center);
    }

    function handleResize() {
        var w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        fitCamera();
    }
    new ResizeObserver(handleResize).observe(canvas.parentElement);
    handleResize();

    var isVisible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(canvas);
    }

    var clock = new THREE.Clock();
    var ready = false;

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;
        var dt = Math.min(clock.getDelta(), 0.05);
        if (!reduceMotion) rig.rotation.y += dt * 0.22;
        renderer.render(scene, camera);
        if (!ready) {
            ready = true;
            canvas.classList.add('is-ready');
        }
    }
    animate();
}

if (canvas && window.WebGLRenderingContext) {
    init();
} else if (canvas) {
    canvas.parentElement.classList.add('is-unsupported');
}
