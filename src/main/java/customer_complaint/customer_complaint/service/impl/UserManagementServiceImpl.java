package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.UserCreateRequest;
import customer_complaint.customer_complaint.dto.request.UserUpdateRequest;
import customer_complaint.customer_complaint.dto.response.AgentImportResultResponse;
import customer_complaint.customer_complaint.dto.response.AgentImportRowResult;
import customer_complaint.customer_complaint.dto.response.UserResponse;
import customer_complaint.customer_complaint.exception.DuplicateUserException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// creates/updates agents and managers
@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    // Column headers the .xlsx "annuaire" must have (case/accent/space
    // insensitive — see normalizeHeader). Phone is deliberately not
    // required: an agent logs in with the Email column, not a phone number,
    // so a missing phone can't block the import. Email is provided as-is by
    // whoever prepared the annuaire (expected format surname.name@camtel.com)
    // — this importer never derives or rewrites it, only validates and
    // stores it.
    private static final List<String> REQUIRED_COLUMNS =
            List.of("name", "surname", "email", "service", "region", "password");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email already in use");
        }

        User user = switch (request.getRole().toUpperCase()) {
            case "AGENT" -> {
                Agent agent = new Agent();
                agent.setAssignedRegion(request.getAssignedRegion());
                agent.setAssignedService(request.getAssignedService());
                yield agent;
            }
            case "MANAGER" -> {
                Manager manager = new Manager();
                manager.setDepartment(request.getDepartment());
                yield manager;
            }
            default -> throw new IllegalArgumentException("Unsupported role for staff creation: " + request.getRole());
        };

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getActive() != null) user.setActive(request.getActive());

        if (user instanceof Agent agent) {
            if (request.getAssignedRegion() != null) agent.setAssignedRegion(request.getAssignedRegion());
            if (request.getAssignedService() != null) agent.setAssignedService(request.getAssignedService());
        }

        if (user instanceof Manager manager && request.getDepartment() != null) {
            manager.setDepartment(request.getDepartment());
        }

        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public Page<UserResponse> listUsers(String role, Pageable pageable) {
        // role already arrives uppercase from the frontend (Role type is
        // 'SUBSCRIBER' | 'AGENT' | 'MANAGER'), matching the @DiscriminatorValue
        // on each User subclass exactly, so it's passed straight through to
        // the query rather than re-derived from a class name.
        return userRepository.findPageByRole(role, pageable).map(this::toResponse);
    }

    // Bulk-creates AGENT accounts from a manager-uploaded .xlsx annuaire.
    // Deliberately NOT @Transactional across the whole file: each row is
    // saved (or not) on its own, so one bad row can't roll back every good
    // row that came before it in the same file — the per-row try/catch below
    // is what actually isolates failures, this just has to not undo that.
    @Override
    public AgentImportResultResponse importAgents(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded");
        }

        DataFormatter fmt = new DataFormatter();
        List<AgentImportRowResult> results = new ArrayList<>();
        // So two rows in the *same* file that would collide with each other
        // (not just with what's already in the database) are both caught,
        // instead of the second one silently overwriting the first at save
        // time.
        Set<String> emailsThisBatch = new HashSet<>();
        Set<String> phonesThisBatch = new HashSet<>();
        int imported = 0;

        try (InputStream in = file.getInputStream(); Workbook workbook = new XSSFWorkbook(in)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("The uploaded file has no header row");
            }

            Map<String, Integer> colIndex = new HashMap<>();
            for (Cell cell : headerRow) {
                String key = normalizeHeader(fmt.formatCellValue(cell));
                if (!key.isEmpty()) colIndex.put(key, cell.getColumnIndex());
            }

            List<String> missing = REQUIRED_COLUMNS.stream().filter(c -> !colIndex.containsKey(c)).toList();
            if (!missing.isEmpty()) {
                throw new IllegalArgumentException("Missing required column(s): " + String.join(", ", missing)
                        + ". Expected headers: Name, Surname, Email, Service, Region, Password (Phone is optional).");
            }
            Integer phoneCol = colIndex.get("phone");

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isBlankRow(row, fmt)) continue; // blank spacer rows don't count as failures

                int humanRow = r + 1; // 1-based, matches what the row looks like in Excel
                String name = cellValue(row, colIndex.get("name"), fmt);
                String surname = cellValue(row, colIndex.get("surname"), fmt);
                String email = cellValue(row, colIndex.get("email"), fmt);
                String service = cellValue(row, colIndex.get("service"), fmt);
                String region = cellValue(row, colIndex.get("region"), fmt);
                String password = cellValue(row, colIndex.get("password"), fmt);
                String phone = phoneCol == null ? "" : cellValue(row, phoneCol, fmt);
                String displayName = (name + " " + surname).trim();

                try {
                    if (name.isBlank() || surname.isBlank() || email.isBlank() || service.isBlank()
                            || region.isBlank() || password.isBlank()) {
                        throw new IllegalArgumentException(
                                "Name, Surname, Email, Service, Region and Password are all required");
                    }
                    if (!EMAIL_PATTERN.matcher(email).matches()) {
                        throw new IllegalArgumentException(
                                "'" + email + "' doesn't look like a valid email (expected surname.name@camtel.com)");
                    }
                    if (password.length() < 6) {
                        throw new IllegalArgumentException("Password must be at least 6 characters");
                    }
                    ServiceType serviceType = parseServiceType(service);

                    // The Email column is used exactly as written — this is
                    // the login the agent is told to expect, so nothing here
                    // rewrites or auto-suffixes it. A collision is a row
                    // error instead, same as the manual "Create User" form.
                    if (userRepository.existsByEmail(email) || !emailsThisBatch.add(email)) {
                        throw new IllegalArgumentException("Email already in use");
                    }

                    // A phone that collides with an existing account or
                    // another row in this same file is dropped rather than
                    // failing the whole row — the agent logs in with the
                    // Email column, never the phone, so this never blocks
                    // "connect later on without any problem".
                    String normalizedPhone = phone.isBlank() ? null : phone.trim();
                    if (normalizedPhone != null
                            && (userRepository.existsByPhone(normalizedPhone) || !phonesThisBatch.add(normalizedPhone))) {
                        normalizedPhone = null;
                    }

                    Agent agent = new Agent();
                    agent.setAssignedRegion(region.trim());
                    agent.setAssignedService(serviceType.name());
                    agent.setName(displayName);
                    agent.setEmail(email);
                    agent.setPhone(normalizedPhone);
                    agent.setPasswordHash(passwordEncoder.encode(password));
                    userRepository.save(agent);

                    imported++;
                    results.add(new AgentImportRowResult(humanRow, displayName, email, true, "Imported successfully"));
                } catch (Exception rowEx) {
                    results.add(new AgentImportRowResult(humanRow, displayName, "", false, rowEx.getMessage()));
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException(
                    "Could not read the uploaded file — make sure it's a valid .xlsx spreadsheet");
        }

        return new AgentImportResultResponse(results.size(), imported, results.size() - imported, results);
    }

    private String cellValue(Row row, Integer colIndex, DataFormatter fmt) {
        if (colIndex == null) return "";
        Cell cell = row.getCell(colIndex);
        // DataFormatter reads the cell's *displayed* value regardless of its
        // underlying type — a password typed as "123456" or a phone number
        // Excel silently turned numeric both come back as plain text, so
        // neither loses a leading zero nor turns into scientific notation.
        return cell == null ? "" : fmt.formatCellValue(cell).trim();
    }

    private boolean isBlankRow(Row row, DataFormatter fmt) {
        for (Cell cell : row) {
            if (!fmt.formatCellValue(cell).trim().isEmpty()) return false;
        }
        return true;
    }

    private String normalizeHeader(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
    }

    private ServiceType parseServiceType(String raw) {
        try {
            return ServiceType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid service '" + raw + "' — must be one of " + Arrays.toString(ServiceType.values()));
        }
    }

    private UserResponse toResponse(User user) {
        String role = user.getClass().getSimpleName().toUpperCase();
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), role, user.isActive());
    }
}
