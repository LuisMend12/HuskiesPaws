// Design tokens. Colors come from the HuskiesPaws logo (docs/logo/README.md);
// the soft, rounded look is inspired by docs/inspiration/pikmin-bloom/.

const palette = {
  navy: "#0b1f3a",
  slate: "#5b6b82", // husky gray
  faint: "#8a97ab",
  green: "#2e9d4f", // bloom green
  greenDark: "#237a3d",
  greenSoft: "#e6f4ea",
  greenOnDark: "#6fd38a", // the logo's green on navy
  ice: "#6ec6ff",
  iceSoft: "#e8f5ff",
  pink: "#f48fb1",
  yellow: "#ffd54f",
  coral: "#ff7a59",
  white: "#ffffff",
  page: "#f3f6fa",
  line: "#e4e9f0",
  stripe: "#f7f9fc",
};

export const colors = Object.freeze({
  ...palette,
  ink: palette.navy,
  muted: palette.slate,
  bg: palette.page,
  card: palette.white,
  border: palette.line,
  accent: palette.coral, // planned route on the map
  // Older names, kept so screens not yet restyled still work.
  leaf: palette.green,
  leafDark: palette.greenDark,
  soft: palette.greenSoft,
  you: palette.greenSoft,
  brandNavy: palette.navy,
  brandGreen: palette.greenOnDark,
});

// Loaded in App.js. Android ignores fontWeight with custom fonts, so each
// weight is its own family: use these (or `type`), never fontWeight.
export const fonts = Object.freeze({
  regular: "Nunito_400Regular",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extrabold: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
});

export const type = Object.freeze({
  display: { fontFamily: fonts.black, fontSize: 34, lineHeight: 40, color: colors.ink },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink },
  heading: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyBold: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, color: colors.ink },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.muted },
});

export const space = Object.freeze({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24 });

export const radius = Object.freeze({ pill: 999, sheet: 28, card: 20, small: 12 });

export const shadow = Object.freeze({
  soft: {
    shadowColor: palette.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: palette.navy,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
