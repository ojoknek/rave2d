import * as THREE from 'three';
import { HINGE as CD_HINGE, trayGeometry as cdTrayGeometry, lidGeometry as cdLidGeometry, discGeometry as cdDiscGeometry } from './cdcase-geometry.js?dev=2';

var canvas = document.getElementById('video-modal-canvas');
var hintEl = document.getElementById('video-modal-case-hint');

if (!canvas || !window.WebGLRenderingContext) {
    window.RaveMixCase = { open: function () {}, close: function () {} };
} else {
    init();
}

function roundedRectShape(w, h, r) {
    var x = -w / 2, y = -h / 2;
    var shape = new THREE.Shape();
    shape.moveTo(x, y + r);
    shape.lineTo(x, y + h - r);
    shape.quadraticCurveTo(x, y + h, x + r, y + h);
    shape.lineTo(x + w - r, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    shape.lineTo(x + w, y + r);
    shape.quadraticCurveTo(x + w, y, x + w - r, y);
    shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y + r);
    return shape;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    var words = text.split(' ');
    var line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = words[i];
        } else {
            line = test;
        }
    }
    lines.push(line);
    lines = lines.slice(0, maxLines);
    for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], x, y + j * lineHeight);
    }
    return lines.length;
}

/* mirrors the catalog card's own `background-size: cover; background-position: right center` crop */
function drawCoverRight(ctx, img, w, h) {
    var s = Math.max(w / img.width, h / img.height);
    var iw = img.width * s, ih = img.height * s;
    var dx = w - iw, dy = (h - ih) / 2;
    ctx.drawImage(img, dx, dy, iw, ih);
}

function loadThumb(thumbHi, thumbLo, cb) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () { cb(img); };
    img.onerror = function () {
        if (img.src !== thumbLo) { img.src = thumbLo; return; }
        cb(null);
    };
    img.src = thumbHi;
}

function buildCassetteTexture(thumbHi, thumbLo, title, meta, done) {
    var w = 1024, h = 606;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');

    function paint(img) {
        ctx.fillStyle = '#0c0d10';
        ctx.fillRect(0, 0, w, h);
        if (img) drawCoverRight(ctx, img, w, h);

        var grad = ctx.createLinearGradient(0, 0, w * 0.72, 0);
        grad.addColorStop(0, 'rgba(5,5,8,0.92)');
        grad.addColorStop(1, 'rgba(5,5,8,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';
        ctx.font = '700 46px "Unbounded", sans-serif';
        var lines = wrapText(ctx, (title || 'RAVE 2D').toUpperCase(), w * 0.055, h * 0.74, w * 0.46, 50, 2);
        ctx.font = '400 24px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText((meta || '').toUpperCase(), w * 0.055, h * 0.74 + lines * 50 + 10);

        ctx.fillStyle = 'rgba(0,34,255,0.85)';
        ctx.font = '700 20px "Unbounded", sans-serif';
        ctx.fillText('RAVE 2D', w * 0.055, h * 0.16);

        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        done(tex);
    }
    loadThumb(thumbHi, thumbLo, paint);
}

function buildDiscTexture(thumbHi, thumbLo, title, meta, grooves, done) {
    var size = 1024;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');

    function paint(img) {
        ctx.fillStyle = grooves ? '#0a0a0a' : '#c9ccd2';
        ctx.fillRect(0, 0, size, size);
        if (img) drawCoverRight(ctx, img, size, size);

        var grad = ctx.createLinearGradient(0, size * 0.52, 0, size);
        grad.addColorStop(0, 'rgba(5,5,8,0)');
        grad.addColorStop(1, 'rgba(5,5,8,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, size * 0.5, size, size * 0.5);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';
        ctx.font = '700 52px "Unbounded", sans-serif';
        var lines = wrapText(ctx, (title || 'RAVE 2D').toUpperCase(), size * 0.09, size * 0.76, size * 0.82, 54, 2);
        ctx.font = '400 28px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillText((meta || '').toUpperCase(), size * 0.09, size * 0.76 + lines * 54 + 14);

        ctx.save();
        ctx.translate(size / 2, size / 2);
        if (grooves) {
            ctx.strokeStyle = 'rgba(0,0,0,0.16)';
            ctx.lineWidth = 1;
            for (var rr = size * 0.49; rr > size * 0.095; rr -= 8) {
                ctx.beginPath();
                ctx.arc(0, 0, rr, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.065, 0, Math.PI * 2);
        ctx.fillStyle = '#050505';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
        ctx.restore();

        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        done(tex);
    }
    loadThumb(thumbHi, thumbLo, paint);
}

function buildGrooveBumpTexture() {
    var size = 512;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = '#4d4d4d';
    ctx.lineWidth = 1.1;
    for (var rr = size * 0.49; rr > size * 0.095; rr -= 3.4) {
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function init() {
    var renderer, scene, camera, clock, rig;
    var envTexture, shadowMesh;
    var models = {};
    var currentModelKind = 'cd';
    var currentOpts = null;
    var ready = false;

    var rotY = -0.5, rotX = 0.1;
    var targetRotY = rotY, targetRotX = rotX;
    var velY = 0;

    var dragging = false, dragMoved = false;
    var lastX = 0, lastY = 0, downX = 0, downY = 0, downT = 0;
    var lastInteraction = 0;
    var rafId = null;
    var requestToken = 0;
    var textureCache = Object.create(null);
    var initialized = false;

    function setupScene() {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, logarithmicDepthBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 2.5, 2.3);
        camera.lookAt(0, 0, 0);

        envTexture = buildEnvironment(renderer);
        scene.environment = envTexture;
        scene.background = buildBackdropTexture();

        var hemi = new THREE.HemisphereLight(0xffffff, 0x3a3a40, 1.1);
        scene.add(hemi);
        var key = new THREE.DirectionalLight(0xffffff, 2.6);
        key.position.set(2.2, 4.2, 2.0);
        scene.add(key);
        var fill = new THREE.DirectionalLight(0xffffff, 1.2);
        fill.position.set(-2.2, 2.4, -1.4);
        scene.add(fill);
        var rim = new THREE.DirectionalLight(0x3355ff, 1.1);
        rim.position.set(-2.6, 1.8, 2.6);
        scene.add(rim);

        shadowMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(4.2, 4.2),
            new THREE.MeshBasicMaterial({ map: buildShadowTexture(), transparent: true, depthWrite: false })
        );
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = -0.12;
        scene.add(shadowMesh);

        rig = new THREE.Group();
        scene.add(rig);

        clock = new THREE.Clock();

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerLeave);

        var ro = new ResizeObserver(handleResize);
        ro.observe(canvas.parentElement);
        handleResize();
    }

    function buildEnvironment(r) {
        var pmrem = new THREE.PMREMGenerator(r);
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

    function buildBackdropTexture() {
        /* a real in-scene backdrop so transmissive plastic has something lit to refract
           (a flat-transparent canvas gives the transmission pass nothing but black) */
        var c = document.createElement('canvas');
        c.width = c.height = 512;
        var ctx = c.getContext('2d');
        var g = ctx.createRadialGradient(256, 236, 0, 256, 236, 420);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.55, '#f3f3f5');
        g.addColorStop(1, '#e6e6ea');
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
        g.addColorStop(0, 'rgba(0,0,0,0.38)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.18)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /* maps the ported geometry's z-up (footprint in local XY, thickness along Z,
       hinge knuckles swept along local Y) into our y-up world with the hinge
       axis landing on world X, matching hingeGroup.rotation.x below:
       local_x -> world_z, local_y -> world_x, local_z -> world_y */
    var CD_ORIENT = new THREE.Matrix4().set(
        0, 1, 0, 0,
        0, 0, 1, 0,
        1, 0, 0, 0,
        0, 0, 0, 1
    );

    function buildCD() {
        var root = new THREE.Group();

        /* real jewel-case millimetre geometry (Ann Nguyen's cd-case, see
           js/cdcase-geometry.js) scaled so the disc keeps its prior radius */
        var S = 0.8 / 60;

        /* MeshPhysicalMaterial.thickness is read in the mesh's LOCAL space, before
           the group's S scale is applied, so it must be pre-divided by S or the
           refraction collapses to a near-zero-thickness film. ~3.75 local units
           matches the ~3mm rail cross-section this geometry is built from. */
        var caseMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.05,
            transmission: 1, thickness: 0.05 / S, ior: 1.49,
            attenuationColor: new THREE.Color(0xeef3fa), attenuationDistance: 0.8 / S,
            clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 1.2, side: THREE.DoubleSide
        });
        /* the lid gets its own non-transmissive material: a transmissive lid
           sitting directly over the transmissive tray (closed state) is past
           what the renderer's single-bounce transmission pass can resolve, and
           washes the disc hub out to flat white. Plain alpha blending draws
           after transmissive passes, so it composites correctly on top. */
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

        var trayGroup = orientedGroup(cdTrayGeometry(), caseMat);
        root.add(trayGroup);

        var sideMat = new THREE.MeshPhysicalMaterial({
            color: 0xb7bfcc, metalness: 0.8, roughness: 0.2, envMapIntensity: 1.2, clearcoat: 0.6
        });
        var labelMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0.1, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 1.1
        });
        var backMat = new THREE.MeshPhysicalMaterial({
            color: 0xd7dadf, metalness: 0.85, roughness: 0.16, envMapIntensity: 1.4, clearcoat: 0.7,
            iridescence: 0.7, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420]
        });
        var disc = new THREE.Mesh(cdDiscGeometry(), [labelMat, backMat, sideMat]);
        disc.setRotationFromMatrix(CD_ORIENT);
        disc.scale.setScalar(S);
        root.add(disc);

        /* hinge pivot sits at the world position of the ported geometry's
           hinge-knuckle axis; the lid group carries the inverse offset so it
           lands back in the shared tray frame when the pivot angle is zero */
        var hingeWorld = new THREE.Vector3(0, S * CD_HINGE.z, S * CD_HINGE.x);
        var hingeGroup = new THREE.Group();
        hingeGroup.position.copy(hingeWorld);
        root.add(hingeGroup);

        var lidGroup = orientedGroup(cdLidGeometry(), lidMat);
        lidGroup.position.copy(hingeWorld).negate();
        hingeGroup.add(lidGroup);

        var LID_OPEN = -2.6, LID_CLOSED = 0;
        var lidAngle = LID_CLOSED, lidTarget = LID_CLOSED;

        return {
            root: root,
            labelMat: labelMat,
            textureBuilder: function (hi, lo, title, meta, done) { buildDiscTexture(hi, lo, title, meta, false, done); },
            hint: 'タップで開閉 ・ ドラッグで回転',
            tick: function (dt) {
                lidAngle += (lidTarget - lidAngle) * 0.1;
                hingeGroup.rotation.x = lidAngle;
            },
            onTap: function () {
                lidTarget = (lidTarget === LID_OPEN) ? LID_CLOSED : LID_OPEN;
            },
            onShow: function () {
                lidAngle = lidTarget = LID_CLOSED;
                window.setTimeout(function () { lidTarget = LID_OPEN; }, 180);
            }
        };
    }

    function buildCassette() {
        var root = new THREE.Group();
        var shell = new THREE.Group();
        shell.rotation.x = -Math.PI / 2;
        root.add(shell);

        var shellMat = new THREE.MeshPhysicalMaterial({
            color: 0x15171c, roughness: 0.36, metalness: 0,
            clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.95, side: THREE.DoubleSide
        });
        var shellGeo = new THREE.ExtrudeGeometry(roundedRectShape(2.0, 1.22, 0.08), {
            depth: 0.16, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, steps: 1
        });
        shellGeo.translate(0, 0, -0.08);
        shell.add(new THREE.Mesh(shellGeo, shellMat));

        var screwMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
        var screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10);
        [[-0.88, 0.5], [0.88, 0.5], [-0.88, -0.5], [0.88, -0.5]].forEach(function (p) {
            var s = new THREE.Mesh(screwGeo, screwMat);
            s.rotation.x = Math.PI / 2;
            s.position.set(p[0], p[1], 0.12);
            shell.add(s);
        });

        var labelMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.5
        });
        var label = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 1.09), labelMat);
        label.position.z = 0.11;
        shell.add(label);

        var windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x050607, roughness: 0.3, clearcoat: 0.6, transparent: true, opacity: 0.94
        });
        var win = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.44), windowMat);
        win.position.set(0, 0.26, 0.14);
        shell.add(win);

        var hubs = [];
        [[-0.4, 0.3], [0.4, 0.21]].forEach(function (p) {
            var hubGroup = new THREE.Group();
            hubGroup.position.set(p[0], 0.26, 0.17);

            var packMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: 0.6, clearcoat: 0.2 });
            var pack = new THREE.Mesh(new THREE.CylinderGeometry(p[1], p[1], 0.03, 36), packMat);
            pack.rotation.x = Math.PI / 2;
            hubGroup.add(pack);

            var hubMat = new THREE.MeshPhysicalMaterial({
                color: 0xcfc9bd, roughness: 0.42, clearcoat: 0.4, envMapIntensity: 0.8
            });
            var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 20), hubMat);
            hub.rotation.x = Math.PI / 2;
            hub.position.z = 0.004;
            hubGroup.add(hub);

            var spokeMat = new THREE.MeshPhysicalMaterial({ color: 0x3a342c, roughness: 0.5 });
            for (var i = 0; i < 3; i++) {
                var spoke = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.012), spokeMat);
                spoke.position.z = 0.006;
                spoke.rotation.z = i * (Math.PI / 3);
                hubGroup.add(spoke);
            }

            var spindleMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.6 });
            var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.045, 14), spindleMat);
            spindle.rotation.x = Math.PI / 2;
            spindle.position.z = 0.008;
            hubGroup.add(spindle);

            var teethMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5, metalness: 0.3 });
            for (var t = 0; t < 6; t++) {
                var ang = t * (Math.PI / 3);
                var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.024, 0.012), teethMat);
                tooth.position.set(Math.cos(ang) * 0.046, Math.sin(ang) * 0.046, 0.008);
                tooth.rotation.z = ang;
                hubGroup.add(tooth);
            }

            shell.add(hubGroup);
            hubs.push(hubGroup);
        });

        var holeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.6 });
        [[-0.28, -0.56], [0.28, -0.56]].forEach(function (p) {
            var hole = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), holeMat);
            hole.position.set(p[0], p[1], 0.1);
            shell.add(hole);
        });
        var centerHole = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), holeMat);
        centerHole.position.set(0, -0.56, 0.1);
        shell.add(centerHole);

        var bedMat = new THREE.MeshPhysicalMaterial({ color: 0x08080a, roughness: 0.55, clearcoat: 0.25 });
        var bedGeo = new THREE.ExtrudeGeometry(roundedRectShape(2.5, 1.7, 0.1), {
            depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2
        });
        bedGeo.rotateX(-Math.PI / 2);
        var bed = new THREE.Mesh(bedGeo, bedMat);
        bed.position.y = -0.1;
        root.add(bed);

        var pinMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
        [[-0.75, -0.6], [0.75, -0.6]].forEach(function (p) {
            var pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 12), pinMat);
            pin.position.set(p[0], -0.06, p[1]);
            root.add(pin);
        });

        var playing = false;
        return {
            root: root,
            labelMat: labelMat,
            textureBuilder: buildCassetteTexture,
            hint: 'タップで再生 ・ ドラッグで回転',
            tick: function (dt) {
                if (!playing) return;
                hubs[0].rotation.z += dt * 1.6;
                hubs[1].rotation.z += dt * 1.6;
            },
            onTap: function () { playing = !playing; },
            onShow: function () { playing = false; }
        };
    }

    function buildVinyl() {
        var root = new THREE.Group();

        /* black plinth, like a real belt/direct-drive turntable base -- kept close to the
           platter's own footprint so the record (the actual subject) stays dominant.
           Nesting must hold: plinth > metal platter > felt mat > record. */
        var plinthMat = new THREE.MeshPhysicalMaterial({ color: 0x0e0e10, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
        var plinthGeo = new THREE.ExtrudeGeometry(roundedRectShape(2.7, 2.2, 0.1), {
            depth: 0.16, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3, steps: 1
        });
        plinthGeo.rotateX(-Math.PI / 2);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(0, -0.16, 0);
        root.add(plinth);

        var edgeMat = new THREE.MeshPhysicalMaterial({
            color: 0x080808, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.25, envMapIntensity: 1
        });
        var labelMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.4, clearcoat: 0.75, clearcoatRoughness: 0.18, envMapIntensity: 0.9,
            bumpMap: buildGrooveBumpTexture(), bumpScale: 0.0045
        });
        var backMat = new THREE.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.5, clearcoat: 0.4 });

        var discR = 0.78;
        var disc = new THREE.Mesh(
            new THREE.CylinderGeometry(discR, discR, 0.018, 96),
            [edgeMat, labelMat, backMat]
        );
        disc.position.y = 0.02;
        root.add(disc);

        var rimHighlight = new THREE.Mesh(
            new THREE.TorusGeometry(discR, 0.006, 8, 96),
            new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.3 })
        );
        rimHighlight.rotation.x = Math.PI / 2;
        rimHighlight.position.y = 0.02;
        root.add(rimHighlight);

        /* metal sub-platter with a felt slipmat on top, like a real deck --
           clearly smaller than the plinth (half-width 1.35 / half-depth 1.1) */
        var platterR = 0.95, feltR = 0.88;
        var metalPlatterMat = new THREE.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.9, roughness: 0.3 });
        var metalPlatter = new THREE.Mesh(new THREE.CylinderGeometry(platterR, platterR, 0.022, 96), metalPlatterMat);
        metalPlatter.position.y = -0.021;
        root.add(metalPlatter);

        var feltMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.95, metalness: 0 });
        var felt = new THREE.Mesh(new THREE.CylinderGeometry(feltR, feltR, 0.012, 96), feltMat);
        felt.position.y = 0;
        root.add(felt);

        /* stroboscope dot ring around the platter edge, between the felt and the platter rim */
        var dotMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.4 });
        var DOT_COUNT = 44;
        var dotR = (platterR + feltR) / 2;
        for (var di = 0; di < DOT_COUNT; di++) {
            var dAng = (di / DOT_COUNT) * Math.PI * 2;
            var dot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.05), dotMat);
            dot.position.set(Math.cos(dAng) * dotR, -0.005, Math.sin(dAng) * dotR);
            dot.rotation.y = -dAng;
            root.add(dot);
        }

        var spindleMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.25 });
        var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 20), spindleMat);
        spindle.position.y = 0.1;
        root.add(spindle);

        var capMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.2 });
        var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20), capMat);
        cap.position.y = 0.016;
        disc.add(cap);

        /* front-left control cluster: power knob + start/stop + speed buttons */
        var knobMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.3 });
        var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 20), knobMat);
        knob.position.set(-1.1, 0.015, 0.82);
        root.add(knob);
        var btnMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
        [[-0.82, 0.92], [-0.58, 0.92], [-0.82, 0.7]].forEach(function (p) {
            var btn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.08), btnMat);
            btn.position.set(p[0], 0.007, p[1]);
            root.add(btn);
        });

        /* tonearm resting on its rest, parked just beside the platter */
        var metalMat = new THREE.MeshStandardMaterial({ color: 0xcfcfd2, metalness: 0.85, roughness: 0.28 });
        var darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x17181a, metalness: 0.55, roughness: 0.35 });

        var tonearmGroup = new THREE.Group();
        tonearmGroup.position.set(1.02, 0, -0.55);
        root.add(tonearmGroup);

        var armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.04, 20), darkMetalMat);
        armBase.position.y = 0.02;
        tonearmGroup.add(armBase);

        var restPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), metalMat);
        restPost.position.set(0.16, 0.015, 0.05);
        tonearmGroup.add(restPost);

        var pivotPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 14), metalMat);
        pivotPost.position.y = 0.08;
        tonearmGroup.add(pivotPost);

        var armPivot = new THREE.Group();
        armPivot.position.y = 0.17;
        tonearmGroup.add(armPivot);

        var armLen = 1.05;
        var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, armLen, 10), metalMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.x = armLen / 2;
        armPivot.add(arm);

        var headshell = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.032, 0.06), darkMetalMat);
        headshell.position.x = armLen - 0.02;
        armPivot.add(headshell);

        var stylus = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 8), darkMetalMat);
        stylus.position.set(armLen + 0.03, -0.02, 0);
        stylus.rotation.z = Math.PI;
        armPivot.add(stylus);

        var counterweight = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.09, 14), darkMetalMat);
        counterweight.rotation.z = Math.PI / 2;
        counterweight.position.x = -0.14;
        armPivot.add(counterweight);

        /* aim the resting arm toward the near edge of the record */
        var restDX = -0.45 - tonearmGroup.position.x;
        var restDZ = 0.95 - tonearmGroup.position.z;
        armPivot.rotation.y = Math.atan2(-restDZ, restDX);

        var playing = false;
        return {
            root: root,
            labelMat: labelMat,
            textureBuilder: function (hi, lo, title, meta, done) { buildDiscTexture(hi, lo, title, meta, true, done); },
            hint: 'タップで再生 ・ ドラッグで回転',
            tick: function (dt) {
                if (!playing) return;
                disc.rotation.y += dt * 1.3;
            },
            onTap: function () { playing = !playing; },
            onShow: function () { playing = false; }
        };
    }

    function ensureModelBuilt(kind) {
        if (models[kind]) return;
        var m = kind === 'vinyl' ? buildVinyl() : (kind === 'cassette' ? buildCassette() : buildCD());
        m.root.visible = false;
        rig.add(m.root);
        models[kind] = m;
    }

    function showModel(kind) {
        ensureModelBuilt(kind);
        Object.keys(models).forEach(function (k) { models[k].root.visible = (k === kind); });
        currentModelKind = kind;
        if (hintEl) hintEl.textContent = models[kind].hint;
        models[kind].onShow();
        applyTexture(kind);
    }

    function applyTexture(kind) {
        var token = requestToken;
        var cacheKey = kind + ':' + currentOpts.videoId;
        var cached = textureCache[cacheKey];

        function apply(tex) {
            if (token !== requestToken) return;
            var m = models[kind];
            if (m.labelMat.map) m.labelMat.map.dispose();
            m.labelMat.map = tex;
            m.labelMat.needsUpdate = true;
        }

        if (cached) { apply(cached); return; }
        models[kind].textureBuilder(currentOpts.thumbHi, currentOpts.thumbLo, currentOpts.title, currentOpts.meta, function (tex) {
            textureCache[cacheKey] = tex;
            apply(tex);
        });
    }

    function handleResize() {
        if (!renderer || !canvas.parentElement) return;
        var w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    function onPointerDown(e) {
        dragging = true;
        dragMoved = false;
        lastX = downX = e.clientX;
        lastY = downY = e.clientY;
        downT = performance.now();
        canvas.setPointerCapture(e.pointerId);
        velY = 0;
    }
    function onPointerMove(e) {
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) dragMoved = true;
        targetRotY += dx * 0.0085;
        targetRotX = Math.max(-0.15, Math.min(0.4, targetRotX - dy * 0.005));
        velY = dx * 0.0085;
        lastInteraction = performance.now();
    }
    function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        var elapsed = performance.now() - downT;
        if (!dragMoved && elapsed < 400) {
            var active = models[currentModelKind];
            if (active) active.onTap();
        }
        lastInteraction = performance.now();
    }
    function onPointerLeave() {
        if (dragging) onPointerUp();
    }

    function animate() {
        rafId = requestAnimationFrame(animate);
        var dt = Math.min(clock.getDelta(), 0.05);
        var idle = performance.now() - lastInteraction > 1600 && !dragging;

        if (idle) targetRotY += dt * 0.15;
        else velY *= 0.9;

        targetRotY += velY;
        velY *= 0.92;

        rotY += (targetRotY - rotY) * 0.14;
        rotX += (targetRotX - rotX) * 0.14;

        rig.rotation.y = rotY;
        rig.rotation.x = rotX;

        var active = models[currentModelKind];
        if (active) active.tick(dt);

        renderer.render(scene, camera);

        if (!ready) {
            ready = true;
            canvas.classList.add('is-ready');
        }
    }

    function stop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        ready = false;
    }

    window.__raveDebug = { scene: function () { return scene; }, models: function () { return models; }, THREE: THREE };

    window.RaveMixCase = {
        open: function (opts) {
            if (!initialized) { setupScene(); initialized = true; }
            requestToken++;
            currentOpts = opts;

            canvas.classList.remove('is-ready');
            rotY = targetRotY = -0.5;
            rotX = targetRotX = 0.1;
            velY = 0;
            lastInteraction = performance.now();

            handleResize();
            if (!rafId) animate();

            showModel(currentModelKind);
        },
        close: function () {
            requestToken++;
            window.setTimeout(stop, 400);
        }
    };
}
