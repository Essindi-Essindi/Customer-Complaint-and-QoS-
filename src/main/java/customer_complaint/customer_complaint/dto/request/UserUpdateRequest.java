package customer_complaint.customer_complaint.dto.request;

import lombok.Getter;
import lombok.Setter;

// payload for editing a user
@Getter
@Setter
public class UserUpdateRequest {

    private String name;
    private String phone;
    private Boolean active;
    private String assignedRegion;
    private String assignedService;
    private String department;
}
