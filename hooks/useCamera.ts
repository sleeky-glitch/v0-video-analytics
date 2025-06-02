"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { Camera, SentimentAnalysis } from "@/types/camera"

const CONTINUOUS_ANALYSIS_INTERVAL = 2000 // 2 seconds

export function useCamera() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isAnalyzingSingleFrame, setIsAnalyzingSingleFrame] = useState<Record<string, boolean>>({})
  const [isContinuouslyAnalyzing, setIsContinuouslyAnalyzing] = useState<Record<string, boolean>>({})

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const streamRefs = useRef<Record<string, MediaStream | null>>({})
  const continuousAnalysisIntervals = useRef<Record<string, NodeJS.Timeout | null>>({})

  const setCameraAnalysisResult = useCallback(
    (
      cameraId: string,
      analysisResult:
        | SentimentAnalysis
        | { error: string; timestamp: number; emotions: {}; dominantEmotion: string; confidence: number },
    ) => {
      setCameras((prev) =>
        prev.map((camera) =>
          camera.id === cameraId
            ? {
                ...camera,
                lastAnalysis: analysisResult as SentimentAnalysis, // Type assertion for simplicity, ensure error structure matches
              }
            : camera,
        ),
      )
    },
    [],
  )

  const captureAndAnalyze = useCallback(
    async (cameraId: string, isContinuous = false) => {
      const videoElement = videoRefs.current[cameraId]
      // Prevent re-entry if already analyzing this specific frame or if continuous analysis is on and an analysis is in progress
      if (
        !videoElement ||
        (!isContinuous && isAnalyzingSingleFrame[cameraId]) ||
        (isContinuous && isAnalyzingSingleFrame[cameraId])
      ) {
        // If continuous, and an analysis is already running, we just skip this tick.
        // The isAnalyzingSingleFrame flag will be cleared by the ongoing analysis.
        return
      }

      if (!isContinuous) {
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: true }))
      } else {
        // For continuous, we also use isAnalyzingSingleFrame to prevent overlapping API calls
        // but the overall state is managed by isContinuouslyAnalyzing
        if (isAnalyzingSingleFrame[cameraId]) return // Already processing a frame
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: true }))
      }

      try {
        const canvas = document.createElement("canvas")
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(videoElement, 0, 0)
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8))

          if (blob) {
            const formData = new FormData()
            formData.append("image", blob)

            try {
              const apiUrl = "https://192.168.100.131:5000/detect" // Ensure this is accessible
              console.log(`[Camera ${cameraId}] Sending image to API: ${apiUrl}`)
              const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
              })

              console.log(`[Camera ${cameraId}] API Response Status: ${response.status} ${response.statusText}`)
              if (!response.ok) {
                const errorText = await response.text()
                console.error(`[Camera ${cameraId}] API Error (Status ${response.status}):`, errorText)
                throw new Error(`API request failed: ${response.status} ${errorText}`)
              }

              const result = await response.json()
              console.log(`[Camera ${cameraId}] API Analysis Result:`, result)
              setCameraAnalysisResult(cameraId, {
                timestamp: Date.now(),
                emotions: result.emotions || {},
                dominantEmotion: result.dominantEmotion || "neutral",
                confidence: result.confidence || 0,
              })
            } catch (error) {
              console.error(`[Camera ${cameraId}] Analysis fetch error:`, error)
              setCameraAnalysisResult(cameraId, {
                error: (error as Error).message || "Analysis failed",
                timestamp: Date.now(),
                emotions: {},
                dominantEmotion: "Error",
                confidence: 0,
              })
            }
          }
        }
      } catch (captureError) {
        console.error(`[Camera ${cameraId}] Capture error:`, captureError)
        setCameraAnalysisResult(cameraId, {
          error: (captureError as Error).message || "Capture failed",
          timestamp: Date.now(),
          emotions: {},
          dominantEmotion: "Error",
          confidence: 0,
        })
      } finally {
        // Always clear the single frame analysis lock
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
      }
    },
    [isAnalyzingSingleFrame, setCameraAnalysisResult], // Removed isContinuouslyAnalyzing from deps as it's passed as arg
  )

  const startContinuousAnalysis = useCallback(
    (cameraId: string) => {
      if (continuousAnalysisIntervals.current[cameraId] || !cameras.find((c) => c.id === cameraId && c.isActive)) {
        return // Already running or camera not active
      }

      setIsContinuouslyAnalyzing((prev) => ({ ...prev, [cameraId]: true }))

      // Immediately trigger first analysis
      captureAndAnalyze(cameraId, true)

      const intervalId = setInterval(() => {
        captureAndAnalyze(cameraId, true)
      }, CONTINUOUS_ANALYSIS_INTERVAL)
      continuousAnalysisIntervals.current[cameraId] = intervalId
    },
    [captureAndAnalyze, cameras],
  )

  const stopContinuousAnalysis = useCallback((cameraId: string) => {
    if (continuousAnalysisIntervals.current[cameraId]) {
      clearInterval(continuousAnalysisIntervals.current[cameraId]!)
      continuousAnalysisIntervals.current[cameraId] = null
    }
    setIsContinuouslyAnalyzing((prev) => ({ ...prev, [cameraId]: false }))
    // Also clear the single frame lock if it was somehow left on
    setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
  }, [])

  const addCamera = useCallback((camera: Omit<Camera, "id" | "lastAnalysis">) => {
    const newCamera: Camera = {
      ...camera,
      id: `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: false, // Ensure isActive is part of the type and initialized
    }
    setCameras((prev) => [...prev, newCamera])
    setIsContinuouslyAnalyzing((prev) => ({ ...prev, [newCamera.id]: false }))
    setIsAnalyzingSingleFrame((prev) => ({ ...prev, [newCamera.id]: false }))
    return newCamera.id
  }, [])

  const removeCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId) // Stop analysis before removing
      const stream = streamRefs.current[cameraId]
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        delete streamRefs.current[cameraId]
      }
      delete videoRefs.current[cameraId]
      setCameras((prev) => prev.filter((camera) => camera.id !== cameraId))
      setIsContinuouslyAnalyzing((prev) => {
        const newState = { ...prev }
        delete newState[cameraId]
        return newState
      })
      setIsAnalyzingSingleFrame((prev) => {
        const newState = { ...prev }
        delete newState[cameraId]
        return newState
      })
    },
    [stopContinuousAnalysis],
  )

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
      // Optionally update camera state to show an error
    }
  }, [])

  const stopCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId) // Stop continuous analysis if camera is stopped
      const stream = streamRefs.current[cameraId]
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        // Do not delete streamRefs.current[cameraId] here, allow restart
      }
      setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? { ...camera, isActive: false } : camera)))
    },
    [stopContinuousAnalysis],
  )

  const setVideoRef = useCallback((cameraId: string, element: HTMLVideoElement | null) => {
    videoRefs.current[cameraId] = element
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(continuousAnalysisIntervals.current).forEach((intervalId) => {
        if (intervalId) clearInterval(intervalId)
      })
    }
  }, [])

  return {
    cameras,
    isAnalyzingSingleFrame, // Renamed from isAnalyzing
    isContinuouslyAnalyzing,
    addCamera,
    removeCamera,
    startCamera,
    stopCamera,
    captureAndAnalyze: (cameraId: string) => captureAndAnalyze(cameraId, false), // Expose single frame analysis
    startContinuousAnalysis,
    stopContinuousAnalysis,
    setVideoRef,
  }
}
