package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

// Sends every subscriber-facing email in the app: registration verification
// codes, the welcome email once verified, and complaint status updates.
// Every method is @Async and swallows its own exceptions (logging instead)
// so a slow/unreachable SMTP server can never turn a 200-worthy business
// operation (register, submit a complaint, change its status) into a 500 -
// the same "best-effort side channel" principle NotificationServiceImpl
// already applies to SMS.
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Override
    @Async("emailTaskExecutor")
    public void sendVerificationCode(Subscriber subscriber, String code) {
        String subject = "CAMTEL - Verify your email / Vérifiez votre e-mail";
        String body = "Hello " + subscriber.getName() + ",\n\n"
                + "Your CAMTEL verification code is: " + code + "\n"
                + "This code expires in 15 minutes.\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
                + "---\n\n"
                + "Bonjour " + subscriber.getName() + ",\n\n"
                + "Votre code de vérification CAMTEL est : " + code + "\n"
                + "Ce code expire dans 15 minutes.\n\n"
                + "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\n"
                + "- The CAMTEL Team / L'équipe CAMTEL";
        send(subscriber.getEmail(), subject, body);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendWelcomeEmail(Subscriber subscriber) {
        String subject = "Welcome to CAMTEL / Bienvenue chez CAMTEL";
        String body = "Hello " + subscriber.getName() + ",\n\n"
                + "Your email is verified and your CAMTEL account is ready. "
                + "You can now sign in and submit or track complaints.\n\n"
                + "---\n\n"
                + "Bonjour " + subscriber.getName() + ",\n\n"
                + "Votre e-mail est vérifié et votre compte CAMTEL est prêt. "
                + "Vous pouvez maintenant vous connecter et déposer ou suivre des plaintes.\n\n"
                + "- The CAMTEL Team / L'équipe CAMTEL";
        send(subscriber.getEmail(), subject, body);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendComplaintStatusEmail(Complaint complaint) {
        Subscriber subscriber = complaint.getSubscriber();
        if (subscriber == null || subscriber.getEmail() == null || subscriber.getEmail().isBlank()) {
            return;
        }

        String subject;
        String statusEn;
        String statusFr;
        switch (complaint.getStatus()) {
            case SUBMITTED -> {
                subject = "CAMTEL - Complaint received / Plainte reçue";
                statusEn = "has been received and is now submitted";
                statusFr = "a été reçue et est maintenant soumise";
            }
            case ASSIGNED -> {
                subject = "CAMTEL - Complaint assigned / Plainte assignée";
                statusEn = "has been assigned to an agent";
                statusFr = "a été assignée à un agent";
            }
            case RESOLVED -> {
                subject = "CAMTEL - Complaint resolved / Plainte résolue";
                statusEn = "has been resolved";
                statusFr = "a été résolue";
            }
            default -> {
                // IN_PROGRESS (and anything else) intentionally sends no
                // email — only SUBMITTED / ASSIGNED / RESOLVED were asked for.
                return;
            }
        }

        String body = "Hello " + subscriber.getName() + ",\n\n"
                + "Your complaint " + complaint.getTicketNumber() + " " + statusEn + ".\n\n"
                + "---\n\n"
                + "Bonjour " + subscriber.getName() + ",\n\n"
                + "Votre plainte " + complaint.getTicketNumber() + " " + statusFr + ".\n\n"
                + "- The CAMTEL Team / L'équipe CAMTEL";

        send(subscriber.getEmail(), subject, body);
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Could not send email to {} - {}", to, ex.getMessage());
        }
    }
}
