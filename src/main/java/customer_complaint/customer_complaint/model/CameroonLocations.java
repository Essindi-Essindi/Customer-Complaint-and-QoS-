package customer_complaint.customer_complaint.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Canonical region -&gt; town list for Cameroon. Mirrors
 * camtel-app/src/lib/cameroonLocations.ts exactly — keep both in sync by
 * hand if either changes, there's no shared source of truth across the
 * Java/TypeScript boundary.
 * <p>
 * Backs {@code ComplaintServiceImpl.submit()}'s region/city validation so a
 * complaint can't be saved with a city that doesn't belong to its region (or
 * either being outside this list at all) — the same closed list the
 * frontend's cascading dropdown is built from, so the two can never drift
 * into free-typed spelling variants that would fragment the heatmap's
 * per-region grouping.
 * <p>
 * Towns are each region's chief town (the regional capital) followed by
 * every one of that region's official department (département) capitals.
 * Yaoundé and Douala additionally list well-known quartiers (Mendong,
 * Bastos, Akwa, ...) — a curated subset of French Wikipedia's quartier
 * lists, not the full ~114 / ~120 exhaustive ones. Sourced from:
 * - Region list + capitals: https://en.wikipedia.org/wiki/Regions_of_Cameroon
 * - Department list per region: https://en.wikipedia.org/wiki/Departments_of_Cameroon
 * - Department capitals cross-checked individually via Wikipedia/citypopulation.de
 * - Quartiers: fr.wikipedia.org/wiki/Quartiers_de_Yaoundé and .../Quartiers_de_Douala
 */
public final class CameroonLocations {

    private static final Map<String, List<String>> TOWNS_BY_REGION = buildMap();

    private CameroonLocations() {
    }

    private static Map<String, List<String>> buildMap() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("Adamaoua", List.of("Ngaoundéré", "Meiganga", "Tibati", "Tignère", "Banyo"));
        m.put("Centre", List.of(
                "Yaoundé", "Bastos", "Nlongkak", "Elig-Essono", "Mendong", "Etoudi",
                "Ngousso", "Mvog-Ada", "Emana", "Mvan", "Nsam", "Obili", "Efoulan",
                "Melen", "Tsinga", "Biyem-Assi", "Ekounou", "Odza",
                "Mbalmayo", "Bafia", "Monatélé", "Ntui", "Mfou", "Ngoumou", "Eséka",
                "Akonolinga", "Nanga-Eboko"));
        m.put("East", List.of("Bertoua", "Batouri", "Abong-Mbang", "Yokadouma"));
        m.put("Far North", List.of("Maroua", "Kousséri", "Yagoua", "Kaélé", "Mora", "Mokolo"));
        m.put("Littoral", List.of(
                "Douala", "Akwa", "Bonanjo", "Bonapriso", "Bonabéri", "Deido", "New-Bell",
                "Ndokoti", "Bépanda", "Makepe", "Bonamoussadi", "Logbaba", "Kotto",
                "PK8", "PK10", "PK12", "Yassa",
                "Nkongsamba", "Édéa", "Yabassi"));
        m.put("North", List.of("Garoua", "Guider", "Poli", "Tcholliré"));
        m.put("North West", List.of("Bamenda", "Kumbo", "Wum", "Nkambe", "Fundong", "Mbengwi", "Ndop"));
        m.put("South", List.of("Ebolowa", "Kribi", "Sangmélima", "Ambam"));
        m.put("South West", List.of("Buea", "Limbé", "Kumba", "Mamfe", "Mundemba", "Bangem", "Menji"));
        m.put("West", List.of(
                "Bafoussam", "Dschang", "Mbouda", "Foumban", "Bafang", "Bangangté",
                "Bandjoun", "Baham"));
        return Map.copyOf(m);
    }

    public static Map<String, List<String>> townsByRegion() {
        return TOWNS_BY_REGION;
    }

    public static boolean isValidRegion(String region) {
        return region != null && TOWNS_BY_REGION.containsKey(region);
    }

    /** True only if region is known AND city is one of that region's towns. */
    public static boolean isValidCityForRegion(String region, String city) {
        List<String> towns = TOWNS_BY_REGION.get(region);
        return towns != null && city != null && towns.contains(city);
    }
}
