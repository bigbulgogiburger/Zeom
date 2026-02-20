package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorApplicationEntity;
import com.cheonjiyeon.api.counselor.CounselorApplicationRepository;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AdminCounselorApplicationService {
    private final CounselorApplicationRepository applicationRepository;
    private final CounselorRepository counselorRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public AdminCounselorApplicationService(
            CounselorApplicationRepository applicationRepository,
            CounselorRepository counselorRepository,
            UserRepository userRepository,
            AuthService authService,
            AuditLogService auditLogService
    ) {
        this.applicationRepository = applicationRepository;
        this.counselorRepository = counselorRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    public Page<CounselorApplicationEntity> listApplications(String authHeader, String status, int page, int size) {
        authService.requireAdmin(authHeader);
        if (status != null && !status.isBlank()) {
            return applicationRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        }
        return applicationRepository.findAll(PageRequest.of(page, size));
    }

    public Map<String, Object> getApplicationDetail(String authHeader, Long id) {
        authService.requireAdmin(authHeader);
        CounselorApplicationEntity app = applicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "상담사 신청을 찾을 수 없습니다."));

        UserEntity user = userRepository.findById(app.getUserId()).orElse(null);

        return Map.of(
                "application", toAppMap(app),
                "applicant", user != null ? Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail()
                ) : Map.of()
        );
    }

    @Transactional
    public CounselorApplicationEntity approveApplication(String authHeader, Long id) {
        UserEntity admin = authService.requireAdmin(authHeader);

        CounselorApplicationEntity app = applicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "상담사 신청을 찾을 수 없습니다."));

        if (!"PENDING".equals(app.getStatus())) {
            throw new ApiException(400, "대기 중인 신청만 승인할 수 있습니다.");
        }

        app.setStatus("APPROVED");
        app.setReviewedBy(admin.getId());
        app.setReviewedAt(LocalDateTime.now());

        // Change user role to COUNSELOR
        UserEntity user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ApiException(404, "사용자를 찾을 수 없습니다."));
        user.setRole("COUNSELOR");
        userRepository.save(user);

        // Create counselor profile if not exists
        if (counselorRepository.findByUserId(app.getUserId()).isEmpty()) {
            CounselorEntity counselor = new CounselorEntity();
            counselor.setName(user.getName());
            counselor.setSpecialty(app.getSpecialty());
            counselor.setIntro(app.getIntro() != null ? app.getIntro() : "상담사 " + user.getName());
            counselor.setUserId(app.getUserId());
            counselorRepository.save(counselor);
        }

        auditLogService.log(admin.getId(), "ADMIN_COUNSELOR_APP_APPROVE", "COUNSELOR_APPLICATION", id);
        return applicationRepository.save(app);
    }

    @Transactional
    public CounselorApplicationEntity rejectApplication(String authHeader, Long id, String reason) {
        UserEntity admin = authService.requireAdmin(authHeader);

        if (reason == null || reason.isBlank()) {
            throw new ApiException(400, "거절 사유를 입력해주세요.");
        }

        CounselorApplicationEntity app = applicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "상담사 신청을 찾을 수 없습니다."));

        if (!"PENDING".equals(app.getStatus())) {
            throw new ApiException(400, "대기 중인 신청만 거절할 수 있습니다.");
        }

        app.setStatus("REJECTED");
        app.setAdminNote(reason);
        app.setReviewedBy(admin.getId());
        app.setReviewedAt(LocalDateTime.now());

        auditLogService.log(admin.getId(), "ADMIN_COUNSELOR_APP_REJECT", "COUNSELOR_APPLICATION", id);
        return applicationRepository.save(app);
    }

    private Map<String, Object> toAppMap(CounselorApplicationEntity app) {
        return Map.ofEntries(
                Map.entry("id", app.getId()),
                Map.entry("userId", app.getUserId()),
                Map.entry("specialty", app.getSpecialty()),
                Map.entry("experience", app.getExperience() != null ? app.getExperience() : ""),
                Map.entry("intro", app.getIntro() != null ? app.getIntro() : ""),
                Map.entry("certificatesUrl", app.getCertificatesUrl() != null ? app.getCertificatesUrl() : ""),
                Map.entry("status", app.getStatus()),
                Map.entry("adminNote", app.getAdminNote() != null ? app.getAdminNote() : ""),
                Map.entry("createdAt", app.getCreatedAt().toString())
        );
    }
}
