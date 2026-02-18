'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RequireLogin } from '../../../../components/route-guard';
import { Card, InlineError, PageTitle, ActionButton } from '../../../../components/ui';

export default function PreflightPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkPermissions();
    checkNetworkQuality();

    return () => {
      // Cleanup preview stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function checkPermissions() {
    setChecking(true);
    try {
      // Use standard WebRTC for preview
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      setCameraPermission('granted');
      setMicPermission('granted');
    } catch {
      // Check individually if combined check failed
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');
        cameraStream.getTracks().forEach(track => track.stop());
      } catch {
        setCameraPermission('denied');
      }

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
        micStream.getTracks().forEach(track => track.stop());
      } catch {
        setMicPermission('denied');
      }
    } finally {
      setChecking(false);
    }
  }

  function checkNetworkQuality() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g') {
        setNetworkQuality('good');
      } else if (effectiveType === '3g') {
        setNetworkQuality('fair');
      } else {
        setNetworkQuality('poor');
      }
    } else {
      setNetworkQuality('good'); // Default to good if can't detect
    }
  }

  function canEnterRoom() {
    return cameraPermission === 'granted' && micPermission === 'granted';
  }

  function enterRoom() {
    if (!canEnterRoom()) {
      setMessage('카메라와 마이크 권한이 필요합니다.');
      return;
    }

    // Clean up preview before entering
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }

    router.push(`/consultation/${sessionId}`);
  }

  const getPermissionIcon = (status: string) => {
    if (status === 'granted') return '✅';
    if (status === 'denied') return '❌';
    return '⏳';
  };

  const getNetworkIcon = (quality: string) => {
    if (quality === 'good') return '🟢';
    if (quality === 'fair') return '🟡';
    return '🔴';
  };

  return (
    <RequireLogin>
      <main style={{
        padding: 'var(--spacing-xl)',
        display: 'grid',
        gap: 'var(--spacing-lg)',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <PageTitle>상담 준비 확인</PageTitle>
        <InlineError message={message} />

        {/* Camera Preview */}
        {cameraPermission === 'granted' && (
          <Card>
            <h3 style={{
              margin: '0 0 var(--spacing-md) 0',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-heading)',
            }}>
              카메라 미리보기
            </h3>
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              background: '#000',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </Card>
        )}

        <Card>
          <h3 style={{
            margin: '0 0 var(--spacing-md) 0',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-heading)',
          }}>
            디바이스 점검
          </h3>

          <div style={{
            display: 'grid',
            gap: 'var(--spacing-md)',
          }}>
            {/* Camera Permission */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--spacing-md)',
              background: cameraPermission === 'granted'
                ? 'var(--color-success-light)'
                : cameraPermission === 'denied'
                  ? 'var(--color-danger-light)'
                  : 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-base)',
                }}>
                  📹 카메라
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted-card)',
                  marginTop: 'var(--spacing-xs)',
                }}>
                  화상 상담을 위해 필요합니다
                </div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>
                {getPermissionIcon(cameraPermission)}
              </div>
            </div>

            {/* Microphone Permission */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--spacing-md)',
              background: micPermission === 'granted'
                ? 'var(--color-success-light)'
                : micPermission === 'denied'
                  ? 'var(--color-danger-light)'
                  : 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-base)',
                }}>
                  🎤 마이크
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted-card)',
                  marginTop: 'var(--spacing-xs)',
                }}>
                  음성 상담을 위해 필요합니다
                </div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>
                {getPermissionIcon(micPermission)}
              </div>
            </div>

            {/* Network Quality */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--spacing-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-base)',
                }}>
                  📡 네트워크
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted-card)',
                  marginTop: 'var(--spacing-xs)',
                }}>
                  {networkQuality === 'good' ? '원활함' : networkQuality === 'fair' ? '보통' : '불안정'}
                </div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>
                {getNetworkIcon(networkQuality)}
              </div>
            </div>
          </div>

          {(cameraPermission === 'denied' || micPermission === 'denied') && (
            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              background: 'var(--color-danger-light)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
            }}>
              ⚠️ 브라우저 설정에서 카메라와 마이크 권한을 허용해주세요.
            </div>
          )}
        </Card>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
        }}>
          <ActionButton
            onClick={enterRoom}
            disabled={!canEnterRoom() || checking}
            loading={checking}
          >
            🚪 상담실 입장
          </ActionButton>

          <button
            onClick={checkPermissions}
            disabled={checking}
            style={{
              background: 'transparent',
              color: 'var(--color-gold)',
              border: `1px solid var(--color-border-dark)`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              fontSize: 'var(--font-size-sm)',
              cursor: checking ? 'not-allowed' : 'pointer',
              opacity: checking ? 0.6 : 1,
            }}
          >
            🔄 다시 확인
          </button>
        </div>
      </main>
    </RequireLogin>
  );
}
