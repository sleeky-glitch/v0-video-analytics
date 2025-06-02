"use client"

import type React from "react"

import type { Camera } from "@/types/camera"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraIcon as LucideCameraIcon, AlertTriangle, Flame, Eye, ShieldCheck } from "lucide-react"

interface AnalyticsOverviewProps {
  cameras: Camera[]
}

// A simpler StatCard component for this UI
function StatCard({
  title,
  value,
  icon: Icon,
  details,
  valueColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  details?: string
  valueColor?: string
}) {
  return (
    <Card className="shadow-md bg-white dark:bg-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueColor || "text-slate-800 dark:text-slate-100"}`}>{value}</div>
        {details && <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{details}</p>}
      </CardContent>
    </Card>
  )
}

export function AnalyticsOverview({ cameras }: AnalyticsOverviewProps) {
  const activeCameras = cameras.filter((camera) => camera.isActive)
  let totalPersonsBoxes = 0
  let personsInDesignatedAreas = 0
  let fireAlertsCount = 0
  let activeStreams = 0

  cameras.forEach((camera) => {
    if (camera.isActive) activeStreams++
    if (camera.lastAnalysis) {
      if (
        camera.lastAnalysis.modelUsed === "person_detection" ||
        camera.lastAnalysis.modelUsed === "person_detection_in_area"
      ) {
        totalPersonsBoxes += camera.lastAnalysis.detections?.length || 0
      }
      if (camera.lastAnalysis.modelUsed === "person_detection_in_area" && camera.lastAnalysis.personInDesignatedArea) {
        personsInDesignatedAreas++
      }
      if (camera.lastAnalysis.modelUsed === "fire_detection" && (camera.lastAnalysis.fireDetections?.length || 0) > 0) {
        fireAlertsCount++
      }
    }
  })

  let personsWithMask = 0
  let personsWithoutMask = 0
  let maskDetectionCamerasActive = 0

  cameras.forEach((camera) => {
    if (camera.isActive && camera.modelType === "mask_detection") {
      maskDetectionCamerasActive++
    }
    if (camera.isActive && camera.lastAnalysis?.modelUsed === "mask_detection") {
      camera.lastAnalysis.maskDetections?.forEach((det) => {
        if (det.label.toLowerCase() === "mask" || det.label.toLowerCase() === "masked") {
          personsWithMask++
        } else if (det.label.toLowerCase() === "no_mask" || det.label.toLowerCase() === "unmasked") {
          personsWithoutMask++
        }
      })
    }
  })

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
      <StatCard
        title="Total Cameras"
        value={cameras.length}
        icon={LucideCameraIcon}
        details={`${activeCameras.length} active`}
      />
      <StatCard title="Active Streams" value={activeStreams} icon={Eye} details="Currently streaming video" />
      <StatCard
        title="Fire Alerts"
        value={fireAlertsCount}
        icon={Flame}
        details="Active fire detections"
        valueColor={fireAlertsCount > 0 ? "text-red-500 dark:text-red-400" : undefined}
      />
      <StatCard
        title="Area Intrusions"
        value={personsInDesignatedAreas}
        icon={AlertTriangle}
        details="Persons in designated areas"
        valueColor={personsInDesignatedAreas > 0 ? "text-orange-500 dark:text-orange-400" : undefined}
      />
      <StatCard
        title="Masks Detected"
        value={personsWithMask}
        icon={ShieldCheck} // Or Users with a mask icon if available
        details={`${maskDetectionCamerasActive} mask cameras active`}
        valueColor={personsWithMask > 0 ? "text-green-500 dark:text-green-400" : undefined}
      />
      <StatCard
        title="No Masks Detected"
        value={personsWithoutMask}
        icon={AlertTriangle} // Or ShieldAlert
        details="Persons detected without masks"
        valueColor={personsWithoutMask > 0 ? "text-orange-500 dark:text-orange-400" : undefined}
      />
    </div>
  )
}
