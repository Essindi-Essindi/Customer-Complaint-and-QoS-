import regionPaths from '../data/cameroon-region-paths.json';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

// Region boundaries: geoBoundaries (CC-BY, https://www.geoboundaries.org,
// dataset CMR-ADM1), simplified + reprojected into this SVG's viewBox by a
// one-off script (see camtel-app/src/data/cameroon-region-paths.json).
// geoBoundaries names two regions with a hyphen where this app's REGIONS
// (constants.ts) uses a space — normalize once here rather than editing
// either canonical list to match the other.
const GEO_NAME_TO_REGION: Record<string, string> = {
  'North-West': 'North West',
  'South-West': 'South West',
};

// Fixed-threshold "traffic light" scale, per explicit request over the
// relative/max-scaled sequential ramp this replaced: white -> green ->
// yellow -> orange -> red as complaint count climbs, with the same 5 bucket
// edges in both themes (0-5, 6-10, 11-15, 16-20, 20+) rather than a scale
// that rescales itself against whatever the current max happens to be — two
// snapshots with the same counts should always look the same color.
const BUCKETS: { max: number; light: string; dark: string }[] = [
  { max: 5, light: '#f4f1ea', dark: '#2a2a24' }, // white/neutral — least
  { max: 10, light: '#4ade80', dark: '#22c55e' }, // green
  { max: 15, light: '#facc15', dark: '#eab308' }, // yellow
  { max: 20, light: '#fb923c', dark: '#f97316' }, // orange
  { max: Infinity, light: '#ef4444', dark: '#dc2626' }, // red — most
];

interface CameroonHeatMapProps {
  // region name (this app's spelling, e.g. "North West") -> complaint count
  counts: Map<string, number>;
}

export function CameroonHeatMap({ counts }: CameroonHeatMapProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const colorFor = (count: number) => {
    const bucket = BUCKETS.find((b) => count <= b.max) ?? BUCKETS[BUCKETS.length - 1];
    return bucket[theme];
  };

  return (
    <div className="cameroon-map">
      <svg
        viewBox={regionPaths.viewBox}
        role="img"
        aria-label={t('heatmap.mapAriaLabel')}
        className="cameroon-map-svg"
      >
        {Object.entries(regionPaths.paths).map(([geoName, d]) => {
          const region = GEO_NAME_TO_REGION[geoName] ?? geoName;
          const count = counts.get(region) ?? 0;
          return (
            <path
              key={geoName}
              d={d}
              className="cameroon-map-region"
              fill={colorFor(count)}
              tabIndex={0}
            >
              <title>
                {region}: {count} {t('heatmap.complaints')}
              </title>
            </path>
          );
        })}
      </svg>

      <div className="cameroon-map-legend">
        {BUCKETS.map((b, i) => {
          const prevMax = i === 0 ? 0 : BUCKETS[i - 1].max;
          const label = b.max === Infinity ? `${prevMax + 1}+` : `${prevMax === 0 ? 0 : prevMax + 1}–${b.max}`;
          return (
            <span key={label} className="cameroon-map-legend-item">
              <span className="cameroon-map-legend-swatch" style={{ background: b[theme] }} />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
