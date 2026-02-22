import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  private var sendbirdPlugin: SendbirdCallsPlugin?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // Register Sendbird Calls MethodChannel
    let controller = window?.rootViewController as! FlutterViewController
    let channel = FlutterMethodChannel(name: "com.cheonjiyeon/sendbird_calls", binaryMessenger: controller.binaryMessenger)

    let plugin = SendbirdCallsPlugin(channel: channel)
    sendbirdPlugin = plugin
    channel.setMethodCallHandler(plugin.handle)

    // Register PlatformView factories for video rendering
    let localViewFactory = SendbirdVideoViewFactory(isLocal: true, plugin: plugin)
    let remoteViewFactory = SendbirdVideoViewFactory(isLocal: false, plugin: plugin)
    registrar(forPlugin: "sendbird-local-video")?.register(localViewFactory, withId: "sendbird-local-video")
    registrar(forPlugin: "sendbird-remote-video")?.register(remoteViewFactory, withId: "sendbird-remote-video")

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
