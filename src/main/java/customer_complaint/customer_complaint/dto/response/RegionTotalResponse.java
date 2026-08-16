package customer_complaint.customer_complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// One region's total complaint count — feeds CameroonHeatMap.tsx's map
// shading. Deliberately separate from the paginated /heatmap city
// breakdown (HeatMapResponse): the map needs every region's true total
// regardless of which page of the city table is currently showing, so it
// can never be computed by aggregating just the current page's rows.
@Getter
@Setter
@AllArgsConstructor
public class RegionTotalResponse {

    private String region;
    private long complaintCount;
}
