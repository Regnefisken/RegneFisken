type CoinIconProps = {
  size?: number;
  className?: string;
};

export function CoinIcon({ size = 20, className = '' }: CoinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" fill="#F59E0B" stroke="#92400E" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="7" fill="#FBBF24" />
      <circle cx="10" cy="10" r="5.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="0.8" />
      <text
        x="10"
        y="14"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="#92400E"
        fontFamily="serif"
      >
        $
      </text>
    </svg>
  );
}
