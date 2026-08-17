package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.response.AgentImportResultResponse;
import customer_complaint.customer_complaint.dto.response.AgentImportRowResult;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.repository.UserRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Covers UserManagementServiceImpl.importAgents end to end against a real
// in-memory .xlsx (built with POI, same library the importer itself uses)
// rather than mocking POI's API — that way a change to how cells are read
// would actually be caught here.
class UserManagementServiceImplTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final UserManagementServiceImpl service =
            new UserManagementServiceImpl(userRepository, passwordEncoder);

    private MultipartFile workbookOf(String[] header, String[][] dataRows) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Agents");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < header.length; i++) {
                headerRow.createCell(i).setCellValue(header[i]);
            }
            for (int r = 0; r < dataRows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < dataRows[r].length; c++) {
                    row.createCell(c).setCellValue(dataRows[r][c]);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return new MockMultipartFile("file", "annuaire.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        }
    }

    @Test
    void importsValidRowsHashesPasswordsAndRejectsDuplicateEmails() throws IOException {
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);

        MultipartFile file = workbookOf(
                new String[]{"Name", "Surname", "Email", "Service", "Region", "Password", "Phone"},
                new String[][]{
                        {"Jean", "Mballa", "mballa.jean@camtel.com", "mobile", "Centre", "Camtel@2026", "677010203"},
                        // Same email as the row above -> must be rejected,
                        // never silently renamed to something else.
                        {"Jean", "Mballa", "mballa.jean@camtel.com", "ftth", "Littoral", "Another@Pass1", ""},
                        // Missing Region -> should fail without touching the
                        // rows around it.
                        {"NoRegion", "Agent", "noregion.agent@camtel.com", "ADSL", "", "Camtel@2026", ""},
                        // Unknown service value -> should fail with a clear reason.
                        {"Bad", "Service", "bad.service@camtel.com", "SATELLITE", "West", "Camtel@2026", ""},
                        // Malformed email -> should fail with a clear reason.
                        {"No", "AtSign", "not-an-email", "MOBILE", "West", "Camtel@2026", ""},
                });

        AgentImportResultResponse result = service.importAgents(file);

        assertThat(result.getTotalRows()).isEqualTo(5);
        assertThat(result.getImportedCount()).isEqualTo(1);
        assertThat(result.getFailedCount()).isEqualTo(4);

        List<AgentImportRowResult> rows = result.getRows();
        assertThat(rows.get(0).isImported()).isTrue();
        assertThat(rows.get(0).getEmail()).isEqualTo("mballa.jean@camtel.com");
        assertThat(rows.get(1).isImported()).isFalse();
        assertThat(rows.get(1).getMessage()).containsIgnoringCase("already in use");
        assertThat(rows.get(2).isImported()).isFalse();
        assertThat(rows.get(2).getMessage()).containsIgnoringCase("required");
        assertThat(rows.get(3).isImported()).isFalse();
        assertThat(rows.get(3).getMessage()).containsIgnoringCase("SATELLITE");
        assertThat(rows.get(4).isImported()).isFalse();
        assertThat(rows.get(4).getMessage()).containsIgnoringCase("valid email");

        ArgumentCaptor<Agent> saved = ArgumentCaptor.forClass(Agent.class);
        verify(userRepository, times(1)).save(saved.capture());
        Agent first = saved.getValue();
        assertThat(first.getName()).isEqualTo("Jean Mballa");
        assertThat(first.getEmail()).isEqualTo("mballa.jean@camtel.com");
        assertThat(first.getAssignedService()).isEqualTo("MOBILE");
        assertThat(first.getAssignedRegion()).isEqualTo("Centre");
        assertThat(first.getPasswordHash()).isEqualTo("hashed");
        verify(passwordEncoder).encode(eq("Camtel@2026"));
    }

    @Test
    void rejectsFileMissingRequiredColumns() throws IOException {
        MultipartFile file = workbookOf(
                new String[]{"Name", "Surname"},
                new String[][]{{"Jean", "Mballa"}});

        assertThatThrownBy(() -> service.importAgents(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Missing required column");
    }

    @Test
    void phoneAlreadyTakenIsDroppedNotRejected() throws IOException {
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("677010203")).thenReturn(true);

        MultipartFile file = workbookOf(
                new String[]{"Name", "Surname", "Email", "Service", "Region", "Password", "Phone"},
                new String[][]{{"Jean", "Mballa", "mballa.jean@camtel.com", "MOBILE", "Centre", "Camtel@2026", "677010203"}});

        AgentImportResultResponse result = service.importAgents(file);

        assertThat(result.getImportedCount()).isEqualTo(1);
        ArgumentCaptor<Agent> saved = ArgumentCaptor.forClass(Agent.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPhone()).isNull();
    }
}
