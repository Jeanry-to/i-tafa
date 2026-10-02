'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import {
  canHostLive,
  createLiveSession,
  endLiveSession,
  getActiveLiveSession,
  type LiveSession,
} from '@/lib/services/api'

type SignalMessage =
  | {
      type: 'viewer-join'
      viewerId: string
    }
  | {
      type: 'viewer-leave'
      viewerId: string
    }
  | {
      type: 'offer'
      viewerId: string
      offer: RTCSessionDescriptionInit
    }
  | {
      type: 'answer'
      viewerId: string
      answer: RTCSessionDescriptionInit
    }
  | {
      type: 'ice-candidate'
      viewerId: string
      candidate: RTCIceCandidateInit
    }
  | {
      type: 'live-ended'
    }

type Props = {
  onStarted?: (session: LiveSession) => void
  onEnded?: () => void
}

export function LiveBroadcast({
  onStarted,
  onEnded,
}: Props) {
  const videoRef =
    useRef<HTMLVideoElement>(null)

  const streamRef =
    useRef<MediaStream | null>(null)

  const channelRef =
    useRef<ReturnType<
      typeof supabase.channel
    > | null>(null)

  const peersRef =
    useRef<Map<string, RTCPeerConnection>>(
      new Map(),
    )

  const sessionRef =
    useRef<LiveSession | null>(null)

  const [canHost, setCanHost] =
    useState<boolean | null>(null)

  const [title, setTitle] =
    useState('')

  const [starting, setStarting] =
    useState(false)

  const [live, setLive] =
    useState(false)

  const [muted, setMuted] =
    useState(false)

  const [cameraEnabled, setCameraEnabled] =
    useState(true)

  const [viewerCount, setViewerCount] =
    useState(0)

  useEffect(() => {
    let active = true

    canHostLive()
      .then((allowed) => {
        if (active) {
          setCanHost(allowed)
        }
      })
      .catch((error) => {
        console.error(
          'Erreur vérification Live:',
          error,
        )

        if (active) {
          setCanHost(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupLocal()
    }
  }, [])

  function closePeer(viewerId: string) {
    const peer =
      peersRef.current.get(viewerId)

    if (peer) {
      peer.close()
      peersRef.current.delete(viewerId)
    }

    setViewerCount(
      peersRef.current.size,
    )
  }

  function cleanupLocal() {
    peersRef.current.forEach(
      (peer) => peer.close(),
    )

    peersRef.current.clear()

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop()
        })

      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (channelRef.current) {
      supabase.removeChannel(
        channelRef.current,
      )

      channelRef.current = null
    }

    sessionRef.current = null

    setViewerCount(0)
    setLive(false)
  }

  async function startLive() {
    if (!title.trim()) {
      toast.error('Titre requis', {
        description:
          'Donnez un titre à votre Live.',
      })

      return
    }

    setStarting(true)

    try {
      const existingLive =
        await getActiveLiveSession()

      if (existingLive) {
        throw new Error(
          'Un Live est déjà en cours pour cette boutique.',
        )
      }

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          'Session expirée. Reconnectez-vous.',
        )
      }

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          'La caméra n’est pas disponible dans ce navigateur.',
        )
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: 'user',
            },
            audio: true,
          },
        )

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream

        videoRef.current.muted = true

        await videoRef.current
          .play()
          .catch(() => undefined)
      }

      const session =
        await createLiveSession({
          hostId: userData.user.id,
          title: title.trim(),
        })

      sessionRef.current = session

      const channel =
        supabase.channel(
          `live:${session.id}`,
          {
            config: {
              broadcast: {
                self: false,
              },
            },
          },
        )

      channelRef.current = channel

      channel.on(
        'broadcast',
        { event: 'signal' },
        async ({
          payload,
        }: {
          payload: SignalMessage
        }) => {
          try {
            if (
              payload.type ===
              'viewer-join'
            ) {
              await handleViewerJoin(
                payload.viewerId,
              )
              return
            }

            if (
              payload.type ===
              'viewer-leave'
            ) {
              closePeer(
                payload.viewerId,
              )
              return
            }

            if (
              payload.type ===
              'answer'
            ) {
              const peer =
                peersRef.current.get(
                  payload.viewerId,
                )

              if (!peer) {
                return
              }

              await peer.setRemoteDescription(
                new RTCSessionDescription(
                  payload.answer,
                ),
              )

              return
            }

            if (
              payload.type ===
              'ice-candidate'
            ) {
              const peer =
                peersRef.current.get(
                  payload.viewerId,
                )

              if (!peer) {
                return
              }

              await peer.addIceCandidate(
                new RTCIceCandidate(
                  payload.candidate,
                ),
              )
            }
          } catch (error) {
            console.error(
              'Erreur signalisation Live:',
              error,
            )
          }
        },
      )

      const status =
        await channel.subscribe()

      if (status !== 'SUBSCRIBED') {
        throw new Error(
          'Impossible de connecter le canal Live.',
        )
      }

      setLive(true)
      setMuted(false)
      setCameraEnabled(true)

      onStarted?.(session)

      toast.success(
        'Live démarré',
        {
          description:
            'Votre caméra est maintenant en direct.',
        },
      )
    } catch (error) {
      cleanupLocal()

      toast.error(
        'Impossible de démarrer le Live',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Vérifiez les autorisations caméra et microphone.',
        },
      )
    } finally {
      setStarting(false)
    }
  }

  async function handleViewerJoin(
    viewerId: string,
  ) {
    const stream =
      streamRef.current

    const channel =
      channelRef.current

    if (!stream || !channel) {
      return
    }

    closePeer(viewerId)

    const peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              'stun:stun.l.google.com:19302',
          },
        ],
      })

    peersRef.current.set(
      viewerId,
      peer,
    )

    setViewerCount(
      peersRef.current.size,
    )

    stream
      .getTracks()
      .forEach((track) => {
        peer.addTrack(
          track,
          stream,
        )
      })

    peer.onicecandidate =
      async (event) => {
        if (
          !event.candidate
        ) {
          return
        }

        await channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice-candidate',
            viewerId,
            candidate:
              event.candidate.toJSON(),
          },
        })
      }

    peer.onconnectionstatechange =
      () => {
        if (
          peer.connectionState ===
            'failed' ||
          peer.connectionState ===
            'closed' ||
          peer.connectionState ===
            'disconnected'
        ) {
          closePeer(viewerId)
        }
      }

    const offer =
      await peer.createOffer()

    await peer.setLocalDescription(
      offer,
    )

    await channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'offer',
        viewerId,
        offer,
      },
    })
  }

  async function stopLive() {
    const session =
      sessionRef.current

    const channel =
      channelRef.current

    try {
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'live-ended',
          },
        })
      }

      if (session) {
        await endLiveSession(
          session.id,
        )
      }

      toast.success(
        'Live terminé',
      )
    } catch (error) {
      toast.error(
        'Erreur lors de la fin du Live',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Réessayez.',
        },
      )
    } finally {
      cleanupLocal()
      onEnded?.()
    }
  }

  function toggleMute() {
    const stream =
      streamRef.current

    if (!stream) {
      return
    }

    const nextMuted =
      !muted

    stream
      .getAudioTracks()
      .forEach((track) => {
        track.enabled =
          !nextMuted
      })

    setMuted(nextMuted)
  }

  function toggleCamera() {
    const stream =
      streamRef.current

    if (!stream) {
      return
    }

    const nextEnabled =
      !cameraEnabled

    stream
      .getVideoTracks()
      .forEach((track) => {
        track.enabled =
          nextEnabled
      })

    setCameraEnabled(
      nextEnabled,
    )
  }

  if (canHost !== true) {
    return null
  }

  if (!live) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Video
              className="size-4"
              aria-hidden="true"
            />

            Live vidéo
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Présentez vos produits en
            direct. La vidéo n&apos;est
            pas enregistrée.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Titre du Live"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={starting}
            />

            <Button
              type="button"
              onClick={startLive}
              disabled={
                starting ||
                !title.trim()
              }
              className="gap-2"
            >
              {starting ? (
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Camera
                  className="size-4"
                  aria-hidden="true"
                />
              )}

              {starting
                ? 'Démarrage...'
                : 'Démarrer le Live'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-destructive/30">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-contain"
          />

          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            EN DIRECT
          </div>

          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            {viewerCount}{' '}
            spectateur
            {viewerCount > 1
              ? 's'
              : ''}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">
              {title}
            </p>

            <p className="text-xs text-muted-foreground">
              Diffusion en temps réel.
              Aucune vidéo n&apos;est
              enregistrée.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleMute}
              aria-label={
                muted
                  ? 'Activer le microphone'
                  : 'Couper le microphone'
              }
            >
              {muted ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleCamera}
              aria-label={
                cameraEnabled
                  ? 'Désactiver la caméra'
                  : 'Activer la caméra'
              }
            >
              <Camera className="size-4" />
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={stopLive}
              className="gap-2"
            >
              <PhoneOff className="size-4" />
              Terminer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}