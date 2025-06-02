"use client"

// No changes needed here if AVAILABLE_MODELS and MODEL_DISPLAY_NAMES in types/camera.ts
// are correctly updated, as this component already iterates over them.
// Just ensure those constants in types/camera.ts include "fire_detection".

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Camera, AnalysisModelType } from "@/types/camera"
import { MODEL_DISPLAY_NAMES, AVAILABLE_MODELS } from "@/types/camera"

interface AddCameraDialogProps {
  onAddCamera: (cameraData: Omit<Camera, "id" | "lastAnalysis" | "isActive" | "designatedArea">) => void
}

export function AddCameraDialog({ onAddCamera }: AddCameraDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"webcam" | "rtsp">("webcam")
  const [url, setUrl] = useState("")
  const [modelType, setModelType] = useState<AnalysisModelType>(AVAILABLE_MODELS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAddCamera({
      name: name.trim(),
      type,
      url: type === "rtsp" ? url.trim() : undefined,
      modelType,
    })

    setName("")
    setUrl("")
    setType("webcam")
    setModelType(AVAILABLE_MODELS[0])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Camera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="name-add-fire">Camera Name</Label>
            <Input
              id="name-add-fire"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Kitchen Cam"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type-add-fire">Camera Type</Label>
            <Select value={type} onValueChange={(value: "webcam" | "rtsp") => setType(value)}>
              <SelectTrigger id="type-add-fire">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webcam">Webcam</SelectItem>
                <SelectItem value="rtsp">RTSP Stream</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "rtsp" && (
            <div className="space-y-1">
              <Label htmlFor="url-add-fire">RTSP URL</Label>
              <Input
                id="url-add-fire"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="rtsp://username:password@ip:port/stream"
                required={type === "rtsp"}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="modelType-add-fire">Analysis Model</Label>
            <Select value={modelType} onValueChange={(value: AnalysisModelType) => setModelType(value)}>
              <SelectTrigger id="modelType-add-fire">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {MODEL_DISPLAY_NAMES[model]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Camera</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
