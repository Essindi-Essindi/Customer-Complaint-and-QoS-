// Canonical region -> town list for Cameroon, used to populate the
// region/city dropdowns on complaint submission and to keep region/city
// values homogeneous in the database (no more free-typed city spelling
// variants breaking the heatmap's grouping).
//
// Towns are each region's chief town (the regional capital) followed by
// every one of that region's official department (département) capitals,
// sourced from:
//   - Region list + capitals: https://en.wikipedia.org/wiki/Regions_of_Cameroon
//   - Department list per region: https://en.wikipedia.org/wiki/Departments_of_Cameroon
//   - Department capitals cross-checked individually via Wikipedia/citypopulation.de
//     (see the trickier ones: Fako's capital is Limbé, not Buea — Buea is the
//     *region's* capital and is also in Fako department, so both are listed).
//
// Yaoundé and Douala additionally list well-known quartiers (neighborhoods)
// — e.g. Mendong, Bastos, Akwa — since a subscriber in a big city rarely
// thinks of themselves as being in "Yaoundé" broadly; these narrow the
// heatmap and give agents a more useful location than the department capital
// alone. Sourced from French Wikipedia's quartier lists (fr.wikipedia.org/wiki/Quartiers_de_Yaoundé
// and .../Quartiers_de_Douala) — a curated, representative subset, not the
// full ~114 (Yaoundé) / ~120 (Douala) exhaustive lists.
//
// Keys must exactly match REGIONS in constants.ts. First entry in each list
// is always that region's own capital, so it sorts first in the dropdown.
export const TOWNS_BY_REGION: Record<string, string[]> = {
  Adamaoua: ['Ngaoundéré', 'Meiganga', 'Tibati', 'Tignère', 'Banyo'],
  Centre: [
    'Yaoundé', 'Bastos', 'Nlongkak', 'Elig-Essono', 'Mendong', 'Etoudi',
    'Ngousso', 'Mvog-Ada', 'Emana', 'Mvan', 'Nsam', 'Obili', 'Efoulan',
    'Melen', 'Tsinga', 'Biyem-Assi', 'Ekounou', 'Odza',
    'Mbalmayo', 'Bafia', 'Monatélé', 'Ntui', 'Mfou', 'Ngoumou', 'Eséka',
    'Akonolinga', 'Nanga-Eboko',
  ],
  East: ['Bertoua', 'Batouri', 'Abong-Mbang', 'Yokadouma'],
  'Far North': ['Maroua', 'Kousséri', 'Yagoua', 'Kaélé', 'Mora', 'Mokolo'],
  Littoral: [
    'Douala', 'Akwa', 'Bonanjo', 'Bonapriso', 'Bonabéri', 'Deido', 'New-Bell',
    'Ndokoti', 'Bépanda', 'Makepe', 'Bonamoussadi', 'Logbaba', 'Kotto',
    'PK8', 'PK10', 'PK12', 'Yassa',
    'Nkongsamba', 'Édéa', 'Yabassi',
  ],
  North: ['Garoua', 'Guider', 'Poli', 'Tcholliré'],
  'North West': ['Bamenda', 'Kumbo', 'Wum', 'Nkambe', 'Fundong', 'Mbengwi', 'Ndop'],
  South: ['Ebolowa', 'Kribi', 'Sangmélima', 'Ambam'],
  'South West': ['Buea', 'Limbé', 'Kumba', 'Mamfe', 'Mundemba', 'Bangem', 'Menji'],
  West: [
    'Bafoussam', 'Dschang', 'Mbouda', 'Foumban', 'Bafang', 'Bangangté',
    'Bandjoun', 'Baham',
  ],
};
