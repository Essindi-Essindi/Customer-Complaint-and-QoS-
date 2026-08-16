# Cameroon reference data

Two data files backing the region/city dropdown and the manager heatmap:

## `cameroon-regions-and-towns.json`
The full region → department → chief-town breakdown (10 regions, 58
departments), with 2005-census population per department. This is the
**source reference** — the actual code that validates/renders in the app
carries only the town-name subset of this, duplicated by hand in two places
that must be kept in sync:
- `camtel-app/src/lib/cameroonLocations.ts` — powers the region → city
  cascading dropdown on complaint submission.
- `src/main/java/customer_complaint/customer_complaint/model/CameroonLocations.java`
  — backend validation, rejects a submitted city that doesn't belong to its
  region.

## `cameroon-region-boundaries.geojson`
Raw ADM1 (region-level) polygon boundaries for Cameroon, from
[geoBoundaries](https://www.geoboundaries.org) (CMR-ADM1 dataset, CC BY 4.0 —
attribution: "geoBoundaries, Wikimedia"). This is the **source geometry**; the
app itself doesn't read this file at runtime. It was processed once (simplified
+ reprojected into an SVG viewBox by a throwaway script) into
`camtel-app/src/data/cameroon-region-paths.json`, which is what
`camtel-app/src/components/CameroonHeatMap.tsx` actually renders.

## Sources
- https://en.wikipedia.org/wiki/Regions_of_Cameroon
- https://en.wikipedia.org/wiki/Departments_of_Cameroon
- https://www.citypopulation.de/en/cameroon/admin/
- https://www.geoboundaries.org
