"use client"

import Image from "next/image"
import { useCamera } from "@/hooks/useCamera"
import { CameraFeed } from "@/components/camera-feed"
import { AddCameraDialog } from "@/components/add-camera-dialog"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Zap, ZapOff, CameraIcon as LucideCameraIcon } from "lucide-react"
import { useState } from "react"

export default function VideoAnalyticsDashboard() {
  const {
    cameras,
    isAnalyzingSingleFrame,
    isContinuouslyAnalyzing,
    addCamera,
    removeCamera,
    startCamera,
    stopCamera,
    captureAndAnalyze,
    startContinuousAnalysis,
    stopContinuousAnalysis,
    setVideoRef,
    updateCameraConfig,
  } = useCamera()

  const [isTogglingAllContinuous, setIsTogglingAllContinuous] = useState(false)

  const handleAnalyzeAllSingleFrame = () => {
    cameras.forEach((camera) => {
      if (camera.isActive && !isContinuouslyAnalyzing[camera.id]) captureAndAnalyze(camera.id)
    })
  }

  const handleToggleAllContinuousAnalysis = () => {
    setIsTogglingAllContinuous(true)
    const activeCameras = cameras.filter((c) => c.isActive)
    const anyContAnalyzing = activeCameras.some((c) => isContinuouslyAnalyzing[c.id])
    activeCameras.forEach((camera) => {
      if (anyContAnalyzing) {
        if (isContinuouslyAnalyzing[camera.id]) stopContinuousAnalysis(camera.id)
      } else {
        if (!isContinuouslyAnalyzing[camera.id]) startContinuousAnalysis(camera.id)
      }
    })
    setTimeout(() => setIsTogglingAllContinuous(false), 1000)
  }

  const activeCamerasCount = cameras.filter((c) => c.isActive).length
  const anyCameraIsContinuouslyAnalyzing = cameras.some((c) => c.isActive && isContinuouslyAnalyzing[c.id])

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Image src="/logo-beyondata.png" alt="BeyonData Logo" width={160} height={40} priority />
          {/* <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Video Analytics
          </h1> */}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeAllSingleFrame}
            disabled={
              activeCamerasCount === 0 ||
              Object.values(isAnalyzingSingleFrame).some((s) => s) ||
              Object.values(isContinuouslyAnalyzing).some((s) => s)
            }
            title="Analyze a single frame for all active cameras not in continuous mode"
            className="bg-white dark:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Analyze All Once
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAllContinuousAnalysis}
            disabled={activeCamerasCount === 0 || isTogglingAllContinuous}
            title={anyCameraIsContinuouslyAnalyzing ? "Stop all streams" : "Start all streams"}
            className="bg-white dark:bg-slate-800"
          >
            {anyCameraIsContinuouslyAnalyzing ? <ZapOff className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            {anyCameraIsContinuouslyAnalyzing ? "Stop All Streams" : "Start All Streams"}
          </Button>
          <AddCameraDialog onAddCamera={addCamera} />
        </div>
      </header>

      <AnalyticsOverview cameras={cameras} />

      {cameras.length === 0 ? (
        <Card className="shadow-md bg-white dark:bg-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LucideCameraIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-6" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No cameras added yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Add your first camera to start monitoring and see insights.
            </p>
            <AddCameraDialog onAddCamera={addCamera} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <CameraFeed
              key={camera.id}
              camera={camera}
              isAnalyzingSingleFrame={isAnalyzingSingleFrame[camera.id] || false}
              isContinuouslyAnalyzing={isContinuouslyAnalyzing[camera.id] || false}
              onStart={() => startCamera(camera.id)}
              onStop={() => stopCamera(camera.id)}
              onRemove={() => removeCamera(camera.id)}
              onAnalyzeSingleFrame={() => captureAndAnalyze(camera.id)}
              onStartContinuousAnalysis={() => startContinuousAnalysis(camera.id)}
              onStopContinuousAnalysis={() => stopContinuousAnalysis(camera.id)}
              onVideoRef={(element) => setVideoRef(camera.id, element)}
              onUpdateCameraConfig={updateCameraConfig}
            />
          ))}
        </div>
      )}
    </div>
  )
}
