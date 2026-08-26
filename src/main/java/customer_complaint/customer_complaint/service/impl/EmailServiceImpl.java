package customer_complaint.customer_complaint.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

// handle service logic
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final URI BREVO_EMAIL_URI = URI.create("https://api.brevo.com/v3/smtp/email");

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${brevo.api-key}")
    private String brevoApiKey;

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
                // handle edge case
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
            ObjectNode payload = objectMapper.createObjectNode();
            payload.putObject("sender").put("email", fromAddress);
            payload.putArray("to").addObject().put("email", to);
            payload.put("subject", subject);
            payload.put("textContent", body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(BREVO_EMAIL_URI)
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Could not send email to {} - Brevo returned {}: {}", to, response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.warn("Could not send email to {} - {}", to, ex.getMessage());
        }
    }
}
