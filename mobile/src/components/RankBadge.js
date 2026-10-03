// League badge: a wooden shield that gets greener with each league (grass,
// leaves, flowers, vines, crystals), the league's gem in the middle, and one to
// three pips for the division (III = 1 pip, I = 3). Small badges (leaderboard
// rows) drop the planks and pips and enlarge the gem so leagues stay tellable apart.
import Svg, { Circle, ClipPath, Defs, G, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { LEAGUES, leagueOf } from "../core/rank.js";

const SHIELD = "M10 12 Q32 4 54 12 L54 38 Q54 58 32 68 Q10 58 10 38 Z";
const WOOD = { light: "#b07a45", dark: "#7a4f27", grain: "#94622f" };
const GRASS = { light: "#7cc96b", dark: "#3f9d4a" };

function Grass() {
  return (
    <Path
      d="M14 60 L18 50 L21 58 L25 47 L28 57 L32 45 L36 57 L39 47 L43 58 L46 50 L50 60 Q32 72 14 60 Z"
      fill={GRASS.light}
      stroke={GRASS.dark}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  );
}

function Leaves() {
  return (
    <G fill={GRASS.light} stroke={GRASS.dark} strokeWidth={1.2}>
      <Path d="M10 16 Q0 12 2 4 Q10 6 12 14 Z" />
      <Path d="M54 16 Q64 12 62 4 Q54 6 52 14 Z" />
    </G>
  );
}

function Flowers() {
  return (
    <G>
      <Circle cx={19} cy={55} r={3.2} fill="#f48fb1" />
      <Circle cx={19} cy={55} r={1.3} fill="#ffd54f" />
      <Circle cx={45} cy={55} r={3.2} fill="#ffd54f" />
      <Circle cx={45} cy={55} r={1.3} fill="#ffffff" />
    </G>
  );
}

function Vines() {
  return (
    <G fill="none" stroke={GRASS.dark} strokeWidth={2} strokeLinecap="round">
      <Path d="M11 20 Q16 28 11 36 Q7 44 13 50" />
      <Path d="M53 20 Q48 28 53 36 Q57 44 51 50" />
    </G>
  );
}

function Crystals({ gem, metal }) {
  return (
    <G fill={gem} stroke={metal} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M14 12 L10 0 L18 9 Z" />
      <Path d="M50 12 L54 0 L46 9 Z" />
      <Path d="M28 7 L32 -2 L36 7 Z" />
    </G>
  );
}

const COMPACT_BELOW = 32;

export function RankBadge({ rank, size = 48 }) {
  const league = leagueOf(rank) ?? LEAGUES[0];
  const tier = LEAGUES.indexOf(league); // 0 = Bronze ... 4 = Crystal
  const compact = size < COMPACT_BELOW;
  const pips = compact ? 0 : 4 - rank.division;
  const gemScale = compact ? 1.45 : 1;
  return (
    <Svg width={size} height={size * 1.125} viewBox="-2 -4 68 76" accessibilityLabel={`${rank.name} badge`}>
      <Defs>
        <ClipPath id="shield">
          <Path d={SHIELD} />
        </ClipPath>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={league.gem} stopOpacity={0.7} />
          <Stop offset="1" stopColor={league.gem} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {tier >= 4 && <Circle cx={32} cy={36} r={36} fill="url(#glow)" />}
      {tier >= 1 && <Leaves />}
      {tier >= 4 && <Crystals gem={league.gem} metal={league.metal} />}

      <Path d={SHIELD} fill={WOOD.light} stroke={WOOD.dark} strokeWidth={3} strokeLinejoin="round" />
      <G clipPath="url(#shield)" opacity={compact ? 0 : 1}>
        {[22, 32, 42].map((x) => (
          <Rect key={x} x={x - 0.75} y={0} width={1.5} height={72} fill={WOOD.grain} />
        ))}
      </G>
      <Path d={SHIELD} fill="none" stroke={league.metal} strokeWidth={2.5} transform="translate(32 36) scale(0.84) translate(-32 -36)" />
      {tier >= 3 && <Vines />}

      {/* The league's gem, with a shine */}
      <G transform={`translate(32 32) scale(${gemScale}) translate(-32 -32)`}>
        <Path d="M32 20 L42 32 L32 44 L22 32 Z" fill={league.gem} stroke={league.metal} strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M32 23 L37 30 L32 30 Z" fill="#ffffff" opacity={0.7} />
      </G>

      <Grass />
      {tier >= 2 && <Flowers />}

      {Array.from({ length: pips }, (_, i) => (
        <Circle key={i} cx={32 + (i - (pips - 1) / 2) * 7} cy={52} r={2.4} fill={league.metal} stroke="#ffffff" strokeWidth={1} />
      ))}
    </Svg>
  );
}
