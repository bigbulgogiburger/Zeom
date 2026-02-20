package com.cheonjiyeon.api.user;

import com.cheonjiyeon.api.auth.AuthDtos;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserService.UserProfileResponse getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return userService.getProfile(authHeader);
    }

    @PutMapping("/me")
    public UserService.UserProfileResponse updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserService.UpdateProfileRequest req
    ) {
        return userService.updateProfile(authHeader, req);
    }

    @DeleteMapping("/me")
    public AuthDtos.MessageResponse deleteAccount(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        userService.requestDeletion(authHeader);
        return new AuthDtos.MessageResponse("계정 탈퇴가 요청되었습니다. 30일 후에 완전히 삭제됩니다.");
    }
}
