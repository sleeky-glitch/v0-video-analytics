"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { Camera, FrameDetections } from "@/types/camera"

const CONTINUOUS_ANALYSIS_INTERVAL = 1000 // Analyze roughly every 1 second, adjust as needed

export function useCamera() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isAnalyzingSingleFrame, setIsAnalyzingSingleFrame] = useState<Record<string, boolean>>({})
  const [isContinuouslyAnalyzing, setIsContinuouslyAnalyzing] = useState<Record<string, boolean>>({})

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const streamRefs = useRef<Record<string, MediaStream | null>>({})
  const continuousAnalysisIntervals = useRef<Record<string, NodeJS.Timeout | null>>({})

  const setCameraAnalysisResult = useCallback((cameraId: string, analysisResult: FrameDetections) => {
    setCameras((prev) =>
      prev.map((camera) =>
        camera.id === cameraId
          ? {
              ...camera,
              lastAnalysis: analysisResult,
            }
          : camera,
      ),
    )
  }, [])

  const captureAndAnalyze = useCallback(
    async (cameraId: string, isContinuous = false) => {
      const videoElement = videoRefs.current[cameraId]
      if (
        !videoElement ||
        videoElement.paused ||
        videoElement.ended ||
        videoElement.videoWidth === 0 ||
        (!isContinuous && isAnalyzingSingleFrame[cameraId]) ||
        (isContinuous && isAnalyzingSingleFrame[cameraId])
      ) {
        if (isContinuous && isAnalyzingSingleFrame[cameraId]) {
          // If continuous and already analyzing, skip this tick
        } else if (!videoElement || videoElement.videoWidth === 0) {
          console.warn(`[Camera ${cameraId}] Video element not ready for capture.`)
        }
        return
      }

      if (!isContinuous) {
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: true }))
      } else {
        if (isAnalyzingSingleFrame[cameraId]) return
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: true }))
      }

      const frameWidth = videoElement.videoWidth
      const frameHeight = videoElement.videoHeight

      try {
        const canvas = document.createElement("canvas")
        canvas.width = frameWidth
        canvas.height = frameHeight
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, frameWidth, frameHeight)
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8))

          if (blob) {
            const formData = new FormData()
            formData.append("image", blob)

            try {
              // Use the backend API URL you provided
              const apiUrl = "https://192.168.100.131:5000/detect"
              console.log(`[Camera ${cameraId}] Sending image to API: ${apiUrl}`)
              const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
                // mode: 'cors', // Usually default, but good to be explicit if issues arise
              })

              console.log(`[Camera ${cameraId}] API Response Status: ${response.status} ${response.statusText}`)
              if (!response.ok) {
                const errorText = await response.text()
                console.error(`[Camera ${cameraId}] API Error (Status ${response.status}):`, errorText)
                throw new Error(`API request failed: ${response.status} ${errorText}`)
              }

              const result = await response.json() // Expects { detections: PersonDetection[] }
              console.log(`[Camera ${cameraId}] API Analysis Result:`, result)

              setCameraAnalysisResult(cameraId, {
                timestamp: Date.now(),
                detections: result.detections || [],
                frameWidth,
                frameHeight,
              })
            } catch (error) {
              console.error(`[Camera ${cameraId}] Analysis fetch error:`, error)
              setCameraAnalysisResult(cameraId, {
                timestamp: Date.now(),
                detections: [],
                error: (error as Error).message || "Analysis failed",
                frameWidth,
                frameHeight,
              })
            }
          } else {
            throw new Error("Failed to create blob from canvas.")
          }
        } else {
          throw new Error("Failed to get 2D context from canvas.")
        }
      } catch (captureError) {
        console.error(`[Camera ${cameraId}] Capture error:`, captureError)
        setCameraAnalysisResult(cameraId, {
          timestamp: Date.now(),
          detections: [],
          error: (captureError as Error).message || "Capture failed",
          frameWidth,
          frameHeight,
        })
      } finally {
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
      }
    },
    [isAnalyzingSingleFrame, setCameraAnalysisResult],
  )

  const startContinuousAnalysis = useCallback(
    (cameraId: string) => {
      const camera = cameras.find((c) => c.id === cameraId)
      if (continuousAnalysisIntervals.current[cameraId] || !camera || !camera.isActive) {
        return
      }
      setIsContinuouslyAnalyzing((prev) => ({ ...prev, [cameraId]: true }))
      captureAndAnalyze(cameraId, true) // Immediate first analysis
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
    setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
  }, [])

  const addCamera = useCallback((cameraData: Omit<Camera, "id" | "lastAnalysis" | "isActive">) => {
    const newCamera: Camera = {
      ...cameraData,
      id: `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: false,
    }
    setCameras((prev) => [...prev, newCamera])
    setIsContinuouslyAnalyzing((prev) => ({ ...prev, [newCamera.id]: false }))
    setIsAnalyzingSingleFrame((prev) => ({ ...prev, [newCamera.id]: false }))
    return newCamera.id
  }, [])

  const removeCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId)
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
        video: { width: 640, height: 480 }, // Standard webcam resolution
      })
      streamRefs.current[cameraId] = stream
      const videoElement = videoRefs.current[cameraId]
      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.onloadedmetadata = () => {
          // Ensure metadata is loaded before setting active
          setCameras((prev) => prev.map((cam) => (cam.id === cameraId ? { ...cam, isActive: true } : cam)))
        }
      } else {
        setCameras((prev) => prev.map((cam) => (cam.id === cameraId ? { ...cam, isActive: true } : cam)))
      }
    } catch (error) {
      console.error("Error starting camera:", error)
      // Update camera state to show error if needed
    }
  }, [])

  const stopCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId)
      const stream = streamRefs.current[cameraId]
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        // Don't delete streamRef, videoRef might still be used or camera restarted
      }
      setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? { ...camera, isActive: false } : camera)))
    },
    [stopContinuousAnalysis],
  )

  const setVideoRef = useCallback((cameraId: string, element: HTMLVideoElement | null) => {
    videoRefs.current[cameraId] = element
  }, [])

  useEffect(() => {
    return () => {
      Object.values(continuousAnalysisIntervals.current).forEach((intervalId) => {
        if (intervalId) clearInterval(intervalId)
      })
      Object.values(streamRefs.current).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
    }
  }, [])

  return {
    cameras,
    isAnalyzingSingleFrame,
    isContinuouslyAnalyzing,
    addCamera,
    removeCamera,
    startCamera,
    stopCamera,
    captureAndAnalyze: (cameraId: string) => captureAndAnalyze(cameraId, false),
    startContinuousAnalysis,
    stopContinuousAnalysis,
    setVideoRef,
  }
}
