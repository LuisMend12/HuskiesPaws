// Rank badges: each league has its own silhouette so Bronze–Crystal stay
// readable at map-bar size (22px) as well as on the Ranks tab. Cel-shaded,
// bold outlines, forest-and-cream palette. Division pips (III = 1, I = 3)
// show on larger badges; compact ones drop pips and enlarge the emblem.
import { useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";
import { LEAGUES, leagueOf } from "../core/rank.js";
import { colors } from "../theme.js";

const INK = colors.navy;
const COMPACT_BELOW = 32;

function Shine({ cx, cy, rx, ry }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity={0.35} />;
}

function Pips({ count, cx, cy, fill }) {
  if (count <= 0) return null;
  return Array.from({ length: count }, (_, i) => (
    <Circle
      key={i}
      cx={cx + (i - (count - 1) / 2) * 8}
      cy={cy}
      r={2.5}
      fill={fill}
      stroke="#ffffff"
      strokeWidth={1.1}
    />
  ));
}

function Sprout({ x, y, leaf }) {
  return (
    <G>
      <Path d={`M${x} ${y + 10} V${y - 2}`} stroke={leaf} strokeWidth={2.4} strokeLinecap="round" />
      <Path d={`M${x} ${y} Q${x - 10} ${y - 6} ${x - 2} ${y - 12} Q${x - 1} ${y - 2} ${x} ${y} Z`} fill={leaf} stroke={INK} strokeWidth={1.2} />
      <Path d={`M${x} ${y} Q${x + 10} ${y - 6} ${x + 2} ${y - 12} Q${x + 1} ${y - 2} ${x} ${y} Z`} fill="#8fd18a" stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

function BronzeBody({ metal, gem, compact }) {
  return (
    <G>
      <Circle cx={32} cy={34} r={26} fill="#c47a3a" stroke="#7a4318" strokeWidth={3} />
      <Circle cx={32} cy={34} r={21} fill="#e0a05a" />
      <Circle cx={32} cy={34} r={21} fill="none" stroke={metal} strokeWidth={2.4} />
      <Shine cx={24} cy={26} rx={10} ry={6} />
      <Circle cx={32} cy={36} r={compact ? 11 : 9} fill={gem} stroke={INK} strokeWidth={1.6} />
      <Sprout x={32} y={38} leaf="#3f9d4a" />
    </G>
  );
}

function SilverBody({ metal, gem, compact }) {
  const shield = "M32 7 L54 18 L50 46 Q32 66 14 46 L10 18 Z";
  return (
    <G>
      <Path d={shield} fill="#c5d0db" stroke="#6d7b8a" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 12 L48 20 L45 44 Q32 58 19 44 L16 20 Z" fill={gem} stroke={metal} strokeWidth={2} strokeLinejoin="round" />
      <Shine cx={26} cy={24} rx={8} ry={5} />
      <Path
        d="M32 22 Q22 32 32 50 Q42 32 32 22 Z"
        fill="#7cc96b"
        stroke={INK}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M32 24 V46" stroke={INK} strokeWidth={1.2} />
      {compact ? null : <Path d="M18 20 Q32 28 46 20" fill="none" stroke={metal} strokeWidth={1.6} />}
    </G>
  );
}

function GoldBody({ metal, gem, compact }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      {petals.map((deg) => (
        <Ellipse
          key={deg}
          cx={32}
          cy={16}
          rx={8}
          ry={compact ? 13 : 12}
          fill="#f3c14a"
          stroke="#b07a12"
          strokeWidth={1.5}
          transform={`rotate(${deg} 32 34)`}
        />
      ))}
      <Circle cx={32} cy={34} r={14} fill={gem} stroke={metal} strokeWidth={2.4} />
      <Shine cx={27} cy={30} rx={6} ry={4} />
      <Circle cx={32} cy={34} r={5} fill="#ffffff" />
      <Circle cx={32} cy={34} r={2.6} fill={colors.coral} />
    </G>
  );
}

function DiamondBody({ metal, gem, compact }) {
  return (
    <G>
      <Path d="M32 4 L58 34 L32 68 L6 34 Z" fill="#4aa3e0" stroke="#1f6fa8" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 10 L50 34 L32 60 L14 34 Z" fill={gem} stroke={metal} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M32 10 L32 60 M14 34 H50 M32 10 L14 34 L32 60 L50 34 Z" fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.55} />
      <Shine cx={26} cy={26} rx={7} ry={5} />
      {compact ? null : (
        <Path d="M24 34 Q32 28 40 34 Q32 42 24 34 Z" fill="#ffffff" opacity={0.45} />
      )}
    </G>
  );
}

function CrystalBody({ metal, gem, glowId, compact }) {
  const hex = "M32 6 L52 18 L52 46 L32 62 L12 46 L12 18 Z";
  return (
    <G>
      <Circle cx={32} cy={34} r={34} fill={`url(#${glowId})`} />
      <Path d={hex} fill="#6a3cb0" stroke={metal} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 12 L46 21 L46 43 L32 54 L18 43 L18 21 Z" fill={gem} stroke="#ffffff" strokeWidth={1.4} strokeLinejoin="round" opacity={0.95} />
      <Path d="M32 12 V54 M18 21 L46 43 M46 21 L18 43" stroke="#ffffff" strokeWidth={1.1} opacity={0.45} />
      <Shine cx={24} cy={24} rx={8} ry={5} />
      <Path
        d="M32 22 L34.2 29 H41 L35.6 33.2 L37.6 40 L32 36 L26.4 40 L28.4 33.2 L23 29 H29.8 Z"
        fill={colors.gold}
        stroke={INK}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {compact ? null : (
        <G>
          <Path d="M12 18 L8 8 L16 14" fill={gem} stroke={metal} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M52 18 L56 8 L48 14" fill={gem} stroke={metal} strokeWidth={1.2} strokeLinejoin="round" />
        </G>
      )}
    </G>
  );
}

const BODIES = [BronzeBody, SilverBody, GoldBody, DiamondBody, CrystalBody];

export function RankBadge({ rank, size = 48 }) {
  const rawId = useId();
  const glowId = `rank-glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const league = leagueOf(rank) ?? LEAGUES[0];
  const tier = Math.max(0, LEAGUES.indexOf(league));
  const compact = size < COMPACT_BELOW;
  const pips = compact ? 0 : 4 - rank.division;
  const Body = BODIES[tier] ?? BronzeBody;

  return (
    <Svg width={size} height={size * 1.18} viewBox="0 0 64 78" accessibilityLabel={`${rank.name} badge`}>
      <Defs>
        <RadialGradient id={glowId} cx="50%" cy="45%" r="55%">
          <Stop offset="0" stopColor={league.gem} stopOpacity={0.75} />
          <Stop offset="1" stopColor={league.gem} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Body metal={league.metal} gem={league.gem} glowId={glowId} compact={compact} />
      <Pips count={pips} cx={32} cy={72} fill={league.metal} />
    </Svg>
  );
}
