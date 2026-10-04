// Pets drawn like Roblox simulator pets (matching the 3D pets): a chunky
// rounded-cube body with big glossy eyes. Ears, markings and tail come from the
// species (species.js), fur from the pet's color, an accessory from its class,
// and a rarity mark. A Grok Imagine portrait (pet.art) wins.
import { Image, StyleSheet } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from "react-native-svg";
import { hashString } from "../core/geo.js";
import { colorOf, rarityOf } from "../core/pets.js";
import { colors } from "../theme.js";
import { speciesOf } from "./species.js";

const INK = colors.navy;

function Eye({ cx }) {
  return (
    <G>
      <Ellipse cx={cx} cy={52} rx={8} ry={9} fill="#ffffff" />
      <Circle cx={cx} cy={53} r={6} fill={colors.ice} />
      <Circle cx={cx} cy={53} r={3.2} fill={INK} />
      <Circle cx={cx - 2.5} cy={50} r={2.2} fill="#ffffff" />
    </G>
  );
}

// Class accessories.
const ACCESSORIES = {
  Scout: () => (
    <G>
      <Path d="M50 30 Q49 22 52 15" stroke="#3f9d4a" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M52 16 Q62 8 68 14 Q60 22 52 16 Z" fill="#7cc96b" stroke="#3f9d4a" strokeWidth={1.5} />
    </G>
  ),
  Storyteller: () => (
    <G>
      <Rect x={22} y={72} width={56} height={8} rx={4} fill="#e53935" />
      <Path d="M64 78 L70 92 L62 90 Z" fill="#c62828" />
    </G>
  ),
  Pathfinder: () => (
    <G>
      <Ellipse cx={50} cy={29} rx={24} ry={4.5} fill="#c8a165" stroke="#8d6e3f" strokeWidth={1.5} />
      <Path d="M36 29 Q37 15 50 15 Q63 15 64 29 Z" fill="#d9b77e" stroke="#8d6e3f" strokeWidth={1.5} />
      <Rect x={37} y={23} width={26} height={4} fill="#8d6e3f" />
    </G>
  ),
  Guardian: () => (
    <G>
      <Path d="M76 62 L88 66 L87 77 Q84 85 76 88 Q68 85 65 77 L64 66 Z" fill="#9aa5b1" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M76 67 L76 83 M69 73 L83 73" stroke="#e8a317" strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),
};

function RarityChip({ mark, color }) {
  if (mark === "diamond") {
    return <Polygon points="88,8 96,16 88,24 80,16" fill={color} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
  }
  if (mark === "hex") {
    return <Polygon points="88,6 96,11 96,21 88,26 80,21 80,11" fill={color} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
  }
  if (mark === "star") {
    return <Path d="M88 6 L90 12 H96 L91 16 L93 22 L88 18 L83 22 L85 16 L80 12 H86 Z" fill={color} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />;
  }
  return <Circle cx={88} cy={16} r={7} fill={color} stroke={INK} strokeWidth={1.6} />;
}

function Sparkles({ color }) {
  const star = (x, y, s) => `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`;
  return (
    <G fill={color}>
      <Path d={star(12, 24, 5)} />
      <Path d={star(88, 40, 4)} />
      <Path d={star(84, 12, 3)} />
    </G>
  );
}

export function PetSvg({ pet, size = 96 }) {
  const fur = colorOf(pet).hex;
  const rarity = rarityOf(pet);
  const Accessory = ACCESSORIES[pet.petClass];
  const kind = speciesOf(pet);
  const glowing = rarity.id === "epic" || rarity.id === "legendary";
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`${pet.name}, a ${rarity.label} ${kind.label} ${pet.petClass}`}>
      <Ellipse cx={50} cy={93} rx={30} ry={5} fill={INK} opacity={0.12} />
      {glowing && <Circle cx={50} cy={56} r={44} fill={rarity.color} opacity={0.18} />}
      {rarity.id === "legendary" && <Ellipse cx={50} cy={12} rx={18} ry={5} fill="none" stroke={rarity.color} strokeWidth={3.5} />}

      {/* Tail and ears, behind the body */}
      {kind.Tail && <kind.Tail fur={fur} />}
      {kind.TailFill && <kind.TailFill fur={fur} />}
      <kind.Ears fur={fur} />

      {/* Feet */}
      <Rect x={28} y={80} width={16} height={11} rx={5} fill={fur} stroke={INK} strokeWidth={2} />
      <Rect x={56} y={80} width={16} height={11} rx={5} fill={fur} stroke={INK} strokeWidth={2} />

      {/* The rounded-cube body, lit from above */}
      <Rect x={16} y={28} width={68} height={58} rx={18} fill={fur} stroke={INK} strokeWidth={2.5} />
      <Rect x={20} y={31} width={60} height={14} rx={10} fill="#ffffff" opacity={0.28} />
      <Rect x={18} y={70} width={64} height={14} rx={12} fill={INK} opacity={0.08} />
      {rarity.id !== "common" && <Path d="M24 40 L32 36 L28 62 L22 64 Z" fill="#ffffff" opacity={0.35} />}

      {/* Species markings and face */}
      <kind.Mask />
      <Eye cx={39} />
      <Eye cx={61} />
      <Ellipse cx={30} cy={64} rx={4} ry={2.5} fill={colors.pink} opacity={0.7} />
      <Ellipse cx={70} cy={64} rx={4} ry={2.5} fill={colors.pink} opacity={0.7} />
      <Path d="M46 62 Q50 60 54 62 Q52 66 50 66 Q48 66 46 62 Z" fill={INK} />
      <Path d="M45 68 Q47.5 71 50 68 Q52.5 71 55 68" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {kind.Extra && <kind.Extra />}

      {Accessory && <Accessory />}
      {rarity.id !== "common" && <Sparkles color={rarity.id === "rare" ? "#ffffff" : rarity.color} />}
      <RarityChip mark={rarity.mark} color={rarity.color} />
      {pet.spaceBorn && (
        <G>
          <Ellipse cx={84} cy={78} rx={11} ry={3.5} fill="none" stroke={colors.ice} strokeWidth={2} />
          <Circle cx={84} cy={78} r={5} fill="#5b6ee1" />
        </G>
      )}
    </Svg>
  );
}

// The pet's Grok portrait when it has one, otherwise the drawn pup.
export function PetArt({ pet, size = 96 }) {
  if (pet.art) {
    return (
      <Image
        source={{ uri: pet.art }}
        style={[styles.portrait, { width: size, height: size, borderRadius: size * 0.2 }]}
        accessibilityLabel={`${pet.name}, drawn by Grok Imagine`}
      />
    );
  }
  return <PetSvg pet={pet} size={size} />;
}

// Shell and spot colors per egg tier (core/pets.js EGG_TIERS): meadow, forest, crystal.
const EGG_LOOKS = {
  short: { shell: "#fff6e0", spots: ["#7cc96b", colors.yellow, "#a5d6a7", colors.pink], label: "Meadow egg" },
  medium: { shell: "#d7f0c8", spots: ["#3f9d4a", colors.gold, "#8d6e3f", "#fff6e0"], label: "Forest egg" },
  long: { shell: "#efe4ff", spots: ["#9b59d0", "#d6b4ff", colors.ice, "#ffffff"], label: "Crystal egg" },
};
const DEFAULT_LOOK = EGG_LOOKS.short;

function EggShell({ tier, shell }) {
  if (tier === "medium") {
    return (
      <G>
        <Path d="M50 6 Q76 12 78 52 Q76 92 50 92 Q24 92 22 52 Q24 12 50 6 Z" fill={shell} stroke={INK} strokeWidth={2.5} />
        <Path d="M50 6 L54 16 L50 22 L46 16 Z" fill={colors.green} stroke={INK} strokeWidth={1.6} />
      </G>
    );
  }
  if (tier === "long") {
    return (
      <Path
        d="M50 8 L72 22 L80 52 L64 86 L36 86 L20 52 L28 22 Z"
        fill={shell}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    );
  }
  return <Path d="M50 8 Q78 10 80 56 Q80 90 50 90 Q20 90 20 56 Q22 10 50 8 Z" fill={shell} stroke={INK} strokeWidth={2.5} />;
}

// Speckled egg; tier sets silhouette and colors, `seed` (the egg id) shuffles spots.
export function EggArt({ size = 64, seed = "", tier }) {
  const look = EGG_LOOKS[tier] ?? DEFAULT_LOOK;
  const start = hashString(seed) % look.spots.length;
  const spot = (i) => look.spots[(start + i) % look.spots.length];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={look.label}>
      <Ellipse cx={50} cy={92} rx={24} ry={4} fill={INK} opacity={0.12} />
      <EggShell tier={tier} shell={look.shell} />
      <Path d="M30 30 Q42 20 50 22" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Circle cx={38} cy={50} r={6} fill={spot(0)} />
      <Circle cx={62} cy={40} r={4.5} fill={spot(1)} />
      <Circle cx={58} cy={68} r={7} fill={spot(2)} />
      <Circle cx={34} cy={74} r={4} fill={spot(3)} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  portrait: { backgroundColor: colors.stripe },
});

// The food every landmark has on the map (a dog-food bag, a can of tuna or a
// jar of bone treats; see foodOf in landmarks.js), standing on its ring.
// ring: "free" (grey), "mine" (green) or "rival" (coral).
const BAG_RINGS = { free: "#aab4bf", mine: colors.green, rival: colors.coral };

function BagShape() {
  return (
    <G>
      <Rect x={14} y={14} width={32} height={44} rx={6} fill="#1f3b63" stroke={INK} strokeWidth={2} />
      <Rect x={13} y={10} width={34} height={7} rx={2} fill="#2b4f80" stroke={INK} strokeWidth={2} />
      <Rect x={18} y={26} width={24} height={20} rx={4} fill={colors.green} />
      <Circle cx={30} cy={38} r={4} fill="#ffffff" />
      <Circle cx={25} cy={32} r={1.7} fill="#ffffff" />
      <Circle cx={28.5} cy={30} r={1.7} fill="#ffffff" />
      <Circle cx={31.5} cy={30} r={1.7} fill="#ffffff" />
      <Circle cx={35} cy={32} r={1.7} fill="#ffffff" />
      <Rect x={17} y={17} width={4} height={36} rx={2} fill="#ffffff" opacity={0.18} />
    </G>
  );
}

function TunaShape() {
  return (
    <G>
      <Path d="M10 34 V54 Q30 62 50 54 V34 Z" fill="#c9d3dd" stroke={INK} strokeWidth={2} />
      <Path d="M10 38 V50 Q30 58 50 50 V38 Q30 46 10 38 Z" fill="#3f8fd2" />
      <Ellipse cx={30} cy={34} rx={20} ry={7} fill="#e4ebf2" stroke={INK} strokeWidth={2} />
      <Ellipse cx={36} cy={34} rx={4} ry={2} fill="none" stroke="#9aa5b1" strokeWidth={1.6} />
      <Ellipse cx={28} cy={47} rx={7} ry={3.5} fill="#ff9f43" />
      <Path d="M34 47 L40 43 L40 51 Z" fill="#ff9f43" />
      <Circle cx={25} cy={46} r={1} fill={INK} />
    </G>
  );
}

function TreatsShape() {
  const bone = (x, y, r) => (
    <G transform={`translate(${x} ${y}) rotate(${r})`} fill="#e2b06c" stroke="#8d5a2b" strokeWidth={0.8}>
      <Circle cx={-6} cy={-1.8} r={2.2} />
      <Circle cx={-6} cy={1.8} r={2.2} />
      <Circle cx={6} cy={-1.8} r={2.2} />
      <Circle cx={6} cy={1.8} r={2.2} />
      <Rect x={-6} y={-1.6} width={12} height={3.2} stroke="none" />
    </G>
  );
  return (
    <G>
      <Rect x={15} y={18} width={30} height={40} rx={7} fill="#cfefff" opacity={0.6} />
      {bone(30, 50, 15)}
      {bone(26, 41, -25)}
      {bone(33, 32, 35)}
      <Rect x={15} y={18} width={30} height={40} rx={7} fill="none" stroke={INK} strokeWidth={2} />
      <Rect x={13} y={11} width={34} height={9} rx={3} fill="#e53935" stroke={INK} strokeWidth={2} />
      <Rect x={18} y={22} width={3} height={30} rx={1.5} fill="#ffffff" opacity={0.5} />
    </G>
  );
}

const FOOD_SHAPES = { bag: BagShape, tuna: TunaShape, treats: TreatsShape };
const FOOD_NAMES = { bag: "dog food", tuna: "tuna", treats: "treats" };

export function FoodSvg({ size = 40, ring = "free", kind = "bag" }) {
  const Shape = FOOD_SHAPES[kind] ?? BagShape;
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 60 69" accessibilityLabel={`Landmark ${FOOD_NAMES[kind] ?? "food"}`}>
      <Ellipse cx={30} cy={60} rx={26} ry={8} fill={BAG_RINGS[ring]} />
      <Ellipse cx={30} cy={60} rx={19} ry={5} fill={INK} opacity={0.25} />
      <Shape />
    </Svg>
  );
}
