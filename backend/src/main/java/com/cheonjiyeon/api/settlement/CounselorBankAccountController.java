package com.cheonjiyeon.api.settlement;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/counselor/bank-account")
public class CounselorBankAccountController {

    private final CounselorBankAccountService bankAccountService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;

    public CounselorBankAccountController(
            CounselorBankAccountService bankAccountService,
            TokenStore tokenStore,
            UserRepository userRepository,
            CounselorRepository counselorRepository
    ) {
        this.bankAccountService = bankAccountService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CounselorBankAccountService.BankAccountResponse register(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CounselorBankAccountService.RegisterRequest req
    ) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        bankAccountService.register(counselor.getId(), req.bankCode(), req.accountNumber(), req.holderName());
        return bankAccountService.getByCounselorId(counselor.getId());
    }

    @GetMapping
    public CounselorBankAccountService.BankAccountResponse get(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        return bankAccountService.getByCounselorId(counselor.getId());
    }

    @PutMapping
    public CounselorBankAccountService.BankAccountResponse update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CounselorBankAccountService.UpdateRequest req
    ) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        bankAccountService.update(counselor.getId(), req.bankCode(), req.accountNumber(), req.holderName());
        return bankAccountService.getByCounselorId(counselor.getId());
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }

    private CounselorEntity resolveCounselor(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return counselorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(403, "상담사 계정이 아닙니다."));
    }
}
