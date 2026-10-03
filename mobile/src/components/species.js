// Pet species for the 2D art. Every species keeps the chunky rounded-cube body
// (Roblox simulator style); they differ by ears, face markings, tail and extras.
// All drawn in PetSvg's 100 x 100 box: body x 16-84, y 28-86; face around y 50-70.
import { Circle, Ellipse, G, Path } from "react-native-svg";
import { hashString } from "../core/geo.js";
import { colors } from "../theme.js";

const INK = colors.navy;
const line = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" };

const mirror = (d) => <Path d={d} transform="translate(100 0) scale(-1 1)" />;

export const SPECIES = Object.freeze({
  husky: {
    label: "Husky",
    Tail: ({ fur }) => <Path d="M80 70 Q98 66 94 48 Q90 40 84 46 Q90 54 80 60 Z" fill={fur} {...line} />,
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Path d="M22 40 L28 10 L46 32 Z" />
          {mirror("M22 40 L28 10 L46 32 Z")}
        </G>
        <G fill={colors.pink}>
          <Path d="M28 34 L31 18 L40 31 Z" />
          {mirror("M28 34 L31 18 L40 31 Z")}
        </G>
      </G>
    ),
    Mask: () => <Path d="M50 40 Q38 44 30 56 Q32 74 50 76 Q68 74 70 56 Q62 44 50 40 Z" fill="#ffffff" opacity={0.92} />,
  },
  shiba: {
    label: "Shiba",
    Tail: ({ fur }) => <Circle cx={86} cy={50} r={9} fill={fur} {...line} />,
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Path d="M20 42 Q22 18 32 14 Q42 22 46 32 Z" />
          {mirror("M20 42 Q22 18 32 14 Q42 22 46 32 Z")}
        </G>
        <G fill="#fff3e0">
          <Path d="M26 36 Q28 24 32 21 Q38 27 40 32 Z" />
          {mirror("M26 36 Q28 24 32 21 Q38 27 40 32 Z")}
        </G>
      </G>
    ),
    Mask: () => (
      <G fill="#fff3e0">
        <Path d="M24 58 Q30 78 50 78 Q70 78 76 58 Q64 66 50 64 Q36 66 24 58 Z" />
        <Ellipse cx={37} cy={42} rx={3.5} ry={2.5} />
        <Ellipse cx={63} cy={42} rx={3.5} ry={2.5} />
      </G>
    ),
  },
  cat: {
    label: "Cat",
    Tail: ({ fur }) => <Path d="M80 72 Q96 70 92 54 Q90 44 96 40" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />,
    TailFill: ({ fur }) => <Path d="M80 72 Q96 70 92 54 Q90 44 96 40" stroke={fur} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Path d="M18 38 L20 14 L40 30 Z" />
          {mirror("M18 38 L20 14 L40 30 Z")}
        </G>
        <G fill={colors.pink}>
          <Path d="M23 33 L24 21 L34 30 Z" />
          {mirror("M23 33 L24 21 L34 30 Z")}
        </G>
      </G>
    ),
    Mask: () => <Ellipse cx={50} cy={66} rx={11} ry={7} fill="#ffffff" opacity={0.85} />,
    Extra: () => (
      <G stroke={INK} strokeWidth={1.4} strokeLinecap="round">
        <Path d="M30 64 L18 62 M30 68 L18 70" />
        <Path d="M70 64 L82 62 M70 68 L82 70" />
      </G>
    ),
  },
  bunny: {
    label: "Bunny",
    Tail: () => <Circle cx={84} cy={74} r={8} fill="#ffffff" {...line} />,
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Ellipse cx={36} cy={14} rx={8} ry={20} transform="rotate(-12 36 14)" />
          <Ellipse cx={64} cy={14} rx={8} ry={20} transform="rotate(12 64 14)" />
        </G>
        <G fill={colors.pink}>
          <Ellipse cx={36} cy={14} rx={3.5} ry={14} transform="rotate(-12 36 14)" />
          <Ellipse cx={64} cy={14} rx={3.5} ry={14} transform="rotate(12 64 14)" />
        </G>
      </G>
    ),
    Mask: () => <Ellipse cx={50} cy={66} rx={10} ry={7} fill="#ffffff" opacity={0.9} />,
    Extra: () => <Path d="M47.5 70 h5 v5 h-5 Z" fill="#ffffff" stroke={INK} strokeWidth={1.2} />,
  },
  fox: {
    label: "Fox",
    Tail: ({ fur }) => (
      <G>
        <Path d="M78 74 Q104 70 96 40 Q84 48 80 60 Z" fill={fur} {...line} />
        <Path d="M96 40 Q92 50 88 46 Q92 42 96 40 Z" fill="#ffffff" />
      </G>
    ),
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Path d="M16 42 L20 4 L48 30 Z" />
          {mirror("M16 42 L20 4 L48 30 Z")}
        </G>
        <G fill={INK}>
          <Path d="M19 14 L20 4 L28 12 Z" />
          {mirror("M19 14 L20 4 L28 12 Z")}
        </G>
      </G>
    ),
    Mask: () => (
      <G fill="#ffffff" opacity={0.95}>
        <Path d="M18 54 Q34 60 50 78 Q26 78 18 54 Z" />
        {mirror("M18 54 Q34 60 50 78 Q26 78 18 54 Z")}
      </G>
    ),
  },
  bear: {
    label: "Bear",
    Ears: ({ fur }) => (
      <G>
        <G fill={fur} {...line}>
          <Circle cx={24} cy={30} r={11} />
          <Circle cx={76} cy={30} r={11} />
        </G>
        <G fill={colors.pink}>
          <Circle cx={24} cy={30} r={5} />
          <Circle cx={76} cy={30} r={5} />
        </G>
      </G>
    ),
    Mask: () => <Ellipse cx={50} cy={66} rx={15} ry={11} fill="#f1d9b5" />,
  },
});

const IDS = Object.keys(SPECIES);

// A pet's species; pets without one get a steady pick from their id.
export function speciesOf(pet) {
  return SPECIES[pet.species] ?? SPECIES[IDS[hashString(pet.id ?? pet.name ?? "") % IDS.length]];
}
