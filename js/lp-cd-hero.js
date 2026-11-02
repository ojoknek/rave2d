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
        color: 0x9fb0ff, transparent: true, opacity: 0.13, depthWrite: false,
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

function dotTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

function init() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hero = document.getElementById('hero');
    var isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    var scene = new THREE.Scene();
    scene.environment = buildEnvironment(renderer);

    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    var camDir = new THREE.Vector3(0, 1.7, 2.4).normalize();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x20203a, 0.9));
    var key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(2.2, 4.2, 2.0);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 1.0);
    fill.position.set(-2.2, 2.4, -1.4);
    scene.add(fill);
    var rim = new THREE.PointLight(0x0022ff, 40, 0, 1.6);
    rim.position.set(-2.4, 1.2, 1.6);
    scene.add(rim);
    var rim2 = new THREE.PointLight(0x5577ff, 22, 0, 1.6);
    rim2.position.set(2.6, -0.4, -1.8);
    scene.add(rim2);

    /* stage = what scroll moves/scales; rig = what drag/idle spin rotates */
    var stage = new THREE.Group();
    scene.add(stage);
    var rig = new THREE.Group();
    rig.rotation.x = 0.1;
    stage.add(rig);

    var caseModel = buildCaseModel();
    rig.add(caseModel);

    /* recenter on the model's own footprint so the open lid doesn't orbit the frame */
    caseModel.updateMatrixWorld(true);
    var modelBox = new THREE.Box3().setFromObject(caseModel);
    var modelCenter = modelBox.getCenter(new THREE.Vector3());
    caseModel.position.x -= modelCenter.x;
    caseModel.position.z -= modelCenter.z;
    caseModel.position.y -= modelCenter.y;
    caseModel.updateMatrixWorld(true);
    modelBox.setFromObject(caseModel);
    var modelSphere = modelBox.getBoundingSphere(new THREE.Sphere());
    var R = modelSphere.radius;

    /* orbit rings -- thin blue halos tilted around the case */
    var rings = [];
    [[1.25, 0.006, 1.2, 0.3], [1.55, 0.004, 0.6, -0.9], [1.9, 0.003, 1.45, 0.5]].forEach(function (d) {
        var ring = new THREE.Mesh(
            new THREE.TorusGeometry(R * d[0], R * d[1], 8, 160),
            new THREE.MeshBasicMaterial({ color: 0x2244ff, transparent: true, opacity: 0.55, depthWrite: false })
        );
        ring.rotation.x = d[2];
        ring.rotation.y = d[3];
        stage.add(ring);
        rings.push(ring);
    });

    /* dust */
    var N = isSmall ? 260 : 480;
    var pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
        var rr = R * (1.3 + Math.random() * 2.6);
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = rr * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = rr * Math.cos(ph) * 0.8;
        pos[i * 3 + 2] = rr * Math.sin(ph) * Math.sin(th);
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
        map: dotTexture(), color: 0x7f95ff, size: R * 0.07, sizeAttenuation: true,
        transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    stage.add(dust);

    function fitCamera() {
        var vf = THREE.MathUtils.degToRad(camera.fov / 2);
        var hf = Math.atan(Math.tan(vf) * camera.aspect);
        /* portrait phones are width-limited: let the case fill the width */
        var dist = R / Math.sin(Math.min(vf, hf)) * (camera.aspect < 1 ? 0.78 : 0.95);
        camera.position.copy(camDir).multiplyScalar(dist);
        camera.lookAt(0, 0, 0);
    }

    function handleResize() {
        var w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        fitCamera();
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    /* --- input: drag to spin (horizontal), pointer parallax, scroll choreography --- */
    var spinVel = 0, dragging = false, lastX = 0;
    var tiltX = 0, tiltY = 0, tx = 0, ty = 0;
    var scrollP = 0, scrollSm = 0, lastScrollY = window.scrollY, scrollKick = 0;

    hero.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a,button')) return;
        dragging = true; lastX = e.clientX;
        hero.classList.add('is-dragging');
        try { hero.setPointerCapture(e.pointerId); } catch (err) {}
    });
    function endDrag() { dragging = false; hero.classList.remove('is-dragging'); }
    hero.addEventListener('pointerup', endDrag);
    hero.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
        if (dragging) {
            spinVel += (e.clientX - lastX) * 0.012;
            lastX = e.clientX;
            hero.classList.add('has-dragged');
        }
    });
    window.addEventListener('scroll', function () {
        var y = window.scrollY;
        scrollKick += (y - lastScrollY) * 0.0022;
        lastScrollY = y;
        scrollP = y / window.innerHeight;
    }, { passive: true });

    var isVisible = true;
    if ('IntersectionObserver' in window) {
        /* the canvas is fixed, so pause only when the tab is hidden */
        document.addEventListener('visibilitychange', function () { isVisible = !document.hidden; });
    }

    var clock = new THREE.Clock();
    var ready = false;
    var baseY = -0.4;
    var heroHeight = function () { return Math.max(1, hero.offsetHeight / window.innerHeight); };

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;
        var dt = Math.min(clock.getDelta(), 0.05);
        var t = clock.elapsedTime;

        scrollSm += (scrollP - scrollSm) * Math.min(1, dt * 6);
        var p = Math.min(scrollSm / heroHeight(), 1.6);

        spinVel += scrollKick; scrollKick = 0;
        spinVel *= Math.pow(0.04, dt);
        baseY += (reduceMotion ? 0 : dt * 0.28) + spinVel * dt * 4;
        rig.rotation.y = baseY;

        tiltX += (ty * 0.14 - tiltX) * Math.min(1, dt * 3);
        tiltY += (tx * 0.22 - tiltY) * Math.min(1, dt * 3);
        rig.rotation.x = 0.1 + tiltX;
        stage.rotation.y = tiltY * 0.6;

        /* scroll: the case recedes down and shrinks, then sits as a ghost behind content */
        var s = THREE.MathUtils.lerp(1, 0.55, Math.min(p, 1));
        stage.scale.setScalar(s);
        stage.position.y = (reduceMotion ? 0 : Math.sin(t * 0.9) * R * 0.04) - Math.min(p, 1) * R * 0.9;
        stage.rotation.z = Math.min(p, 1) * 0.35;

        rings[0].rotation.z += dt * 0.35;
        rings[1].rotation.z -= dt * 0.22;
        rings[2].rotation.z += dt * 0.12;
        dust.rotation.y += dt * 0.03;
        rim.intensity = 40 + Math.sin(t * 2.2) * 14;

        canvas.style.opacity = ready ? String(THREE.MathUtils.lerp(1, 0.28, Math.min(p, 1))) : '0';

        renderer.render(scene, camera);
        if (!ready) {
            ready = true;
            canvas.classList.add('is-ready');
            document.documentElement.classList.add('gl-ready');
        }
    }
    animate();
}

if (canvas && window.WebGLRenderingContext) {
    try { init(); } catch (e) { document.documentElement.classList.add('no-gl'); }
} else {
    document.documentElement.classList.add('no-gl');
}
