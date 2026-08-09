import { useEffect, useMemo, useRef } from "react";

/**
 * Procedural Haikei-style layered-waves background (viewBox 0 0 900 300).
 * Peak/trough endpoints animate; Bézier handles stay relative to those points.
 *
 * Configure layers, colours, motion, and optional 180° orientation via props.
 */

export const WAVE_ANIM = {
  upperDurationMin: 1.5,
  upperDurationMax: 2.5,
  lowerDurationMin: 1.5,
  lowerDurationMax: 2.5,
  upperYAmp: 34,
  lowerYAmp: 28,
  upperXAmp: 14,
  lowerXAmp: 10,
};

const VIEW_W = 900;
const VIEW_H = 300;
const CLOSE_Y = 301;

const HOME_BG = "#213659";
const HOME_UPPER_FILL = "#3364c8";
const HOME_LOWER_FILL = "#457fec";

/** Upper ridge — home (multi-peak). */
export const HOME_UPPER_BASE = [
  { cmd: "M", x: 0, y: 198, lockX: true },
  { cmd: "L", x: 25, y: 181.2 },
  {
    cmd: "C",
    c1x: 50,
    c1y: 164.3,
    c2x: 100,
    c2y: 130.7,
    x: 150,
    y: 122.3,
  },
  {
    cmd: "C",
    c1x: 200,
    c1y: 114,
    c2x: 250,
    c2y: 131,
    x: 300,
    y: 160.2,
  },
  {
    cmd: "C",
    c1x: 350,
    c1y: 189.3,
    c2x: 400,
    c2y: 230.7,
    x: 450,
    y: 216.5,
  },
  {
    cmd: "C",
    c1x: 500,
    c1y: 202.3,
    c2x: 550,
    c2y: 132.7,
    x: 600,
    y: 135.5,
  },
  {
    cmd: "C",
    c1x: 650,
    c1y: 138.3,
    c2x: 700,
    c2y: 213.7,
    x: 750,
    y: 228.3,
  },
  {
    cmd: "C",
    c1x: 800,
    c1y: 243,
    c2x: 850,
    c2y: 197,
    x: 875,
    y: 174,
  },
  { cmd: "L", x: 900, y: 151, lockX: true },
];

/** Lower ridge — home. */
export const HOME_LOWER_BASE = [
  { cmd: "M", x: 0, y: 275, lockX: true },
  { cmd: "L", x: 25, y: 271.3 },
  {
    cmd: "C",
    c1x: 50,
    c1y: 267.7,
    c2x: 100,
    c2y: 260.3,
    x: 150,
    y: 243.2,
  },
  {
    cmd: "C",
    c1x: 200,
    c1y: 226,
    c2x: 250,
    c2y: 199,
    x: 300,
    y: 181,
  },
  {
    cmd: "C",
    c1x: 350,
    c1y: 163,
    c2x: 400,
    c2y: 154,
    x: 450,
    y: 165.5,
  },
  {
    cmd: "C",
    c1x: 500,
    c1y: 177,
    c2x: 550,
    c2y: 209,
    x: 600,
    y: 233,
  },
  {
    cmd: "C",
    c1x: 650,
    c1y: 257,
    c2x: 700,
    c2y: 273,
    x: 750,
    y: 266.7,
  },
  {
    cmd: "C",
    c1x: 800,
    c1y: 260.3,
    c2x: 850,
    c2y: 231.7,
    x: 875,
    y: 217.3,
  },
  { cmd: "L", x: 900, y: 203, lockX: true },
];

/**
 * Clubs foreground wave (pre-rotation local space).
 * One broad trough on the right; after a 180° centre rotation the dominant
 * crest faces left and fills the lower banner without edge gaps.
 */
export const CLUBS_WAVE_LOCAL = [
  { cmd: "M", x: 0, y: 118, lockX: true },
  { cmd: "L", x: 60, y: 122 },
  {
    cmd: "C",
    c1x: 180,
    c1y: 130,
    c2x: 320,
    c2y: 145,
    x: 460,
    y: 175,
  },
  {
    cmd: "C",
    c1x: 580,
    c1y: 200,
    c2x: 660,
    c2y: 255,
    x: 760,
    y: 262,
  },
  {
    cmd: "C",
    c1x: 820,
    c1y: 266,
    c2x: 860,
    c2y: 240,
    x: 885,
    y: 220,
  },
  { cmd: "L", x: 900, y: 210, lockX: true },
];

export const CLUBS_WAVE_ANIM = {
  durationMin: 3.2,
  durationMax: 4.8,
  yAmp: 16,
  xAmp: 8,
};

const BOTTOM_CLOSE =
  `L${VIEW_W} ${CLOSE_Y}L875 ${CLOSE_Y}` +
  `C850 ${CLOSE_Y} 800 ${CLOSE_Y} 750 ${CLOSE_Y}` +
  `C700 ${CLOSE_Y} 650 ${CLOSE_Y} 600 ${CLOSE_Y}` +
  `C550 ${CLOSE_Y} 500 ${CLOSE_Y} 450 ${CLOSE_Y}` +
  `C400 ${CLOSE_Y} 350 ${CLOSE_Y} 300 ${CLOSE_Y}` +
  `C250 ${CLOSE_Y} 200 ${CLOSE_Y} 150 ${CLOSE_Y}` +
  `C100 ${CLOSE_Y} 50 ${CLOSE_Y} 25 ${CLOSE_Y}` +
  `L0 ${CLOSE_Y}Z`;

function cloneRidge(base) {
  return base.map((seg) => ({ ...seg }));
}

function ridgeToPath(ridge) {
  let d = "";
  for (const seg of ridge) {
    if (seg.cmd === "M") {
      d += `M${seg.x} ${seg.y}`;
    } else if (seg.cmd === "L") {
      d += `L${seg.x} ${seg.y}`;
    } else if (seg.cmd === "C") {
      d += `C${seg.c1x} ${seg.c1y} ${seg.c2x} ${seg.c2y} ${seg.x} ${seg.y}`;
    }
  }
  return `${d}${BOTTOM_CLOSE}`;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function findPeakTroughIndices(ridge) {
  const points = ridge.map((seg, index) => ({
    index,
    y: seg.y,
    locked: Boolean(seg.lockX) || seg.cmd === "M",
  }));

  const movable = [];
  for (let i = 1; i < points.length - 1; i += 1) {
    if (points[i].locked) continue;
    const prev = points[i - 1].y;
    const curr = points[i].y;
    const next = points[i + 1].y;
    const isPeak = curr <= prev && curr <= next;
    const isTrough = curr >= prev && curr >= next;
    if (isPeak || isTrough) movable.push(points[i].index);
  }
  return movable;
}

function createAxis(
  base,
  amplitude,
  durationMin,
  durationMax,
  now0,
  phaseBias,
) {
  const duration = randBetween(durationMin, durationMax) * 1000;
  return {
    base,
    amplitude,
    current: base,
    from: base,
    target: base + randBetween(-amplitude, amplitude),
    start: now0 - randBetween(0, duration * 0.55) - phaseBias,
    duration,
  };
}

function advanceAxis(axis, now, durationMin, durationMax) {
  const elapsed = now - axis.start;
  if (elapsed >= axis.duration) {
    axis.current = axis.target;
    axis.from = axis.current;
    axis.target = axis.base + randBetween(-axis.amplitude, axis.amplitude);
    axis.start = now;
    axis.duration = randBetween(durationMin, durationMax) * 1000;
    return;
  }
  const t = elapsed / axis.duration;
  const ease = t * t * (3 - 2 * t);
  axis.current = axis.from + (axis.target - axis.from) * ease;
}

function createPeakRuntime(baseRidge, durationMin, durationMax, yAmp, xAmp) {
  const ridge = cloneRidge(baseRidge);
  const baseSnapshot = cloneRidge(baseRidge);
  const peakIndices = findPeakTroughIndices(baseRidge);
  const now0 = performance.now();

  const peaks = peakIndices.map((index, peakOrder) => {
    const base = baseRidge[index];
    const phaseBias = peakOrder * 120;
    return {
      index,
      x: createAxis(base.x, xAmp, durationMin, durationMax, now0, phaseBias),
      y: createAxis(
        base.y,
        yAmp,
        durationMin,
        durationMax,
        now0,
        phaseBias + 80,
      ),
    };
  });

  return {
    tick(now) {
      for (let i = 0; i < ridge.length; i += 1) {
        Object.assign(ridge[i], baseSnapshot[i]);
      }

      for (const peak of peaks) {
        advanceAxis(peak.x, now, durationMin, durationMax);
        advanceAxis(peak.y, now, durationMin, durationMax);

        const baseSeg = baseSnapshot[peak.index];
        const dx = peak.x.current - peak.x.base;
        const dy = peak.y.current - peak.y.base;
        const seg = ridge[peak.index];

        seg.x = peak.x.current;
        seg.y = peak.y.current;

        if (seg.cmd === "C") {
          seg.c2x = baseSeg.c2x + dx;
          seg.c2y = baseSeg.c2y + dy;
        }

        const next = ridge[peak.index + 1];
        const nextBase = baseSnapshot[peak.index + 1];
        if (next?.cmd === "C" && nextBase) {
          next.c1x = nextBase.c1x + dx * 0.65;
          next.c1y = nextBase.c1y + dy * 0.65;
        }

        const prev = ridge[peak.index - 1];
        const prevBase = baseSnapshot[peak.index - 1];
        if (
          prev?.cmd === "C" &&
          prevBase &&
          !peakIndices.includes(peak.index - 1)
        ) {
          prev.c2x = prevBase.c2x + dx * 0.35;
          prev.c2y = prevBase.c2y + dy * 0.35;
        }
      }

      let prevX = -Infinity;
      for (const seg of ridge) {
        if (seg.cmd === "M" || seg.cmd === "L") {
          if (!seg.lockX && seg.x < prevX + 2) seg.x = prevX + 2;
          prevX = seg.x;
        } else if (seg.cmd === "C") {
          if (seg.c1x < prevX - 4) seg.c1x = prevX - 4;
          if (seg.c2x < seg.c1x - 2) seg.c2x = seg.c1x - 2;
          if (seg.x < prevX + 2) seg.x = prevX + 2;
          prevX = seg.x;
        }
      }

      return ridgeToPath(ridge);
    },
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * @typedef {object} WaveLayerConfig
 * @property {Array} base
 * @property {string} fill
 * @property {number} [durationMin]
 * @property {number} [durationMax]
 * @property {number} [yAmp]
 * @property {number} [xAmp]
 */

/**
 * @param {object} props
 * @param {string} [props.backgroundColor]
 * @param {WaveLayerConfig[]} [props.layers]
 * @param {number} [props.rotation=0] Degrees around viewBox centre (SVG transform).
 * @param {string} [props.className]
 */
export function AnimatedLayeredWaves({
  backgroundColor = HOME_BG,
  layers,
  rotation = 0,
  className = "home-banner__waves",
}) {
  const resolvedLayers = useMemo(() => {
    if (layers?.length) return layers;
    return [
      {
        base: HOME_UPPER_BASE,
        fill: HOME_UPPER_FILL,
        durationMin: WAVE_ANIM.upperDurationMin,
        durationMax: WAVE_ANIM.upperDurationMax,
        yAmp: WAVE_ANIM.upperYAmp,
        xAmp: WAVE_ANIM.upperXAmp,
      },
      {
        base: HOME_LOWER_BASE,
        fill: HOME_LOWER_FILL,
        durationMin: WAVE_ANIM.lowerDurationMin,
        durationMax: WAVE_ANIM.lowerDurationMax,
        yAmp: WAVE_ANIM.lowerYAmp,
        xAmp: WAVE_ANIM.lowerXAmp,
      },
    ];
  }, [layers]);

  const svgRef = useRef(null);
  const pathRefs = useRef([]);

  const staticPaths = useMemo(
    () => resolvedLayers.map((layer) => ridgeToPath(layer.base)),
    [resolvedLayers],
  );

  useEffect(() => {
    const svg = svgRef.current;
    const pathEls = pathRefs.current.slice(0, resolvedLayers.length);
    if (!svg || pathEls.some((el) => !el)) return undefined;

    if (prefersReducedMotion()) {
      pathEls.forEach((el, index) => {
        el.setAttribute("d", staticPaths[index]);
      });
      return undefined;
    }

    const runtimes = resolvedLayers.map((layer) =>
      createPeakRuntime(
        layer.base,
        layer.durationMin ?? WAVE_ANIM.upperDurationMin,
        layer.durationMax ?? WAVE_ANIM.upperDurationMax,
        layer.yAmp ?? WAVE_ANIM.upperYAmp,
        layer.xAmp ?? WAVE_ANIM.upperXAmp,
      ),
    );

    let rafId = 0;
    let running = false;
    let inView = true;
    let tabVisible = document.visibilityState !== "hidden";

    function stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function frame(now) {
      if (!running) return;
      pathEls.forEach((el, index) => {
        el.setAttribute("d", runtimes[index].tick(now));
      });
      rafId = requestAnimationFrame(frame);
    }

    function syncPause() {
      const shouldRun = inView && tabVisible && !prefersReducedMotion();
      if (shouldRun && !running) {
        running = true;
        rafId = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        stop();
      }
    }

    syncPause();

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        syncPause();
      },
      { root: null, threshold: 0, rootMargin: "40px" },
    );
    observer.observe(svg);

    function onVisibility() {
      tabVisible = document.visibilityState !== "hidden";
      syncPause();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    function onMotionChange() {
      if (motionQuery.matches) {
        pathEls.forEach((el, index) => {
          el.setAttribute("d", staticPaths[index]);
        });
        stop();
      } else {
        syncPause();
      }
    }
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [resolvedLayers, staticPaths]);

  const waveGroupTransform =
    rotation !== 0
      ? `rotate(${rotation} ${VIEW_W / 2} ${VIEW_H / 2})`
      : undefined;

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill={backgroundColor} />
      <g transform={waveGroupTransform}>
        {resolvedLayers.map((layer, index) => (
          <path
            key={`wave-layer-${index}`}
            ref={(el) => {
              pathRefs.current[index] = el;
            }}
            d={staticPaths[index]}
            fill={layer.fill}
          />
        ))}
      </g>
    </svg>
  );
}

export const HOME_WAVE_LAYERS = [
  {
    base: HOME_UPPER_BASE,
    fill: HOME_UPPER_FILL,
    durationMin: WAVE_ANIM.upperDurationMin,
    durationMax: WAVE_ANIM.upperDurationMax,
    yAmp: WAVE_ANIM.upperYAmp,
    xAmp: WAVE_ANIM.upperXAmp,
  },
  {
    base: HOME_LOWER_BASE,
    fill: HOME_LOWER_FILL,
    durationMin: WAVE_ANIM.lowerDurationMin,
    durationMax: WAVE_ANIM.lowerDurationMax,
    yAmp: WAVE_ANIM.lowerYAmp,
    xAmp: WAVE_ANIM.lowerXAmp,
  },
];

export const CLUBS_WAVE_LAYERS = [
  {
    base: CLUBS_WAVE_LOCAL,
    fill: "#3364C8",
    durationMin: CLUBS_WAVE_ANIM.durationMin,
    durationMax: CLUBS_WAVE_ANIM.durationMax,
    yAmp: CLUBS_WAVE_ANIM.yAmp,
    xAmp: CLUBS_WAVE_ANIM.xAmp,
  },
];
