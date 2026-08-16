package customer_complaint.customer_complaint.config;

import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.CameroonLocations;
import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.CategoryRepository;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Fills a freshly-created (empty) database with test data — every account's
 * password is "123456789" — so the app is immediately explorable after a
 * `DROP DATABASE` + restart instead of landing on a blank dashboard with no
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
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String PASSWORD = "123456789";
    private static final Random RANDOM = new Random(42); // fixed seed - reproducible seed data

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ComplaintRepository complaintRepository;
    private final TicketService ticketService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-data:true}")
    private boolean seedEnabled;

    // region -> how many complaints to generate — spans every heatmap
    // bucket (0-5 white, 6-10 green, 11-15 yellow, 16-20 orange, 21+ red).
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
        seedComplaints(categories, agents, subscribers);

        log.info("DataSeeder: done — {} managers, {} agents, {} subscribers seeded",
                managers.size(), agents.size(), subscribers.size());
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
        // (region, serviceType) pairs — deliberately covers the regions
        // carrying the most seeded complaints below, so the agent/manager
        // dashboards have someone plausible to assign/claim work.
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

    private void seedComplaints(List<Category> categories, List<Agent> agents, List<Subscriber> subscribers) {
        ServiceType[] serviceTypes = ServiceType.values();
        ComplaintStatus[] statuses = ComplaintStatus.values();

        for (Object[] regionCount : REGION_COUNTS) {
            String region = (String) regionCount[0];
            int count = (int) regionCount[1];
            List<String> towns = CameroonLocations.townsByRegion().get(region);

            for (int i = 0; i < count; i++) {
                // ~10% of the time exercise the "Other" escape hatch instead
                // of a real listed city, same as a real subscriber could pick.
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

                // Spread over the last 30 days so it falls inside
                // ManagerHeatmap's default date range out of the box.
                LocalDateTime createdAt = LocalDateTime.now().minusDays(RANDOM.nextInt(30)).minusHours(RANDOM.nextInt(24));
                complaint.setCreatedAt(createdAt);

                // Anything past SUBMITTED implies an agent claimed it —
                // pick one whose assignedService matches, falling back to
                // any agent if none match this complaint's service type.
                if (status != ComplaintStatus.SUBMITTED && !agents.isEmpty()) {
                    Agent agent = agents.stream()
                            .filter(a -> serviceType.name().equals(a.getAssignedService()))
                            .findFirst()
                            .orElse(agents.get(RANDOM.nextInt(agents.size())));
                    complaint.setAgent(agent);
                    complaint.setUpdatedAt(createdAt.plusHours(1 + RANDOM.nextInt(48)));
                }

                complaintRepository.save(complaint);
                ticketService.generateFor(complaint);
            }
        }
    }
}
