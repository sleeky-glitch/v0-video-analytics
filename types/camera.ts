// Available analysis models
export type AnalysisModelType = "person_detection" | "emotion_detection" | "person_detection_in_area" | "fire_detection" // New model type
// | "person_count"
// | "queue_length_estimation"

export interface Point {
  x: number
  y: number
}

export interface DesignatedArea {
  points: Point[]
}

export interface PersonDetectionBox {
  person_box: [number, number, number, number]
  confidence: number
}

export interface FaceEmotionDetection {
  box: [number, number, number, number]
  emotion: string
  score: number
}

// New type for fire detection results
export interface FireDetectionBox {
  box: [number, number, number, number] // [x1, y1, x2, y2]
  confidence: number
  class_id: number // As per backend
}

export interface FrameAnalysisResult {
  timestamp: number
  modelUsed?: AnalysisModelType

  detections?: PersonDetectionBox[]
  personInDesignatedArea?: boolean

  faceEmotions?: FaceEmotionDetection[]

  fireDetections?: FireDetectionBox[] // New field

  error?: string
  frameWidth?: number
  frameHeight?: number
}

export interface Camera {
  id: string
  name: string
  type: "webcam" | "rtsp"
  url?: string
  isActive: boolean
  modelType: AnalysisModelType
  designatedArea?: DesignatedArea
  lastAnalysis?: FrameAnalysisResult
}

export const MODEL_DISPLAY_NAMES: Record<AnalysisModelType, string> = {
  person_detection: "Person Detection",
  emotion_detection: "Emotion Detection",
  person_detection_in_area: "Person Detection in Area",
  fire_detection: "Fire Detection", // New display name
  // person_count: "Person Count (Coming Soon)",
  // queue_length_estimation: "Queue Length (Coming Soon)",
}

export const AVAILABLE_MODELS: AnalysisModelType[] = [
  "person_detection",
  "emotion_detection",
  "person_detection_in_area",
  "fire_detection", // New available model
  // "person_count",
  // "queue_length_estimation",
]
