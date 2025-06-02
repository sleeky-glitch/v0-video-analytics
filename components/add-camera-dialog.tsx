"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Camera } from "@/types/camera"

interface AddCameraDialogProps {
  onAddCamera: (camera: Omit<Camera, "id" | "lastAnalysis" | "isActive">) => void
}

export function AddCameraDialog({ onAddCamera }: AddCameraDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"webcam" | "rtsp">("webcam")
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAddCamera({
      name: name.trim(),
      type,
      url: type === "rtsp" ? url : undefined,
    })

    setName("")
    setUrl("")
    setType("webcam")
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Camera Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter camera name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Camera Type</Label>
            <Select value={type} onValueChange={(value: "webcam" | "rtsp") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webcam">Webcam</SelectItem>
                <SelectItem value="rtsp">RTSP Stream</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "rtsp" && (
            <div className="space-y-2">
              <Label htmlFor="url">RTSP URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="rtsp://username:password@ip:port/stream"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Camera</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
