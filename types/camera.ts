// Available analysis models
export type AnalysisModelType =
  | "person_detection" // YOLO for persons only
  | "emotion_detection" // FER for emotions on faces (full frame)
  | "person_detection_in_area" // YOLO for persons + area check
// | "person_count" // Placeholder for future
// | "queue_length_estimation" // Placeholder for future

export interface Point {
  x: number // Normalized (0-1 relative to video width)
  y: number // Normalized (0-1 relative to video height)
}

export interface DesignatedArea {
  points: Point[]
}

// For "person_detection" and "person_detection_in_area" models
export interface PersonDetectionBox {
  person_box: [number, number, number, number] // [x1, y1, x2, y2] absolute in frame
  confidence: number
  // No 'faces' array here anymore as per new backend
}

// For "emotion_detection" model
export interface FaceEmotionDetection {
  box: [number, number, number, number] // [x, y, w, h] absolute in frame
  emotion: string
  score: number
}

export interface FrameAnalysisResult {
  timestamp: number
  modelUsed?: AnalysisModelType

  // Output for person_detection & person_detection_in_area
  detections?: PersonDetectionBox[]
  personInDesignatedArea?: boolean // Specific to person_detection_in_area

  // Output for emotion_detection
  faceEmotions?: FaceEmotionDetection[]

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
  // person_count: "Person Count (Coming Soon)",
  // queue_length_estimation: "Queue Length (Coming Soon)",
}

export const AVAILABLE_MODELS: AnalysisModelType[] = [
  "person_detection",
  "emotion_detection",
  "person_detection_in_area",
  // "person_count",
  // "queue_length_estimation",
]
