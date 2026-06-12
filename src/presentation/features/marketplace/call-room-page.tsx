'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import type { ApiCallSession } from '@/infrastructure/api/types'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { toast } from '@/presentation/components/ui/toast'
import { buildWebRtcIceServers } from '@/shared/lib/webrtc-ice-servers'

type IceList = RTCIceCandidateInit[]

function readIce(signaling: Record<string, unknown> | undefined, key: string): IceList {
  const raw = signaling?.[key]
  return Array.isArray(raw) ? (raw as IceList) : []
}

function iceKey(userId: string, initiatorId: string): 'ice_initiator' | 'ice_callee' {
  return userId === initiatorId ? 'ice_initiator' : 'ice_callee'
}

function remoteIceKey(userId: string, initiatorId: string): 'ice_initiator' | 'ice_callee' {
  return userId === initiatorId ? 'ice_callee' : 'ice_initiator'
}

/** WebRTC signaling API orqali (STUN; production uchun TURN kerak bo'lishi mumkin) */
export function CallRoomPage({ callId }: { callId: string }) {
  const { t, userId } = useApp()
  const {
    data: session,
    loading: sessionLoading,
    error: sessionLoadFailed,
    loadError: sessionFetchError,
    reload: reloadSession,
  } = useProtectedLoader(() => api.getCall(callId), [callId])
  const [endedLocally, setEndedLocally] = useState(false)
  const activeSession = useMemo(
    () => (endedLocally && session ? { ...session, status: 'ended' as const } : session),
    [endedLocally, session]
  )
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const appliedIceRef = useRef<Set<string>>(new Set())
  const negotiatingRef = useRef(false)

  const isInitiator = Boolean(userId && session && session.initiator_id === userId)

  const appendIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!userId || !session) return
      const key = iceKey(userId, session.initiator_id)
      const latest = await api.getCall(callId)
      const existing = readIce(latest.signaling, key)
      await api.updateCall(callId, {
        signaling: { [key]: [...existing, candidate] },
      })
    },
    [callId, session, userId]
  )

  const applyRemoteSignaling = useCallback(
    async (pc: RTCPeerConnection, sig: Record<string, unknown> | undefined) => {
      if (!sig || !userId || !session || negotiatingRef.current) return

      const offer = sig.offer as RTCSessionDescriptionInit | undefined
      const answer = sig.answer as RTCSessionDescriptionInit | undefined

      if (!isInitiator && offer && !pc.currentRemoteDescription) {
        negotiatingRef.current = true
        try {
          await pc.setRemoteDescription(offer)
          const localAnswer = await pc.createAnswer()
          await pc.setLocalDescription(localAnswer)
          await api.updateCall(callId, {
            signaling: { answer: pc.localDescription ?? localAnswer },
            status: 'active',
          })
        } finally {
          negotiatingRef.current = false
        }
      }

      if (isInitiator && answer && !pc.currentRemoteDescription) {
        negotiatingRef.current = true
        try {
          await pc.setRemoteDescription(answer)
        } finally {
          negotiatingRef.current = false
        }
      }

      const remoteKey = remoteIceKey(userId, session.initiator_id)
      for (const candidate of readIce(sig, remoteKey)) {
        const fingerprint = JSON.stringify(candidate)
        if (appliedIceRef.current.has(fingerprint)) continue
        appliedIceRef.current.add(fingerprint)
        try {
          await pc.addIceCandidate(candidate)
        } catch (e) {
          ignoreWithLog(e, { scope: 'messages', apiPath: 'webrtc/addIceCandidate' })
        }
      }
    },
    [callId, isInitiator, session, userId]
  )

  useEffect(() => {
    if (!activeSession || activeSession.status === 'ended' || !userId) return

    let cancelled = false
    const pc = new RTCPeerConnection({
      iceServers: buildWebRtcIceServers(),
    })
    pcRef.current = pc

    pc.ontrack = (ev) => {
      if (remoteRef.current) remoteRef.current.srcObject = ev.streams[0]
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void appendIceCandidate(ev.candidate.toJSON()).catch((e) =>
          ignoreWithLog(e, { scope: 'messages', apiPath: `/api/v1/calls/${callId}` })
        )
      }
    }

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        localStreamRef.current = stream
        if (localRef.current) localRef.current.srcObject = stream
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        if (isInitiator) {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await api.updateCall(callId, {
            signaling: { offer: pc.localDescription ?? offer },
            status: 'active',
          })
        }
      } catch (e) {
        ignoreWithLog(e, { scope: 'messages', apiPath: 'webrtc/getUserMedia' })
        toast.error(t('call_media_failed'))
      }
    }

    void setup()

    const poll = window.setInterval(() => {
      void api
        .getCall(callId)
        .then((latest: ApiCallSession) => {
          if (cancelled) return
          if (latest.status === 'ended') setEndedLocally(true)
          return applyRemoteSignaling(pc, latest.signaling)
        })
        .catch((e) => ignoreWithLog(e, { scope: 'messages', apiPath: `/api/v1/calls/${callId}` }))
    }, 1500)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      pc.close()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      pcRef.current = null
    }
  }, [activeSession, appendIceCandidate, applyRemoteSignaling, callId, isInitiator, t, userId])

  useEffect(() => {
    localStreamRef.current?.getTracks().forEach((track) => {
      if (track.kind === 'video') track.enabled = cameraOn
      if (track.kind === 'audio') track.enabled = micOn
    })
    api
      .updateCall(callId, { media_state: { camera: cameraOn, mic: micOn, screen: false } })
      .catch((e) => ignoreWithLog(e, { scope: 'messages', apiPath: `/api/v1/calls/${callId}` }))
  }, [callId, cameraOn, micOn])

  const endCall = async () => {
    await api.updateCall(callId, { status: 'ended' })
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    pcRef.current?.close()
    setEndedLocally(true)
  }

  if (sessionLoading) {
    return <LoadingBlock />
  }

  if (sessionLoadFailed) {
    return (
      <div className="p-4 md:p-6">
        <LoadErrorAlert
          error={sessionFetchError}
          scope="messages"
          onRetry={() => void reloadSession()}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-xl font-bold">{t('video_call')}</h1>
      <p className="text-sm text-muted-foreground">{t('call_test_mode_note')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <video ref={localRef} autoPlay muted playsInline className="aspect-video w-full rounded-xl bg-black" />
        <video ref={remoteRef} autoPlay playsInline className="aspect-video w-full rounded-xl bg-muted" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setMicOn((v) => !v)} aria-pressed={micOn}>
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setCameraOn((v) => !v)} aria-pressed={cameraOn}>
          {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" disabled title={t('call_screen_share_soon')}>
          <Monitor className="h-4 w-4" />
        </Button>
        <Button variant="destructive" onClick={() => void endCall()}>
          <PhoneOff className="mr-2 h-4 w-4" />
          {t('end_call')}
        </Button>
      </div>
      {session && (
        <p className="text-center text-sm capitalize text-muted-foreground">
          {t('status')}: {activeSession?.status ?? '—'}
        </p>
      )}
    </div>
  )
}
