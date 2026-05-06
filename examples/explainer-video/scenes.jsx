// scenes.jsx — Six beats of the Ivy Invest endowment-style explainer.
// All timings in seconds. Total duration: 45s.

const IVY = {
  forestDeep: '#082519',
  forest: '#122B21',
  mint: '#9BD0BC',
  mintSoft: '#BCD8D3',
  green: '#229154',
  cream: '#EFE7D4',
  creamWarm: '#F2F2ED',
  white: '#FFFFFF',
  blue: '#649ADA',
  blueSteel: '#5484B5',
  blueSlate: '#3A607A',
  rust: '#F16838',
  clay: '#98502F',
  sage: '#729E8D',
  bark: '#624129',
};

const SERIF = "'Roboto Serif', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";

// Beat windows (seconds)
const B = {
  b1: [0, 5],
  b2: [5, 13],
  b3: [13, 18.5],
  b4: [18.5, 27.5],
  b5: [27.5, 35.5],
  b6: [35.5, 50],
};

// ── Word-stagger text ───────────────────────────────────────────────────────
function StaggerLine({
  text, x, y, width = 960,
  size = 48, color = IVY.white, font = SERIF, weight = 500,
  italic = false, align = 'center',
  startOffset = 0, wordStagger = 0.07, wordDur = 0.3,
  letterSpacing = '-0.01em', lineHeight = 1.15,
  accentWord = null, accentColor = IVY.mint, accentItalic = true,
  holdExit = true, exitDur = 0.35,
}) {
  const { localTime, duration } = useSprite();
  const exitStart = holdExit ? Math.max(0, duration - exitDur) : Infinity;
  const words = text.split(' ');

  let globalOpacity = 1;
  let globalTy = 0;
  if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    globalOpacity = 1 - t;
    globalTy = -t * 6;
  }
  const containerLeft = align === 'center' ? (x - width / 2) : x;

  return (
    <div style={{
      position: 'absolute', left: containerLeft, top: y, width,
      transform: `translateY(${globalTy}px)`, opacity: globalOpacity,
      fontFamily: font, fontSize: size, fontWeight: weight,
      fontStyle: italic ? 'italic' : 'normal',
      color, letterSpacing, lineHeight, textAlign: align,
      willChange: 'transform, opacity',
    }}>
      {words.map((w, i) => {
        const wStart = startOffset + i * wordStagger;
        const t = clamp((localTime - wStart) / wordDur, 0, 1);
        const eased = Easing.easeOutCubic(t);
        const isAccent = accentWord != null &&
          (Array.isArray(accentWord) ? accentWord.includes(i) : i === accentWord);
        return (
          <span key={i} style={{
            display: 'inline-block', opacity: eased,
            transform: `translateY(${(1 - eased) * 14}px)`,
            willChange: 'transform, opacity',
            color: isAccent ? accentColor : 'inherit',
            fontStyle: isAccent && accentItalic ? 'italic' : 'inherit',
            marginRight: i < words.length - 1 ? '0.28em' : 0,
          }}>{w}</span>
        );
      })}
    </div>
  );
}

// ── Animated pie ────────────────────────────────────────────────────────────
function AnimatedPie({
  cx, cy, radius, thickness = null, slices,
  startTime = 0, sliceStaggered = 0.12, sliceDur = 0.5,
  labelOffset = 0.1, labelDur = 0.4, showLabels = true,
  rotationOffset = -90, labelRadiusFactor = 1.22,
  uniformAngularSpeed = true,
}) {
  const { localTime } = useSprite();
  const t = localTime;

  let cumulativePct = 0;
  const arcs = slices.map((s) => {
    const startPct = cumulativePct;
    cumulativePct += s.pct;
    return { ...s, startPct, endPct: cumulativePct };
  });

  // Scale per-slice draw duration proportional to slice size, so angular
  // velocity (deg / sec) is uniform across wedges. Largest slice = sliceDur.
  const maxPct = Math.max(...slices.map(s => s.pct));
  const sliceDurs = arcs.map(s => uniformAngularSpeed
    ? sliceDur * (s.pct / maxPct)
    : sliceDur);
  // Cumulative slice start times. When uniformAngularSpeed is on, each slice
  // begins exactly when the previous one finishes drawing — producing a single
  // continuous unspool around the circle. Otherwise, fixed stagger.
  const sliceStarts = [];
  for (let i = 0; i < arcs.length; i++) {
    if (i === 0) {
      sliceStarts.push(0);
    } else if (uniformAngularSpeed) {
      sliceStarts.push(sliceStarts[i-1] + sliceDurs[i-1]);
    } else {
      sliceStarts.push(sliceStarts[i-1] + sliceStaggered);
    }
  }

  const circumference = 2 * Math.PI * radius;
  const thick = thickness || radius * 0.55;

  return (
    <g>
      {arcs.map((s, i) => {
        const sliceStart = startTime + sliceStarts[i];
        const p = clamp((t - sliceStart) / sliceDurs[i], 0, 1);
        // Linear within each wedge so wedge boundaries are invisible — the
        // entire pie reads as one continuous sweep at constant angular speed.
        const eased = uniformAngularSpeed ? p : Easing.easeInOutCubic(p);
        const currentPct = s.startPct + (s.endPct - s.startPct) * eased;
        const grownLen = (currentPct - s.startPct) * circumference;
        const startAngle = s.startPct * 360 + rotationOffset;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={s.color} strokeWidth={thick}
            strokeDasharray={`${grownLen} ${circumference}`}
            strokeDashoffset="0"
            transform={`rotate(${startAngle} ${cx} ${cy})`} />
        );
      })}
      {showLabels && arcs.map((s, i) => {
        const sliceStart = startTime + sliceStarts[i];
        const labelStart = sliceStart + sliceDurs[i] * 0.6 + labelOffset;
        const p = clamp((t - labelStart) / labelDur, 0, 1);
        if (p <= 0) return null;
        const eased = Easing.easeOutCubic(p);
        const midPct = (s.startPct + s.endPct) / 2;
        const angle = (midPct * 360 + rotationOffset) * Math.PI / 180;
        const lrFactor = s.labelRadiusFactor ?? labelRadiusFactor;
        const lr = radius + thick * 0.5 + 22;
        const lx = cx + Math.cos(angle) * lr * lrFactor / 1.22;
        const ly = cy + Math.sin(angle) * lr * lrFactor / 1.22;
        const innerR = radius + thick * 0.5 + 2;
        const ix = cx + Math.cos(angle) * innerR;
        const iy = cy + Math.sin(angle) * innerR;
        const rightSide = Math.cos(angle) >= 0;
        const anchor = rightSide ? 'start' : 'end';
        const tx = lx + (rightSide ? 6 : -6);
        return (
          <g key={'lbl' + i} opacity={eased}>
            <line x1={ix} y1={iy} x2={lx} y2={ly} stroke={IVY.mint} strokeWidth="1" opacity="0.55" />
            <text x={tx} y={ly - 2} textAnchor={anchor} dominantBaseline="middle"
              fontFamily={SANS} fontSize="22" fontWeight="600" fill={IVY.cream}
              letterSpacing="0.01em">{s.label}</text>
            <text x={tx} y={ly + 26} textAnchor={anchor} dominantBaseline="middle"
              fontFamily={SANS} fontSize="22" fontWeight="600" fill={IVY.mint} opacity="0.9">
              {Math.round(s.pct * 100)}%
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Shared endowment slice set
const ENDOW_SLICES = [
  { label: 'Public Equities',    pct: 0.41, color: IVY.mint },
  { label: 'Private Equity',     pct: 0.23, color: IVY.green },
  { label: 'Private Credit',     pct: 0.08, color: IVY.blueSlate },
  { label: 'Real Estate',        pct: 0.06, color: IVY.clay },
  { label: 'Infrastructure',     pct: 0.05, color: IVY.bark },
  { label: 'Hedge Funds',        pct: 0.03, color: IVY.blueSteel, labelRadiusFactor: 1.34 },
  { label: 'Special Situations', pct: 0.06, color: IVY.rust },
  { label: 'Fixed Income',       pct: 0.08, color: IVY.sage, labelRadiusFactor: 1.34 },
];

// ═══════════════════════════════════════════════════════════════════════════
// BEAT 1 — The familiar picture (0–5s)
// ═══════════════════════════════════════════════════════════════════════════
function Beat1() {
  return (
    <Sprite start={B.b1[0]} end={B.b1[1]}>
      {({ localTime }) => {
        const cx = 540, cy = 650, r = 150;
        const beatDur = B.b1[1] - B.b1[0];
        const exitOp = clamp((beatDur - localTime) / 0.4, 0, 1);
        const captionOp = clamp((localTime - 1.8) / 0.4, 0, 1) * exitOp;
        return (
          <div style={{ opacity: exitOp }}>
            <StaggerLine
              text="Most investors own stocks and bonds."
              x={540} y={270} width={900} size={46}
              color={IVY.white} font={SERIF} weight={400}
              startOffset={0.15} wordStagger={0.08} wordDur={0.3}
            />
            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>
              <AnimatedPie
                cx={cx} cy={cy} radius={r} thickness={r * 1.05}
                slices={[
                  { label: 'Stocks', pct: 0.70, color: IVY.mint },
                  { label: 'Bonds',  pct: 0.30, color: IVY.sage },
                ]}
                startTime={0.8} sliceStaggered={0.3} sliceDur={0.5}
                labelOffset={0.1} labelDur={0.35}
              />
            </svg>
            <div style={{
              position: 'absolute', left: 540, top: 930,
              transform: 'translateX(-50%)',
              fontFamily: SANS, fontSize: 22, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: IVY.mint, opacity: captionOp, whiteSpace: 'nowrap',
            }}>
              The 70/30 Portfolio
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAT 2 — The surprise (5–13s)
// ═══════════════════════════════════════════════════════════════════════════
function Beat2() {
  return (
    <Sprite start={B.b2[0]} end={B.b2[1]}>
      {({ localTime }) => {
        const duration = B.b2[1] - B.b2[0];

        // Pie migrates from center-stage to Beat 3 target position in last 0.9s
        const migrateStart = duration - 0.9;
        const migT = clamp((localTime - migrateStart) / 0.9, 0, 1);
        const migE = Easing.easeInOutCubic(migT);
        const cx = 540 + (270 - 540) * migE;
        const cy = 640 + (580 - 640) * migE;
        const r  = 150 + (130 - 150) * migE;

        // Text + caption fade out during migration
        const textOut = 1 - migE;

        const capOp = clamp((localTime - 3.2) / 0.4, 0, 1) * textOut;

        return (
          <>
            <div style={{ opacity: textOut }}>
              <StaggerLine
                text="But universities like Harvard and Yale"
                x={540} y={200} width={1000} size={44}
                color={IVY.white} font={SERIF} weight={400}
                startOffset={0.15} wordStagger={0.07} wordDur={0.3}
              />
              <StaggerLine
                text="invest very differently."
                x={540} y={260} width={1000} size={44}
                color={IVY.white} font={SERIF} weight={400}
                startOffset={0.55} wordStagger={0.07} wordDur={0.3}
                accentWord={2}
              />
            </div>
            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>
              <g opacity={1 - migE * 0.0}>
                <AnimatedPie
                  cx={cx} cy={cy} radius={r} thickness={r * 1.05}
                  slices={ENDOW_SLICES}
                  startTime={0.9} sliceStaggered={0.22} sliceDur={0.4}
                  labelOffset={0.05} labelDur={0.3}
                  showLabels={migE < 0.15}
                />
              </g>
            </svg>
            <div style={{
              position: 'absolute', left: 540, top: 990,
              transform: 'translateX(-50%)',
              fontFamily: SANS, fontSize: 22, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: IVY.mint, opacity: capOp, whiteSpace: 'nowrap',
            }}>
              Endowment Allocation — Illustrative
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAT 3 — Name the concept (13–21s)
// ═══════════════════════════════════════════════════════════════════════════
function Beat3() {
  return (
    <Sprite start={B.b3[0]} end={B.b3[1]}>
      {({ localTime }) => {
        const cx = 270, cy = 580, r = 130;

        const eyebrowOp = clamp((localTime - 0.1) / 0.35, 0, 1);
        const ruleOp = clamp((localTime - 0.05) / 0.3, 0, 1);
        const titleT = clamp((localTime - 0.3) / 0.5, 0, 1);
        const titleEased = Easing.easeOutCubic(titleT);
        const subT = clamp((localTime - 1.0) / 0.5, 0, 1);
        const subEased = Easing.easeOutCubic(subT);

        // Exit
        const exitStart = (B.b3[1]-B.b3[0]) - 0.4;
        const exitT = localTime > exitStart
          ? Easing.easeInCubic(clamp((localTime - exitStart)/0.4, 0, 1)) : 0;
        const exitOp = 1 - exitT;

        return (
          <div style={{ opacity: exitOp }}>
            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>
              <AnimatedPie
                cx={cx} cy={cy} radius={r} thickness={r * 1.05}
                slices={ENDOW_SLICES}
                startTime={-2} sliceStaggered={0} sliceDur={0.01}
                showLabels={false}
              />
            </svg>

            <div style={{
              position: 'absolute', left: 530, top: 398,
              width: 40, height: 2, background: IVY.mint, opacity: ruleOp,
            }}/>
            <div style={{
              position: 'absolute', left: 530, top: 410,
              fontFamily: SANS, fontSize: 26, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: IVY.mint, opacity: eyebrowOp,
            }}>
              this is
            </div>

            <div style={{
              position: 'absolute', left: 530, top: 460, width: 480,
              fontFamily: SERIF, fontSize: 68, fontWeight: 500,
              color: IVY.white, letterSpacing: '-0.015em', lineHeight: 1.08,
              opacity: titleEased,
              transform: `translateX(${(1 - titleEased) * 36}px)`,
              willChange: 'transform, opacity',
            }}>
              <span style={{ color: IVY.mint, fontStyle: 'italic' }}>endowment-style</span><br/>
              investing.
            </div>

            <div style={{
              position: 'absolute', left: 530, top: 690, width: 540,
              fontFamily: SANS, fontSize: 28, fontWeight: 400,
              color: IVY.cream, lineHeight: 1.4,
              opacity: subEased,
              transform: `translateY(${(1 - subEased) * 10}px)`,
            }}>
              A long-term approach that includes<br/>
              public and private markets.
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAT 4 — Scope of the opportunity (21–30s)
// Icon grid: 8 identical company glyphs. 1 cream outlined (Public),
// 7 mint filled (Private). Count does the work, not size.
// ═══════════════════════════════════════════════════════════════════════════
function Beat4() {
  return (
    <Sprite start={B.b4[0]} end={B.b4[1]}>
      {({ localTime }) => {
        // Grid: 8 icons in two rows of 4, or a single row of 8.
        // Single row of 8 reads best for the "7 to 1" ratio. Center vertically ~ y=580.
        const totalW = 820;
        const count = 8;
        const gap = totalW / (count - 1);
        const leftEdge = 540 - totalW / 2;
        const rowY = 540;

        // Glyph size
        const glyphW = 68;
        const glyphH = 96;

        // Timing: Public icon appears first (left-most), then 7 private icons
        // stagger in left-to-right.
        const pubAppear = 0.4;
        const pubT = clamp((localTime - pubAppear) / 0.5, 0, 1);
        const pubEased = Easing.easeOutCubic(pubT);

        const privStart = 1.1;
        const privStagger = 0.13;
        const privDur = 0.4;

        // Group labels appear after the icons they describe
        const pubLabelT = clamp((localTime - 0.8) / 0.4, 0, 1);
        const privLabelT = clamp((localTime - (privStart + 6 * privStagger + 0.2)) / 0.4, 0, 1);

        // Brackets: underline accents showing the 1 vs 7 grouping
        const pubBracketT = clamp((localTime - 0.7) / 0.4, 0, 1);
        const privBracketT = clamp((localTime - (privStart + 6 * privStagger + 0.1)) / 0.4, 0, 1);

        // Final stat
        const statOp = clamp((localTime - 3.6) / 0.5, 0, 1);

        // Exit
        const exitStart = (B.b4[1]-B.b4[0]) - 0.4;
        const exitOp = localTime > exitStart
          ? 1 - Easing.easeInCubic(clamp((localTime - exitStart)/0.4, 0, 1)) : 1;

        // Building glyph — simple office tower silhouette.
        // Rendered as a mint-filled or cream-outlined rect with window dots.
        const Building = ({ x, y, filled, opacity, scale }) => {
          const stroke = filled ? 'none' : IVY.cream;
          const fill = filled ? IVY.mint : 'none';
          const winColor = filled ? IVY.forestDeep : IVY.cream;
          const winOp = filled ? 0.55 : 0.7;
          return (
            <g opacity={opacity}
               transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}>
              {/* Body */}
              <rect x={x - glyphW/2} y={y - glyphH/2}
                width={glyphW} height={glyphH}
                fill={fill} stroke={stroke} strokeWidth="2"
                rx="2"/>
              {/* Windows — 3 cols × 4 rows */}
              {[0,1,2,3].map(row => [0,1,2].map(col => {
                const wx = x - glyphW/2 + 14 + col * 14;
                const wy = y - glyphH/2 + 14 + row * 18;
                return (
                  <rect key={row*3+col}
                    x={wx} y={wy} width="7" height="10"
                    fill={winColor} opacity={winOp}/>
                );
              }))}
              {/* Roof cap line */}
              <rect x={x - glyphW/2 - 2} y={y - glyphH/2 - 4}
                width={glyphW + 4} height="3"
                fill={filled ? IVY.green : IVY.cream}
                opacity={filled ? 1 : 0.9}/>
            </g>
          );
        };

        return (
          <div style={{ opacity: exitOp }}>
            <StaggerLine
              text="Most of the economy is private."
              x={540} y={280} width={900} size={44}
              color={IVY.white} font={SERIF} weight={400}
              startOffset={0.1} wordStagger={0.07} wordDur={0.3}
              accentWord={5}
            />

            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>

              {/* Public icon (position 0) */}
              <Building
                x={leftEdge + 0 * gap} y={rowY}
                filled={false}
                opacity={pubEased}
                scale={0.5 + 0.5 * pubEased}
              />

              {/* 7 Private icons (positions 1..7) */}
              {[1,2,3,4,5,6,7].map(i => {
                const idx = i - 1; // 0..6
                const s = privStart + idx * privStagger;
                const t = clamp((localTime - s) / privDur, 0, 1);
                const eased = Easing.easeOutCubic(t);
                return (
                  <Building key={i}
                    x={leftEdge + i * gap} y={rowY}
                    filled={true}
                    opacity={eased}
                    scale={0.5 + 0.5 * eased}
                  />
                );
              })}

              {/* Bracket under Public (left) */}
              <g opacity={pubBracketT}>
                <line
                  x1={leftEdge + 0 * gap - glyphW/2 - 6}
                  y1={rowY + glyphH/2 + 24}
                  x2={leftEdge + 0 * gap + glyphW/2 + 6}
                  y2={rowY + glyphH/2 + 24}
                  stroke={IVY.cream} strokeWidth="1.5" opacity="0.7"/>
                <line
                  x1={leftEdge + 0 * gap - glyphW/2 - 6}
                  y1={rowY + glyphH/2 + 24}
                  x2={leftEdge + 0 * gap - glyphW/2 - 6}
                  y2={rowY + glyphH/2 + 18}
                  stroke={IVY.cream} strokeWidth="1.5" opacity="0.7"/>
                <line
                  x1={leftEdge + 0 * gap + glyphW/2 + 6}
                  y1={rowY + glyphH/2 + 24}
                  x2={leftEdge + 0 * gap + glyphW/2 + 6}
                  y2={rowY + glyphH/2 + 18}
                  stroke={IVY.cream} strokeWidth="1.5" opacity="0.7"/>
              </g>

              {/* Bracket under 7 Private */}
              <g opacity={privBracketT}>
                {(() => {
                  const x1 = leftEdge + 1 * gap - glyphW/2 - 6;
                  const x2 = leftEdge + 7 * gap + glyphW/2 + 6;
                  const yB = rowY + glyphH/2 + 24;
                  return (
                    <>
                      <line x1={x1} y1={yB} x2={x2} y2={yB}
                        stroke={IVY.mint} strokeWidth="1.5"/>
                      <line x1={x1} y1={yB} x2={x1} y2={yB - 6}
                        stroke={IVY.mint} strokeWidth="1.5"/>
                      <line x1={x2} y1={yB} x2={x2} y2={yB - 6}
                        stroke={IVY.mint} strokeWidth="1.5"/>
                    </>
                  );
                })()}
              </g>

              {/* Public label */}
              <g opacity={pubLabelT}>
                <text x={leftEdge + 0 * gap} y={rowY + glyphH/2 + 110}
                  textAnchor="middle"
                  fontFamily={SANS} fontSize="56" fontWeight="600"
                  fill={IVY.cream}
                  letterSpacing="-0.02em">
                  1
                </text>
                <text x={leftEdge + 0 * gap} y={rowY + glyphH/2 + 156}
                  textAnchor="middle"
                  fontFamily={SANS} fontSize="22" fontWeight="700"
                  fill={IVY.cream} opacity="0.85"
                  letterSpacing="0.12em">
                  PUBLIC
                </text>
              </g>

              {/* Private label (centered under bracket) */}
              <g opacity={privLabelT}>
                <text
                  x={leftEdge + 4 * gap}
                  y={rowY + glyphH/2 + 110}
                  textAnchor="middle"
                  fontFamily={SANS} fontSize="56" fontWeight="600"
                  fill={IVY.mint}
                  letterSpacing="-0.02em">
                  7
                </text>
                <text
                  x={leftEdge + 4 * gap}
                  y={rowY + glyphH/2 + 156}
                  textAnchor="middle"
                  fontFamily={SANS} fontSize="22" fontWeight="700"
                  fill={IVY.mint}
                  letterSpacing="0.12em">
                  PRIVATE
                </text>
              </g>
            </svg>

            {/* Supporting stat */}
            <div style={{
              position: 'absolute', left: 540, top: 870,
              transform: 'translateX(-50%)',
              width: 960, textAlign: 'center',
              fontFamily: SANS, fontSize: 34, fontWeight: 500,
              color: IVY.cream, lineHeight: 1.35,
              opacity: statOp, letterSpacing: '-0.005em',
            }}>
              Among U.S. companies with $100M+ revenue,<br/>
              <span style={{ color: IVY.mint, fontWeight: 700 }}>private outnumber public nearly 7 to 1.</span>
            </div>

            {/* Source disclosure */}
            <div style={{
              position: 'absolute', left: 540, top: 1000,
              transform: 'translateX(-50%)',
              width: 920, textAlign: 'center',
              fontFamily: SANS, fontSize: 12, fontWeight: 400,
              letterSpacing: '0.01em',
              color: IVY.cream, opacity: statOp * 0.7,
            }}>
              Source: S&amp;P Capital IQ
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// BEAT 5 — The gatekeeping (30–38s)
// ICEBERG: small tip above the waterline = what most investors can access.
// Large submerged mass = private markets, locked behind $1M minimums.
// ═══════════════════════════════════════════════════════════════════════════
function Beat5() {
  return (
    <Sprite start={B.b5[0]} end={B.b5[1]}>
      {({ localTime }) => {
        // Waterline at y=520. Tip extends above to ~458. Mass extends below to ~880.
        const waterY = 520;
        const cx = 540;

        // Iceberg path construction — tip + submerged body
        // Tip: jagged triangle above waterline
        const tipPath = `
          M ${cx - 72} ${waterY}
          L ${cx - 58} ${waterY - 28}
          L ${cx - 30} ${waterY - 42}
          L ${cx - 10} ${waterY - 62}
          L ${cx + 18} ${waterY - 54}
          L ${cx + 40} ${waterY - 36}
          L ${cx + 58} ${waterY - 20}
          L ${cx + 72} ${waterY}
          Z
        `;
        // Submerged: large irregular mass
        const massPath = `
          M ${cx - 72} ${waterY}
          L ${cx - 160} ${waterY + 40}
          L ${cx - 210} ${waterY + 120}
          L ${cx - 230} ${waterY + 220}
          L ${cx - 200} ${waterY + 310}
          L ${cx - 130} ${waterY + 350}
          L ${cx - 40} ${waterY + 368}
          L ${cx + 60} ${waterY + 360}
          L ${cx + 160} ${waterY + 330}
          L ${cx + 220} ${waterY + 260}
          L ${cx + 240} ${waterY + 160}
          L ${cx + 200} ${waterY + 70}
          L ${cx + 100} ${waterY + 30}
          L ${cx + 72} ${waterY}
          Z
        `;

        // Timing
        const riseT = clamp((localTime - 0.3) / 0.9, 0, 1);
        const riseEased = Easing.easeOutCubic(riseT);
        // Iceberg "rises" into frame from below
        const bergY = (1 - riseEased) * 80;
        const bergOp = riseEased;

        // Waterline draws in
        const waterT = clamp((localTime - 0.1) / 0.6, 0, 1);
        const waterEased = Easing.easeOutCubic(waterT);

        // "Public" label above
        const pubLabelT = clamp((localTime - 1.4) / 0.5, 0, 1);

        // "Private" label below
        const privLabelT = clamp((localTime - 2.0) / 0.5, 0, 1);

        // Lock appears over submerged mass
        const lockT = clamp((localTime - 2.7) / 0.5, 0, 1);
        const lockEased = Easing.easeOutCubic(lockT);

        // Out-of-reach footer label
        const oorT = clamp((localTime - 3.4) / 0.5, 0, 1);

        // Exit
        const exitStart = (B.b5[1]-B.b5[0]) - 0.4;
        const exitOp = localTime > exitStart
          ? 1 - Easing.easeInCubic(clamp((localTime - exitStart)/0.4, 0, 1)) : 1;

        return (
          <div>
            <div style={{ opacity: exitOp }}>
              <StaggerLine
                text="But these investments have typically required high minimums — and the right connections."
                x={540} y={220} width={960} size={38}
                color={IVY.white} font={SERIF} weight={400}
                startOffset={0.1} wordStagger={0.055} wordDur={0.28}
                lineHeight={1.3}
                accentWord={[6, 12]}
              />
            </div>

            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>
              {/* Waterline — dashed, draws left to right */}
              <line
                x1={120} y1={waterY}
                x2={120 + (1080 - 240) * waterEased} y2={waterY}
                stroke={IVY.cream} strokeWidth="1.5"
                strokeDasharray="6 8"
                opacity="0.55"
              />

              <g opacity={bergOp} transform={`translate(0 ${bergY})`}>
                {/* Submerged mass — filled mint, translucent */}
                <path d={massPath}
                  fill={IVY.mint} fillOpacity="0.32"
                  stroke={IVY.mint} strokeWidth="2" strokeOpacity="0.9"
                  strokeLinejoin="round"/>

                {/* Tip — brighter cream-white */}
                <path d={tipPath}
                  fill={IVY.cream} fillOpacity="0.94"
                  stroke={IVY.white} strokeWidth="1.5"
                  strokeLinejoin="round"/>
              </g>

              {/* Public label above waterline */}
              <g opacity={pubLabelT * exitOp}>
                <line x1={cx + 80} y1={waterY - 42}
                      x2={cx + 130} y2={waterY - 42}
                      stroke={IVY.cream} strokeWidth="1" opacity="0.55"/>
                <text x={cx + 138} y={waterY - 46}
                  fontFamily={SANS} fontSize="26" fontWeight="700"
                  fill={IVY.cream} letterSpacing="0.01em">
                  Public markets
                </text>
                <text x={cx + 138} y={waterY - 18}
                  fontFamily={SANS} fontSize="22" fontWeight="500"
                  fill={IVY.cream} opacity="0.7">
                  what most investors own
                </text>
              </g>

              {/* Private label below waterline */}
              <g opacity={privLabelT * exitOp}>
                <line x1={cx + 240} y1={waterY + 190}
                      x2={cx + 290} y2={waterY + 190}
                      stroke={IVY.mint} strokeWidth="1" opacity="0.7"/>
                <text x={cx + 298} y={waterY + 186}
                  fontFamily={SANS} fontSize="26" fontWeight="700"
                  fill={IVY.mint} letterSpacing="0.01em">
                  Private markets
                </text>
                <text x={cx + 298} y={waterY + 214}
                  fontFamily={SANS} fontSize="22" fontWeight="500"
                  fill={IVY.mint} opacity="0.8">
                  below the surface
                </text>
              </g>

              {/* Waterline caption — left side */}
              <g opacity={waterEased * 0.7 * exitOp}>
                <text x={150} y={waterY - 12}
                  fontFamily={SANS} fontSize="17" fontWeight="700"
                  fill={IVY.cream} opacity="0.6"
                  letterSpacing="0.22em">
                  WATERLINE OF ACCESS
                </text>
              </g>

              {/* Lock icon on submerged mass */}
              <g opacity={lockEased}
                 transform={`translate(${cx} ${waterY + 200}) scale(${0.7 + 0.3 * lockEased})`}>
                <rect x="-28" y="-6" width="56" height="46" rx="6"
                  fill={IVY.forestDeep} stroke={IVY.rust} strokeWidth="3"/>
                <path d="M -18 -6 V -22 a 18 18 0 0 1 36 0 V -6"
                  fill="none" stroke={IVY.rust} strokeWidth="3.5"
                  strokeLinecap="round"/>
                <circle cx="0" cy="15" r="5" fill={IVY.rust}/>
                <rect x="-2" y="15" width="4" height="13" fill={IVY.rust}/>
              </g>
            </svg>

            {/* Footer label */}
            <div style={{
              position: 'absolute', left: 540, top: 1000,
              transform: 'translateX(-50%)',
              fontFamily: SANS, fontSize: 28, fontWeight: 700,
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: IVY.rust, opacity: oorT * exitOp, whiteSpace: 'nowrap',
            }}>
              Out of reach for most investors
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAT 6 — Bring it home (38–45s)
// Waterline rises — submerged iceberg emerges fully, then fades as Ivy mark
// + wordmark reveal, tagline, CTA.
// ═══════════════════════════════════════════════════════════════════════════
function Beat6() {
  return (
    <Sprite start={B.b6[0]} end={B.b6[1]}>
      {({ localTime }) => {
        const cx = 540;
        const waterY = 520;

        // Iceberg paths (match Beat 5)
        const tipPath = `
          M ${cx - 72} ${waterY}
          L ${cx - 58} ${waterY - 28}
          L ${cx - 30} ${waterY - 42}
          L ${cx - 10} ${waterY - 62}
          L ${cx + 18} ${waterY - 54}
          L ${cx + 40} ${waterY - 36}
          L ${cx + 58} ${waterY - 20}
          L ${cx + 72} ${waterY}
          Z
        `;
        const massPath = `
          M ${cx - 72} ${waterY}
          L ${cx - 160} ${waterY + 40}
          L ${cx - 210} ${waterY + 120}
          L ${cx - 230} ${waterY + 220}
          L ${cx - 200} ${waterY + 310}
          L ${cx - 130} ${waterY + 350}
          L ${cx - 40} ${waterY + 368}
          L ${cx + 60} ${waterY + 360}
          L ${cx + 160} ${waterY + 330}
          L ${cx + 220} ${waterY + 260}
          L ${cx + 240} ${waterY + 160}
          L ${cx + 200} ${waterY + 70}
          L ${cx + 100} ${waterY + 30}
          L ${cx + 72} ${waterY}
          Z
        `;

        // ACT 1: Brief hold, then lock unlocks (0.4 – 1.8s)
        const unlockT = clamp((localTime - 0.4) / 1.4, 0, 1);
        const unlockEased = Easing.easeOutCubic(unlockT);
        // shackle rises as it unlocks
        const shackleLift = unlockEased * 14;
        const shackleRot  = unlockEased * 18;
        // lock fades after unlocking
        const lockFadeT = clamp((localTime - 2.2) / 0.6, 0, 1);
        const lockOp = 1 - lockFadeT;

        // ACT 2: Waterline drops down (2.0 – 4.0s)
        const dropT = clamp((localTime - 2.0) / 2.0, 0, 1);
        const dropEased = Easing.easeInOutCubic(dropT);
        const waterDrop = dropEased * 460;

        // ACT 3: Iceberg brightens (2.8 – 4.6s)
        const brightenT = clamp((localTime - 2.8) / 1.8, 0, 1);
        const brightenEased = Easing.easeOutCubic(brightenT);
        const massFillOp = 0.34 + 0.56 * brightenEased;
        const glowOp = brightenEased;

        // Tagline: "Open to everyone." (3.4 – 7.5s, fade 7.0–7.5)
        const tagInT = clamp((localTime - 3.4) / 0.8, 0, 1);
        const tagOutT = clamp((localTime - 7.0) / 0.5, 0, 1);
        const tagOp = Easing.easeOutCubic(tagInT) * (1 - tagOutT);
        const tagY = (1 - Easing.easeOutCubic(tagInT)) * 14;

        // Iceberg fades out as logo fades in (7.4+)
        const bergFadeT = clamp((localTime - 7.4) / 0.7, 0, 1);
        const bergOp = 1 - bergFadeT;

        // Logo reveal
        const markT     = clamp((localTime - 8.0) / 0.7, 0, 1);
        const markEased = Easing.easeOutCubic(markT);
        const wordmarkT = clamp((localTime - 8.5) / 0.6, 0, 1);
        const wordmarkEased = Easing.easeOutCubic(wordmarkT);
        const headlineT = clamp((localTime - 9.2) / 0.6, 0, 1);
        const startingT = clamp((localTime - 9.9) / 0.5, 0, 1);
        const ctaT      = clamp((localTime - 10.6) / 0.5, 0, 1);
        const disclaimerT = clamp((localTime - 11.4) / 0.6, 0, 1);

        return (
          <>
            <svg width="1080" height="1080" viewBox="0 0 1080 1080"
              style={{ position: 'absolute', inset: 0 }}>

              {/* Iceberg group */}
              <g opacity={bergOp}>
                {/* Soft mint glow behind iceberg as it becomes accessible */}
                {glowOp > 0 && (
                  <g opacity={glowOp * 0.5}>
                    <path d={massPath}
                      fill={IVY.mint} fillOpacity="0.18"
                      stroke="none"
                      style={{ filter: 'blur(24px)' }}/>
                    <path d={tipPath}
                      fill={IVY.cream} fillOpacity="0.4"
                      stroke="none"
                      style={{ filter: 'blur(20px)' }}/>
                  </g>
                )}

                {/* Waterline — drops downward */}
                <line
                  x1={120} y1={waterY + waterDrop}
                  x2={960} y2={waterY + waterDrop}
                  stroke={IVY.cream} strokeWidth="1.5"
                  strokeDasharray="6 8"
                  opacity={0.55 * (1 - dropEased * 0.8)}
                />

                {/* Submerged mass — brightens as it becomes accessible */}
                <path d={massPath}
                  fill={IVY.mint} fillOpacity={massFillOp}
                  stroke={IVY.mint} strokeWidth={2 + brightenEased}
                  strokeOpacity={0.9 + 0.1 * brightenEased}
                  strokeLinejoin="round"/>

                {/* Tip */}
                <path d={tipPath}
                  fill={IVY.cream} fillOpacity="0.94"
                  stroke={IVY.white} strokeWidth="1.5"
                  strokeLinejoin="round"/>
              </g>

              {/* Lock — unlocks, then fades */}
              <g opacity={lockOp}
                 transform={`translate(${cx} ${waterY + 200})`}>
                {/* Body */}
                <rect x="-28" y="-6" width="56" height="46" rx="6"
                  fill={IVY.forestDeep} stroke={IVY.rust} strokeWidth="3"
                  transform={`translate(0 ${unlockEased * 2}) rotate(${unlockEased * 3})`}/>
                {/* Shackle — lifts + rotates open on unlock, rust → mint as it frees */}
                <g transform={`translate(${unlockEased * 6} ${-shackleLift}) rotate(${shackleRot} -18 -6)`}>
                  <path d="M -18 -6 V -22 a 18 18 0 0 1 36 0 V -6"
                    fill="none" stroke={IVY.rust} strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={1 - unlockEased}/>
                  <path d="M -18 -6 V -22 a 18 18 0 0 1 36 0 V -6"
                    fill="none" stroke={IVY.mint} strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={unlockEased}/>
                </g>
                {/* Keyhole */}
                <circle cx="0" cy="15" r="5" fill={IVY.rust}/>
                <rect x="-2" y="15" width="4" height="13" fill={IVY.rust}/>
              </g>
            </svg>

            {/* "Open to everyone." */}
            <div style={{
              position: 'absolute', left: 540, top: 320,
              transform: `translate(-50%, ${tagY}px)`,
              width: 960, textAlign: 'center',
              fontFamily: SERIF, fontSize: 66, fontWeight: 400,
              color: IVY.white, lineHeight: 1.1,
              opacity: tagOp, letterSpacing: '-0.02em',
            }}>
              Now, <span style={{ color: IVY.mint, fontStyle: 'italic' }}>open to everyone.</span>
            </div>

            {/* Ivy mark */}
            <div style={{
              position: 'absolute', left: 540, top: 270,
              transform: `translate(-50%, ${(1 - markEased) * 18}px)`,
              opacity: markEased, willChange: 'transform, opacity',
            }}>
              <img src={(window.__resources && window.__resources['assets/ivy-mark.svg']) || 'assets/ivy-mark.svg'} alt=""
                style={{ width: 200, height: 'auto', display: 'block' }}/>
            </div>

            {/* Wordmark */}
            <div style={{
              position: 'absolute', left: 540, top: 450,
              transform: `translate(-50%, ${(1 - wordmarkEased) * 12}px)`,
              opacity: wordmarkEased, willChange: 'transform, opacity',
              filter: 'brightness(0) invert(1)',
            }}>
              <img src={(window.__resources && window.__resources['assets/ivy-wordmark.svg']) || 'assets/ivy-wordmark.svg'} alt=""
                style={{ width: 360, height: 'auto', display: 'block' }}/>
            </div>

            {/* Tagline */}
            <div style={{
              position: 'absolute', left: 540, top: 600,
              transform: `translate(-50%, ${(1 - headlineT) * 8}px)`,
              width: 920, textAlign: 'center',
              fontFamily: SERIF, fontSize: 40, fontWeight: 400,
              color: IVY.white, lineHeight: 1.3,
              opacity: Easing.easeOutCubic(headlineT), letterSpacing: '-0.01em',
            }}>
              Bringing <span style={{ color: IVY.mint, fontStyle: 'italic' }}>endowment-style investing</span>
              <br/>
              to individual investors.
            </div>

            {/* Starting */}
            <div style={{
              position: 'absolute', left: 540, top: 780,
              transform: 'translateX(-50%)',
              fontFamily: SANS, fontSize: 24, fontWeight: 700,
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: IVY.mint, opacity: startingT, whiteSpace: 'nowrap',
            }}>
              Starting at $1,000
            </div>

            {/* CTA */}
            <div style={{
              position: 'absolute', left: 540, top: 880,
              transform: `translate(-50%, ${(1 - ctaT) * 8}px)`,
              fontFamily: SANS, fontSize: 28, fontWeight: 500,
              color: IVY.cream, opacity: ctaT, letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              Learn more at <span style={{
                color: IVY.white, fontWeight: 600,
                borderBottom: `1px solid ${IVY.mint}`, paddingBottom: 3,
              }}>ivyinvest.co</span>
            </div>

            {/* Compliance disclaimer */}
            <div style={{
              position: 'absolute', left: 540, top: 1000,
              transform: 'translate(-50%, 0)',
              width: 920, textAlign: 'center',
              fontFamily: SANS, fontSize: 12, fontWeight: 400,
              lineHeight: 1.45, letterSpacing: '0.01em',
              color: IVY.cream, opacity: disclaimerT * 0.7,
            }}>
              Before investing, carefully consider the Institutional Investment Strategy Fund&rsquo;s investment objective, risks, charges and expenses.<br/>The prospectus contains this and other information. Past performance does not guarantee future results.
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Background frame
// ═══════════════════════════════════════════════════════════════════════════
function BackgroundFrame() {
  return (
    <>
      <div style={{
        position: 'absolute', left: 64, top: 64, width: 64, height: 'auto',
      }}>
        <img src={(window.__resources && window.__resources['assets/ivy-mark.svg']) || 'assets/ivy-mark.svg'} alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}/>
      </div>
      <div style={{
        position: 'absolute', right: 64, top: 82,
        width: 150,
      }}>
        <img src={(window.__resources && window.__resources['assets/ivy-wordmark-mint.svg']) || 'assets/ivy-wordmark-mint.svg'} alt="Ivy Invest"
          style={{ width: '100%', height: 'auto', display: 'block' }}/>
      </div>
    </>
  );
}

function IvyExplainer() {
  return (
    <>
      <BackgroundFrame />
      <Beat1 />
      <Beat2 />
      <Beat3 />
      <Beat4 />
      <Beat5 />
      <Beat6 />
    </>
  );
}

Object.assign(window, {
  IvyExplainer, Beat1, Beat2, Beat3, Beat4, Beat5, Beat6,
  IVY, StaggerLine, AnimatedPie, ENDOW_SLICES,
});
