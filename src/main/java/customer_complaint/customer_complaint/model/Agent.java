package customer_complaint.customer_complaint.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// staff handling complaints in a region/service
@Entity
@DiscriminatorValue("AGENT")
@Getter
@Setter
@NoArgsConstructor
public class Agent extends User {

    private String assignedRegion;

    private String assignedService;
}
