"use client"

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
    updateCameraConfig, // Added this
  } = useCamera()

  const [isTogglingAllContinuous, setIsTogglingAllContinuous] = useState(false)

  const handleAnalyzeAllSingleFrame = () => {
    cameras.forEach((camera) => {
      if (camera.isActive && !isContinuouslyAnalyzing[camera.id]) {
        captureAndAnalyze(camera.id)
      }
    })
  }

  const handleToggleAllContinuousAnalysis = () => {
    setIsTogglingAllContinuous(true)
    const activeCameras = cameras.filter((c) => c.isActive)
    const anyCameraContinuouslyAnalyzing = activeCameras.some((c) => isContinuouslyAnalyzing[c.id])

    if (anyCameraContinuouslyAnalyzing) {
      activeCameras.forEach((camera) => {
        if (isContinuouslyAnalyzing[camera.id]) {
          stopContinuousAnalysis(camera.id)
        }
      })
    } else {
      activeCameras.forEach((camera) => {
        if (!isContinuouslyAnalyzing[camera.id]) {
          startContinuousAnalysis(camera.id)
        }
      })
    }
    setTimeout(() => setIsTogglingAllContinuous(false), 1000)
  }

  const activeCamerasCount = cameras.filter((c) => c.isActive).length
  const anyCameraIsContinuouslyAnalyzing = cameras.some((c) => c.isActive && isContinuouslyAnalyzing[c.id])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Advanced Video Analytics</h1>
            <p className="text-sm text-muted-foreground">Multi-model real-time video processing</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleAnalyzeAllSingleFrame}
              disabled={
                activeCamerasCount === 0 ||
                Object.values(isAnalyzingSingleFrame).some((s) => s) ||
                Object.values(isContinuouslyAnalyzing).some((s) => s)
              }
              title="Analyze a single frame for all active cameras not in continuous mode"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze All Once
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleAllContinuousAnalysis}
              disabled={activeCamerasCount === 0 || isTogglingAllContinuous}
              title={
                anyCameraIsContinuouslyAnalyzing
                  ? "Stop continuous analysis for all active cameras"
                  : "Start continuous analysis for all active cameras"
              }
            >
              {anyCameraIsContinuouslyAnalyzing ? (
                <ZapOff className="h-4 w-4 mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {anyCameraIsContinuouslyAnalyzing ? "Stop All Streams" : "Start All Streams"}
            </Button>
            <AddCameraDialog onAddCamera={addCamera} />
          </div>
        </header>

        <AnalyticsOverview cameras={cameras} />

        {cameras.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <LucideCameraIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No cameras added yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first camera to start monitoring and analyzing video feeds.
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
                onUpdateCameraConfig={updateCameraConfig} // Pass the new handler
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
