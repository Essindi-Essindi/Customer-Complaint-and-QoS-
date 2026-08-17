package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ReportGenerationRequest;
import customer_complaint.customer_complaint.dto.response.ReportResponse;
import customer_complaint.customer_complaint.exception.ReportNotReadyException;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.messaging.ReportEventPublisher;
import customer_complaint.customer_complaint.messaging.ReportGenerationEvent;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.Report;
import customer_complaint.customer_complaint.model.Resolution;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ReportType;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.ReportRepository;
import customer_complaint.customer_complaint.repository.ResolutionRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

// creates the report row, pdf built async
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_ONLY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final float MARGIN = 50f;
    private static final float LEADING = 16f;
    private static final float LOGO_SIZE = 34f;
    private static final String LOGO_RESOURCE = "/branding/camtel-logo.png";
    private static final float TABLE_WIDTH = PDRectangle.A4.getWidth() - 2 * MARGIN;

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final ResolutionRepository resolutionRepository;
    private final ReportEventPublisher reportEventPublisher;

    @Value("${report.storage-dir:reports}")
    private String storageDir;

    @Override
    public ReportResponse requestGeneration(Long managerId, ReportGenerationRequest request) {
        Manager manager = (Manager) userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        Report report = new Report();
        report.setGeneratedBy(manager);
        report.setType(parseReportType(request.getType()));
        report.setStartDate(request.getStartDate());
        report.setEndDate(request.getEndDate());
        reportRepository.save(report);

        // Same reasoning as NotificationServiceImpl.queueSms: the Report row above is already
        // saved successfully, so if the broker is unreachable we don't want to fail the whole
        // request. The PDF simply stays pending (filePath null) until the queue is back;
        // downloading it in the meantime already returns a clean "not ready" response via
        // getReportForDownload(), so this degrades gracefully instead of lying about a failure.
        try {
            reportEventPublisher.publish(new ReportGenerationEvent(
                    report.getId(), report.getType().name(), report.getStartDate(), report.getEndDate()));
        } catch (Exception ex) {
            log.warn("Could not queue report generation for report {} - broker may be unreachable",
                    report.getId(), ex);
        }

        return toResponse(report);
    }

    @Override
    @Transactional
    public void generatePdf(ReportGenerationEvent event) {
        Report report = reportRepository.findById(event.getReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        List<Complaint> complaints = complaintRepository.findByCreatedAtBetween(
                event.getStartDate().atStartOfDay(), event.getEndDate().plusDays(1).atStartOfDay());

        try {
            Path dir = Paths.get(storageDir);
            Files.createDirectories(dir);

            Path filePath = dir.resolve("report-" + report.getId() + ".pdf");
            writePdf(report, complaints, filePath);

            report.setFilePath(filePath.toString());
            reportRepository.save(report);
        } catch (IOException e) {
            // Leave filePath null so getReportForDownload() keeps reporting
            // "not ready" instead of pointing at a file that doesn't exist.
            log.error("Failed to generate PDF for report {}", report.getId(), e);
        }
    }

    // A column in one of the tables below: a header label plus a fixed
    // width in PDF points. Every table's column widths sum to TABLE_WIDTH so
    // the table always spans the same left/right margins as the header box.
    private record Column(String header, float width) {
    }

    // CAMTEL corporate report template — mirrors the layout of the
    // reference "2026_ACTIVITY_REPORT_..." document (repo root): a header
    // box on every page with the logo top-left, title top-center, and a
    // Code/Version/Date/Page metadata block top-right, under a rule line.
    // Only the header layout is borrowed — the body below it is this
    // report's own: a key-metrics table, status/service breakdown tables,
    // then the full complaint listing as an actual bordered/shaded table
    // (not hand-spaced text) so it reads as a real report, not a dump.
    private void writePdf(Report report, List<Complaint> complaints, Path filePath) throws IOException {
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

        int total = complaints.size();
        Map<ComplaintStatus, Long> byStatus = new EnumMap<>(ComplaintStatus.class);
        for (Complaint c : complaints) {
            byStatus.merge(c.getStatus(), 1L, Long::sum);
        }
        long resolved = byStatus.getOrDefault(ComplaintStatus.RESOLVED, 0L);
        long unresolved = total - resolved;
        double resolutionRate = total > 0 ? resolved * 100.0 / total : 0;
        double avgResolutionHours = averageResolutionHours(complaints);

        // Ratings: one bulk query for every complaint in the period rather
        // than one per row — see ResolutionRepository.findByComplaintIdIn.
        List<Long> complaintIds = complaints.stream().map(Complaint::getId).toList();
        List<Resolution> resolutions =
                complaintIds.isEmpty() ? List.of() : resolutionRepository.findByComplaintIdIn(complaintIds);
        List<Integer> ratings = resolutions.stream().map(Resolution::getRating).filter(Objects::nonNull).toList();
        double avgRating = ratings.stream().mapToInt(Integer::intValue).average().orElse(0);

        Map<ServiceType, List<Complaint>> byService =
                complaints.stream().collect(Collectors.groupingBy(Complaint::getServiceType));

        try (PDDocument document = new PDDocument()) {
            PDImageXObject logo = loadLogo(document);
            RenderState st = startPage(document, logo, report, 1);
            float x = MARGIN;

            st.y = drawLine(st.cs, x, st.y, regular, 10,
                    "Period: " + report.getStartDate() + "  to  " + report.getEndDate());
            st.y = drawLine(st.cs, x, st.y, regular, 10,
                    "Generated by: " + report.getGeneratedBy().getName()
                            + "  on  " + report.getGeneratedAt().format(DATE_FMT));
            st.y -= LEADING * 0.5f;

            // ---- Key metrics --------------------------------------------------
            Column[] metricCols = {new Column("Metric", 260), new Column("Value", 235)};
            String[][] metricRows = {
                    {"Total complaints", String.valueOf(total)},
                    {"Resolved", resolved + " (" + String.format("%.1f", resolutionRate) + "%)"},
                    {"Unresolved / in progress", String.valueOf(unresolved)},
                    {"Average resolution time", String.format("%.1f hours", avgResolutionHours)},
                    {"Customer ratings received", ratings.isEmpty() ? "None yet"
                            : ratings.size() + " (avg " + String.format("%.1f", avgRating) + " / 5)"},
            };
            ensureSpace(st, tableHeight(metricRows.length, 9.5f), document, logo, report);
            st.y = drawLine(st.cs, x, st.y, bold, 12, "Key Metrics");
            st.y = drawTable(st.cs, x, st.y, metricCols, metricRows, regular, bold, 9.5f);
            st.y -= LEADING;

            // ---- Status breakdown -----------------------------------------------
            Column[] statusCols = {new Column("Status", 200), new Column("Count", 145), new Column("Share", 150)};
            String[][] statusRows = Arrays.stream(ComplaintStatus.values())
                    .map(s -> {
                        long count = byStatus.getOrDefault(s, 0L);
                        double pct = total > 0 ? count * 100.0 / total : 0;
                        return new String[]{s.name(), String.valueOf(count), String.format("%.1f%%", pct)};
                    })
                    .toArray(String[][]::new);
            ensureSpace(st, LEADING + tableHeight(statusRows.length, 9.5f), document, logo, report);
            st.y = drawLine(st.cs, x, st.y, bold, 12, "Status Breakdown");
            st.y = drawTable(st.cs, x, st.y, statusCols, statusRows, regular, bold, 9.5f);
            st.y -= LEADING;

            // ---- By service type --------------------------------------------
            Column[] serviceCols = {
                    new Column("Service", 140), new Column("Total", 110),
                    new Column("Resolved", 110), new Column("Avg Resolution (h)", 135),
            };
            String[][] serviceRows = Arrays.stream(ServiceType.values())
                    .map(type -> {
                        List<Complaint> list = byService.getOrDefault(type, List.of());
                        long svcResolved = list.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();
                        double svcAvg = averageResolutionHours(list);
                        return new String[]{
                                type.name(), String.valueOf(list.size()), String.valueOf(svcResolved),
                                String.format("%.1f", svcAvg),
                        };
                    })
                    .toArray(String[][]::new);
            ensureSpace(st, LEADING + tableHeight(serviceRows.length, 9.5f), document, logo, report);
            st.y = drawLine(st.cs, x, st.y, bold, 12, "By Service Type");
            st.y = drawTable(st.cs, x, st.y, serviceCols, serviceRows, regular, bold, 9.5f);
            st.y -= LEADING;

            // ---- Full complaint listing ---------------------------------------
            Column[] detailCols = {
                    new Column("Ticket", 65), new Column("Date", 58), new Column("Type", 82),
                    new Column("Service", 42), new Column("Status", 50), new Column("Region/City", 88),
                    new Column("Subscriber", 58), new Column("Agent", 52),
            };
            float detailFontSize = 7.2f;
            float detailRowHeight = detailFontSize + 6f;

            ensureSpace(st, LEADING + 20f, document, logo, report);
            st.y = drawLine(st.cs, x, st.y, bold, 12, "Complaints (" + total + ")");

            if (complaints.isEmpty()) {
                st.y = drawLine(st.cs, x, st.y, regular, 10, "No complaints in this period.");
            } else {
                ensureSpace(st, detailRowHeight * 2, document, logo, report);
                st.y = drawTableHeaderRow(st.cs, x, st.y, detailCols, bold, detailFontSize);

                boolean shade = false;
                for (Complaint c : complaints) {
                    boolean broke = ensureSpace(st, detailRowHeight, document, logo, report);
                    if (broke) {
                        st.y = drawTableHeaderRow(st.cs, x, st.y, detailCols, bold, detailFontSize);
                        shade = false;
                    }
                    st.y = drawTableRow(st.cs, x, st.y, detailCols, detailRow(c), regular, detailFontSize, shade);
                    shade = !shade;
                }
            }

            st.cs.close();
            document.save(filePath.toFile());
        }
    }

    private String[] detailRow(Complaint c) {
        String region = nullSafe(c.getRegion());
        String city = c.getCity() == null || c.getCity().isBlank() ? "" : "/" + c.getCity();
        return new String[]{
                nullSafe(c.getTicketNumber()),
                c.getCreatedAt() == null ? "" : c.getCreatedAt().format(DATE_ONLY_FMT),
                nullSafe(c.getType()),
                c.getServiceType() == null ? "" : c.getServiceType().name(),
                c.getStatus() == null ? "" : c.getStatus().name(),
                region + city,
                c.getSubscriber() == null ? "" : nullSafe(c.getSubscriber().getName()),
                c.getAgent() == null ? "Unassigned" : nullSafe(c.getAgent().getName()),
        };
    }

    // Resolution time: (updatedAt - createdAt) in hours for every RESOLVED
    // complaint in the group, averaged. Same formula AnalyticsServiceImpl
    // uses for the KPI dashboard, so the report and the dashboard never
    // disagree about what "average resolution time" means.
    private double averageResolutionHours(List<Complaint> complaints) {
        return complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getUpdatedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                .average()
                .orElse(0);
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }

    // ---- low-level page/table rendering ------------------------------------

    // Mutable render cursor: which page/content-stream we're currently
    // drawing into and how far down it we've gotten. Passed by reference to
    // every draw helper so a mid-table page break (see ensureSpace) is
    // visible to the caller without every helper having to return and
    // re-thread a tuple of (page, cs, y, pageNumber).
    private static final class RenderState {
        PDPage page;
        PDPageContentStream cs;
        float y;
        int pageNumber;
    }

    private RenderState startPage(PDDocument document, PDImageXObject logo, Report report, int pageNumber)
            throws IOException {
        RenderState st = new RenderState();
        st.page = new PDPage(PDRectangle.A4);
        document.addPage(st.page);
        st.cs = new PDPageContentStream(document, st.page);
        st.pageNumber = pageNumber;
        st.y = drawHeader(st.cs, st.page, logo, report, pageNumber);
        return st;
    }

    // Starts a fresh page (closing the current one first) if the next block
    // of `needed` points wouldn't fit above the bottom margin. Returns
    // whether a break happened, so callers drawing a table can redraw the
    // column header row on the new page.
    private boolean ensureSpace(RenderState st, float needed, PDDocument document, PDImageXObject logo, Report report)
            throws IOException {
        if (st.y - needed >= MARGIN) return false;
        st.cs.close();
        RenderState fresh = startPage(document, logo, report, st.pageNumber + 1);
        st.page = fresh.page;
        st.cs = fresh.cs;
        st.y = fresh.y;
        st.pageNumber = fresh.pageNumber;
        return true;
    }

    // Conservative height estimate for a small table (header + rows) used to
    // reserve space up front — the aggregate tables (metrics/status/service)
    // never break mid-table, they always fit on one page.
    private float tableHeight(int rowCount, float fontSize) {
        return (rowCount + 1) * (fontSize + 7f);
    }

    private float drawLine(PDPageContentStream cs, float x, float y, PDFont font, float size, String text)
            throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - LEADING;
    }

    private float drawTable(PDPageContentStream cs, float x, float y, Column[] cols, String[][] rows,
                             PDFont regular, PDFont bold, float fontSize) throws IOException {
        y = drawTableHeaderRow(cs, x, y, cols, bold, fontSize);
        boolean shade = false;
        for (String[] row : rows) {
            y = drawTableRow(cs, x, y, cols, row, regular, fontSize, shade);
            shade = !shade;
        }
        return y;
    }

    private float drawTableHeaderRow(PDPageContentStream cs, float x, float y, Column[] cols, PDFont bold,
                                      float fontSize) throws IOException {
        float rowHeight = fontSize + 7f;
        float bottom = y - rowHeight;

        cs.setNonStrokingColor(0.16f, 0.30f, 0.48f);
        cs.addRect(x, bottom, TABLE_WIDTH, rowHeight);
        cs.fill();

        cs.setNonStrokingColor(1f, 1f, 1f);
        float cx = x;
        float baseline = y - fontSize - 3f;
        for (Column col : cols) {
            String text = truncate(bold, fontSize, col.header(), col.width() - 8f);
            cs.beginText();
            cs.setFont(bold, fontSize);
            cs.newLineAtOffset(cx + 4f, baseline);
            cs.showText(text);
            cs.endText();
            cx += col.width();
        }
        cs.setNonStrokingColor(0f, 0f, 0f);
        return bottom;
    }

    private float drawTableRow(PDPageContentStream cs, float x, float y, Column[] cols, String[] values,
                                PDFont font, float fontSize, boolean shaded) throws IOException {
        float rowHeight = fontSize + 6f;
        float bottom = y - rowHeight;

        if (shaded) {
            cs.setNonStrokingColor(0.94f, 0.95f, 0.97f);
            cs.addRect(x, bottom, TABLE_WIDTH, rowHeight);
            cs.fill();
            cs.setNonStrokingColor(0f, 0f, 0f);
        }

        float cx = x;
        float baseline = y - fontSize - 2f;
        for (int i = 0; i < cols.length; i++) {
            String text = truncate(font, fontSize, values[i] == null ? "" : values[i], cols[i].width() - 8f);
            cs.beginText();
            cs.setFont(font, fontSize);
            cs.newLineAtOffset(cx + 4f, baseline);
            cs.showText(text);
            cs.endText();
            cx += cols[i].width();
        }

        cs.setLineWidth(0.5f);
        cs.setStrokingColor(0.82f, 0.84f, 0.88f);
        cs.moveTo(x, bottom);
        cs.lineTo(x + TABLE_WIDTH, bottom);
        cs.stroke();
        cs.setStrokingColor(0f, 0f, 0f);
        return bottom;
    }

    // Shortens `text` with a trailing "..." so it fits within maxWidth at
    // this font/size — measured against the real (proportional) glyph
    // widths rather than a fixed character count, so it doesn't over- or
    // under-truncate depending on which letters happen to be in it.
    private String truncate(PDFont font, float fontSize, String text, float maxWidth) throws IOException {
        if (text.isEmpty() || font.getStringWidth(text) / 1000f * fontSize <= maxWidth) return text;

        String suffix = "...";
        float suffixWidth = font.getStringWidth(suffix) / 1000f * fontSize;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            float width = font.getStringWidth(sb.toString() + ch) / 1000f * fontSize + suffixWidth;
            if (width > maxWidth) break;
            sb.append(ch);
        }
        return sb + suffix;
    }

    /**
     * Draws the CAMTEL header box (logo, title, Code/Version/Date/Page
     * metadata, rule line) at the top of the given page and returns the y
     * coordinate body content should start writing at.
     */
    private float drawHeader(PDPageContentStream cs, PDPage page, PDImageXObject logo, Report report,
                              int pageNumber) throws IOException {
        float pageWidth = page.getMediaBox().getWidth();
        float top = page.getMediaBox().getHeight() - MARGIN;

        if (logo != null) {
            cs.drawImage(logo, MARGIN, top - LOGO_SIZE, LOGO_SIZE, LOGO_SIZE);
        }

        float titleX = MARGIN + LOGO_SIZE + 12f;
        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
        cs.newLineAtOffset(titleX, top - 12f);
        cs.showText("CAMTEL ACTIVITY REPORT");
        cs.endText();

        cs.beginText();
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        cs.newLineAtOffset(titleX, top - 26f);
        cs.showText("Complaint Management — " + report.getType() + " Report");
        cs.endText();

        // Code/Version/Date/Page metadata block, top-right — same fields the
        // reference CAMTEL template carries on every page. No formal
        // document-code system backs these reports, so Code stays "null"
        // rather than inventing one.
        float metaX = pageWidth - MARGIN - 150f;
        float metaY = top - 2f;
        String[] metaLines = {
                "Code : null",
                "Version : 001",
                "Date : " + report.getGeneratedAt().format(DATE_ONLY_FMT),
                "Page : " + pageNumber,
        };
        for (String line : metaLines) {
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            cs.newLineAtOffset(metaX, metaY);
            cs.showText(line);
            cs.endText();
            metaY -= 11f;
        }

        float ruleY = top - LOGO_SIZE - 8f;
        cs.setLineWidth(1f);
        cs.moveTo(MARGIN, ruleY);
        cs.lineTo(pageWidth - MARGIN, ruleY);
        cs.stroke();

        return ruleY - LEADING;
    }

    private PDImageXObject loadLogo(PDDocument document) {
        try (InputStream in = getClass().getResourceAsStream(LOGO_RESOURCE)) {
            if (in == null) {
                log.warn("CAMTEL logo resource {} not found - report header will render without it", LOGO_RESOURCE);
                return null;
            }
            return PDImageXObject.createFromByteArray(document, in.readAllBytes(), "camtel-logo");
        } catch (IOException e) {
            log.warn("Could not load CAMTEL logo for PDF report header", e);
            return null;
        }
    }

    @Override
    public List<ReportResponse> listForManager(Long managerId) {
        return reportRepository.findByGeneratedByIdOrderByGeneratedAtDesc(managerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Report getReportForDownload(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        if (report.getFilePath() == null) {
            throw new ReportNotReadyException(
                    "This report is still being generated. Try downloading it again shortly.");
        }

        return report;
    }

    private ReportType parseReportType(String raw) {
        try {
            return ReportType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid report type '" + raw + "'. Valid values: " + Arrays.toString(ReportType.values()));
        }
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getId(), r.getType().name(), r.getStartDate(), r.getEndDate(),
                r.getGeneratedAt(), r.getFilePath());
    }
}
