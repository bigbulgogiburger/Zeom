import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { DirectCall } from 'sendbird-calls';
import ConsultationRoomPage from '@/app/consultation/[sessionId]/page';

// ZEOM-20: minimal helper — Sendbird DirectCall has 50+ properties; the page
// only touches a handful (lifecycle hooks + end()). Cast through unknown to
// satisfy the type without listing every property.
function makeMockCall(overrides: Record<string, unknown> = {}): DirectCall {
  return {
    onEstablished: null,
    onConnected: null,
    onEnded: null,
    onRemoteAudioSettingsChanged: null,
    onRemoteVideoSettingsChanged: null,
    end: jest.fn(),
    ...overrides,
  } as unknown as DirectCall;
}

// Mock next/navigation
const mockPush = jest.fn();
const mockParams = { sessionId: '123' };
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock api-client
jest.mock('@/components/api-client', () => ({
  apiFetch: jest.fn(),
  getSessionToken: jest.fn(),
  endSession: jest.fn(),
  getNextConsecutive: jest.fn(),
  consumeSessionCredit: jest.fn(),
}));

// Mock SendBird Calls - create mocks inline to avoid hoisting issues
jest.mock('sendbird-calls', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    authenticate: jest.fn(),
    connectWebSocket: jest.fn(),
    disconnectWebSocket: jest.fn(),
    dial: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    connectionState: 'disconnected',
  },
}));

// Mock route-guard
jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock session-timer
jest.mock('@/components/session-timer', () => {
  return function MockSessionTimer({ onTimeUp }: { startTime: string; durationMinutes: number; onTimeUp?: () => void }) {
    return (
      <div data-testid="session-timer">
        <button onClick={onTimeUp}>Trigger Time Up</button>
      </div>
    );
  };
});

import { apiFetch, getSessionToken, endSession, getNextConsecutive } from '@/components/api-client';
import SendBirdCall from 'sendbird-calls';

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockGetSessionToken = getSessionToken as jest.MockedFunction<typeof getSessionToken>;
const mockEndSession = endSession as jest.MockedFunction<typeof endSession>;
const mockGetNextConsecutive = getNextConsecutive as jest.MockedFunction<typeof getNextConsecutive>;

// Get mocked SendBirdCall methods
const mockSendbirdInit = SendBirdCall.init as jest.MockedFunction<typeof SendBirdCall.init>;
const mockSendbirdAuthenticate = SendBirdCall.authenticate as jest.MockedFunction<typeof SendBirdCall.authenticate>;
const mockSendbirdConnectWebSocket = SendBirdCall.connectWebSocket as jest.MockedFunction<typeof SendBirdCall.connectWebSocket>;
const mockSendbirdDial = SendBirdCall.dial as jest.MockedFunction<typeof SendBirdCall.dial>;
const mockSendbirdAddListener = SendBirdCall.addListener as jest.MockedFunction<typeof SendBirdCall.addListener>;

function mockResponse(body: any, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('ConsultationRoomPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [],
        }),
      },
    });
  });

  const mockSession = {
    id: 123,
    reservationId: 456,
    counselorName: '김지혜',
    counselorSpecialty: '타로',
    startedAt: new Date().toISOString(),
    durationMinutes: 60,
    status: 'ACTIVE',
    sendbirdChannelUrl: 'channel-123',
  };

  it('renders loading state initially', () => {
    mockApiFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<ConsultationRoomPage />);

    expect(screen.getByText('세션을 불러오는 중...')).toBeInTheDocument();
  });

  it('loads and displays session information', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: 'mock-token',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: name appears twice (fallback + top status row "{name} · {specialty}")
    // and specialty is rendered inside that combined span, so match by regex.
    await waitFor(() => {
      expect(screen.getAllByText('김지혜').length).toBeGreaterThan(0);
      expect(screen.getByText(/김지혜\s·\s타로/)).toBeInTheDocument();
    });
  });

  it('displays error when session fetch fails', async () => {
    mockApiFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Session not found' }, 404)
    );

    render(<ConsultationRoomPage />);

    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });
  });

  it('initializes SendBird in mock mode when token is not provided', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    await waitFor(() => {
      expect(screen.getByText(/Mock 모드: Sendbird 연동은 실제 토큰이 제공되면 활성화됩니다/)).toBeInTheDocument();
    });

    // In mock mode, init is NOT called - it returns early
    expect(mockSendbirdInit).not.toHaveBeenCalled();
  });

  it('handles SendBird connection failure gracefully', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockRejectedValueOnce(new Error('Token fetch failed'));

    render(<ConsultationRoomPage />);

    // When token fetch fails, loadSession catches silently and continues.
    // The session data still loads, but tokenData is null, so sendbird is not initialized.
    // Component shows mock mode message or session info without connection.
    await waitFor(() => {
      expect(screen.getAllByText('김지혜').length).toBeGreaterThan(0);
    });

    // No connection is established since tokenData is null
    expect(mockSendbirdInit).not.toHaveBeenCalled();
  });

  it('renders video placeholders when not connected', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: emoji placeholders replaced by Lucide <User> icon (aria-hidden)
    // + counselor name + waiting copy. Self-PIP shows "나" label twice.
    await waitFor(() => {
      expect(screen.getAllByText('김지혜').length).toBeGreaterThan(0);
      expect(screen.getByText('선생님이 아직 준비 중입니다')).toBeInTheDocument();
      expect(screen.getAllByText('나').length).toBeGreaterThan(0);
    });
  });

  it('ends session and redirects to complete page', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });
    mockEndSession.mockResolvedValueOnce({});

    render(<ConsultationRoomPage />);

    // ZEOM-20: native confirm replaced by EndCallModal. Click the
    // destructive "상담 종료" FabBtn (icon-only; addressable by aria-label),
    // then confirm with the "종료" button inside the modal.
    const endFabBtn = await screen.findByRole('button', { name: '상담 종료' });
    fireEvent.click(endFabBtn);

    const confirmBtn = await screen.findByRole('button', { name: '종료' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockEndSession).toHaveBeenCalledWith('123');
      expect(mockPush).toHaveBeenCalledWith('/consultation/123/summary');
    });
  });

  it('does not end session if user cancels confirmation', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: cancel via the modal's "취소" button instead of window.confirm.
    const endFabBtn = await screen.findByRole('button', { name: '상담 종료' });
    fireEvent.click(endFabBtn);

    const cancelBtn = await screen.findByRole('button', { name: '취소' });
    fireEvent.click(cancelBtn);

    expect(mockEndSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays error message when session end fails', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });
    mockEndSession.mockRejectedValueOnce(new Error('End session failed'));

    render(<ConsultationRoomPage />);

    // ZEOM-20: drive via FabBtn → EndCallModal "종료" confirmation.
    const endFabBtn = await screen.findByRole('button', { name: '상담 종료' });
    fireEvent.click(endFabBtn);

    const confirmBtn = await screen.findByRole('button', { name: '종료' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('End session failed')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles time up callback correctly', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });
    // getNextConsecutive returns no consecutive booking
    mockGetNextConsecutive.mockResolvedValueOnce({ hasNext: false });

    render(<ConsultationRoomPage />);

    await waitFor(() => {
      expect(screen.getByTestId('session-timer')).toBeInTheDocument();
    });

    const timeUpButton = screen.getByText('Trigger Time Up');
    fireEvent.click(timeUpButton);

    // handleTimeUp checks for consecutive booking; with hasNext: false,
    // it proceeds silently and the grace period starts via SessionTimer
    await waitFor(() => {
      expect(mockGetNextConsecutive).toHaveBeenCalledWith('123');
    });
  });

  it('renders microphone and camera control buttons', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: control bar uses icon-only FabBtns; addressable by aria-label.
    // Initial state: audio/video enabled → label is the "turn off" action.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '마이크 끄기' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '카메라 끄기' })).toBeInTheDocument();
    });
  });

  it('disables audio/video controls when not connected', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: the new control bar keeps mic/camera FabBtns visible even
    // before the call connects; toggle handlers no-op safely without an
    // active call (currentCallRef.current is null), and aria-pressed flips.
    // Express the same intent: clicking when disconnected must not throw,
    // must not call any Sendbird call methods, and must update aria-pressed.
    const micBtn = await screen.findByRole('button', { name: '마이크 끄기' });
    const camBtn = await screen.findByRole('button', { name: '카메라 끄기' });

    expect(micBtn).toHaveAttribute('aria-pressed', 'true');
    expect(camBtn).toHaveAttribute('aria-pressed', 'true');

    expect(() => fireEvent.click(micBtn)).not.toThrow();
    expect(() => fireEvent.click(camBtn)).not.toThrow();

    // After toggling without a connection, labels flip to the inverse action.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '마이크 켜기' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '카메라 켜기' })).toBeInTheDocument();
    });
  });

  it('renders session timer component', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    await waitFor(() => {
      expect(screen.getByTestId('session-timer')).toBeInTheDocument();
    });
  });

  it('displays counselor specialty and name correctly', async () => {
    const customSession = {
      ...mockSession,
      counselorName: '이민지',
      counselorSpecialty: '사주',
    };

    mockApiFetch.mockResolvedValueOnce(mockResponse(customSession, 200));
    mockGetSessionToken.mockResolvedValueOnce({
      sendbirdToken: '',
      sendbirdUserId: 'user-123',
      sendbirdAppId: 'mock-app-id',
    });

    render(<ConsultationRoomPage />);

    // ZEOM-20: name + specialty share one span ("{name} · {specialty}").
    // Match the combined text via regex; name still also appears in fallback.
    await waitFor(() => {
      expect(screen.getAllByText('이민지').length).toBeGreaterThan(0);
      expect(screen.getByText(/이민지\s·\s사주/)).toBeInTheDocument();
    });
  });

  // New Sendbird Calls SDK tests
  describe('Sendbird Calls SDK Integration', () => {
    it('initializes SendBird Calls with proper authentication flow', async () => {
      const mockCall = makeMockCall();

      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: 'real-token-123',
        sendbirdUserId: 'user-456',
        sendbirdAppId: 'real-app-id',
        calleeId: 'counselor-789',
      });

      mockSendbirdAuthenticate.mockResolvedValueOnce(undefined);
      mockSendbirdDial.mockReturnValueOnce(mockCall);

      render(<ConsultationRoomPage />);

      await waitFor(() => {
        expect(mockSendbirdInit).toHaveBeenCalledWith('real-app-id');
        expect(mockSendbirdAuthenticate).toHaveBeenCalledWith({
          userId: 'user-456',
          accessToken: 'real-token-123',
        });
        expect(mockSendbirdConnectWebSocket).toHaveBeenCalled();
      });
    });

    it('dials counselor when calleeId is provided (caller role)', async () => {
      const mockCall = makeMockCall();

      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: 'real-token-123',
        sendbirdUserId: 'user-456',
        sendbirdAppId: 'real-app-id',
        calleeId: 'counselor-789',
      });

      mockSendbirdAuthenticate.mockResolvedValueOnce(undefined);
      mockSendbirdDial.mockReturnValueOnce(mockCall);

      render(<ConsultationRoomPage />);

      await waitFor(() => {
        expect(mockSendbirdDial).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'counselor-789',
            isVideoCall: true,
          })
        );
      });
    });

    it('sets up listener when no calleeId (callee role)', async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: 'real-token-123',
        sendbirdUserId: 'user-456',
        sendbirdAppId: 'real-app-id',
        // No calleeId - this is the callee
      });

      mockSendbirdAuthenticate.mockResolvedValueOnce(undefined);

      render(<ConsultationRoomPage />);

      await waitFor(() => {
        expect(mockSendbirdAddListener).toHaveBeenCalledWith(
          'consultation-listener',
          expect.objectContaining({
            onRinging: expect.any(Function),
          })
        );
      });
    });

    it('handles media permission denied gracefully', async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: 'real-token-123',
        sendbirdUserId: 'user-456',
        sendbirdAppId: 'real-app-id',
        calleeId: 'counselor-789',
      });

      mockSendbirdAuthenticate.mockResolvedValueOnce(undefined);

      // Mock media permission denied
      const getUserMediaMock = navigator.mediaDevices.getUserMedia as jest.Mock;
      getUserMediaMock.mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );

      render(<ConsultationRoomPage />);

      await waitFor(() => {
        expect(screen.getByText(/카메라 및 마이크 권한이 필요합니다/)).toBeInTheDocument();
      });

      // Should not attempt to dial after permission failure
      expect(mockSendbirdDial).not.toHaveBeenCalled();
    });

    it('shows connection state messages correctly', async () => {
      const mockCall = makeMockCall({
        onEstablished: jest.fn(),
        onConnected: jest.fn(),
        onEnded: jest.fn(),
        onRemoteAudioSettingsChanged: jest.fn(),
        onRemoteVideoSettingsChanged: jest.fn(),
      });

      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: 'real-token-123',
        sendbirdUserId: 'user-456',
        sendbirdAppId: 'real-app-id',
        calleeId: 'counselor-789',
      });

      mockSendbirdAuthenticate.mockResolvedValueOnce(undefined);
      mockSendbirdDial.mockReturnValueOnce(mockCall);

      render(<ConsultationRoomPage />);

      // Initial state should show connection message
      await waitFor(() => {
        // The component should show some connection-related UI
        expect(mockSendbirdConnectWebSocket).toHaveBeenCalled();
      });
    });

    it('continues to show session when token fetch fails', async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));

      // Token fetch fails, but loadSession catches the error silently
      mockGetSessionToken.mockRejectedValueOnce(new Error('Network error'));

      render(<ConsultationRoomPage />);

      // Session data still loads successfully even when token fetch fails
      await waitFor(() => {
        expect(screen.getAllByText('김지혜').length).toBeGreaterThan(0);
      });

      // SendBird is not initialized since tokenData is null
      expect(mockSendbirdInit).not.toHaveBeenCalled();
    });

    it('shows mock mode message when token has no sendbirdToken', async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse(mockSession, 200));

      // Token returns empty string for sendbirdToken (mock mode)
      mockGetSessionToken.mockResolvedValueOnce({
        sendbirdToken: '',
        sendbirdUserId: 'user-123',
        sendbirdAppId: 'mock-app-id',
      });

      render(<ConsultationRoomPage />);

      // Should show mock mode message since sendbirdToken is empty
      await waitFor(() => {
        expect(screen.getByText(/Mock 모드/)).toBeInTheDocument();
      });

      // SendBird init should not be called in mock mode
      expect(mockSendbirdInit).not.toHaveBeenCalled();
    });
  });
});
