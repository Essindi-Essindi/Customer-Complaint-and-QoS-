package customer_complaint.customer_complaint.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// Class-level constraint for RegisterSubscriberRequest: email and phone are
// each individually optional, but at least one must be supplied. See
// EmailOrPhoneRequiredValidator.
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EmailOrPhoneRequiredValidator.class)
public @interface EmailOrPhoneRequired {

    String message() default "Provide at least an email address or a phone number";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
