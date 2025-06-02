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

export interface FrameDetections {
  timestamp: number
  detections: PersonDetection[]
  error?: string
  // Store original frame dimensions to help with scaling on canvas if needed
  frameWidth?: number
  frameHeight?: number
}

export interface Camera {
  id: string
  name: string
  type: "webcam" | "rtsp"
  url?: string // For RTSP streams
  isActive: boolean
  lastAnalysis?: FrameDetections // Updated to use FrameDetections
}
