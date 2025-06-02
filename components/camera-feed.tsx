"use client"

import { useEffect, useRef } from "react"
import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, CameraIcon, Trash2, Zap, ZapOff, RotateCcw } from "lucide-react"

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

  useEffect(() => {
    onVideoRef(videoRef.current)
  }, [onVideoRef])

  const getEmotionColor = (emotion?: string) => {
    if (!emotion) return "bg-gray-500"
    const colors: Record<string, string> = {
      happy: "bg-green-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      surprised: "bg-yellow-500",
      neutral: "bg-gray-500",
      Error: "bg-destructive",
    }
    return colors[emotion] || "bg-gray-500"
  }

  const dominantEmotionDisplay = camera.lastAnalysis?.dominantEmotion || "N/A"
  const confidenceDisplay =
    camera.lastAnalysis?.confidence !== undefined ? `${(camera.lastAnalysis.confidence * 100).toFixed(1)}%` : "N/A"

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CameraIcon className="h-4 w-4" />
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
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
            {isAnalyzingSingleFrame ? "Analyzing..." : "Analyze Once"}
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

        {camera.lastAnalysis && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Analysis:</span>
              <Badge className={getEmotionColor(camera.lastAnalysis.dominantEmotion)}>{dominantEmotionDisplay}</Badge>
            </div>
            {camera.lastAnalysis.dominantEmotion !== "Error" && (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(camera.lastAnalysis.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="flex justify-between">
                      <span className="capitalize">{emotion}:</span>
                      <span>{(value * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Confidence: {confidenceDisplay}</div>
              </>
            )}
            {/* @ts-ignore */}
            {camera.lastAnalysis.error && (
              <p className="text-xs text-red-500">
                {/* @ts-ignore */}
                Error: {camera.lastAnalysis.error}
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              Timestamp: {new Date(camera.lastAnalysis.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
