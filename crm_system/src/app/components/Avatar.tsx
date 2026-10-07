"use client";

import { motion } from "framer-motion";
import type { AvatarConfig, AvatarProps } from "@/lib/avatar";
import { defaultAvatar } from "@/lib/avatar";
import { ExtraShape, MotionSpec, ShapeLayer } from "@/lib/avatar/avatarConfig";

const DEFAULT_HANDS_MOTION: MotionSpec = {
  idle: { y: 90, opacity: 0 },
  covering: { y: 0, opacity: 1 },
  transition: { type: "spring", stiffness: 360, damping: 24 },
};

function ExtraShapes({
  shapes,
  layer,
  coveringEyes,
  colors,
}: {
  shapes?: ExtraShape[];
  layer: ShapeLayer;
  coveringEyes: boolean;
  colors: AvatarConfig["colors"];
}) {
  const resolve = (c: string) => colors[c as keyof typeof colors] ?? c;

  return (
    <>
      {shapes
        ?.filter((s) => s.layer === layer)
        .map((s) => (
          <motion.path
            key={s.id}
            d={s.path}
            fill={resolve(s.fill)}
            stroke={resolve(s.stroke ?? "outline")}
            strokeWidth={s.strokeWidth ?? 3}
            strokeLinejoin="round"
            style={s.origin ? { transformOrigin: s.origin } : undefined}
            initial={false}
            animate={s.motion && (coveringEyes ? s.motion.covering : s.motion.idle)}
            transition={s.motion?.transition}
          />
        ))}
    </>
  );
}

export default function Avatar({
  config = defaultAvatar,
  eyeX,
  eyeY,
  coveringEyes,
}: AvatarProps) {
  const {
    colors,
    background,
    body,
    head,
    ears,
    hair,
    eyes,
    mouth,
    hands,
    shapes,
  } = config;
  const handsMotion = hands.motion ?? DEFAULT_HANDS_MOTION;

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {/* ---------------------------------------------------------- */}
      {/* Background                                                  */}
      {/* ---------------------------------------------------------- */}

      <circle
        cx={background.cx}
        cy={background.cy}
        r={background.radius}
        fill={colors.background}
        stroke={colors.outline}
        strokeWidth={background.strokeWidth}
      />

      {/* ---------------------------------------------------------- */}
      {/* Clip avatar contents inside background circle               */}
      {/* ---------------------------------------------------------- */}

      <clipPath id="avatarClip">
        <circle
          cx={background.cx}
          cy={background.cy}
          r={background.radius}
        />
      </clipPath>

      <g clipPath="url(#avatarClip)">
        {/* -------------------------------------------------------- */}
        {/* Body                                                     */}
        {/* -------------------------------------------------------- */}

        <motion.ellipse
          cx={body.cx}
          cy={body.cy}
          rx={body.rx}
          ry={body.ry}
          fill={colors.body}
          stroke={colors.outline}
          strokeWidth={body.strokeWidth}
          initial={{ y: 8 }}
          animate={{
            y: coveringEyes ? 3 : 8,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 18,
          }}
        />
        {body.text && (
        <motion.text
            x={body.text.x}
            y={body.text.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={body.text.fontSize}
            fontWeight={body.text.fontWeight ?? 400}
            fill={body.text.fill}
        >
            {body.text.value}
        </motion.text>
        )}

        <ExtraShapes shapes={shapes} layer="afterBody" coveringEyes={coveringEyes} colors={colors} />

        {/* -------------------------------------------------------- */}
        {/* Head                                                     */}
        {/* -------------------------------------------------------- */}

        <motion.circle
          cx={head.cx}
          cy={head.cy}
          r={head.radius}
          fill={colors.head}
          stroke={colors.outline}
          strokeWidth={head.strokeWidth}
          animate={{
            y: coveringEyes ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 22,
          }}
        />

        {/* -------------------------------------------------------- */}
        {/* Ears                                                     */}
        {/* -------------------------------------------------------- */}

        <circle
          cx={ears.leftX}
          cy={ears.y}
          r={ears.radius}
          fill={colors.head}
          stroke={colors.outline}
          strokeWidth={ears.strokeWidth}
        />

        <circle
          cx={ears.rightX}
          cy={ears.y}
          r={ears.radius}
          fill={colors.head}
          stroke={colors.outline}
          strokeWidth={ears.strokeWidth}
        />

        {/* -------------------------------------------------------- */}
        {/* Hair                                                     */}
        {/* -------------------------------------------------------- */}

        <motion.path
          d={hair.path}
          fill={colors.hair}
          stroke={colors.outline}
          strokeWidth={hair.strokeWidth}
          strokeLinejoin="round"
          animate={{
            y: coveringEyes ? -1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 22,
          }}
        />

        <ExtraShapes shapes={shapes} layer="afterHead" coveringEyes={coveringEyes} colors={colors} />

        {/* -------------------------------------------------------- */}
        {/* Eyes                                                     */}
        {/* -------------------------------------------------------- */}

        <motion.g
          style={{
            x: eyeX,
            y: eyeY,
          }}
        >
          <circle
            cx={eyes.leftX}
            cy={eyes.y}
            r={eyes.radius}
            fill={colors.eye}
          />

          <circle
            cx={eyes.rightX}
            cy={eyes.y}
            r={eyes.radius}
            fill={colors.eye}
          />
        </motion.g>

        {/* -------------------------------------------------------- */}
        {/* Mouth                                                    */}
        {/* -------------------------------------------------------- */}

        <motion.path
          d={mouth.path}
          fill="none"
          stroke={colors.mouth}
          strokeWidth={mouth.strokeWidth}
          strokeLinecap="round"
          animate={{
            scaleX: coveringEyes
              ? mouth.scaleWhenCoveringEyes
              : 1,
          }}
          transition={{
            duration: 0.25,
          }}
          style={{
            transformOrigin: "100px 134px",
          }}
        />

        <ExtraShapes shapes={shapes} layer="beforeHands" coveringEyes={coveringEyes} colors={colors} />

        {/* -------------------------------------------------------- */}
        {/* Hands covering eyes                                      */}
        {/* -------------------------------------------------------- */}
        <motion.g
          initial={false}
          animate={coveringEyes ? handsMotion.covering : handsMotion.idle}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 24,
          }}
        >
          <motion.circle
            cx={hands.leftX}
            cy={hands.y}
            r={hands.radius}
            fill={colors.hand}
            stroke={colors.outline}
            strokeWidth={hands.strokeWidth}
          />

          <motion.circle
            cx={hands.rightX}
            cy={hands.y}
            r={hands.radius}
            fill={colors.hand}
            stroke={colors.outline}
            strokeWidth={hands.strokeWidth}
          />
        </motion.g>

        <ExtraShapes shapes={shapes} layer="afterHands" coveringEyes={coveringEyes} colors={colors} />
      </g>
    </svg>
  );
}