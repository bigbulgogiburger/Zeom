package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public Map<String, Object> listUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<UserEntity> userPage = adminUserService.listUsers(authHeader, search, status, role, page, size);
        return Map.of(
                "content", userPage.getContent().stream().map(u -> Map.of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "name", u.getName(),
                        "role", u.getRole(),
                        "status", u.getStatus() != null ? u.getStatus() : "ACTIVE"
                )).toList(),
                "totalPages", userPage.getTotalPages(),
                "totalElements", userPage.getTotalElements(),
                "page", userPage.getNumber()
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> getUserDetail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return adminUserService.getUserDetail(authHeader, id);
    }

    @PutMapping("/{id}/suspend")
    public Map<String, Object> suspendUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.get("reason");
        UserEntity user = adminUserService.suspendUser(authHeader, id, reason);
        return Map.of("status", "SUSPENDED", "userId", user.getId());
    }

    @PutMapping("/{id}/unsuspend")
    public Map<String, Object> unsuspendUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        UserEntity user = adminUserService.unsuspendUser(authHeader, id);
        return Map.of("status", "ACTIVE", "userId", user.getId());
    }
}
