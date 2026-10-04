// Cohesive SVG icons for tabs, map actions, rarity marks, and map markers.
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from "react-native-svg";
import { colors } from "../theme.js";

const INK = colors.navy;

export function GameIcon({ size = 22, children, label }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={label} importantForAccessibility={label ? "yes" : "no-hide-descendants"}>
      {children}
    </Svg>
  );
}

export function SquadIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Squad">
      <Path d="M7 19c0-2.4 2.2-4 5-4s5 1.6 5 4" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={9.5} r={3.4} fill={colors.cream} stroke={color} strokeWidth={2} />
      <Path d="M9.2 8.2 L10.2 5.2 L12 7.6 L13.8 5.2 L14.8 8.2" fill={colors.slate} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={5.2} cy={11} r={2.2} fill={colors.iceSoft} stroke={color} strokeWidth={1.6} />
      <Circle cx={18.8} cy={11} r={2.2} fill={colors.greenSoft} stroke={color} strokeWidth={1.6} />
    </GameIcon>
  );
}

export function PetsIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Pets">
      <Path d="M12 3.2 C16.4 3.4 18.6 8 18.5 13 C18.4 18 15.4 21 12 21 C8.6 21 5.6 18 5.5 13 C5.4 8 7.6 3.4 12 3.2 Z" fill={colors.cream} stroke={color} strokeWidth={2} />
      <Circle cx={9.4} cy={12} r={1.5} fill={colors.green} />
      <Circle cx={14.2} cy={10.4} r={1.2} fill={colors.coral} />
      <Circle cx={13.2} cy={15.2} r={1.6} fill={colors.yellow} />
    </GameIcon>
  );
}

export function RanksIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Ranks">
      <Path d="M12 3 L19 7.2 V13.5 C19 17.2 15.8 20.2 12 21.4 C8.2 20.2 5 17.2 5 13.5 V7.2 Z" fill={colors.greenSoft} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M12 8.2 L14.6 13.2 L9.4 13.2 Z" fill={colors.gold} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </GameIcon>
  );
}

export function AlbumIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Album">
      <Rect x={4} y={6} width={16} height={13} rx={3} fill={colors.cream} stroke={color} strokeWidth={2} />
      <Path d="M4 15 L9 11 L12.5 14 L15 12 L20 16" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx={9} cy={10} r={1.4} fill={colors.gold} />
    </GameIcon>
  );
}

export function ExploreIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Explore">
      <Circle cx={12} cy={12} r={8} fill={colors.iceSoft} stroke={color} strokeWidth={2} />
      <Path d="M12 5.5 V18.5 M5.5 12 H18.5" stroke={colors.green} strokeWidth={1.4} />
      <Circle cx={12} cy={12} r={2} fill={colors.coral} stroke={color} strokeWidth={1.2} />
    </GameIcon>
  );
}

export function StoryIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Story">
      <Path d="M6 5.5 H15 C17 5.5 18.5 7 18.5 9 V19 H8 C6.5 19 5.5 18 5.5 16.5 V7 C5.5 6.2 6.2 5.5 7 5.5" fill={colors.cream} stroke={color} strokeWidth={2} />
      <Path d="M8.5 9.5 H15 M8.5 12.5 H14 M8.5 15.5 H12.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </GameIcon>
  );
}

export function DirectionsIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Directions">
      <Path d="M12 3 L21 12 L12 21 L3 12 Z" fill={colors.iceSoft} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 12 H13 V8" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </GameIcon>
  );
}

export function CaptureIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Capture">
      <Rect x={3.5} y={7} width={17} height={12} rx={3} fill={colors.navy} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={13} r={3.6} fill={colors.ice} stroke={colors.cream} strokeWidth={1.6} />
      <Rect x={8} y={5} width={8} height={3} rx={1} fill={colors.gold} />
    </GameIcon>
  );
}

export function TerritoryIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Territory">
      <Path d="M5 18 L8 8 L12 12 L16 6 L19 18 Z" fill={colors.greenSoft} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={2.2} fill={colors.green} stroke={color} strokeWidth={1.3} />
    </GameIcon>
  );
}

export function LiveIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Live location">
      <Path d="M12 21 C12 21 6 14.4 6 10.2 A6 6 0 0 1 18 10.2 C18 14.4 12 21 12 21 Z" fill={colors.coral} stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={10.2} r={2.2} fill={colors.cream} />
    </GameIcon>
  );
}

export function WalkIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Walk">
      <Circle cx={15} cy={5.5} r={2.2} fill={colors.gold} stroke={color} strokeWidth={1.4} />
      <Path d="M8 21 L11 13 L15 15 L18 21" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 13 L7 11 L9 8" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </GameIcon>
  );
}

export function GardenIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Garden map">
      <Path d="M12 21 V12" stroke="#8d6e3f" strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={12} cy={9} r={5.5} fill={colors.green} stroke={color} strokeWidth={1.6} />
      <Circle cx={8.5} cy={10.5} r={3.2} fill={colors.greenDark} />
      <Circle cx={15.5} cy={10.5} r={3.2} fill={colors.greenOnDark} />
    </GameIcon>
  );
}

export function MapGlyphIcon({ size = 22, color = INK }) {
  return (
    <GameIcon size={size} label="Standard map">
      <Path d="M4 7 L10 5 L14 8 L20 6 V18 L14 20 L10 17 L4 19 Z" fill={colors.iceSoft} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 5 V17 M14 8 V20" stroke={color} strokeWidth={1.2} />
    </GameIcon>
  );
}

export function PawIcon({ size = 22, color = colors.white }) {
  return (
    <GameIcon size={size} label="Squad in 3D">
      <Ellipse cx={12} cy={15.2} rx={5.4} ry={4.4} fill={color} />
      <Circle cx={6.4} cy={9.4} r={2.1} fill={color} />
      <Circle cx={10} cy={7.2} r={2.1} fill={color} />
      <Circle cx={14} cy={7.2} r={2.1} fill={color} />
      <Circle cx={17.6} cy={9.4} r={2.1} fill={color} />
    </GameIcon>
  );
}

export function RecenterIcon({ size = 20, color = INK }) {
  return (
    <GameIcon size={size} label="Center the map">
      <Circle cx={12} cy={12} r={6.5} fill="none" stroke={color} strokeWidth={2.2} />
      <Circle cx={12} cy={12} r={2} fill={color} />
      <Path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </GameIcon>
  );
}

export function BloomIcon({ size = 18, color = colors.pink }) {
  return (
    <GameIcon size={size} label="Bloom">
      <Circle cx={12} cy={12} r={3.2} fill={colors.gold} />
      <Ellipse cx={12} cy={6.2} rx={2.6} ry={3.6} fill={color} />
      <Ellipse cx={12} cy={17.8} rx={2.6} ry={3.6} fill={color} />
      <Ellipse cx={6.2} cy={12} rx={3.6} ry={2.6} fill={color} />
      <Ellipse cx={17.8} cy={12} rx={3.6} ry={2.6} fill={color} />
    </GameIcon>
  );
}

export function YouMarker({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" accessibilityLabel="You">
      <Circle cx={14} cy={14} r={12} fill={colors.green} opacity={0.28} />
      <Circle cx={14} cy={14} r={8} fill={colors.greenDark} stroke={colors.white} strokeWidth={2.5} />
      <Ellipse cx={14} cy={16} rx={3.4} ry={2.6} fill={colors.cream} />
      <Circle cx={10.6} cy={12} r={1.3} fill={colors.cream} />
      <Circle cx={14} cy={10.6} r={1.3} fill={colors.cream} />
      <Circle cx={17.4} cy={12} r={1.3} fill={colors.cream} />
    </Svg>
  );
}

export function MysteryMarker({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" accessibilityLabel="Somewhere new">
      <Circle cx={15} cy={15} r={13} fill={colors.navy} stroke={colors.ice} strokeWidth={3} />
      <Path d="M11 12.2 C11 9.8 13 8.4 15 8.4 C17.2 8.4 19 9.8 19 12 C19 14 17 14.6 16 16 V17.4" fill="none" stroke={colors.cream} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={16} cy={20.6} r={1.5} fill={colors.gold} />
    </Svg>
  );
}

const MARKS = {
  circle: ({ color }) => <Circle cx={12} cy={12} r={7} fill={color} stroke={INK} strokeWidth={1.8} />,
  diamond: ({ color }) => <Polygon points="12,3.5 20.5,12 12,20.5 3.5,12" fill={color} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
  hex: ({ color }) => <Polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill={color} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
  star: ({ color }) => (
    <Path
      d="M12 3 L14.2 9 H20.5 L15.6 12.8 L17.6 19 L12 15.4 L6.4 19 L8.4 12.8 L3.5 9 H9.8 Z"
      fill={color}
      stroke={INK}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  ),
};

export function RarityMark({ mark = "circle", color, size = 16, label }) {
  const Shape = MARKS[mark] ?? MARKS.circle;
  return (
    <GameIcon size={size} label={label}>
      <Shape color={color} />
    </GameIcon>
  );
}
