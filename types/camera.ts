export interface Camera {
  id: string
  name: string
  type: "webcam" | "rtsp"
  url?: string // For RTSP streams
  isActive: boolean
  lastAnalysis?: SentimentAnalysis
}

export interface SentimentAnalysis {
  timestamp: number
  emotions: {
    happy: number
    sad: number
    angry: number
    surprised: number
    neutral: number
  }
  dominantEmotion: string
  confidence: number
}
