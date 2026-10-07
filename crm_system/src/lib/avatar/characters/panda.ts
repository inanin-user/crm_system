import type { AvatarConfig, MotionSpec } from "../avatarConfig";
import { defaultAvatar } from "./default";

/**
 * Panda avatar.
 *
 * The Avatar component is unchanged. The panda is built purely from config:
 * the "hair" layer is drawn after the head and before the eyes, so its path
 * draws all the black panda parts (ears, eye patches, nose). Eye patches
 * have an opposite-winding inner circle so the head colour shows through
 * as a white eye socket, which keeps the existing dark eyes visible.
 */
const bodyMotion: MotionSpec = {
  idle: { y: 8 },
  covering: { y: 3 },
  transition: { type: "spring", stiffness: 220, damping: 18 },
};
const handsMotion: MotionSpec = {
  idle: { y: 90, opacity: 0 },
  covering: { y: 0, opacity: 1 },
  transition: { type: "spring", stiffness: 220, damping: 18 },
};
export const pandaAvatar: AvatarConfig = {
  ...defaultAvatar,

  colors: {
    ...defaultAvatar.colors,
    // Only colour change: the hair layer is the panda's black.
    hair: defaultAvatar.colors.outline,
  },

  // Real ears are hidden; the panda ears are part of the hair path.
  ears: {
    ...defaultAvatar.ears,
    radius: 0,
    strokeWidth: 0,
  },

  hair: {
    path: `
      M49 66 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0Z
      M125 66 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0Z

      M76.08 95.31 A10.5 14 25 1 0 87.92 120.69 A10.5 14 25 1 0 76.08 95.31Z
      M74.5 108 a7.5 7.5 0 1 1 15 0 a7.5 7.5 0 1 1 -15 0Z

      M123.92 95.31 A10.5 14 -25 1 1 112.08 120.69 A10.5 14 -25 1 1 123.92 95.31Z
      M110.5 108 a7.5 7.5 0 1 0 15 0 a7.5 7.5 0 1 0 -15 0Z

      M93.5 121 a6.5 4.5 0 1 0 13 0 a6.5 4.5 0 1 0 -13 0Z
    `,
    strokeWidth: 3,
  },

  eyes: {
    ...defaultAvatar.eyes,
    radius: 4.5,
    glancePath: [
      { x: 0, y: 0 }, // start
      { x: -2, y: 4 },
      { x: 0, y: 4.5 },
      { x: 2, y: 5 },
      { x: 4, y: 6 }, // lowest
    ],
  },

  // Nose-to-mouth line plus the classic panda "w" mouth.
  mouth: {
    ...defaultAvatar.mouth,
    path: "M100 125 V131 M89 130 Q94.5 137 100 131 Q105.5 137 111 130",
  },

  shapes: [
    {
      id: "shoulders",
      layer: "afterBody",
      fill: "hair", // the panda's black, from colors.hair
      path: `
        M38 170 Q60 158 78 172 Q70 186 52 196 Q40 190 38 170Z
        M162 170 Q140 158 122 172 Q130 186 148 196 Q160 190 162 170Z
      `,
      motion: bodyMotion, // follows the body's rise
    },
    // {
    //   id: "forearms",
    //   layer: "beforeHands",
    //   fill: "hand", // same dark as the paws, resolved from colors.hand
    //   motion: handsMotion,
    //   path: `
    //   M68 112 L42 215 L68 215 L92 112Z
    //   M108 112 L132 215 L158 215 L132 112Z
    // `,
    // },
    {
  id: "paws",
  layer: "afterHands",
  fill: "hand",
  strokeWidth: 0,
  motion: handsMotion,
  path: `
    // Left paw — adapted from the Lottie Hand silhouette
    M82 216.58
    C82 216.58 73.72 221.98 73.72 221.98
    C73.28 221.99 72.86 222 72.43 222
    C54.18 222.1 43.9 210.54 42 199.18
    C41.54 196.42 41.91 194.26 43.2 192.76
    C44.17 191.65 45.33 191.48 45.33 191.48
    C45.33 191.48 45.63 189.62 47.44 188.88
    C49.04 188.22 51.02 188.77 51.02 188.77
    C51.02 188.77 52.26 187.86 53.83 188
    C56.02 188.19 58.09 190.2 59.58 192.92
    C61.31 196.09 63.57 198.61 65.94 200.61
    C71.21 205.07 77 206.92 78.6 207.37
    C78.88 207.44 79.03 207.48 79.03 207.48
    C79.03 207.48 80.43 211.76 80.43 211.76
    C80.43 211.76 82 216.58 82 216.58 Z

    // Right paw — mirrored from the Lottie-derived left paw
    M118 216.58
    C118 216.58 126.28 221.98 126.28 221.98
    C126.72 221.99 127.14 222 127.57 222
    C145.82 222.1 156.1 210.54 158 199.18
    C158.46 196.42 158.09 194.26 156.8 192.76
    C155.83 191.65 154.67 191.48 154.67 191.48
    C154.67 191.48 154.37 189.62 152.56 188.88
    C150.96 188.22 148.98 188.77 148.98 188.77
    C148.98 188.77 147.74 187.86 146.17 188
    C143.98 188.19 141.91 190.2 140.42 192.92
    C138.69 196.09 136.43 198.61 134.06 200.61
    C128.79 205.07 123 206.92 121.4 207.37
    C121.12 207.44 120.97 207.48 120.97 207.48
    C120.97 207.48 119.57 211.76 119.57 211.76
    C119.57 211.76 118 216.58 118 216.58 Z
  `,
},
  ],

  hands: {
    ...defaultAvatar.hands,
    motion: handsMotion,
  },
};
