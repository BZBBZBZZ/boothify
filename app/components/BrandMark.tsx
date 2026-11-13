type BrandMarkProps = {
  size?: number;
};

/* A booth grid: four stands, one picked. */
export default function BrandMark({ size = 24 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="brand-mark"
    >
      <rect x="1" y="1" width="10" height="10" className="brand-mark-cell" />
      <rect x="13" y="1" width="10" height="10" className="brand-mark-pick" />
      <rect x="1" y="13" width="10" height="10" className="brand-mark-cell" />
      <rect x="13" y="13" width="10" height="10" className="brand-mark-cell" />
    </svg>
  );
}
