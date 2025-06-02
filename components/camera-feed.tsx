"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import type {
  Camera,
  Point,
  AnalysisModelType,
  PersonDetectionBox,
  FaceEmotionDetection,
  FireDetectionBox,
} from "@/types/camera" // Added FireDetectionBox
import { MODEL_DISPLAY_NAMES, AVAILABLE_MODELS } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Play,
  Square,
  CameraIcon as LucideCameraIcon,
  Trash2,
  Zap,
  ZapOff,
  RotateCcw,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Eraser,
  Flame,
} from "lucide-react"

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
  onUpdateCameraConfig: (cameraId: string, newConfig: Partial<Pick<Camera, "modelType" | "designatedArea">>) => void
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
  onUpdateCameraConfig,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingArea, setIsDrawingArea] = useState(false)
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<Point[]>(camera.designatedArea?.points || [])

  useEffect(() => {
    onVideoRef(videoRef.current)
  }, [onVideoRef])
  useEffect(() => {
    setCurrentPolygonPoints(camera.designatedArea?.points || [])
  }, [camera.designatedArea])

  const drawPolygon = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      scaleX: number,
      scaleY: number,
      color = "rgba(255, 255, 0, 0.7)",
    ) => {
      if (points.length === 0) return
      ctx.beginPath()
      ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY)
      }
      if (points.length > 2) ctx.closePath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
      if (points.length > 2 && !isDrawingArea) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.2)"
        ctx.fill()
      }
      points.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x * scaleX, p.y * scaleY, 3, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      })
    },
    [isDrawingArea],
  )

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const displayWidth = video.clientWidth
    const displayHeight = video.clientHeight
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!camera.isActive) return

    const nativeWidth = camera.lastAnalysis?.frameWidth || video.videoWidth || displayWidth
    const nativeHeight = camera.lastAnalysis?.frameHeight || video.videoHeight || displayHeight
    const scaleX = displayWidth > 0 && nativeWidth > 0 ? displayWidth / nativeWidth : 1
    const scaleY = displayHeight > 0 && nativeHeight > 0 ? displayHeight / nativeHeight : 1

    if (camera.modelType === "person_detection_in_area" && currentPolygonPoints.length > 0) {
      drawPolygon(ctx, currentPolygonPoints, displayWidth, displayHeight, "yellow")
    }

    ctx.lineWidth = 2
    ctx.font = "12px Arial"

    if (
      camera.lastAnalysis?.modelUsed === "person_detection" ||
      camera.lastAnalysis?.modelUsed === "person_detection_in_area"
    ) {
      camera.lastAnalysis.detections?.forEach((person: PersonDetectionBox) => {
        const [p_x1, p_y1, p_x2, p_y2] = person.person_box
        ctx.strokeStyle = "lime"
        ctx.strokeRect(p_x1 * scaleX, p_y1 * scaleY, (p_x2 - p_x1) * scaleX, (p_y2 - p_y1) * scaleY)
        ctx.fillStyle = "lime"
        ctx.fillText(`P ${person.confidence.toFixed(2)}`, p_x1 * scaleX, p_y1 * scaleY - 5)
      })
    }

    if (camera.lastAnalysis?.modelUsed === "emotion_detection") {
      camera.lastAnalysis.faceEmotions?.forEach((face: FaceEmotionDetection) => {
        const [fx, fy, fw, fh] = face.box
        ctx.strokeStyle = "cyan"
        ctx.strokeRect(fx * scaleX, fy * scaleY, fw * scaleX, fh * scaleY)
        ctx.fillStyle = "cyan"
        ctx.fillText(`${face.emotion.substring(0, 3)} ${face.score.toFixed(2)}`, fx * scaleX, fy * scaleY - 5)
      })
    }

    // New: Draw Fire Detections
    if (camera.lastAnalysis?.modelUsed === "fire_detection") {
      camera.lastAnalysis.fireDetections?.forEach((fire: FireDetectionBox) => {
        const [x1, y1, x2, y2] = fire.box
        ctx.strokeStyle = "red" // Fire in red
        ctx.fillStyle = "red"
        ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY)
        ctx.fillText(`Fire ${fire.confidence.toFixed(2)}`, x1 * scaleX, y1 * scaleY - 5)
      })
    }
  }, [camera.lastAnalysis, camera.isActive, camera.modelType, currentPolygonPoints, drawPolygon, isDrawingArea])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingArea || camera.modelType !== "person_detection_in_area") return
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || video.videoWidth === 0 || video.videoHeight === 0) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setCurrentPolygonPoints((prev) => [...prev, { x: x / canvas.width, y: y / canvas.height }])
  }

  const handleModelChange = (newModel: AnalysisModelType) => {
    onUpdateCameraConfig(camera.id, { modelType: newModel })
    if (newModel !== "person_detection_in_area") {
      setIsDrawingArea(false)
      setCurrentPolygonPoints([])
    } else {
      setCurrentPolygonPoints(camera.designatedArea?.points || [])
    }
  }

  const toggleDrawingArea = () => {
    if (isDrawingArea) onUpdateCameraConfig(camera.id, { designatedArea: { points: currentPolygonPoints } })
    setIsDrawingArea(!isDrawingArea)
  }

  const clearDrawingArea = () => {
    setCurrentPolygonPoints([])
    if (!isDrawingArea) onUpdateCameraConfig(camera.id, { designatedArea: { points: [] } })
  }

  const hasFireDetections =
    camera.lastAnalysis?.modelUsed === "fire_detection" && (camera.lastAnalysis.fireDetections?.length || 0) > 0

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <LucideCameraIcon className="h-5 w-5" /> {camera.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasFireDetections && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Flame className="h-3 w-3" /> FIRE DETECTED
              </Badge>
            )}
            <Badge variant={camera.isActive ? "default" : "secondary"}>{camera.isActive ? "Active" : "Inactive"}</Badge>
            {isContinuouslyAnalyzing && camera.isActive && (
              <Badge variant="outline" className="border-sky-500 text-sky-500">
                Live Analysis
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove camera" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="relative bg-black rounded-md overflow-hidden aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover block" />
          <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full ${isDrawingArea && camera.modelType === "person_detection_in_area" ? "cursor-crosshair" : "pointer-events-none"}`}
            onClick={handleCanvasClick}
          />
          {!camera.isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <span className="text-white text-sm">Camera Inactive</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`model-select-${camera.id}`} className="text-xs">
            Analysis Model
          </Label>
          <Select value={camera.modelType} onValueChange={handleModelChange}>
            <SelectTrigger id={`model-select-${camera.id}`} className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {MODEL_DISPLAY_NAMES[model]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {camera.modelType === "person_detection_in_area" && ( // Only show for this model
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs">Designated Area</Label>
            <div className="flex gap-2">
              <Button onClick={toggleDrawingArea} variant="outline" size="sm" className="flex-1">
                <Edit3 className={`mr-2 h-4 w-4 ${isDrawingArea ? "text-destructive" : ""}`} />{" "}
                {isDrawingArea ? "Finish Drawing" : "Draw Area"}
              </Button>
              <Button
                onClick={clearDrawingArea}
                variant="outline"
                size="sm"
                disabled={currentPolygonPoints.length === 0 && !isDrawingArea}
              >
                <Eraser className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
            {currentPolygonPoints.length > 0 && !isDrawingArea && (
              <p className="text-xs text-muted-foreground">{currentPolygonPoints.length} points defined.</p>
            )}
          </div>
        )}
        {camera.lastAnalysis?.personInDesignatedArea !== undefined &&
          camera.modelType === "person_detection_in_area" && ( // Only show for this model
            <div
              className={`flex items-center gap-2 p-2 rounded-md text-sm ${camera.lastAnalysis.personInDesignatedArea ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"}`}
            >
              {camera.lastAnalysis.personInDesignatedArea ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Person in Area: {camera.lastAnalysis.personInDesignatedArea ? "DETECTED" : "Clear"}
            </div>
          )}
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2 pt-3 border-t">
        <div className="grid grid-cols-2 gap-2">
          {!camera.isActive ? (
            <Button onClick={onStart} size="sm" className="col-span-2">
              <Play className="h-4 w-4 mr-2" /> Start Camera
            </Button>
          ) : (
            <Button onClick={onStop} variant="outline" size="sm" className="col-span-2">
              <Square className="h-4 w-4 mr-2" /> Stop Camera
            </Button>
          )}
          <Button
            onClick={onAnalyzeSingleFrame}
            disabled={!camera.isActive || isAnalyzingSingleFrame || isContinuouslyAnalyzing}
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />{" "}
            {isAnalyzingSingleFrame && !isContinuouslyAnalyzing ? "Analyzing..." : "Analyze Once"}
          </Button>
          {isContinuouslyAnalyzing ? (
            <Button onClick={onStopContinuousAnalysis} disabled={!camera.isActive} variant="destructive" size="sm">
              <ZapOff className="h-4 w-4 mr-2" /> Stop Stream
            </Button>
          ) : (
            <Button onClick={onStartContinuousAnalysis} disabled={!camera.isActive || isAnalyzingSingleFrame} size="sm">
              <Zap className="h-4 w-4 mr-2" /> Start Stream
            </Button>
          )}
        </div>
        {camera.lastAnalysis?.error && <p className="text-xs text-red-500 pt-2">Error: {camera.lastAnalysis.error}</p>}
        {camera.lastAnalysis && !camera.lastAnalysis.error && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Last analysis: {new Date(camera.lastAnalysis.timestamp).toLocaleTimeString()}
            {camera.lastAnalysis.modelUsed && ` (${MODEL_DISPLAY_NAMES[camera.lastAnalysis.modelUsed]})`}
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
