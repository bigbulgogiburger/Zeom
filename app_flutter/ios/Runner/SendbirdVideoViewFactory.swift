import Flutter
import SendBirdCalls

class SendbirdVideoViewFactory: NSObject, FlutterPlatformViewFactory {
    private let isLocal: Bool
    private weak var plugin: SendbirdCallsPlugin?

    init(isLocal: Bool, plugin: SendbirdCallsPlugin) {
        self.isLocal = isLocal
        self.plugin = plugin
        super.init()
    }

    func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
        let videoView = SendbirdVideoView(frame: frame, isLocal: isLocal)
        // Register the native video view with the plugin so it can bind to the DirectCall
        plugin?.registerVideoView(videoView.getVideoView(), isLocal: isLocal)
        return videoView
    }

    func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
        return FlutterStandardMessageCodec.sharedInstance()
    }
}

class SendbirdVideoView: NSObject, FlutterPlatformView {
    private let videoView: SendBirdVideoView

    init(frame: CGRect, isLocal: Bool) {
        videoView = SendBirdVideoView(frame: frame)
        videoView.backgroundColor = .black
        videoView.contentMode = .scaleAspectFill
        videoView.clipsToBounds = true
        super.init()
    }

    func view() -> UIView {
        return videoView
    }

    func getVideoView() -> SendBirdVideoView {
        return videoView
    }
}
