"use client"

import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CameraIcon as LucideCameraIcon, AlertTriangle, CheckCircle, Users, Flame } from "lucide-react" // Added Flame

interface AnalyticsOverviewProps {
  cameras: Camera[]
}

export function AnalyticsOverview({ cameras }: AnalyticsOverviewProps) {
  const activeCameras = cameras.filter((camera) => camera.isActive)

  let totalPersonsBoxes = 0
  let totalFaceEmotionDetections = 0
  const emotionCounts: Record<string, number> = {}
  let errorsReported = 0
  let personsInDesignatedAreas = 0
  let fireAlerts = 0 // New counter for fire alerts

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
      // New: Count fire alerts
      if (camera.lastAnalysis.modelUsed === "fire_detection" && (camera.lastAnalysis.fireDetections?.length || 0) > 0) {
        fireAlerts++
      }
    }
  })

  const dominantOverallEmotion =
    Object.keys(emotionCounts).length > 0 ? Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0][0] : "N/A"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {" "}
      {/* Adjusted grid for 5 cards */}
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
        {" "}
        {/* New Fire Alert Card */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fire Alerts</CardTitle>
          <Flame className={`h-4 w-4 ${fireAlerts > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${fireAlerts > 0 ? "text-red-500" : ""}`}>{fireAlerts}</div>
          <p className="text-xs text-muted-foreground">Cameras detecting fire</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Persons in Area</CardTitle>
          {personsInDesignatedAreas > 0 ? (
            <AlertTriangle className="h-4 w-4 text-orange-500" /> // Changed color for distinction
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${personsInDesignatedAreas > 0 ? "text-orange-500" : "text-green-500"}`}>
            {personsInDesignatedAreas}
          </div>
          <p className="text-xs text-muted-foreground">Area intrusion alerts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detected Persons</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPersonsBoxes}</div>
          <p className="text-xs text-muted-foreground">Total person boxes</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detected Emotions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{dominantOverallEmotion}</div>
          <p className="text-xs text-muted-foreground">{totalFaceEmotionDetections} faces analyzed</p>
        </CardContent>
      </Card>
    </div>
  )
}
