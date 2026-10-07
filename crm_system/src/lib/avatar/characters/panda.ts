import type { AvatarConfig, MotionSpec } from "../avatarConfig";
import { defaultAvatar } from "./default";
import { pandaHandShapes, pandaHandsMotion } from "./pandaHands";

/**
 * Panda avatar (cartoon style).
 *
 * Layer map (back to front) and what lives where:
 *   body ellipse             default config
 *   afterBody shapes         shoulders, ears, inner ears, HEAD (custom wide path)
 *   head / ears circles      hidden (radius 0): replaced by the shapes above
 *   hair path                eye patches (black)
 *   afterHead shapes         white eye sockets, nose
 *   eyes group               iris + pupil + shine (moves with eyeX / eyeY)
 *   mouth path               philtrum + smile line
 *   beforeHands shapes       open mouth + tongue
 *   hands group + afterHands paws (pandaHandShapes)
 *
 * Coordinate system is unchanged: centre X = 100, head centre (100, 108),
 * eyes at X = 100 ± 22, everything left/right symmetric around X = 100.
 */

const PINK = "#F4B6B0";
const NOSE = "#5B2A36";
const MOUTH_INSIDE = "#5B2333";
const TONGUE = "#F28BA0";

const bodyMotion: MotionSpec = {
  idle: { y: 8 },
  covering: { y: 3 },
  transition: { type: "spring", stiffness: 220, damping: 18 },
};

// Head, ears and inner ears follow the hair layer (the component moves it -1).
const headMotion: MotionSpec = {
  idle: { y: 0 },
  covering: { y: -1 },
  transition: { type: "spring", stiffness: 300, damping: 22 },
};

// The open mouth narrows with the mouth line when the eyes are covered.
const mouthMotion: MotionSpec = {
  idle: { scaleX: 1 },
  covering: { scaleX: 0.95 },
  transition: { duration: 0.25 },
};

export const pandaAvatar: AvatarConfig = {
  ...defaultAvatar,

  colors: {
    ...defaultAvatar.colors,
    hair: defaultAvatar.colors.outline, // panda black: ears, patches, shoulders
    hand: "#244E6B",                    // paws + forearms
    eye: "#7A4A2E",                     // brown iris
  },

  // Built-in head and ears are replaced by shapes (custom head outline + ears behind it).
  head: { ...defaultAvatar.head, radius: 0, strokeWidth: 0 },
  ears: { ...defaultAvatar.ears, radius: 0, strokeWidth: 0 },

  // Hair layer = the two tilted eye patches (top edge leans toward the nose).
  hair: {
    path: `
      M83.81 93.63 A12 15.5 22 1 0 72.19 122.37 A12 15.5 22 1 0 83.81 93.63Z
      M116.19 93.63 A12 15.5 -22 1 1 127.81 122.37 A12 15.5 -22 1 1 116.19 93.63Z
    `,
    strokeWidth: 3,
  },

  eyes: {
    ...defaultAvatar.eyes,
    leftX: 78,
    rightX: 122,
    y: 108,
    radius: 6.2, // iris
    pupil: { radius: 3.2, fill: "#111111" },
    shine: { dx: 2.1, dy: -2.3, radius: 1.7, fill: "#FFFFFF" },
    // Socket radius is 9, so keep the travel inside ~3 units.
    glancePath: [
      { x: 0, y: 0 },
      { x: -1.5, y: 1.5 },
      { x: 0, y: 2.5 },
      { x: 1.2, y: 2.6 },
      { x: 1.8, y: 2.4 },
    ],
  },

  // Philtrum (nose -> mouth) + smile line. The open mouth is drawn on top as a shape.
  mouth: {
    ...defaultAvatar.mouth,
    path: "M100 126 V130.5 M88 129.5 Q100 135 112 129.5",
  },

  shapes: [
    // ---- behind the head -------------------------------------------------
    {
      id: "shoulders",
      layer: "afterBody",
      fill: "hair",
      path: `
        M38 170 Q60 158 78 172 Q70 186 52 196 Q40 190 38 170Z
        M162 170 Q140 158 122 172 Q130 186 148 196 Q160 190 162 170Z
      `,
      motion: bodyMotion,
    },
    {
      id: "ears",
      layer: "afterBody",
      fill: "hair",
      path: `
        M37 68 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0Z
        M133 68 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0Z
      `,
      motion: headMotion,
    },
    {
      id: "inner-ears",
      layer: "afterBody",
      fill: PINK,
      strokeWidth: 0,
      path: `
        M44 70 a8.5 8.5 0 1 0 17 0 a8.5 8.5 0 1 0 -17 0Z
        M139 70 a8.5 8.5 0 1 0 17 0 a8.5 8.5 0 1 0 -17 0Z
      `,
      motion: headMotion,
    },
    {
      id: "head",
      layer: "afterBody",
      fill: "head",
      path: "M100 58 C134 58 160 80 160 110 C160 138 134 158 100 158 C66 158 40 138 40 110 C40 80 66 58 100 58Z",
      motion: headMotion,
    },

    // ---- face details (above patches, below the moving eyes) -------------
    {
      id: "eye-sockets",
      layer: "afterHead",
      fill: "#FFFFFF",
      strokeWidth: 0,
      path: `
        M69 108 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0Z
        M113 108 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0Z
      `,
    },
    {
      id: "nose",
      layer: "afterHead",
      fill: NOSE,
      strokeWidth: 0,
      path: "M93.5 118 Q100 114.5 106.5 118 Q106 124 100 126.5 Q94 124 93.5 118Z",
    },

    // ---- open mouth (above the mouth line, below the paws) ---------------
    {
      id: "open-mouth",
      layer: "beforeHands",
      fill: MOUTH_INSIDE,
      strokeWidth: 2.5,
      origin: "100px 134px",
      motion: mouthMotion,
      path: "M88 129.5 Q100 135 112 129.5 Q111 145 100 145 Q89 145 88 129.5Z",
    },
    {
      id: "tongue",
      layer: "beforeHands",
      fill: TONGUE,
      strokeWidth: 0,
      origin: "100px 134px",
      motion: mouthMotion,
      path: "M93 139 Q100 134.5 107 139 Q105 144 100 144 Q95 144 93 139Z",
    },

    // ---- paws + forearms --------------------------------------------------
    ...pandaHandShapes,
  ],

  // The built-in paw circles are hidden: pandaHandShapes draws the paws.
  hands: {
    ...defaultAvatar.hands,
    radius: 0,
    strokeWidth: 0,
    motion: pandaHandsMotion,
  },
};
