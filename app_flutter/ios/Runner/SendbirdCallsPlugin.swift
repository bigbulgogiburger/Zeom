import Flutter
import AVFoundation
import SendBirdCalls

class SendbirdCallsPlugin: NSObject, FlutterPlugin, DirectCallDelegate {
    private var channel: FlutterMethodChannel
    private var currentCall: DirectCall?

    // Video view references — set by SendbirdVideoViewFactory
    var localVideoView: SendBirdVideoView?
    var remoteVideoView: SendBirdVideoView?

    init(channel: FlutterMethodChannel) {
        self.channel = channel
        super.init()
    }

    /// Called by SendbirdVideoViewFactory when a platform view is created.
    /// Binds the video view to the current call if one exists.
    func registerVideoView(_ view: SendBirdVideoView, isLocal: Bool) {
        if isLocal {
            localVideoView = view
            currentCall?.updateLocalVideoView(view)
        } else {
            remoteVideoView = view
            currentCall?.updateRemoteVideoView(view)
        }
    }

    static func register(with registrar: FlutterPluginRegistrar) {
        // Not used - registered manually in AppDelegate
    }

    func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        let args = call.arguments as? [String: Any]
        switch call.method {
        case "init":
            guard let appId = args?["appId"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "appId required", details: nil))
                return
            }
            SendBirdCall.configure(appId: appId)
            SendBirdCall.addDelegate(self, identifier: "main")
            result(nil)

        case "authenticate":
            guard let userId = args?["userId"] as? String,
                  let accessToken = args?["accessToken"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "userId and accessToken required", details: nil))
                return
            }
            let params = AuthenticateParams(userId: userId, accessToken: accessToken)
            SendBirdCall.authenticate(with: params) { user, error in
                if let error = error {
                    result(FlutterError(code: "AUTH_ERROR", message: error.localizedDescription, details: nil))
                } else {
                    result(nil)
                }
            }

        case "dial":
            guard let calleeId = args?["calleeId"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "calleeId required", details: nil))
                return
            }
            let isAudioEnabled = args?["audioEnabled"] as? Bool ?? true
            let isVideoEnabled = args?["videoEnabled"] as? Bool ?? true

            let callOptions = CallOptions()
            callOptions.isAudioEnabled = isAudioEnabled
            callOptions.isVideoEnabled = isVideoEnabled

            let dialParams = DialParams(calleeId: calleeId, isVideoCall: true, callOptions: callOptions)

            SendBirdCall.dial(with: dialParams) { [weak self] call, error in
                if let error = error {
                    result(FlutterError(code: "DIAL_ERROR", message: error.localizedDescription, details: nil))
                    return
                }
                guard let call = call else {
                    result(FlutterError(code: "DIAL_ERROR", message: "Call object is nil", details: nil))
                    return
                }
                self?.currentCall = call
                call.delegate = self

                // Attach video views if already created by PlatformView factory
                if let localView = self?.localVideoView {
                    call.updateLocalVideoView(localView)
                }
                if let remoteView = self?.remoteVideoView {
                    call.updateRemoteVideoView(remoteView)
                }

                result(call.callId)
            }

        case "endCall":
            currentCall?.end()
            currentCall = nil
            result(nil)

        case "muteMicrophone":
            currentCall?.muteMicrophone()
            result(nil)

        case "unmuteMicrophone":
            currentCall?.unmuteMicrophone()
            result(nil)

        case "stopVideo":
            currentCall?.stopVideo()
            result(nil)

        case "startVideo":
            currentCall?.startVideo()
            result(nil)

        default:
            result(FlutterMethodNotImplemented)
        }
    }

    // MARK: - DirectCallDelegate
    func didEstablish(_ call: DirectCall) {
        // Call established (ringing at remote)
    }

    func didConnect(_ call: DirectCall) {
        // Re-bind video views on connect to ensure rendering starts
        if let localView = localVideoView {
            call.updateLocalVideoView(localView)
        }
        if let remoteView = remoteVideoView {
            call.updateRemoteVideoView(remoteView)
        }
        channel.invokeMethod("onConnected", arguments: ["callId": call.callId])
    }

    func didEnd(_ call: DirectCall) {
        channel.invokeMethod("onEnded", arguments: ["callId": call.callId])
        currentCall = nil
    }

    func didRemoteAudioSettingsChange(_ call: DirectCall) {}
    func didRemoteVideoSettingsChange(_ call: DirectCall) {}
    func didAudioDeviceChange(_ call: DirectCall, session: AVAudioSession, previousRoute: AVAudioSessionRouteDescription, reason: AVAudioSession.RouteChangeReason) {}
}

// MARK: - SendBirdCallDelegate (incoming call handling)
extension SendbirdCallsPlugin: SendBirdCallDelegate {
    func didStartRinging(_ call: DirectCall) {
        // For now, auto-accept incoming calls (counselor-side)
        let callOptions = CallOptions()
        callOptions.isAudioEnabled = true
        callOptions.isVideoEnabled = true

        let acceptParams = AcceptParams()
        acceptParams.callOptions = callOptions

        currentCall = call
        call.delegate = self
        call.accept(with: acceptParams)
    }
}
