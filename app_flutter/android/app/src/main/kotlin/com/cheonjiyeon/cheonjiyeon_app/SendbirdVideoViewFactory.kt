package com.cheonjiyeon.cheonjiyeon_app

import android.content.Context
import android.view.View
import com.sendbird.calls.SendBirdVideoView
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory

class SendbirdVideoViewFactory(
    private val isLocal: Boolean
) : PlatformViewFactory(StandardMessageCodec.INSTANCE) {

    override fun create(context: Context, viewId: Int, args: Any?): PlatformView {
        return SendbirdPlatformVideoView(context, isLocal)
    }
}

class SendbirdPlatformVideoView(
    context: Context,
    private val isLocal: Boolean
) : PlatformView {

    private val videoView: SendBirdVideoView = SendBirdVideoView(context).apply {
        setBackgroundColor(android.graphics.Color.BLACK)
    }

    override fun getView(): View = videoView

    override fun dispose() {}

    fun getVideoView(): SendBirdVideoView = videoView
}
