import { css } from "@/styled/css";

// @pandacss/preset-panda (already in `presets` at panda.config.ts) ships
// both a `spin` keyframe (`to: { transform: "rotate(360deg)" } }`) and an
// `animations.spin` token whose value is `"spin 1s linear infinite"` -
// byte-identical in effect to the Stitches keyframes/animation pair this
// replaces. The only difference is that Stitches named the `0%` state
// explicitly where the token relies on the implicit from-state, which is
// equivalent here since this SVG has no base transform. No panda.config.ts
// edit was needed or made.
const spin = css({
  animation: "spin",
});

export default function Spinner() {
  return (
    <svg
      className={spin}
      width={48}
      height={48}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 42c9.941 0 18-8.059 18-18S33.941 6 24 6 6 14.059 6 24s8.059 18 18 18Z"
        stroke="#E6E8FF"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 24c0-9.941-8.059-18-18-18S6 14.059 6 24s8.059 18 18 18"
        stroke="url(#a)"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="a"
          x1={42}
          y1={20.5}
          x2={22}
          y2={42}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3F479D" />
          <stop offset={1} stopColor="#3F479D" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}
