// League badges are painted PNGs (mobile/assets/badges/). Division pips
// (III = 1, I = 3) sit under the art on larger badges; compact map badges
// show only the league image so silhouettes stay readable.
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { LEAGUES, leagueOf } from "../core/rank.js";

const COMPACT_BELOW = 32;

const ART = {
  bronze: require("../../assets/badges/bronze.png"),
  silver: require("../../assets/badges/silver.png"),
  gold: require("../../assets/badges/gold.png"),
  diamond: require("../../assets/badges/diamond.png"),
  crystal: require("../../assets/badges/crystal.png"),
};

function Pips({ count, color, width }) {
  if (count <= 0) return null;
  const r = 3.2;
  const gap = 9;
  const cx = width / 2;
  return (
    <Svg width={width} height={10} style={styles.pips}>
      {Array.from({ length: count }, (_, i) => (
        <Circle
          key={i}
          cx={cx + (i - (count - 1) / 2) * gap}
          cy={5}
          r={r}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1.2}
        />
      ))}
    </Svg>
  );
}

export function RankBadge({ rank, size = 48 }) {
  const league = leagueOf(rank) ?? LEAGUES[0];
  const compact = size < COMPACT_BELOW;
  const pips = compact ? 0 : 4 - rank.division;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${rank.name} badge`}
      style={[styles.wrap, { width: size }]}
    >
      <Image
        source={ART[league.id] ?? ART.bronze}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Pips count={pips} color={league.metal} width={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  pips: { marginTop: -2 },
});
