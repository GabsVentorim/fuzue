// Rolling hills, the park's section horizon. On the carousel: a blue ridge and a pink ridge behind
// a front hill in the page's own colour, so the banner sinks into the park. On the footer
// (tone="footer"): pink ridges behind a blue front hill, so the footer rises out of the park.
export default function Horizon({ tone = 'hero' }) {
  return (
    <svg className={`horizon horizon--${tone}`} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
      <path className="horizon__back" d="M0 70 C 180 20, 360 30, 520 62 S 860 110, 1040 58 S 1320 10, 1440 46 V120 H0 Z" />
      <path className="horizon__mid" d="M0 92 C 220 48, 420 60, 640 84 S 1040 120, 1220 78 S 1400 60, 1440 70 V120 H0 Z" />
      <path className="horizon__front" d="M0 108 C 260 80, 520 84, 720 98 S 1180 120, 1440 96 V120 H0 Z" />
    </svg>
  );
}
