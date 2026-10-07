import { MotionValue, Transition } from "framer-motion/dom";

export interface AvatarProps {
  config?: AvatarConfig;
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  coveringEyes: boolean;
}
export type MotionTarget = {
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  opacity?: number;
};

export type MotionSpec = {
  idle: MotionTarget;
  covering: MotionTarget;
  transition?: Transition;
};

/** Where the shape sits in the layer order. */
export type ShapeLayer =
  | "afterBody"   // above body, below head (shoulders, collar, scarf)
  | "afterHead"   // above head, below eyes (cheeks, blush)
  | "beforeHands"
  | "afterHands"; // topmost (paw pads, sleeves)

export type ExtraShape = {
  id: string;
  layer: ShapeLayer;
  path: string;
  fill: string;          // a key of config.colors, or a literal color
  stroke?: string;       // same rule, defaults to colors.outline
  strokeWidth?: number;  // defaults to 3
  origin?: string;       // e.g. "100px 170px", for scale/rotate
  motion?: MotionSpec;
};

export type EyePoint = { x: number; y: number };
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
    glancePath: EyePoint[];
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
    motion?: MotionSpec;
  };
  shapes?: ExtraShape[];
}