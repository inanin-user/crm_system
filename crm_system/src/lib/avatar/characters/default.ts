import type { AvatarConfig } from "../avatarConfig";

export const defaultAvatar: AvatarConfig = {
  colors: {
    background: "#9FD3EC",
    outline: "#1B4965",

    head: "#F4FAFE",
    body: "#E4F2FB",

    hair: "#F4FAFE",

    eye: "#1B4965",
    mouth: "#1B4965",

    hand: "#F4FAFE",
  },

  background: {
    cx: 100,
    cy: 100,
    radius: 98,
    strokeWidth: 3,
  },

  body: {
    cx: 100,
    cy: 215,
    rx: 70,
    ry: 55,
    strokeWidth: 3,
    text: {
      value: "Mi",
      x: 100,
      y: 185,
      fontSize: 16,
      fontWeight: 700,
      fill: "#1B4965",
    },
  },

  head: {
    cx: 100,
    cy: 110,
    radius: 52,
    strokeWidth: 3,
  },

  ears: {
    leftX: 52,
    rightX: 148,
    y: 112,
    radius: 10,
    strokeWidth: 3,
  },

  hair: {
    path: `
      M55 90
      Q60 35 100 40
      Q140 35 145 90
      Q130 60 118 85
      Q108 50 100 82
      Q92 50 82 85
      Q70 60 55 90Z
    `,
    strokeWidth: 3,
  },

  eyes: {
  leftX: 82,
  rightX: 118,
  y: 108,
  radius: 5,
  glancePath: [
    { x: 0, y: 0 },    // start
    { x: -2, y: 4 },
    { x: 0, y: 11 },
    { x: 2, y: 13 },
    { x: 4, y: 9.8 },  // lowest
  ],
},

  mouth: {
    path: "M85 128 Q100 140 115 128",
    strokeWidth: 3,
    scaleWhenCoveringEyes: 0.95,
  },

  hands: {
    leftX: 80,
    rightX: 120,
    y: 108,
    radius: 17,
    strokeWidth: 3,
  },
};