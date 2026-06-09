'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import type { ApiCallSession } from '@/infrastructure/api/types'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'

/** Local/test WebRTC — signaling API orqali (production: TURN/STUN server kerak) */
export function CallRoomPage({ callId }: { callId: string }) {
  const { t } = useApp()
  const [session, setSession] = useState<ApiCallSession | null>(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [screenOn, setScreenOn] = useState(false)
  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    api.getCall(callId).then(setSession)
  }, [callId])

  useEffect(() => {
    if (!session || session.status === 'ended') return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    pcRef.current = pc

    navigator.mediaDevices
      .getUserMedia({ video: cameraOn, audio: micOn })
      .then((stream) => {
        localStreamRef.current = stream
        if (localRef.current) localRef.current.srcObject = stream
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      })
      .catch(() => {})

    pc.ontrack = (ev) => {
      if (remoteRef.current) remoteRef.current.srcObject = ev.streams[0]
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        api.updateCall(callId, { signaling: { ice: ev.candidate.toJSON() } }).catch(() => {})
      }
    }

    return () => {
      pc.close()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [session, callId, cameraOn, micOn])

  const endCall = async () => {
    await api.updateCall(callId, { status: 'ended' })
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    pcRef.current?.close()
    setSession((s) => (s ? { ...s, status: 'ended' } : s))
  }

  const toggleTrack = (kind: 'video' | 'audio', enabled: boolean) => {
    localStreamRef.current?.getTracks().forEach((track) => {
      if (track.kind === kind) track.enabled = enabled
    })
    api.updateCall(callId, {
      media_state: { camera: kind === 'video' ? enabled : cameraOn, mic: kind === 'audio' ? enabled : micOn, screen: screenOn },
    }).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-xl font-bold">{t('video_call')}</h1>
      <p className="text-sm text-muted-foreground">{t('call_test_mode_note')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <video ref={localRef} autoPlay muted playsInline className="rounded-xl bg-black aspect-video w-full" />
        <video ref={remoteRef} autoPlay playsInline className="rounded-xl bg-muted aspect-video w-full" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setMicOn((v) => !v)
            toggleTrack('audio', !micOn)
          }}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCameraOn((v) => !v)
            toggleTrack('video', !cameraOn)
          }}
        >
          {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setScreenOn((v) => !v)}>
          <Monitor className="h-4 w-4" />
        </Button>
        <Button variant="destructive" onClick={endCall}>
          <PhoneOff className="h-4 w-4 mr-2" />
          {t('end_call')}
        </Button>
      </div>
      {session && (
        <p className="text-center text-sm text-muted-foreground capitalize">
          {t('status')}: {session.status}
        </p>
      )}
    </div>
  )
}
