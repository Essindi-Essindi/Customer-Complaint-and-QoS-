// Canonical region -> city -> locality data for Cameroon, used to populate
// the region -> city -> locality cascading dropdowns on complaint
// submission and to keep those three values homogeneous in the database (no
// more free-typed spelling variants breaking the heatmap's grouping).
// Mirrors src/main/java/.../model/CameroonLocations.java exactly — keep
// both in sync by hand if either changes, there's no shared source of truth
// across the Java/TypeScript boundary.
//
// OTHER is the shared "not in the list" escape hatch, always offered as the
// last option for both city and locality — picking it is expected to come
// with the real place named in the complaint description instead (see
// SubmitComplaint.tsx's dynamic placeholder).
export const OTHER = 'Other';

// Cities are each region's chief town (the regional capital) followed by
// every one of that region's official department (département) capitals,
// sourced from:
//   - Region list + capitals: https://en.wikipedia.org/wiki/Regions_of_Cameroon
//   - Department list per region: https://en.wikipedia.org/wiki/Departments_of_Cameroon
//   - Department capitals cross-checked individually via Wikipedia/citypopulation.de
//     (see the trickier ones: Fako's capital is Limbé, not Buea — Buea is the
//     *region's* capital and is also in Fako department, so both are listed).
//
// Keys must exactly match REGIONS in constants.ts. First entry in each list
// is always that region's own capital, so it sorts first in the dropdown.
export const TOWNS_BY_REGION: Record<string, string[]> = {
  Adamaoua: ['Ngaoundéré', 'Meiganga', 'Tibati', 'Tignère', 'Banyo'],
  Centre: [
    'Yaoundé', 'Mbalmayo', 'Bafia', 'Monatélé', 'Ntui', 'Mfou', 'Ngoumou',
    'Eséka', 'Akonolinga', 'Nanga-Eboko',
  ],
  East: ['Bertoua', 'Batouri', 'Abong-Mbang', 'Yokadouma'],
  'Far North': ['Maroua', 'Kousséri', 'Yagoua', 'Kaélé', 'Mora', 'Mokolo'],
  Littoral: ['Douala', 'Nkongsamba', 'Édéa', 'Yabassi'],
  North: ['Garoua', 'Guider', 'Poli', 'Tcholliré'],
  'North West': ['Bamenda', 'Kumbo', 'Wum', 'Nkambe', 'Fundong', 'Mbengwi', 'Ndop'],
  South: ['Ebolowa', 'Kribi', 'Sangmélima', 'Ambam'],
  'South West': ['Buea', 'Limbé', 'Kumba', 'Mamfe', 'Mundemba', 'Bangem', 'Menji'],
  West: [
    'Bafoussam', 'Dschang', 'Mbouda', 'Foumban', 'Bafang', 'Bangangté',
    'Bandjoun', 'Baham',
  ],
};

// Localities (quartiers) are only curated for each region's own capital —
// the one city per region large enough that "which quartier" is actually
// useful to know. A curated representative subset (8-20 each), not each
// city's full official quartier list (Yaoundé alone has ~114), sourced from
// French Wikipedia's quartier list pages (fr.wikipedia.org/wiki/Quartiers_de_*)
// where one exists, otherwise cross-referenced across multiple sources. A
// city with no entry here still gets a working locality field — it just
// only offers OTHER, since there's no curated list to show.
export const LOCALITIES_BY_CITY: Record<string, string[]> = {
  Ngaoundéré: ['Baladji', 'Dang', 'Bamyanga', 'Sabongari', 'Wakwa', 'Béka-Hosséré', 'Madagascar', 'Joli-Soir'],
  Yaoundé: [
    'Bastos', 'Nlongkak', 'Elig-Essono', 'Mendong', 'Montée Jouvence', 'Etoudi',
    'Ngousso', 'Mvog-Ada', 'Emana', 'Mvan', 'Nsam', 'Obili', 'Efoulan',
    'Melen', 'Tsinga', 'Biyem-Assi', 'Ekounou', 'Odza',
  ],
  Bertoua: ['Mokolo', 'Nkolbikon', 'Madagascar', 'Tigaza', 'Ndongoffi', 'Bamvele', 'Nyangaza'],
  Maroua: ['Domayo', 'Djarengol', 'Kongola', 'Makabaye', 'Ouro-Tchédé', 'Pallar', 'Baouliwol', 'Hardé'],
  Douala: [
    'Akwa', 'Bonanjo', 'Bonapriso', 'Bonabéri', 'Deido', 'New-Bell', 'Ndokoti',
    'Bépanda', 'Makepe', 'Bonamoussadi', 'Logbaba', 'Kotto', 'PK8', 'PK10', 'PK12', 'Yassa',
  ],
  Garoua: ['Roumdé-Adjia', 'Foulbéré', 'Kakataré', 'Lopéré', 'Poumpoumré', 'Yelwa', 'Marouaré'],
  Bamenda: ['Nkwen', 'Up Station', 'Commercial Avenue', 'Ntamulung', 'Mankon', 'Mendankwe', 'New-Layout'],
  Ebolowa: ['Angalé', 'Ébolowa-Si 1', 'Ébolowa-Si 2', 'Abang', "Nko'ovos", 'Mekalat-Yévol'],
  Buea: [
    'Molyko', 'Buea Station', 'Muea', 'GRA', 'Mile 16', 'Great Soppo',
    'Bonduma', 'Likoko-Membea', 'Bokwaongo', 'Small Soppo',
  ],
  Bafoussam: [
    'Banengo', 'Djeleng', 'Famla', 'Kamkop', 'Tamdja', 'Quartier Eveché',
    'Quartier Haoussa', 'Djemoum', 'Tougang',
  ],
};
