"use client"

import { useCamera } from "@/hooks/useCamera"
import { CameraFeed } from "@/components/camera-feed"
import { AddCameraDialog } from "@/components/add-camera-dialog"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function VideoAnalyticsDashboard() {
  const { cameras, isAnalyzing, addCamera, removeCamera, startCamera, stopCamera, captureAndAnalyze, setVideoRef } =
    useCamera()

  const handleAnalyzeAll = () => {
    cameras.forEach((camera) => {
      if (camera.isActive) {
        captureAndAnalyze(camera.id)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor live feeds and analyze sentiment in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAnalyzeAll}
              disabled={cameras.filter((c) => c.isActive).length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze All
            </Button>
            <AddCameraDialog onAddCamera={addCamera} />
          </div>
        </div>

        <AnalyticsOverview cameras={cameras} />

        {cameras.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">No cameras added yet</h3>
                <p className="text-muted-foreground">
                  Add your first camera to start monitoring and analyzing video feeds
                </p>
                <AddCameraDialog onAddCamera={addCamera} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cameras.map((camera) => (
              <CameraFeed
                key={camera.id}
                camera={camera}
                isAnalyzing={isAnalyzing[camera.id] || false}
                onStart={() => startCamera(camera.id)}
                onStop={() => stopCamera(camera.id)}
                onRemove={() => removeCamera(camera.id)}
                onAnalyze={() => captureAndAnalyze(camera.id)}
                onVideoRef={(element) => setVideoRef(camera.id, element)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
