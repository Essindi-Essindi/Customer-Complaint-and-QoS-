package customer_complaint.customer_complaint.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// entity subclass
@Entity
@DiscriminatorValue("SUBSCRIBER")
@Getter
@Setter
@NoArgsConstructor
public class Subscriber extends User {

    private String camtelAccountNumber;

    private String serviceType;
}
