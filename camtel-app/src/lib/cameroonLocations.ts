// location data setup
export const OTHER = 'Other';

// city list data
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

// locality list data
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
