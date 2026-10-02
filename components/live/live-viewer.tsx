'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Loader2,
  Radio,
  Volume2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { LiveSession } from '@/lib/services/api'

type SignalMessage =
  | {
      type: 'offer'
      viewerId: string
      offer: RTCSessionDescriptionInit
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
  session: LiveSession
  onEnded?: () => void
}

function createViewerId() {
  if (
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function LiveViewer({
  session,
  onEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const peerRef =
    useRef<RTCPeerConnection | null>(null)

  const channelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(
      null,
    )

  const viewerIdRef =
    useRef(createViewerId())

  const pendingCandidatesRef =
    useRef<RTCIceCandidateInit[]>([])

  const onEndedRef =
    useRef(onEnded)

  const [connecting, setConnecting] =
    useState(true)

  const [connected, setConnected] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    let cancelled = false

    async function connect() {
      setConnecting(true)
      setError(null)

      try {
        const viewerId =
          viewerIdRef.current

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

        function createPeer() {
          const peer =
            new RTCPeerConnection({
              iceServers: [
                {
                  urls:
                    'stun:stun.l.google.com:19302',
                },
              ],
            })

          peer.ontrack = (event) => {
            const stream =
              event.streams[0]

            if (
              !videoRef.current ||
              !stream
            ) {
              return
            }

            videoRef.current.srcObject =
              stream

            videoRef.current
              .play()
              .then(() => {
                setConnected(true)
                setConnecting(false)
              })
              .catch(() => {
                setConnected(true)
                setConnecting(false)
              })
          }

          peer.onicecandidate =
            async (event) => {
              if (
                !event.candidate ||
                !channelRef.current
              ) {
                return
              }

              await channelRef.current.send({
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
                'connected'
              ) {
                setConnected(true)
                setConnecting(false)
              }

              if (
                peer.connectionState ===
                'failed'
              ) {
                setError(
                  'La connexion vidéo a échoué.',
                )
                setConnecting(false)
              }

              if (
                peer.connectionState ===
                'disconnected'
              ) {
                setConnected(false)
              }
            }

          return peer
        }

        channel.on(
          'broadcast',
          { event: 'signal' },
          async ({
            payload,
          }: {
            payload: SignalMessage
          }) => {
            if (cancelled) {
              return
            }

            try {
              if (
                payload.type ===
                'live-ended'
              ) {
                setConnected(false)
                setConnecting(false)

                if (videoRef.current) {
                  videoRef.current.srcObject =
                    null
                }

                onEndedRef.current?.()

                return
              }

              if (
                payload.type ===
                'ice-candidate'
              ) {
                if (
                  payload.viewerId !==
                  viewerId
                ) {
                  return
                }

                const candidate =
                  payload.candidate

                const peer =
                  peerRef.current

                if (
                  !peer ||
                  !peer.remoteDescription
                ) {
                  pendingCandidatesRef.current.push(
                    candidate,
                  )

                  return
                }

                await peer.addIceCandidate(
                  new RTCIceCandidate(
                    candidate,
                  ),
                )

                return
              }

              if (
                payload.type !==
                'offer'
              ) {
                return
              }

              if (
                payload.viewerId !==
                viewerId
              ) {
                return
              }

              let peer =
                peerRef.current

              if (!peer) {
                peer = createPeer()
                peerRef.current =
                  peer
              }

              await peer.setRemoteDescription(
                new RTCSessionDescription(
                  payload.offer,
                ),
              )

              for (const candidate of
                pendingCandidatesRef.current) {
                try {
                  await peer.addIceCandidate(
                    new RTCIceCandidate(
                      candidate,
                    ),
                  )
                } catch {
                  // Ignore une candidate ICE invalide.
                }
              }

              pendingCandidatesRef.current =
                []

              const answer =
                await peer.createAnswer()

              await peer.setLocalDescription(
                answer,
              )

              await channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'answer',
                  viewerId,
                  answer,
                },
              })
            } catch (signalError) {
              console.error(
                'Erreur Live viewer:',
                signalError,
              )

              setError(
                'Erreur de connexion au Live.',
              )
            }
          },
        )

       const status = await channel.subscribe()

console.log('Statut Realtime Live viewer :', status)

if (status !== 'SUBSCRIBED') {
  throw new Error(
    `Connexion Realtime refusée. Statut : ${status}`,
  )
}
        if (cancelled) {
          return
        }

        await channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'viewer-join',
            viewerId,
          },
        })
      } catch (connectError) {
        if (cancelled) {
          return
        }

        console.error(
          connectError,
        )

        setError(
          connectError instanceof Error
            ? connectError.message
            : 'Impossible de rejoindre le Live.',
        )

        setConnecting(false)
      }
    }

    connect()

    return () => {
      cancelled = true

      const viewerId =
        viewerIdRef.current

      const channel =
        channelRef.current

      if (channel) {
        channel
          .send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'viewer-leave',
              viewerId,
            },
          })
          .catch(() => undefined)

        supabase.removeChannel(
          channel,
        )

        channelRef.current =
          null
      }

      if (peerRef.current) {
        peerRef.current.close()
        peerRef.current =
          null
      }

      pendingCandidatesRef.current =
        []

      if (videoRef.current) {
        videoRef.current.srcObject =
          null
      }
    }
  }, [session.id])

  return (
    <Card className="overflow-hidden border-destructive/30">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className="h-full w-full object-contain"
          />

          {connecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white">
              <Loader2 className="size-8 animate-spin" />

              <p className="text-sm">
                Connexion au Live...
              </p>
            </div>
          )}

          {error && !connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center text-white">
              <Radio className="size-8" />

              <p className="text-sm">
                {error}
              </p>
            </div>
          )}

          {connected && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white">
              <span className="size-2 animate-pulse rounded-full bg-white" />
              EN DIRECT
            </div>
          )}

          {connected && (
            <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
              <Volume2 className="mr-1 inline size-3.5" />
              Audio en direct
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="font-semibold">
            {session.title}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Diffusion en direct — aucune vidéo
            n&apos;est enregistrée.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}