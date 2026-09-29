import { MotionValue } from "framer-motion/dom";

export interface AvatarProps {
  config?: AvatarConfig;
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  coveringEyes: boolean;
}

export interface AvatarConfig {
  // ------------------------------------------------------------
  // Basic colors
  // ------------------------------------------------------------
  colors: {
    background: string;
    outline: string;
    head: string;
    body: string;
    hair: string;
    eye: string;
    mouth: string;
    hand: string;
  };

  // ------------------------------------------------------------
  // Background
  // ------------------------------------------------------------
  background: {
    cx: number;
    cy: number;
    radius: number;
    strokeWidth: number;
  };

  // ------------------------------------------------------------
  // Body
  // ------------------------------------------------------------
  body: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    strokeWidth: number;
     text?: {
      x: number;
      y: number;
      value: string;
      fontSize: number;
      fontWeight?: number | string;
      fill: string;
    };
  };

  // ------------------------------------------------------------
  // Head
  // ------------------------------------------------------------
  head: {
    cx: number;
    cy: number;
    radius: number;
    strokeWidth: number;
  };

  // ------------------------------------------------------------
  // Ears
  // ------------------------------------------------------------
  ears: {
    leftX: number;
    rightX: number;
    y: number;
    radius: number;
    strokeWidth: number;
  };

  // ------------------------------------------------------------
  // Hair
  // ------------------------------------------------------------
  hair: {
    path: string;
    strokeWidth: number;
  };

  // ------------------------------------------------------------
  // Eyes
  // ------------------------------------------------------------
  eyes: {
    leftX: number;
    rightX: number;
    y: number;
    radius: number;
  };

  // ------------------------------------------------------------
  // Mouth
  // ------------------------------------------------------------
  mouth: {
    path: string;
    strokeWidth: number;
    scaleWhenCoveringEyes: number;
  };

  // ------------------------------------------------------------
  // Hands
  // ------------------------------------------------------------
  hands: {
    leftX: number;
    rightX: number;
    y: number;
    radius: number;
    strokeWidth: number;
  };
}