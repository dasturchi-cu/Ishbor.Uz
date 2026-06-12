const DEFAULT_STUN = 'stun:stun.l.google.com:19302'

/** ICE servers for WebRTC — optional TURN via env (production NAT traversal). */
export function buildWebRtcIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = []

  const stunList = process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS?.split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  if (stunList?.length) {
    servers.push({ urls: stunList.length === 1 ? stunList[0]! : stunList })
  } else {
    servers.push({ urls: DEFAULT_STUN })
  }

  const turnUrl = process.env.NEXT_PUBLIC_WEBRTC_TURN_URL?.trim()
  if (turnUrl) {
    const turn: RTCIceServer = { urls: turnUrl }
    const username = process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME?.trim()
    const credential = process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL?.trim()
    if (username && credential) {
      turn.username = username
      turn.credential = credential
    }
    servers.push(turn)
  }

  return servers
}
