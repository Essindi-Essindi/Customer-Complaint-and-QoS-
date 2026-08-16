package customer_complaint.customer_complaint.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Canonical region -&gt; city -&gt; locality data for Cameroon. Mirrors
 * camtel-app/src/lib/cameroonLocations.ts exactly — keep both in sync by
 * hand if either changes, there's no shared source of truth across the
 * Java/TypeScript boundary.
 * <p>
 * Backs {@code ComplaintServiceImpl.submit()}'s region/city/locality
 * validation so a complaint can't be saved with a city that doesn't belong
 * to its region, or a locality that doesn't belong to its city — the same
 * closed lists the frontend's three-level cascading dropdown is built from,
 * so they can never drift into free-typed spelling variants that would
 * fragment the heatmap's per-region grouping. {@link #OTHER} is always a
 * legal city or locality value — it's the escape hatch for "not in the
 * list", where the subscriber is expected to type the real one into the
 * complaint description instead.
 * <p>
 * Cities are each region's chief town (the regional capital) followed by
 * every one of that region's official department (département) capitals,
 * sourced from:
 * - Region list + capitals: https://en.wikipedia.org/wiki/Regions_of_Cameroon
 * - Department list per region: https://en.wikipedia.org/wiki/Departments_of_Cameroon
 * - Department capitals cross-checked individually via Wikipedia/citypopulation.de
 * <p>
 * Localities (quartiers) are only curated for each region's own capital —
 * the one city per region large enough that "which quartier" is actually
 * useful to know. A curated representative subset (8-20 each), not each
 * city's full official quartier list (Yaoundé alone has ~114), sourced from
 * French Wikipedia's quartier list pages (fr.wikipedia.org/wiki/Quartiers_de_*)
 * where one exists, otherwise cross-referenced across multiple sources.
 */
public final class CameroonLocations {

    /** Escape hatch for "not in the list" — always valid for city or locality. */
    public static final String OTHER = "Other";

    private static final Map<String, List<String>> TOWNS_BY_REGION = buildTownsByRegion();
    private static final Map<String, List<String>> LOCALITIES_BY_CITY = buildLocalitiesByCity();

    private CameroonLocations() {
    }

    private static Map<String, List<String>> buildTownsByRegion() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("Adamaoua", List.of("Ngaoundéré", "Meiganga", "Tibati", "Tignère", "Banyo"));
        m.put("Centre", List.of(
                "Yaoundé", "Mbalmayo", "Bafia", "Monatélé", "Ntui", "Mfou", "Ngoumou",
                "Eséka", "Akonolinga", "Nanga-Eboko"));
        m.put("East", List.of("Bertoua", "Batouri", "Abong-Mbang", "Yokadouma"));
        m.put("Far North", List.of("Maroua", "Kousséri", "Yagoua", "Kaélé", "Mora", "Mokolo"));
        m.put("Littoral", List.of("Douala", "Nkongsamba", "Édéa", "Yabassi"));
        m.put("North", List.of("Garoua", "Guider", "Poli", "Tcholliré"));
        m.put("North West", List.of("Bamenda", "Kumbo", "Wum", "Nkambe", "Fundong", "Mbengwi", "Ndop"));
        m.put("South", List.of("Ebolowa", "Kribi", "Sangmélima", "Ambam"));
        m.put("South West", List.of("Buea", "Limbé", "Kumba", "Mamfe", "Mundemba", "Bangem", "Menji"));
        m.put("West", List.of(
                "Bafoussam", "Dschang", "Mbouda", "Foumban", "Bafang", "Bangangté",
                "Bandjoun", "Baham"));
        return Map.copyOf(m);
    }

    private static Map<String, List<String>> buildLocalitiesByCity() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("Ngaoundéré", List.of(
                "Baladji", "Dang", "Bamyanga", "Sabongari", "Wakwa", "Béka-Hosséré",
                "Madagascar", "Joli-Soir"));
        m.put("Yaoundé", List.of(
                "Bastos", "Nlongkak", "Elig-Essono", "Mendong", "Montée Jouvence", "Etoudi",
                "Ngousso", "Mvog-Ada", "Emana", "Mvan", "Nsam", "Obili", "Efoulan",
                "Melen", "Tsinga", "Biyem-Assi", "Ekounou", "Odza"));
        m.put("Bertoua", List.of(
                "Mokolo", "Nkolbikon", "Madagascar", "Tigaza", "Ndongoffi", "Bamvele", "Nyangaza"));
        m.put("Maroua", List.of(
                "Domayo", "Djarengol", "Kongola", "Makabaye", "Ouro-Tchédé", "Pallar",
                "Baouliwol", "Hardé"));
        m.put("Douala", List.of(
                "Akwa", "Bonanjo", "Bonapriso", "Bonabéri", "Deido", "New-Bell", "Ndokoti",
                "Bépanda", "Makepe", "Bonamoussadi", "Logbaba", "Kotto", "PK8", "PK10", "PK12", "Yassa"));
        m.put("Garoua", List.of(
                "Roumdé-Adjia", "Foulbéré", "Kakataré", "Lopéré", "Poumpoumré", "Yelwa", "Marouaré"));
        m.put("Bamenda", List.of(
                "Nkwen", "Up Station", "Commercial Avenue", "Ntamulung", "Mankon",
                "Mendankwe", "New-Layout"));
        m.put("Ebolowa", List.of(
                "Angalé", "Ébolowa-Si 1", "Ébolowa-Si 2", "Abang", "Nko'ovos", "Mekalat-Yévol"));
        m.put("Buea", List.of(
                "Molyko", "Buea Station", "Muea", "GRA", "Mile 16", "Great Soppo",
                "Bonduma", "Likoko-Membea", "Bokwaongo", "Small Soppo"));
        m.put("Bafoussam", List.of(
                "Banengo", "Djeleng", "Famla", "Kamkop", "Tamdja", "Quartier Eveché",
                "Quartier Haoussa", "Djemoum", "Tougang"));
        return Map.copyOf(m);
    }

    public static Map<String, List<String>> townsByRegion() {
        return TOWNS_BY_REGION;
    }

    public static List<String> localitiesForCity(String city) {
        return LOCALITIES_BY_CITY.getOrDefault(city, List.of());
    }

    public static boolean isValidRegion(String region) {
        return region != null && TOWNS_BY_REGION.containsKey(region);
    }

    /** True if region is known AND (city is one of that region's towns OR city == OTHER). */
    public static boolean isValidCityForRegion(String region, String city) {
        if (OTHER.equals(city)) {
            return isValidRegion(region);
        }
        List<String> towns = TOWNS_BY_REGION.get(region);
        return towns != null && city != null && towns.contains(city);
    }

    /**
     * True if locality is blank/absent (it's optional), OR == OTHER, OR is
     * one of that city's curated localities. Only meaningful when city is a
     * real city (not OTHER) — callers should skip this check entirely when
     * city == OTHER, since there's nothing to validate a locality against.
     */
    public static boolean isValidLocalityForCity(String city, String locality) {
        if (locality == null || locality.isBlank() || OTHER.equals(locality)) {
            return true;
        }
        return localitiesForCity(city).contains(locality);
    }
}
