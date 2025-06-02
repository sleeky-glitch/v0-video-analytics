"use client"

import { useEffect, useRef } from "react"
import type { Camera, PersonDetection, FaceDetection } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, CameraIcon as LucideCameraIcon, Trash2, Zap, ZapOff, RotateCcw } from "lucide-react"

interface CameraFeedProps {
  camera: Camera
  isAnalyzingSingleFrame: boolean
  isContinuouslyAnalyzing: boolean
  onStart: () => void
  onStop: () => void
  onRemove: () => void
  onAnalyzeSingleFrame: () => void
  onStartContinuousAnalysis: () => void
  onStopContinuousAnalysis: () => void
  onVideoRef: (element: HTMLVideoElement | null) => void
}

export function CameraFeed({
  camera,
  isAnalyzingSingleFrame,
  isContinuouslyAnalyzing,
  onStart,
  onStop,
  onRemove,
  onAnalyzeSingleFrame,
  onStartContinuousAnalysis,
  onStopContinuousAnalysis,
  onVideoRef,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    onVideoRef(videoRef.current)
  }, [onVideoRef])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !camera.isActive || !camera.lastAnalysis?.detections) {
      // Clear canvas if not active or no detections
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Ensure canvas is same size as video for clearing
          if (video && video.videoWidth > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // Ensure canvas dimensions match video display dimensions for accurate overlay
    // This is crucial if the video element is styled (e.g., width: 100%)
    const displayWidth = video.clientWidth
    const displayHeight = video.clientHeight
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Scaling factors if video's natural dimensions differ from display dimensions
    const scaleX = displayWidth / (camera.lastAnalysis.frameWidth || video.videoWidth || displayWidth)
    const scaleY = displayHeight / (camera.lastAnalysis.frameHeight || video.videoHeight || displayHeight)

    ctx.lineWidth = 2
    ctx.font = "14px Arial"

    camera.lastAnalysis.detections.forEach((person: PersonDetection) => {
      const [p_x1, p_y1, p_x2, p_y2] = person.person_box
      const scaled_p_x1 = p_x1 * scaleX
      const scaled_p_y1 = p_y1 * scaleY
      const scaled_p_w = (p_x2 - p_x1) * scaleX
      const scaled_p_h = (p_y2 - p_y1) * scaleY

      // Draw person box (green)
      ctx.strokeStyle = "lime" // Brighter green
      ctx.strokeRect(scaled_p_x1, scaled_p_y1, scaled_p_w, scaled_p_h)
      ctx.fillStyle = "lime"
      ctx.fillText(
        `Person ${person.confidence.toFixed(2)}`,
        scaled_p_x1,
        scaled_p_y1 > 10 ? scaled_p_y1 - 5 : scaled_p_y1 + 10, // Adjust text position
      )

      person.faces.forEach((face: FaceDetection) => {
        const [f_rx, f_ry, f_w, f_h] = face.box // Relative to person ROI

        // Absolute face coordinates within the original frame
        const abs_f_x = p_x1 + f_rx
        const abs_f_y = p_y1 + f_ry

        // Scale absolute face coordinates and dimensions
        const scaled_f_x = abs_f_x * scaleX
        const scaled_f_y = abs_f_y * scaleY
        const scaled_f_w = f_w * scaleX
        const scaled_f_h = f_h * scaleY

        // Draw face box (blue)
        ctx.strokeStyle = "blue"
        ctx.strokeRect(scaled_f_x, scaled_f_y, scaled_f_w, scaled_f_h)
        ctx.fillStyle = "blue"
        ctx.fillText(
          `${face.emotion} ${face.score.toFixed(2)}`,
          scaled_f_x,
          scaled_f_y > 10 ? scaled_f_y - 5 : scaled_f_y + 10,
        )
      })
    })
  }, [camera.lastAnalysis, camera.isActive]) // Redraw when analysis or active state changes

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LucideCameraIcon className="h-4 w-4" />
          {camera.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={camera.isActive ? "default" : "secondary"}>{camera.isActive ? "Active" : "Inactive"}</Badge>
          {isContinuouslyAnalyzing && (
            <Badge variant="outline" className="border-sky-500 text-sky-500">
              Streaming Analysis
            </Badge>
          )}
          <Button variant="outline" size="icon" onClick={onRemove} aria-label="Remove camera">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover block" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          {!camera.isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <span className="text-white text-sm">Camera Inactive</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!camera.isActive ? (
            <Button onClick={onStart} size="sm" className="col-span-2">
              <Play className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={onStop} variant="outline" size="sm" className="col-span-2">
              <Square className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          )}

          <Button
            onClick={onAnalyzeSingleFrame}
            disabled={!camera.isActive || isAnalyzingSingleFrame || isContinuouslyAnalyzing}
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isAnalyzingSingleFrame && !isContinuouslyAnalyzing ? "Analyzing..." : "Analyze Once"}
          </Button>

          {isContinuouslyAnalyzing ? (
            <Button onClick={onStopContinuousAnalysis} disabled={!camera.isActive} variant="destructive" size="sm">
              <ZapOff className="h-4 w-4 mr-2" />
              Stop Stream
            </Button>
          ) : (
            <Button onClick={onStartContinuousAnalysis} disabled={!camera.isActive || isAnalyzingSingleFrame} size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Start Stream
            </Button>
          )}
        </div>
        {camera.lastAnalysis?.error && (
          <p className="text-xs text-red-500 pt-2 border-t">Error: {camera.lastAnalysis.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
