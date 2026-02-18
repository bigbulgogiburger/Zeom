# 천지연꽃신당 Flutter App

천지연꽃신당 (Cheonjiyeon Lotus Shrine) — Korean traditional fortune-telling consultation platform mobile app.

## Features

✅ **Completed (MVP)**:
- Korean traditional theme (먹색, 한지, 금색, 연꽃핑크)
- JWT authentication (login, signup, logout)
- Token refresh with automatic retry
- Bottom navigation (홈, 상담사, 예약, 지갑, 더보기)
- Home screen with recommended counselors
- Route guards and auth state management
- Google Fonts integration (Noto Serif KR, Noto Sans KR)

🚧 **Pending**:
- Counselor detail and booking
- Payment integration
- Chat/consultation room
- Wallet and cash transactions
- Push notifications

## Tech Stack

- **Flutter SDK**: 3.2.3+
- **State Management**: Riverpod 2.6+
- **Routing**: go_router 13.2+
- **HTTP Client**: dio 5.9+
- **Secure Storage**: flutter_secure_storage 9.2+
- **Fonts**: google_fonts 6.2+

## Project Structure

```
lib/
├── core/
│   ├── api_client.dart        # Dio HTTP client with JWT interceptor
│   ├── auth_service.dart      # Login, signup, logout, token storage
│   └── router.dart            # GoRouter with auth redirect
├── features/
│   ├── auth/
│   │   ├── auth_provider.dart # Riverpod auth state management
│   │   ├── login_screen.dart  # Login UI
│   │   └── signup_screen.dart # Signup UI
│   ├── home/
│   │   ├── main_screen.dart   # Bottom navigation shell
│   │   └── home_screen.dart   # Landing page with counselors
│   ├── counselor/
│   │   └── counselor_list_screen.dart
│   ├── booking/
│   │   └── booking_list_screen.dart
│   ├── wallet/
│   │   └── wallet_screen.dart
│   └── more/
│       └── more_screen.dart   # User profile, settings, logout
├── shared/
│   ├── theme.dart             # Korean traditional theme
│   └── widgets/               # Reusable widgets
└── main.dart                  # App entry point
```

## Setup

### Prerequisites

- Flutter SDK 3.2.0 or higher
- iOS Simulator / Android Emulator / Physical device
- Backend API running at `http://localhost:8080` (Spring Boot)

### Installation

```bash
cd app_flutter
flutter pub get
```

### Environment Variables

The app uses `API_BASE` to configure the backend URL:

```bash
# Default (localhost:8080)
flutter run

# Custom backend URL
flutter run --dart-define=API_BASE=http://192.168.1.100:8080
```

### Run

```bash
# Development (default: localhost:8080)
flutter run

# Release build
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## API Integration

The app connects to the Spring Boot backend at `/api/v1/*`:

- `POST /api/v1/auth/signup` — User registration
- `POST /api/v1/auth/login` — User login (returns JWT tokens)
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Logout (optional)
- `GET /api/v1/auth/me` — Get current user info
- `GET /api/v1/counselors` — List counselors

## Authentication Flow

1. User enters email + password on login screen
2. `AuthService.login()` calls `POST /api/v1/auth/login`
3. Backend returns `accessToken` and `refreshToken`
4. Tokens stored in `flutter_secure_storage`
5. `ApiClient` attaches `Authorization: Bearer <token>` to all requests
6. On 401 error, `ApiClient` automatically calls `/api/v1/auth/refresh`
7. If refresh succeeds, retry original request; otherwise redirect to login

## Korean Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| 먹색 (Ink Black) | #111111 | Primary, AppBar, buttons |
| 한지 (Hanji Paper) | #F5EBDD | Background, text on dark |
| 금색 (Gold) | #C9A227 | Accent, highlights |
| 암적색 (Dark Red) | #8B0000 | Error, important actions |
| 연꽃 핑크 (Lotus Pink) | #C36B85 | Soft accent, avatars |

## Testing

```bash
# Run unit tests (when available)
flutter test

# Run with coverage (when available)
flutter test --coverage
```

## Next Steps

1. Implement counselor detail and booking flow
2. Integrate payment (PortOne SDK or WebView)
3. Implement chat/consultation room (Sendbird SDK)
4. Add wallet and cash transaction pages
5. Add push notifications (FCM)
6. E2E testing with integration_test package

## Notes

- Minimum touch target: 44px (iOS HIG compliant)
- Bottom navigation always visible
- Pull-to-refresh on home screen
- Offline-first token storage with `flutter_secure_storage`
- Auto token refresh on 401 errors

---

Built with ❤️ using Flutter
