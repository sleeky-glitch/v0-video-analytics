"use client"

import { useState, useRef, useCallback } from "react"
import type { Camera } from "@/types/camera"

export function useCamera() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({})
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const streamRefs = useRef<Record<string, MediaStream | null>>({})

  const addCamera = useCallback((camera: Omit<Camera, "id">) => {
    const newCamera: Camera = {
      ...camera,
      id: `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setCameras((prev) => [...prev, newCamera])
    return newCamera.id
  }, [])

  const removeCamera = useCallback((cameraId: string) => {
    // Stop the stream if it exists
    const stream = streamRefs.current[cameraId]
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      delete streamRefs.current[cameraId]
      delete videoRefs.current[cameraId]
    }
    setCameras((prev) => prev.filter((camera) => camera.id !== cameraId))
  }, [])

  const startCamera = useCallback(async (cameraId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      streamRefs.current[cameraId] = stream

      const videoElement = videoRefs.current[cameraId]
      if (videoElement) {
        videoElement.srcObject = stream
      }

      setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? { ...camera, isActive: true } : camera)))
    } catch (error) {
      console.error("Error starting camera:", error)
    }
  }, [])

  const stopCamera = useCallback((cameraId: string) => {
    const stream = streamRefs.current[cameraId]
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      delete streamRefs.current[cameraId]
    }

    setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? { ...camera, isActive: false } : camera)))
  }, [])

  const captureAndAnalyze = useCallback(
    async (cameraId: string) => {
      const videoElement = videoRefs.current[cameraId]
      if (!videoElement || isAnalyzing[cameraId]) return

      setIsAnalyzing((prev) => ({ ...prev, [cameraId]: true }))

      try {
        // Create canvas to capture frame
        const canvas = document.createElement("canvas")
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(videoElement, 0, 0)

          // Convert to blob
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const formData = new FormData()
                formData.append("image", blob)

                try {
                  console.log(
                    `[Camera ${cameraId}] Attempting to send image to API: http://192.168.100.131:5000/detect`,
                  )
                  // You can inspect the blob size or type if needed:
                  // console.log(`[Camera ${cameraId}] Image blob size: ${blob.size} bytes, type: ${blob.type}`);

                  const response = await fetch("http://192.168.100.131:5000/detect", {
                    method: "POST",
                    body: formData,
                    // It's good practice to set mode to 'cors' if you expect cross-origin requests,
                    // though the browser defaults to it for fetch.
                    // mode: 'cors',
                  })

                  console.log(`[Camera ${cameraId}] API Response Status: ${response.status} ${response.statusText}`)

                  if (!response.ok) {
                    const errorText = await response.text()
                    console.error(
                      `[Camera ${cameraId}] API Error Response Text (Status ${response.status}):`,
                      errorText,
                    )
                    // It's important to throw an error here so it's caught by the outer catch
                    throw new Error(`API request failed with status ${response.status}: ${errorText}`)
                  }

                  const result = await response.json()
                  console.log(`[Camera ${cameraId}] API Analysis Result:`, result)

                  // Update camera with analysis result
                  setCameras((prev) =>
                    prev.map((camera) =>
                      camera.id === cameraId
                        ? {
                            ...camera,
                            lastAnalysis: {
                              timestamp: Date.now(),
                              emotions: result.emotions || {}, // Ensure graceful handling of missing fields
                              dominantEmotion: result.dominantEmotion || "neutral",
                              confidence: result.confidence || 0,
                            },
                          }
                        : camera,
                    ),
                  )
                } catch (error) {
                  // This will catch errors from fetch itself (network errors) or the thrown error above
                  console.error(`[Camera ${cameraId}] Analysis error:`, error)
                  // Optionally, update UI to show an error state for this camera
                  setCameras((prev) =>
                    prev.map((cam) =>
                      cam.id === cameraId
                        ? {
                            ...cam,
                            lastAnalysis: {
                              // @ts-ignore
                              error: (error as Error).message || "Analysis failed",
                              timestamp: Date.now(),
                              emotions: {},
                              dominantEmotion: "Error",
                              confidence: 0,
                            },
                          }
                        : cam,
                    ),
                  )
                }
              }
            },
            "image/jpeg",
            0.8,
          )
        }
      } catch (error) {
        console.error("Capture error:", error)
      } finally {
        setIsAnalyzing((prev) => ({ ...prev, [cameraId]: false }))
      }
    },
    [isAnalyzing],
  )

  const setVideoRef = useCallback((cameraId: string, element: HTMLVideoElement | null) => {
    videoRefs.current[cameraId] = element
  }, [])

  return {
    cameras,
    isAnalyzing,
    addCamera,
    removeCamera,
    startCamera,
    stopCamera,
    captureAndAnalyze,
    setVideoRef,
  }
}
