package com.cheonjiyeon.cheonjiyeon_app

import android.content.Context
import com.sendbird.calls.*
import com.sendbird.calls.handler.AuthenticateHandler
import com.sendbird.calls.handler.DialHandler
import com.sendbird.calls.handler.DirectCallListener
import com.sendbird.calls.handler.SendBirdCallListener
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class SendbirdCallsPlugin(
    private val context: Context,
    private val channel: MethodChannel
) : MethodChannel.MethodCallHandler {

    private var currentCall: DirectCall? = null

    init {
        channel.setMethodCallHandler(this)
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "init" -> {
                val appId = call.argument<String>("appId")
                if (appId == null) {
                    result.error("INVALID_ARGS", "appId required", null)
                    return
                }
                SendBirdCall.init(context, appId)

                // Listen for incoming calls
                SendBirdCall.addListener("main", object : SendBirdCallListener() {
                    override fun onRinging(call: DirectCall) {
                        val acceptParams = AcceptParams()
                        currentCall = call
                        call.setListener(directCallListener)
                        call.accept(acceptParams)
                    }

                    override fun onInvitationReceived(invitation: com.sendbird.calls.RoomInvitation) {
                        // Room invitations not used - direct calls only
                    }
                })

                result.success(null)
            }

            "authenticate" -> {
                val userId = call.argument<String>("userId")
                val accessToken = call.argument<String>("accessToken")
                if (userId == null || accessToken == null) {
                    result.error("INVALID_ARGS", "userId and accessToken required", null)
                    return
                }
                val params = AuthenticateParams(userId).setAccessToken(accessToken)
                SendBirdCall.authenticate(params, object : AuthenticateHandler {
                    override fun onResult(user: User?, e: SendBirdException?) {
                        if (e != null) {
                            result.error("AUTH_ERROR", e.message, null)
                        } else {
                            result.success(null)
                        }
                    }
                })
            }

            "dial" -> {
                val calleeId = call.argument<String>("calleeId")
                if (calleeId == null) {
                    result.error("INVALID_ARGS", "calleeId required", null)
                    return
                }
                val audioEnabled = call.argument<Boolean>("audioEnabled") ?: true
                val videoEnabled = call.argument<Boolean>("videoEnabled") ?: true

                val callOptions = CallOptions().apply {
                    setAudioEnabled(audioEnabled)
                    setVideoEnabled(videoEnabled)
                }
                val dialParams = DialParams(calleeId).apply {
                    setVideoCall(true)
                    setCallOptions(callOptions)
                }

                SendBirdCall.dial(dialParams, object : DialHandler {
                    override fun onResult(directCall: DirectCall?, e: SendBirdException?) {
                        if (e != null) {
                            result.error("DIAL_ERROR", e.message, null)
                            return
                        }
                        if (directCall == null) {
                            result.error("DIAL_ERROR", "Call object is null", null)
                            return
                        }
                        currentCall = directCall
                        directCall.setListener(directCallListener)
                        result.success(directCall.callId)
                    }
                })
            }

            "endCall" -> {
                currentCall?.end()
                currentCall = null
                result.success(null)
            }

            "muteMicrophone" -> {
                currentCall?.muteMicrophone()
                result.success(null)
            }

            "unmuteMicrophone" -> {
                currentCall?.unmuteMicrophone()
                result.success(null)
            }

            "stopVideo" -> {
                currentCall?.stopVideo()
                result.success(null)
            }

            "startVideo" -> {
                currentCall?.startVideo()
                result.success(null)
            }

            else -> result.notImplemented()
        }
    }

    private val directCallListener = object : DirectCallListener() {
        override fun onEstablished(call: DirectCall) {
            // Call established (ringing at remote)
        }

        override fun onConnected(call: DirectCall) {
            channel.invokeMethod("onConnected", mapOf("callId" to call.callId))
        }

        override fun onEnded(call: DirectCall) {
            channel.invokeMethod("onEnded", mapOf("callId" to call.callId))
            currentCall = null
        }
    }

    fun getCurrentCall(): DirectCall? = currentCall
}
