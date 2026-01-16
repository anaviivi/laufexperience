import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF, useAnimations, Html } from "@react-three/drei";

// ✅ DEINE DATEIEN (Pfad ggf. anpassen!)
import forestImg from "./assets/forest-Bno_N5jD.jpg";
import natureVideo from "./assets/bg_nature-ByKg6-je.mp4";

/* ======================================================================================
   PROFILE (Gender) – kommt aus ProfilePage:
   - localStorage key: "laufx_profile"
   - update event:     "laufx_profile_updated"
====================================================================================== */
const PROFILE_STORAGE_KEY = "laufx_profile";
const PROFILE_UPDATED_EVENT = "laufx_profile_updated";

function safeProfileParse() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredGender() {
  const p = safeProfileParse();
  return p?.gender === "female" ? "female" : "male";
}

/* ======================================================================================
   PATHS: public/models/
====================================================================================== */
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const MODELS_DIR = "models/";
const modelUrl = (file) => `${BASE}${MODELS_DIR}${file}`;

/* ======================================================================================
   GLB mapping
====================================================================================== */
const GLB = {
  easy_run: { male: "easy_run_man.glb", female: "easy_run_woman.glb" },
  tempo_run: { male: "tempo_run_man.glb", female: "tempo_run_woman.glb" },
  sprint_run: { male: "tempo_run_man.glb", female: "tempo_run_woman.glb" },

  heel_strike: { male: "heel_strike_man.glb", female: "heel_strike_woman.glb" },
  midfoot_strike: { male: "midfoot_strike_man.glb", female: "midfoot_strike_woman.glb" },
  forefoot_strike: { male: "forefoot_strike_man.glb", female: "forefoot_strike_woman.glb" },

  injury: { male: "injury_man.glb", female: "injury_woman.glb" },
};

/* ======================================================================================
   FIXED TEMPOS (NUR 3!)
====================================================================================== */
const FIXED_RUN_TEMPOS = Object.freeze({
  easy_run: 0.75,
  tempo_run: 1.0,
  sprint_run: 1.35,
});

const IS_RUN_MODE = (modeKey) =>
  modeKey === "easy_run" || modeKey === "tempo_run" || modeKey === "sprint_run";

function normalizeGender(v) {
  const s = String(v || "").toLowerCase();
  return ["f", "female", "woman", "frau"].includes(s) ? "female" : "male";
}

function resolveMode(mode) {
  const m = String(mode || "").toLowerCase();

  // ✅ direkt bekannte Keys
  if (GLB[m]) return m;

  // ✅ RunnerDemo / allgemein
  if (m === "easy") return "easy_run";
  if (m === "tempo") return "tempo_run";
  if (m === "sprint") return "sprint_run";

  // ✅ RunningTechniquesPage: "heel | mid | fore"
  if (m === "heel") return "heel_strike";
  if (m === "mid") return "midfoot_strike";
  if (m === "fore") return "forefoot_strike";

  // ✅ Injury pages
  if (["knee", "shin", "achilles"].includes(m)) return "injury";

  return "easy_run";
}

/* ======================================================================================
   Camera presets
====================================================================================== */
const DEFAULT_CAMERA = {
  position: new THREE.Vector3(0, 1.6, 3.2),
  target: new THREE.Vector3(0, 1.2, 0),
  fov: 45,
};

const INJURY_CAMERA = {
  knee: {
    position: new THREE.Vector3(0.3, 1.35, 2.8),
    target: new THREE.Vector3(0.2, 1.05, 0),
    fov: 45,
  },
  shin: {
    position: new THREE.Vector3(0.3, 1.1, 2.9),
    target: new THREE.Vector3(0.2, 0.75, 0),
    fov: 45,
  },
  achilles: {
    position: new THREE.Vector3(0.3, 1.1, 2.9),
    target: new THREE.Vector3(0.2, 0.6, -0.05),
    fov: 45,
  },
};

const FOCUS_CAMERA = {
  knee: INJURY_CAMERA.knee,
  shin: INJURY_CAMERA.shin,
  achilles: INJURY_CAMERA.achilles,

  heel: {
    position: new THREE.Vector3(0.35, 1.0, 2.95),
    target: new THREE.Vector3(0.2, 0.25, 0.0),
    fov: 42,
  },
  midfoot: {
    position: new THREE.Vector3(0.35, 1.05, 2.9),
    target: new THREE.Vector3(0.2, 0.35, 0.0),
    fov: 42,
  },
  forefoot: {
    position: new THREE.Vector3(0.35, 1.05, 2.9),
    target: new THREE.Vector3(0.2, 0.45, 0.05),
    fov: 42,
  },
};

function toVec3(arr, fallback) {
  if (Array.isArray(arr) && arr.length === 3 && arr.every((n) => Number.isFinite(n))) {
    return new THREE.Vector3(arr[0], arr[1], arr[2]);
  }
  return fallback.clone();
}

function normalizeCameraView(v) {
  const raw = String(v || "").toLowerCase().trim();
  const s = raw.split("|")[0];
  if (s === "side" || s === "front" || s === "back") return s;
  return null;
}

function cameraViewToCamera(cameraView) {
  const v = normalizeCameraView(cameraView);
  const base = { target: DEFAULT_CAMERA.target.clone(), fov: DEFAULT_CAMERA.fov };

  if (v === "back") return { ...base, position: new THREE.Vector3(0, 1.6, -3.2) };
  if (v === "side") return { ...base, position: new THREE.Vector3(3.2, 1.6, 0) };
  return { ...base, position: DEFAULT_CAMERA.position.clone() };
}

function scaleCameraDistanceAroundTarget(cfg, padding = 1.0) {
  const p = Number.isFinite(padding) && padding > 0 ? padding : 1.0;
  if (p === 1) return cfg;

  const target = cfg.target.clone();
  const dir = cfg.position.clone().sub(target);
  dir.multiplyScalar(p);

  return { ...cfg, position: target.clone().add(dir) };
}

function getCamera(selectedMode, highlightArea, focusTarget, cameraProp, cameraView, cameraPadding = 1.0) {
  if (cameraProp && typeof cameraProp === "object") {
    const pos = toVec3(cameraProp.position, DEFAULT_CAMERA.position);
    const tar = toVec3(cameraProp.target, DEFAULT_CAMERA.target);
    const fov = Number.isFinite(cameraProp.fov) ? cameraProp.fov : DEFAULT_CAMERA.fov;
    return scaleCameraDistanceAroundTarget({ position: pos, target: tar, fov }, cameraPadding);
  }

  const cv = normalizeCameraView(cameraView);
  if (cv) {
    const cfg = cameraViewToCamera(cv);
    return scaleCameraDistanceAroundTarget(cfg, cameraPadding);
  }

  if (Array.isArray(focusTarget) && focusTarget.length === 3) {
    const tar = new THREE.Vector3(focusTarget[0], focusTarget[1], focusTarget[2]);
    const pos = new THREE.Vector3(0.35, tar.y + 0.55, 2.85);
    const cfg = { position: pos, target: tar, fov: 45 };
    return scaleCameraDistanceAroundTarget(cfg, cameraPadding);
  }

  const a = String(highlightArea || "").toLowerCase();
  if (FOCUS_CAMERA[a]) return scaleCameraDistanceAroundTarget(FOCUS_CAMERA[a], cameraPadding);

  return scaleCameraDistanceAroundTarget(DEFAULT_CAMERA, cameraPadding);
}

/* ======================================================================================
   Helpers
====================================================================================== */
function findFirstByNames(root, names = []) {
  if (!root) return null;
  const set = new Set((names || []).map((n) => String(n)));
  let found = null;

  root.traverse((o) => {
    if (found) return;
    if (!o) return;
    if (o.name && set.has(o.name)) found = o;
  });

  return found;
}

/* ======================================================================================
   Hotspots overlay
====================================================================================== */
function Hotspots({ items = [] }) {
  return (
    <>
      {items.map((h) => (
        <Html key={h.id} position={h.position} center>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "rgba(16,185,129,0.95)",
              boxShadow: "0 0 0 4px rgba(16,185,129,0.25)",
            }}
            title={h.label || h.id}
          />
        </Html>
      ))}
    </>
  );
}

/* ======================================================================================
   RunnerModel
====================================================================================== */
function RunnerModel({ url, paused = false, timeScale = 1, onLoaded, logSceneNames = false, stepSignal = 0, onSceneReady }) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  const activeActionRef = useRef(null);
  const lastStepRef = useRef(stepSignal);

  useEffect(() => {
    onLoaded?.(url);
  }, [url, onLoaded]);

  useEffect(() => {
    if (!scene) return;
    onSceneReady?.({ scene, group: group.current });
  }, [scene, onSceneReady]);

  useEffect(() => {
    if (!logSceneNames || !scene) return;
    console.log("====== GLB NAMES START ======");
    console.log("URL:", url);
    console.log("---- Meshes ----");
    scene.traverse((o) => o?.isMesh && console.log("Mesh:", o.name));
    console.log("---- Bones ----");
    scene.traverse((o) => o?.isBone && console.log("Bone:", o.name));
    console.log("====== GLB NAMES END ======");
  }, [logSceneNames, scene, url]);

  useEffect(() => {
    if (!actions || !Object.keys(actions).length) {
      activeActionRef.current = null;
      return;
    }

    Object.values(actions).forEach((a) => {
      a.stop();
      a.reset();
      a.paused = false;
      a.setEffectiveTimeScale?.(1);
      a.timeScale = 1;
    });

    const firstKey = Object.keys(actions)[0];
    const action = actions[firstKey];
    if (!action) return;

    action.reset().fadeIn(0.35).play();
    activeActionRef.current = action;

    const s = paused ? 0 : timeScale;
    action.paused = !!paused;
    action.setEffectiveTimeScale?.(s);
    action.timeScale = s;

    return () => action.fadeOut(0.25);
  }, [actions, url]);

  useEffect(() => {
    const a = activeActionRef.current;
    if (!a) return;
    const s = paused ? 0 : timeScale;
    a.paused = !!paused;
    a.setEffectiveTimeScale?.(s);
    a.timeScale = s;
  }, [paused, timeScale]);

  useEffect(() => {
    if (lastStepRef.current === stepSignal) return;
    lastStepRef.current = stepSignal;

    const a = activeActionRef.current;
    if (!a) return;

    const dt = 1 / 60;
    a.time = (a.time ?? 0) + dt;
  }, [stepSignal]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

/* ======================================================================================
   Camera rig
====================================================================================== */
function CameraRig({ controlsRef, selectedMode, highlightArea, focusTarget, cameraProp, cameraView, cameraPadding }) {
  const camRef = useRef(null);
  const targetRef = useRef(DEFAULT_CAMERA.target.clone());

  useFrame(({ camera }) => {
    camRef.current = camera;
    camera.lookAt(targetRef.current);
  });

  useEffect(() => {
    const camera = camRef.current;
    const controls = controlsRef?.current || null;
    if (!camera) return;

    const cfg = getCamera(selectedMode, highlightArea, focusTarget, cameraProp, cameraView, cameraPadding ?? 1.0);

    const fromPos = camera.position.clone();
    const toPos = cfg.position.clone();

    const fromTarget = controls ? controls.target.clone() : targetRef.current.clone();
    const toTarget = cfg.target.clone();

    let raf = 0;
    let t = 0;
    const duration = 0.35;

    const step = () => {
      t += 1 / 60;
      const k = Math.min(1, t / duration);

      camera.position.lerpVectors(fromPos, toPos, k);
      targetRef.current.lerpVectors(fromTarget, toTarget, k);

      if (controls) {
        controls.target.copy(targetRef.current);
        controls.update();
      } else {
        camera.lookAt(targetRef.current);
      }

      if (k < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selectedMode, highlightArea, focusTarget, cameraProp, cameraView, controlsRef, cameraPadding]);

  return null;
}

/* ======================================================================================
   Target projector (3D -> 2D screen px)
====================================================================================== */
const DEFAULT_TARGET_NAMES = {
  knee: ["Marker_Knee", "Knee", "knee_l", "knee_r", "mixamorig:LeftLeg", "LeftLeg", "mixamorig:RightLeg", "RightLeg", "mixamorig:LeftUpLeg", "LeftUpLeg", "mixamorig:RightUpLeg", "RightUpLeg"],
  shin: ["Marker_Shin", "Shin", "shin_l", "shin_r", "mixamorig:LeftLeg", "LeftLeg", "mixamorig:RightLeg", "RightLeg", "mixamorig:LeftFoot", "LeftFoot", "mixamorig:RightFoot", "RightFoot"],
  achilles: ["Marker_Achilles", "Marker_Foot", "Foot", "foot_l", "foot_r", "mixamorig:LeftFoot", "LeftFoot", "mixamorig:RightFoot", "RightFoot", "mixamorig:LeftToeBase", "LeftToeBase", "mixamorig:RightToeBase", "RightToeBase"],

  heel: ["Marker_Heel", "Heel", "heel_l", "heel_r", "mixamorig:LeftFoot", "LeftFoot", "mixamorig:RightFoot", "RightFoot"],
  midfoot: ["Marker_Midfoot", "Midfoot", "midfoot_l", "midfoot_r", "mixamorig:LeftFoot", "LeftFoot", "mixamorig:RightFoot", "RightFoot"],
  forefoot: ["Marker_Forefoot", "Forefoot", "forefoot_l", "forefoot_r", "mixamorig:LeftToeBase", "LeftToeBase", "mixamorig:RightToeBase", "RightToeBase", "mixamorig:LeftFoot", "LeftFoot", "mixamorig:RightFoot", "RightFoot"],
};

function TargetProjector({ sceneRoot, targetMode = "knee", onTargetScreenPos, targetNameCandidates, targetOffset = [0, 0, 0] }) {
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const objRef = useRef(null);
  const lastSentRef = useRef({ x: -9999, y: -9999 });

  const candidates = useMemo(() => {
    if (targetNameCandidates?.[targetMode]?.length) return targetNameCandidates[targetMode];
    return DEFAULT_TARGET_NAMES[targetMode] ?? DEFAULT_TARGET_NAMES.knee;
  }, [targetMode, targetNameCandidates]);

  useEffect(() => {
    objRef.current = null;
    lastSentRef.current = { x: -9999, y: -9999 };
  }, [sceneRoot, targetMode, candidates]);

  useFrame(() => {
    if (!sceneRoot || !onTargetScreenPos) return;

    if (!objRef.current) objRef.current = findFirstByNames(sceneRoot, candidates);
    const obj = objRef.current;
    if (!obj) return;

    obj.getWorldPosition(tmp);
    tmp.add(new THREE.Vector3(targetOffset[0] || 0, targetOffset[1] || 0, targetOffset[2] || 0));
    tmp.project(camera);

    if (tmp.z < -1 || tmp.z > 1) return;

    const x = (tmp.x * 0.5 + 0.5) * size.width;
    const y = (-tmp.y * 0.5 + 0.5) * size.height;

    const last = lastSentRef.current;
    if (Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return;
    lastSentRef.current = { x, y };

    onTargetScreenPos({ x, y });
  });

  return null;
}

/* ======================================================================================
   ✅ TRUE 3D Marker that sticks to the joint object
====================================================================================== */
function JointMarker({ sceneRoot, mode, targetNameCandidates, targetOffset = [0, 0, 0], visible = true }) {
  const markerRef = useRef(null);
  const ringRef = useRef(null);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const objRef = useRef(null);

  const candidates = useMemo(() => {
    if (targetNameCandidates?.[mode]?.length) return targetNameCandidates[mode];
    return DEFAULT_TARGET_NAMES[mode] ?? DEFAULT_TARGET_NAMES.knee;
  }, [mode, targetNameCandidates]);

  useEffect(() => {
    objRef.current = null;
  }, [sceneRoot, mode, candidates]);

  useFrame((_, delta) => {
    if (!visible || !sceneRoot || !markerRef.current) return;

    if (!objRef.current) objRef.current = findFirstByNames(sceneRoot, candidates);
    const obj = objRef.current;
    if (!obj) return;

    obj.getWorldPosition(tmp);
    tmp.add(new THREE.Vector3(targetOffset[0] || 0, targetOffset[1] || 0, targetOffset[2] || 0));

    markerRef.current.position.lerp(tmp, 1 - Math.pow(0.001, delta));

    if (ringRef.current) {
      ringRef.current.position.copy(markerRef.current.position);
      ringRef.current.rotation.y += delta * 0.9;
    }
  });

  if (!visible) return null;

  return (
    <>
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.028, 20, 20]} />
        <meshStandardMaterial emissive={"white"} emissiveIntensity={0.9} color={"#ffffff"} />
      </mesh>

      <mesh ref={ringRef}>
        <torusGeometry args={[0.05, 0.008, 12, 40]} />
        <meshStandardMaterial emissive={"#10b981"} emissiveIntensity={1.2} color={"#10b981"} />
      </mesh>
    </>
  );
}

/* ======================================================================================
   ✅ Injury Highlighter (deutlichere Verletzungen)
   - markiert Bereich rot + Glow + Puls
   - Restkörper leicht transparent/abgedimmt (optional)
====================================================================================== */
const INJURY_NAME_HINTS = {
  knee: ["knee", "upleg", "leg", "thigh"],
  shin: ["shin", "leg", "calf"],
  achilles: ["achilles", "ankle", "foot", "toe", "heel"],
};

function normalizeArea(a) {
  const s = String(a || "").toLowerCase().trim();
  return ["knee", "shin", "achilles"].includes(s) ? s : null;
}

function InjuryHighlighter({
  sceneRoot,
  area,
  enabled = false,
  color = "#ef4444",
  emissive = "#7f1d1d",
  baseEmissiveIntensity = 0.55,
  pulse = true,
  dimOthers = false,
  othersOpacity = 1,
}) {

  const injuredMeshesRef = useRef([]);
  const originalsRef = useRef(new Map()); // mesh.uuid -> { material, opacity, transparent }

  const resolved = useMemo(() => normalizeArea(area), [area]);

  // Apply once whenever scene/area/enabled changes
  useEffect(() => {
    // Cleanup restore
    const restoreAll = () => {
      originalsRef.current.forEach((orig, uuid) => {
        // We stored originals, but we need object reference: store on mesh.userData too
      });

      if (!sceneRoot) return;
      sceneRoot.traverse((o) => {
        if (!o?.isMesh) return;
        const orig = o.userData?._inj_orig;
        if (!orig) return;

        // restore
        o.material = orig.material;
        if (o.material) {
          o.material.transparent = orig.transparent;
          o.material.opacity = orig.opacity;
        }
        delete o.userData._inj_orig;
      });

      injuredMeshesRef.current = [];
      originalsRef.current.clear();
    };

    if (!sceneRoot || !enabled || !resolved) {
      restoreAll();
      return;
    }

    // restore first, then re-apply for this area
    restoreAll();

    const hints = INJURY_NAME_HINTS[resolved] || [];
    const loweredHints = hints.map((h) => h.toLowerCase());

    const isInjuryMesh = (mesh) => {
      const name = String(mesh?.name || "").toLowerCase();
      if (!name) return false;
      // match any hint
      return loweredHints.some((h) => name.includes(h));
    };

    const newInjured = [];

    sceneRoot.traverse((o) => {
      if (!o?.isMesh) return;

      // store original
      if (!o.userData._inj_orig) {
        o.userData._inj_orig = {
          material: o.material,
          opacity: o.material?.opacity ?? 1,
          transparent: o.material?.transparent ?? false,
        };
      }

      const hit = isInjuryMesh(o);

      // clone material so we don't mutate shared ones
      const cloned = o.material?.clone ? o.material.clone() : o.material;
      if (cloned) {
        // Make sure it can glow
        cloned.emissive = cloned.emissive ?? new THREE.Color("#000000");
        cloned.color = cloned.color ?? new THREE.Color("#ffffff");

        if (hit) {
          cloned.color.set(color);
          cloned.emissive.set(emissive);
          cloned.emissiveIntensity = baseEmissiveIntensity;
          cloned.transparent = false;
          cloned.opacity = 1;
          newInjured.push({ mesh: o, mat: cloned });
        } else if (dimOthers) {
          cloned.transparent = false;
          cloned.opacity = 1;
          // reduce emissive if any
          if (cloned.emissive) {
            cloned.emissiveIntensity = Math.min(cloned.emissiveIntensity ?? 0, 0.15);
          }
        }
      }

      o.material = cloned;
    });

    injuredMeshesRef.current = newInjured;

    return () => {
      restoreAll();
    };
  }, [sceneRoot, enabled, resolved, color, emissive, baseEmissiveIntensity, pulse, dimOthers, othersOpacity]);

  // Pulse animation
  useFrame(({ clock }) => {
    if (!enabled || !pulse) return;
    const t = clock.getElapsedTime();
    const intensity = baseEmissiveIntensity + (Math.sin(t * 4.2) * 0.35 + 0.35); // ~0.55..1.25

    for (const it of injuredMeshesRef.current) {
      if (!it?.mat) continue;
      it.mat.emissiveIntensity = intensity;
    }
  });

  return null;
}

/* ======================================================================================
   BACKGROUND: DEINE DATEIEN
====================================================================================== */
const BG_ORDER = ["forest", "nature", "neutral"];

const BG = {
  forest: { type: "image", src: forestImg, label: "Wald (Bild)" },
  nature: { type: "video", src: natureVideo, label: "Nature (Video)" },
  neutral: {
    type: "solid",
    label: "Neutral",
    style: {
      background:
        "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.92), transparent 62%)," +
        "linear-gradient(180deg, #f8fafc 0%, #e5e7eb 55%, #d1d5db 100%)",
    },
  },
};

function BackgroundLayer({ background = "forest" }) {
  const cfg = BG[background] || BG.forest;

  const commonStyle = {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 24,
    transform: "scale(1.02)",
    filter: "saturate(1.05) contrast(1.05)",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        borderRadius: 24,
        background: "#0b1220",
      }}
    >
      {cfg.type === "solid" ? (
        <div
          style={{
            ...commonStyle,
            ...cfg.style,
            filter: "none",
            transform: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                background === "neutral"
                  ? "radial-gradient(circle at center, transparent 55%, rgba(15,23,42,0.18))"
                  : "radial-gradient(circle at 40% 35%, rgba(0,0,0,0.10), rgba(0,0,0,0.45))",
            }}
          />
        </div>
      ) : cfg.type === "video" ? (
        <video key={cfg.src} src={cfg.src} style={commonStyle} autoPlay muted loop playsInline />
      ) : (
        <img key={cfg.src} src={cfg.src} alt="" style={commonStyle} />
      )}

      {cfg.type !== "solid" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 40% 35%, rgba(0,0,0,0.10), rgba(0,0,0,0.45))",
          }}
        />
      )}
    </div>
  );
}

/* ======================================================================================
   PUBLIC COMPONENT: RunnerHero (3D Stage)
====================================================================================== */
function RunnerHero({
  gender = null,
  selectedMode = "easy_run",

  highlightArea = null,
  followArea = null,

  hotspots = [],
  focusTarget = null,

  paused = false,
  timeScale = 1,
  stepSignal = 0,

  showControls = false,
  interactive = true,

  camera = null,
  cameraView = null,
  cameraPadding = 1.0,

  background = null,

  debug = false,
  onModelLoaded = null,
  logSceneNames = false,

  className = "",
  style,

  onTargetScreenPos = null,
  targetMode = null,
  targetNameCandidates = null,
  targetOffset = [0, 0, 0],

  showMarker = undefined,
  showJointMarker = true,

  // ✅ NEW: Injury emphasis settings (optional)
  emphasizeInjuries = true,
  injuryPulse = true,
  injuryDimOthers = true,
  injuryOthersOpacity = 1,
  injuryColor = "#ef4444",
  injuryEmissive = "#7f1d1d",
  injuryBaseEmissiveIntensity = 0.55,
}) {
  const jointMarkerEnabled = typeof showMarker === "boolean" ? showMarker : showJointMarker;

  const [profileGender, setProfileGender] = useState(() => getStoredGender());

  useEffect(() => {
    const onProfileUpdate = () => setProfileGender(getStoredGender());
    const onStorage = (e) => {
      if (e?.key === PROFILE_STORAGE_KEY) setProfileGender(getStoredGender());
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const effectiveGender = gender ? normalizeGender(gender) : normalizeGender(profileGender);

  const modeKey = resolveMode(selectedMode);

  const file = GLB?.[modeKey]?.[effectiveGender] || GLB.easy_run[effectiveGender];
  const url = useMemo(() => modelUrl(file), [file]);

  const controlsRef = useRef(null);
  const effectiveHighlight = highlightArea ?? followArea ?? null;

  const [loadedUrl, setLoadedUrl] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);

  const [autoFocusTarget, setAutoFocusTarget] = useState(null);

  const [activeBg, setActiveBg] = useState(background || "forest");

  useEffect(() => {
    if (background) setActiveBg(background);
  }, [background]);

  useEffect(() => {
    if (background) return;
    const id = setInterval(() => {
      setActiveBg((cur) => {
        const idx = BG_ORDER.indexOf(cur);
        const next = BG_ORDER[(idx + 1 + BG_ORDER.length) % BG_ORDER.length];
        return next;
      });
    }, 10000);
    return () => clearInterval(id);
  }, [background]);

  useEffect(() => {
    useGLTF.preload(url);
  }, [url]);

  const targetTimeScale = useMemo(() => {
    if (modeKey === "injury") return Math.min(timeScale, 0.18); // ✅ injury etwas langsamer
    if (IS_RUN_MODE(modeKey)) return FIXED_RUN_TEMPOS[modeKey];
    return timeScale;
  }, [modeKey, timeScale]);

  const [smoothTimeScale, setSmoothTimeScale] = useState(targetTimeScale);

  useEffect(() => {
    if (paused) {
      setSmoothTimeScale(0);
      return;
    }

    let raf = 0;
    const speed = 0.12;

    const tick = () => {
      setSmoothTimeScale((cur) => {
        const next = cur + (targetTimeScale - cur) * speed;
        if (Math.abs(next - targetTimeScale) < 0.001) return targetTimeScale;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetTimeScale, paused]);

  // ✅ injury: etwas dunkleres Licht => mehr Kontrast
  const envPreset = activeBg === "forest" ? "forest" : activeBg === "neutral" ? "studio" : "city";

  const isInjury = modeKey === "injury";

  const ambientIntensity = isInjury ? 0.45 : activeBg === "forest" ? 0.75 : activeBg === "neutral" ? 1.05 : 1.0;
  const dirIntensity = isInjury ? 1.25 : activeBg === "forest" ? 1.6 : activeBg === "neutral" ? 2.2 : 2.0;

  const resolvedTargetMode = useMemo(() => {
    let t = String(targetMode || effectiveHighlight || selectedMode || "").toLowerCase();

    if (t === "mid") t = "midfoot";
    if (t === "fore") t = "forefoot";

    if (["knee", "shin", "achilles", "heel", "midfoot", "forefoot"].includes(t)) return t;
    return null;
  }, [targetMode, effectiveHighlight, selectedMode]);

  useEffect(() => {
    if (!sceneRoot || !resolvedTargetMode) {
      setAutoFocusTarget(null);
      return;
    }

    const candidates =
      (targetNameCandidates?.[resolvedTargetMode]?.length
        ? targetNameCandidates[resolvedTargetMode]
        : DEFAULT_TARGET_NAMES[resolvedTargetMode]) ?? DEFAULT_TARGET_NAMES.knee;

    const obj = findFirstByNames(sceneRoot, candidates);
    if (!obj) {
      setAutoFocusTarget(null);
      return;
    }

    const v = new THREE.Vector3();
    obj.getWorldPosition(v);
    v.add(new THREE.Vector3(targetOffset[0] || 0, targetOffset[1] || 0, targetOffset[2] || 0));
    setAutoFocusTarget([v.x, v.y, v.z]);
  }, [sceneRoot, resolvedTargetMode, targetNameCandidates, targetOffset]);

  const cameraCfg = useMemo(() => {
    const ft = autoFocusTarget ?? focusTarget ?? null;
    return getCamera(selectedMode, effectiveHighlight, ft, camera, cameraView, cameraPadding);
  }, [selectedMode, effectiveHighlight, autoFocusTarget, focusTarget, camera, cameraView, cameraPadding]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        pointerEvents: "auto",
        borderRadius: 24,
        overflow: "hidden",
        ...style,
      }}
    >
      <BackgroundLayer background={activeBg} />

      {debug && (
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            zIndex: 20,
            padding: "6px 8px",
            fontSize: 12,
            borderRadius: 10,
            background: "rgba(0,0,0,0.65)",
            color: "white",
            pointerEvents: "none",
          }}
        >
          loaded: {loadedUrl || "…"}
          <br />
          gender: {effectiveGender}
          <br />
          mode: {selectedMode} → {modeKey}
          <br />
          area: {String(effectiveHighlight || "-")}
          <br />
          bg: {activeBg}
          <br />
          paused: {paused ? "true" : "false"}
          <br />
          timeScale: {smoothTimeScale.toFixed(3)}
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          camera={{
            position: cameraCfg.position.toArray(),
            fov: cameraCfg.fov ?? 45,
            near: 0.1,
            far: 200,
          }}
          onCreated={({ camera }) => {
            camera.lookAt(cameraCfg.target);
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={ambientIntensity} />
            <directionalLight position={[3, 4, 2]} intensity={dirIntensity} />
            <Environment preset={envPreset} />

            <RunnerModel
              key={url}
              url={url}
              paused={paused}
              timeScale={smoothTimeScale}
              stepSignal={stepSignal}
              logSceneNames={logSceneNames}
              onSceneReady={({ scene }) => setSceneRoot(scene)}
              onLoaded={(u) => {
                setLoadedUrl(u);
                onModelLoaded?.(u);
              }}
            />

            {/* ✅ Verletzungs-Visualisierung (rot+glow+puls+dim) */}
            <InjuryHighlighter
              sceneRoot={sceneRoot}
              area={effectiveHighlight}
              enabled={isInjury && emphasizeInjuries}
              pulse={injuryPulse}
              dimOthers={injuryDimOthers}
              othersOpacity={injuryOthersOpacity}
              color={injuryColor}
              emissive={injuryEmissive}
              baseEmissiveIntensity={injuryBaseEmissiveIntensity}
            />

            {resolvedTargetMode && jointMarkerEnabled ? (
              <JointMarker
                sceneRoot={sceneRoot}
                mode={resolvedTargetMode}
                targetNameCandidates={targetNameCandidates}
                targetOffset={targetOffset}
                visible={true}
              />
            ) : null}

            {resolvedTargetMode && onTargetScreenPos ? (
              <TargetProjector
                sceneRoot={sceneRoot}
                targetMode={resolvedTargetMode}
                onTargetScreenPos={onTargetScreenPos}
                targetNameCandidates={targetNameCandidates}
                targetOffset={targetOffset}
              />
            ) : null}

            {hotspots?.length ? <Hotspots items={hotspots} /> : null}

            {(showControls || interactive) && (
              <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableRotate={showControls ? true : interactive}
                enableZoom={showControls ? true : interactive}
                target={cameraCfg.target.toArray()}
                maxPolarAngle={Math.PI * 0.48}
                minPolarAngle={Math.PI * 0.25}
              />
            )}

            <CameraRig
              controlsRef={controlsRef}
              selectedMode={selectedMode}
              highlightArea={effectiveHighlight}
              focusTarget={autoFocusTarget ?? focusTarget}
              cameraProp={camera}
              cameraView={cameraView}
              cameraPadding={cameraPadding}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

/* ======================================================================================
   ✅ DEMO mit 3 Hintergründen
====================================================================================== */
export default function RunnerExperience() {
  const [bg, setBg] = useState("forest");
  const [userPicked, setUserPicked] = useState(false);

  useEffect(() => {
    if (userPicked) return;
    const id = setInterval(() => {
      setBg((cur) => {
        const idx = BG_ORDER.indexOf(cur);
        return BG_ORDER[(idx + 1 + BG_ORDER.length) % BG_ORDER.length];
      });
    }, 10000);
    return () => clearInterval(id);
  }, [userPicked]);

  const pick = (k) => {
    setUserPicked(true);
    setBg(k);
  };

  const pill = (active) => ({
    padding: "10px 18px",
    borderRadius: 999,
    border: active ? "1px solid #0b1e32" : "1px solid rgba(15,23,42,0.15)",
    background: active ? "#0b1e32" : "rgba(255,255,255,0.88)",
    color: active ? "#ffffff" : "#0f172a",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
    backdropFilter: "blur(12px)",
    boxShadow: active ? "0 12px 26px rgba(15,23,42,0.25)" : "0 12px 26px rgba(15,23,42,0.14)",
    transition: "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  });

  return (
    <div style={{ width: "100%", height: 520, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          zIndex: 50,
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 12px 30px rgba(15,23,42,0.22)",
        }}
      >
        <button
          style={pill(bg === "forest")}
          onClick={() => pick("forest")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          🌲 Wald
        </button>
        <button
          style={pill(bg === "nature")}
          onClick={() => pick("nature")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          🎥 Natur
        </button>
        <button
          style={pill(bg === "neutral")}
          onClick={() => pick("neutral")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          ⚪ Neutral
        </button>
      </div>

      <div style={{ width: "100%", height: "100%" }}>
        <RunnerHero showControls={true} interactive={true} selectedMode={"easy_run"} background={bg} cameraPadding={1.0} />
      </div>
    </div>
  );
}

export { RunnerHero };
