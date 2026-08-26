package customer_complaint.customer_complaint.dto.validation;

import customer_complaint.customer_complaint.dto.request.RegisterSubscriberRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EmailOrPhoneRequiredValidator
        implements ConstraintValidator<EmailOrPhoneRequired, RegisterSubscriberRequest> {

    @Override
    public boolean isValid(RegisterSubscriberRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true; // edge case
        }
        boolean hasEmail = request.getEmail() != null && !request.getEmail().isBlank();
        boolean hasPhone = request.getPhone() != null && !request.getPhone().isBlank();
        return hasEmail || hasPhone;
    }
}
