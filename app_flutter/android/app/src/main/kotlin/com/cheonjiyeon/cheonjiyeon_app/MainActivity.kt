package com.cheonjiyeon.cheonjiyeon_app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var sendbirdPlugin: SendbirdCallsPlugin? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        val channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.cheonjiyeon/sendbird_calls")
        val plugin = SendbirdCallsPlugin(applicationContext, channel)
        sendbirdPlugin = plugin

        // Register PlatformView factories for native video rendering
        flutterEngine.platformViewsController.registry.apply {
            registerViewFactory("sendbird-local-video", SendbirdVideoViewFactory(isLocal = true))
            registerViewFactory("sendbird-remote-video", SendbirdVideoViewFactory(isLocal = false))
        }
    }
}
