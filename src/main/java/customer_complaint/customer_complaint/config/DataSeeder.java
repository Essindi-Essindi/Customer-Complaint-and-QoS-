package customer_complaint.customer_complaint.config;

// ============================================================================
// reset instructions
// ============================================================================

import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Attachment;
import customer_complaint.customer_complaint.model.CameroonLocations;
import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Notification;
import customer_complaint.customer_complaint.model.Report;
import customer_complaint.customer_complaint.model.Resolution;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.NotificationStatus;
import customer_complaint.customer_complaint.model.enums.ReportType;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.AttachmentRepository;
import customer_complaint.customer_complaint.repository.CategoryRepository;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.NotificationRepository;
import customer_complaint.customer_complaint.repository.ReportRepository;
import customer_complaint.customer_complaint.repository.ResolutionRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Fills a freshly-created (empty) database with test data — every account's
 * password is "123456789" — so the app is immediately explorable after a
 * table wipe + restart instead of landing on a blank dashboard with no
 * heatmap data. Only runs once: guarded on {@code userRepository.count() ==
 * 0}, so it's a no-op the moment any real registration or manager-created
 * account exists. Can be turned off entirely via app.seed-data=false in
 * .env if that guard alone isn't enough (e.g. before pointing this at a
 * database you don't want touched even once).
 * <p>
 * Complaints are inserted directly via the repository rather than through
 * ComplaintServiceImpl.submit() — that path also fires SMS/email
 * notifications and a captcha check, none of which make sense for
 * synthetic data. Region totals are deliberately spread across every bucket
 * of CameroonHeatMap.tsx's fixed scale (0-5 / 6-10 / 11-15 / 16-20 / 21+) so
 * the map actually shows the full white-to-red range instead of one color.
 * <p>
 * Attachments, notifications, resolutions, and reports (10 rows each) are
 * seeded off the generated complaints/managers/agents so every table has
 * data, not just users/categories/complaints/tickets.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String PASSWORD = "123456789";
    private static final Random RANDOM = new Random(42); // fixed value

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ComplaintRepository complaintRepository;
    private final AttachmentRepository attachmentRepository;
    private final NotificationRepository notificationRepository;
    private final ResolutionRepository resolutionRepository;
    private final ReportRepository reportRepository;
    private final TicketService ticketService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-data:true}")
    private boolean seedEnabled;

    // sample data
    private static final List<Object[]> REGION_COUNTS = List.of(
            new Object[] { "Centre", 24 },
            new Object[] { "Littoral", 18 },
            new Object[] { "East", 15 },
            new Object[] { "West", 12 },
            new Object[] { "North West", 8 },
            new Object[] { "Far North", 6 },
            new Object[] { "South West", 4 },
            new Object[] { "North", 3 },
            new Object[] { "Adamaoua", 1 },
            new Object[] { "South", 0 }
    );

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }
        if (userRepository.count() > 0) {
            log.info("DataSeeder: users already exist, skipping seed");
            return;
        }
        log.info("DataSeeder: empty database detected, seeding test data (all passwords: {})", PASSWORD);

        List<Category> categories = seedCategories();
        List<Manager> managers = seedManagers();
        List<Agent> agents = seedAgents();
        List<Subscriber> subscribers = seedSubscribers();
        List<Complaint> complaints = seedComplaints(categories, agents, subscribers);
        seedAttachments(complaints);
        seedNotifications(complaints);
        seedResolutions(complaints, agents);
        seedReports(managers);

        log.info("DataSeeder: done — {} managers, {} agents, {} subscribers, {} complaints seeded (plus 10 rows each of attachments/notifications/resolutions/reports)",
                managers.size(), agents.size(), subscribers.size(), complaints.size());
    }

    private List<Category> seedCategories() {
        List<String> names = List.of("Slow Internet", "Call Drop", "Billing Error", "No Signal", "Service Outage");
        List<Category> saved = new ArrayList<>();
        for (String name : names) {
            Category c = new Category();
            c.setName(name);
            c.setDescription(name + " complaints");
            saved.add(categoryRepository.save(c));
        }
        return saved;
    }

    private List<Manager> seedManagers() {
        List<Manager> saved = new ArrayList<>();
        saved.add(saveManager("Manager One", "manager1@camtel.cm", "670000001", "Customer Care"));
        saved.add(saveManager("Manager Two", "manager2@camtel.cm", "670000002", "Network Operations"));
        return saved;
    }

    private Manager saveManager(String name, String email, String phone, String department) {
        Manager m = new Manager();
        m.setName(name);
        m.setEmail(email);
        m.setPhone(phone);
        m.setPasswordHash(passwordEncoder.encode(PASSWORD));
        m.setDepartment(department);
        return userRepository.save(m);
    }

    private List<Agent> seedAgents() {
        List<Object[]> defs = List.of(
                new Object[] { "Centre", ServiceType.MOBILE },
                new Object[] { "Centre", ServiceType.ADSL },
                new Object[] { "Littoral", ServiceType.MOBILE },
                new Object[] { "Littoral", ServiceType.FTTH },
                new Object[] { "East", ServiceType.MOBILE },
                new Object[] { "West", ServiceType.ADSL },
                new Object[] { "North West", ServiceType.MOBILE },
                new Object[] { "Far North", ServiceType.FTTH }
        );
        List<Agent> saved = new ArrayList<>();
        int i = 1;
        for (Object[] def : defs) {
            Agent a = new Agent();
            a.setName("Agent " + i);
            a.setEmail("agent" + i + "@camtel.cm");
            a.setPhone("6700001" + String.format("%02d", i));
            a.setPasswordHash(passwordEncoder.encode(PASSWORD));
            a.setAssignedRegion((String) def[0]);
            a.setAssignedService(((ServiceType) def[1]).name());
            saved.add(userRepository.save(a));
            i++;
        }
        return saved;
    }

    private List<Subscriber> seedSubscribers() {
        List<Subscriber> saved = new ArrayList<>();
        ServiceType[] types = ServiceType.values();
        for (int i = 1; i <= 20; i++) {
            Subscriber s = new Subscriber();
            s.setName("Subscriber " + i);
            s.setEmail("subscriber" + i + "@example.cm");
            s.setPhone("6800000" + String.format("%02d", i));
            s.setPasswordHash(passwordEncoder.encode(PASSWORD));
            s.setCamtelAccountNumber("CMT" + String.format("%07d", i));
            s.setServiceType(types[i % types.length].name());
            saved.add(userRepository.save(s));
        }
        return saved;
    }

    private List<Complaint> seedComplaints(List<Category> categories, List<Agent> agents, List<Subscriber> subscribers) {
        List<Complaint> savedComplaints = new ArrayList<>();
        ServiceType[] serviceTypes = ServiceType.values();
        ComplaintStatus[] statuses = ComplaintStatus.values();

        for (Object[] regionCount : REGION_COUNTS) {
            String region = (String) regionCount[0];
            int count = (int) regionCount[1];
            List<String> towns = CameroonLocations.townsByRegion().get(region);

            for (int i = 0; i < count; i++) {
                String city = RANDOM.nextInt(10) == 0
                        ? CameroonLocations.OTHER
                        : towns.get(RANDOM.nextInt(towns.size()));

                String locality = null;
                if (!CameroonLocations.OTHER.equals(city)) {
                    List<String> localities = CameroonLocations.localitiesForCity(city);
                    if (!localities.isEmpty() && RANDOM.nextBoolean()) {
                        locality = RANDOM.nextInt(8) == 0
                                ? CameroonLocations.OTHER
                                : localities.get(RANDOM.nextInt(localities.size()));
                    }
                }

                ServiceType serviceType = serviceTypes[RANDOM.nextInt(serviceTypes.length)];
                ComplaintStatus status = statuses[RANDOM.nextInt(statuses.length)];
                Category category = categories.get(RANDOM.nextInt(categories.size()));
                Subscriber subscriber = subscribers.get(RANDOM.nextInt(subscribers.size()));

                Complaint complaint = new Complaint();
                complaint.setIdempotencyKey(java.util.UUID.randomUUID().toString());
                complaint.setSubscriber(subscriber);
                complaint.setType(category.getName());
                complaint.setCategory(category);
                complaint.setServiceType(serviceType);
                complaint.setRegion(region);
                complaint.setCity(city);
                complaint.setLocality(locality);
                complaint.setDescription(CameroonLocations.OTHER.equals(city) || CameroonLocations.OTHER.equals(locality)
                        ? "Exact location: " + city + (locality != null ? ", " + locality : "")
                        : null);
                complaint.setStatus(status);
                complaint.setTicketNumber(ticketService.nextTicketNumber());

                LocalDateTime createdAt = LocalDateTime.now().minusDays(RANDOM.nextInt(30)).minusHours(RANDOM.nextInt(24));
                complaint.setCreatedAt(createdAt);

                if (status != ComplaintStatus.SUBMITTED && !agents.isEmpty()) {
                    Agent agent = agents.stream()
                            .filter(a -> serviceType.name().equals(a.getAssignedService()))
                            .findFirst()
                            .orElse(agents.get(RANDOM.nextInt(agents.size())));
                    complaint.setAgent(agent);
                    complaint.setUpdatedAt(createdAt.plusHours(1 + RANDOM.nextInt(48)));
                }

                Complaint saved = complaintRepository.save(complaint);
                ticketService.generateFor(saved);
                savedComplaints.add(saved);
            }
        }
        return savedComplaints;
    }

    private void seedAttachments(List<Complaint> complaints) {
        String[] fileTypes = { "image/jpeg", "image/png", "application/pdf" };
        int n = Math.min(10, complaints.size());
        for (int i = 0; i < n; i++) {
            Complaint complaint = complaints.get(i);
            Attachment a = new Attachment();
            a.setComplaint(complaint);
            a.setFileName("evidence-" + (i + 1) + "." + (i % 3 == 2 ? "pdf" : "jpg"));
            a.setFileType(fileTypes[i % fileTypes.length]);
            a.setFilePath("attachments/seed/evidence-" + (i + 1));
            a.setUploadedAt(complaint.getCreatedAt().plusMinutes(2));
            attachmentRepository.save(a);
        }
    }

    private void seedNotifications(List<Complaint> complaints) {
        String[] types = { "SMS", "EMAIL" };
        int n = Math.min(10, complaints.size());
        for (int i = 0; i < n; i++) {
            Complaint complaint = complaints.get(i);
            Notification note = new Notification();
            note.setRecipient(complaint.getSubscriber());
            note.setComplaint(complaint);
            note.setMessage("Your complaint " + complaint.getTicketNumber() + " has been received.");
            note.setType(types[i % types.length]);
            note.setStatus(NotificationStatus.SENT);
            note.setSentAt(complaint.getCreatedAt().plusMinutes(5));
            notificationRepository.save(note);
        }
    }

    private void seedResolutions(List<Complaint> complaints, List<Agent> agents) {
        List<Complaint> pool = complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED)
                .toList();
        if (pool.size() < 10) {
            pool = complaints;
        }
        int n = Math.min(10, pool.size());
        for (int i = 0; i < n; i++) {
            Complaint complaint = pool.get(i);
            Resolution r = new Resolution();
            r.setComplaint(complaint);
            r.setResolvedBy(agents.isEmpty() ? null : agents.get(i % agents.size()));
            r.setNote("Issue diagnosed and resolved on site.");
            r.setResolvedAt(complaint.getUpdatedAt() != null ? complaint.getUpdatedAt() : complaint.getCreatedAt());
            r.setRating(3 + (i % 3));
            r.setRatingComment("Resolved satisfactorily.");
            resolutionRepository.save(r);
        }
    }

    private void seedReports(List<Manager> managers) {
        if (managers.isEmpty()) {
            return;
        }
        ReportType[] types = ReportType.values();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 10; i++) {
            Report r = new Report();
            r.setGeneratedBy(managers.get(i % managers.size()));
            ReportType type = types[i % types.length];
            r.setType(type);
            if (type == ReportType.WEEKLY) {
                r.setStartDate(today.minusWeeks(i + 1));
                r.setEndDate(today.minusWeeks(i));
            } else {
                r.setStartDate(today.minusMonths(i + 1));
                r.setEndDate(today.minusMonths(i));
            }
            r.setGeneratedAt(LocalDateTime.now().minusDays(i));
            r.setFilePath("reports/seed/report-" + (i + 1) + ".pdf");
            reportRepository.save(r);
        }
    }
}
