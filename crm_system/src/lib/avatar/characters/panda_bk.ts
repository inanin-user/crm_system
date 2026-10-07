import type { AvatarConfig, MotionSpec } from "../avatarConfig";
import { defaultAvatar } from "./default";
import { pandaHandShapes, pandaHandsMotion } from "./pandaHands";
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
export const pandaAvatar: AvatarConfig = {
  ...defaultAvatar,

  colors: {
    ...defaultAvatar.colors,
    // Only colour change: the hair layer is the panda's black.
    hair: defaultAvatar.colors.outline,
    hand: "#244E6B", 
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
    ...pandaHandShapes,    
  ],

  hands: {
    ...defaultAvatar.hands,
    radius: 0,
    strokeWidth: 0,
    motion: pandaHandsMotion, // hands rise to cover eyes
  },
};
