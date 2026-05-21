export function GlobalFilters() {
  return (
    <svg
      width={0}
      height={0}
      style={{ position: 'absolute' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="pencil-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale="1.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
