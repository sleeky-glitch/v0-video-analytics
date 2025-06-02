"use client"

import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CameraIcon, TrendingUp, Users } from "lucide-react"

interface AnalyticsOverviewProps {
  cameras: Camera[]
}

export function AnalyticsOverview({ cameras }: AnalyticsOverviewProps) {
  const activeCameras = cameras.filter((camera) => camera.isActive)
  const totalAnalyses = cameras.filter((camera) => camera.lastAnalysis).length

  const emotionCounts = cameras.reduce(
    (acc, camera) => {
      if (camera.lastAnalysis) {
        const dominant = camera.lastAnalysis.dominantEmotion
        acc[dominant] = (acc[dominant] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const dominantOverallEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
          <CameraIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cameras.length}</div>
          <p className="text-xs text-muted-foreground">{activeCameras.length} active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Feeds</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCameras.length}</div>
          <p className="text-xs text-muted-foreground">Currently streaming</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analyses Done</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAnalyses}</div>
          <p className="text-xs text-muted-foreground">Sentiment analyses completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dominant Emotion</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{dominantOverallEmotion}</div>
          <p className="text-xs text-muted-foreground">Across all cameras</p>
        </CardContent>
      </Card>
    </div>
  )
}
