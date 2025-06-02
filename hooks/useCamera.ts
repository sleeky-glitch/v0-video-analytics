"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { Camera, FrameAnalysisResult, AnalysisModelType } from "@/types/camera"

const CONTINUOUS_ANALYSIS_INTERVAL = 1500

export function useCamera() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isAnalyzingSingleFrame, setIsAnalyzingSingleFrame] = useState<Record<string, boolean>>({})
  const [isContinuouslyAnalyzing, setIsContinuouslyAnalyzing] = useState<Record<string, boolean>>({})

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const streamRefs = useRef<Record<string, MediaStream | null>>({})
  const continuousAnalysisIntervals = useRef<Record<string, NodeJS.Timeout | null>>({})

  const setCameraAnalysisResult = useCallback((cameraId: string, analysisResult: FrameAnalysisResult) => {
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
      const camera = cameras.find((c) => c.id === cameraId)
      const videoElement = videoRefs.current[cameraId]

      if (
        !camera ||
        !videoElement ||
        videoElement.paused ||
        videoElement.ended ||
        videoElement.videoWidth === 0 ||
        (!isContinuous && isAnalyzingSingleFrame[cameraId]) ||
        (isContinuous && isAnalyzingSingleFrame[cameraId])
      ) {
        return
      }

      if (!isContinuous) setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: true }))
      else {
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
        if (!ctx) throw new Error("Failed to get 2D context.")
        ctx.drawImage(videoElement, 0, 0, frameWidth, frameHeight)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8))
        if (!blob) throw new Error("Failed to create blob.")

        const formData = new FormData()
        formData.append("image", blob)
        formData.append("model_type", camera.modelType)

        if (camera.modelType === "person_detection_in_area") {
          const points = camera.designatedArea?.points || []
          const pointsAsArrays = points.map((p) => [p.x, p.y])
          formData.append("designated_area", JSON.stringify(pointsAsArrays))
        }

        try {
          const apiUrl = "https://192.168.100.131:5000/detect"
          const response = await fetch(apiUrl, { method: "POST", body: formData })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API request failed: ${response.status} ${errorText}`)
          }
          const result = await response.json() // API now returns modelUsed

          // Construct analysis result based on the model used (as reported by backend)
          const analysisData: FrameAnalysisResult = {
            timestamp: Date.now(),
            modelUsed: result.modelUsed as AnalysisModelType,
            frameWidth,
            frameHeight,
          }

          if (result.modelUsed === "person_detection" || result.modelUsed === "person_detection_in_area") {
            analysisData.detections = result.detections
            if (result.modelUsed === "person_detection_in_area") {
              analysisData.personInDesignatedArea = result.personInDesignatedArea
            }
          } else if (result.modelUsed === "emotion_detection") {
            analysisData.faceEmotions = result.faceEmotions
          }

          setCameraAnalysisResult(cameraId, analysisData)
        } catch (fetchError) {
          console.error(`[Camera ${cameraId}] Analysis fetch error:`, fetchError)
          setCameraAnalysisResult(cameraId, {
            timestamp: Date.now(),
            error: (fetchError as Error).message,
            modelUsed: camera.modelType,
            frameWidth,
            frameHeight,
          })
        }
      } catch (captureError) {
        console.error(`[Camera ${cameraId}] Capture error:`, captureError)
        setCameraAnalysisResult(cameraId, {
          timestamp: Date.now(),
          error: (captureError as Error).message,
          modelUsed: camera.modelType,
          frameWidth,
          frameHeight,
        })
      } finally {
        setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
      }
    },
    [cameras, isAnalyzingSingleFrame, setCameraAnalysisResult],
  )

  const startContinuousAnalysis = useCallback(
    (cameraId: string) => {
      const cam = cameras.find((c) => c.id === cameraId)
      if (continuousAnalysisIntervals.current[cameraId] || !cam || !cam.isActive) return
      setIsContinuouslyAnalyzing((prev) => ({ ...prev, [cameraId]: true }))
      captureAndAnalyze(cameraId, true)
      const intervalId = setInterval(() => captureAndAnalyze(cameraId, true), CONTINUOUS_ANALYSIS_INTERVAL)
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

  const addCamera = useCallback((cameraData: Omit<Camera, "id" | "lastAnalysis" | "isActive" | "designatedArea">) => {
    const newCamera: Camera = {
      ...cameraData,
      id: `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: false,
      designatedArea: cameraData.modelType === "person_detection_in_area" ? { points: [] } : undefined,
    }
    setCameras((prev) => [...prev, newCamera])
    return newCamera.id
  }, [])

  const updateCameraConfig = useCallback(
    (cameraId: string, newConfig: Partial<Pick<Camera, "modelType" | "designatedArea" | "name">>) => {
      setCameras((prevCameras) =>
        prevCameras.map((cam) => {
          if (cam.id === cameraId) {
            const updatedCam = { ...cam, ...newConfig }
            if (newConfig.modelType && newConfig.modelType !== "person_detection_in_area") {
              updatedCam.designatedArea = undefined
            } else if (newConfig.modelType === "person_detection_in_area" && !updatedCam.designatedArea) {
              updatedCam.designatedArea = { points: [] }
            }
            return updatedCam
          }
          return cam
        }),
      )
      if (isContinuouslyAnalyzing[cameraId]) stopContinuousAnalysis(cameraId)
    },
    [isContinuouslyAnalyzing, stopContinuousAnalysis],
  )

  const removeCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId)
      streamRefs.current[cameraId]?.getTracks().forEach((track) => track.stop())
      delete streamRefs.current[cameraId]
      delete videoRefs.current[cameraId]
      setCameras((prev) => prev.filter((camera) => camera.id !== cameraId))
      setIsAnalyzingSingleFrame((prev) => ({ ...prev, [cameraId]: false }))
      setIsContinuouslyAnalyzing((prev) => ({ ...prev, [cameraId]: false }))
    },
    [stopContinuousAnalysis],
  )

  const startCamera = useCallback(async (cameraId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRefs.current[cameraId] = stream
      const videoElement = videoRefs.current[cameraId]
      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.onloadedmetadata = () => {
          setCameras((prev) => prev.map((cam) => (cam.id === cameraId ? { ...cam, isActive: true } : cam)))
        }
      }
    } catch (error) {
      console.error("Error starting camera:", error)
    }
  }, [])

  const stopCamera = useCallback(
    (cameraId: string) => {
      stopContinuousAnalysis(cameraId)
      streamRefs.current[cameraId]?.getTracks().forEach((track) => track.stop())
      setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? { ...camera, isActive: false } : camera)))
    },
    [stopContinuousAnalysis],
  )

  const setVideoRef = useCallback((cameraId: string, element: HTMLVideoElement | null) => {
    videoRefs.current[cameraId] = element
  }, [])

  useEffect(() => {
    return () => {
      Object.values(continuousAnalysisIntervals.current).forEach((id) => id && clearInterval(id))
      Object.values(streamRefs.current).forEach((s) => s?.getTracks().forEach((t) => t.stop()))
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
    updateCameraConfig,
  }
}
