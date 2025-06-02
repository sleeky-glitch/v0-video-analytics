"use client"

import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CameraIcon as LucideCameraIcon, AlertTriangle, CheckCircle, Users } from "lucide-react"

interface AnalyticsOverviewProps {
  cameras: Camera[]
}

export function AnalyticsOverview({ cameras }: AnalyticsOverviewProps) {
  const activeCameras = cameras.filter((camera) => camera.isActive)

  let totalPersonsBoxes = 0 // From person_detection models
  let totalFaceEmotionDetections = 0 // From emotion_detection model
  const emotionCounts: Record<string, number> = {}
  let errorsReported = 0
  let personsInDesignatedAreas = 0

  cameras.forEach((camera) => {
    if (camera.lastAnalysis) {
      if (camera.lastAnalysis.error) errorsReported++

      if (
        camera.lastAnalysis.modelUsed === "person_detection" ||
        camera.lastAnalysis.modelUsed === "person_detection_in_area"
      ) {
        totalPersonsBoxes += camera.lastAnalysis.detections?.length || 0
      }
      if (camera.lastAnalysis.modelUsed === "person_detection_in_area" && camera.lastAnalysis.personInDesignatedArea) {
        personsInDesignatedAreas++
      }
      if (camera.lastAnalysis.modelUsed === "emotion_detection") {
        totalFaceEmotionDetections += camera.lastAnalysis.faceEmotions?.length || 0
        camera.lastAnalysis.faceEmotions?.forEach((face) => {
          emotionCounts[face.emotion] = (emotionCounts[face.emotion] || 0) + 1
        })
      }
    }
  })

  const dominantOverallEmotion =
    Object.keys(emotionCounts).length > 0 ? Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0][0] : "N/A"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
          <LucideCameraIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cameras.length}</div>
          <p className="text-xs text-muted-foreground">{activeCameras.length} active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Persons in Area</CardTitle>
          {personsInDesignatedAreas > 0 ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${personsInDesignatedAreas > 0 ? "text-red-500" : "text-green-500"}`}>
            {personsInDesignatedAreas}
          </div>
          <p className="text-xs text-muted-foreground">Alerts from active areas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detected Emotions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{dominantOverallEmotion}</div>
          <p className="text-xs text-muted-foreground">{totalFaceEmotionDetections} faces analyzed (emotion model)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detected Persons</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPersonsBoxes}</div>
          <p className="text-xs text-muted-foreground">Total person boxes (person models)</p>
        </CardContent>
      </Card>
    </div>
  )
}
