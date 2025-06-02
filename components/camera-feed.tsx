"use client"

import { useEffect, useRef } from "react"
import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, CameraIcon, Trash2 } from "lucide-react"

interface CameraFeedProps {
  camera: Camera
  isAnalyzing: boolean
  onStart: () => void
  onStop: () => void
  onRemove: () => void
  onAnalyze: () => void
  onVideoRef: (element: HTMLVideoElement | null) => void
}

export function CameraFeed({ camera, isAnalyzing, onStart, onStop, onRemove, onAnalyze, onVideoRef }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    onVideoRef(videoRef.current)
  }, [onVideoRef])

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-green-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      surprised: "bg-yellow-500",
      neutral: "bg-gray-500",
    }
    return colors[emotion] || "bg-gray-500"
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CameraIcon className="h-4 w-4" />
          {camera.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={camera.isActive ? "default" : "secondary"}>{camera.isActive ? "Active" : "Inactive"}</Badge>
          <Button variant="outline" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
          {!camera.isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <span className="text-white text-sm">Camera Inactive</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!camera.isActive ? (
            <Button onClick={onStart} size="sm" className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={onStop} variant="outline" size="sm" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          <Button onClick={onAnalyze} disabled={!camera.isActive || isAnalyzing} size="sm" className="flex-1">
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {camera.lastAnalysis && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Analysis:</span>
              <Badge className={getEmotionColor(camera.lastAnalysis.dominantEmotion)}>
                {camera.lastAnalysis.dominantEmotion}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(camera.lastAnalysis.emotions).map(([emotion, value]) => (
                <div key={emotion} className="flex justify-between">
                  <span className="capitalize">{emotion}:</span>
                  <span>{(value * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence: {(camera.lastAnalysis.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
