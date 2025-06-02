// Available analysis models
export type AnalysisModelType =
  | "sentiment_emotion_detection" // Previous default
  | "person_detection_in_area"
  | "person_count" // Placeholder for future
  | "queue_length_estimation" // Placeholder for future

export interface Point {
  x: number // Normalized (0-1 relative to video width)
  y: number // Normalized (0-1 relative to video height)
}

// For now, a camera will have one primary designated area if that model is selected.
// Could be extended to an array of areas later.
export interface DesignatedArea {
  points: Point[]
  // id?: string; // If multiple areas were supported
}

export interface FaceDetection {
  box: [number, number, number, number] // [x_relative_to_person_roi, y_relative_to_person_roi, width, height]
  emotion: string
  score: number
}

export interface PersonDetection {
  person_box: [number, number, number, number] // [x1, y1, x2, y2] absolute in frame
  confidence: number
  faces: FaceDetection[]
}

export interface FrameAnalysisResult {
  timestamp: number
  // Fields for sentiment_emotion_detection & general person/face boxes
  detections?: PersonDetection[]
  // Fields for person_detection_in_area
  personInDesignatedArea?: boolean
  // Common fields
  modelUsed?: AnalysisModelType // Echo back the model that was used for this analysis
  // areaUsedForDetection?: DesignatedArea; // Echo back area if needed
  error?: string
  frameWidth?: number // Original width of the frame analyzed
  frameHeight?: number // Original height of the frame analyzed
}

export interface Camera {
  id: string
  name: string
  type: "webcam" | "rtsp"
  url?: string
  isActive: boolean
  modelType: AnalysisModelType
  designatedArea?: DesignatedArea // Only relevant for person_detection_in_area model
  lastAnalysis?: FrameAnalysisResult
}

// Helper for model display names
export const MODEL_DISPLAY_NAMES: Record<AnalysisModelType, string> = {
  sentiment_emotion_detection: "Sentiment & Emotion Detection",
  person_detection_in_area: "Person Detection in Designated Area",
  person_count: "Person Count (Coming Soon)",
  queue_length_estimation: "Queue Length (Coming Soon)",
}

export const AVAILABLE_MODELS: AnalysisModelType[] = [
  "sentiment_emotion_detection",
  "person_detection_in_area",
  // "person_count", // Uncomment when ready
  // "queue_length_estimation", // Uncomment when ready
]
