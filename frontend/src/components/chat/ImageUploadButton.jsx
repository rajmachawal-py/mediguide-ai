/**
 * MediGuide AI — ImageUploadButton
 * Camera/gallery button for uploading symptom images.
 * Compresses to max 1MB, converts to base64, shows preview.
 */

import { useState, useRef } from 'react'
import { FiCamera, FiX, FiSend } from 'react-icons/fi'

const MAX_SIZE_BYTES = 1024 * 1024 // 1MB
const MAX_DIMENSION = 1024         // max width/height in px

/**
 * Compress an image file to fit within MAX_SIZE_BYTES.
 * Uses canvas resize to reduce dimensions and quality.
 * Returns a base64 data URL string.
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if larger than MAX_DIMENSION
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until under 1MB
        let quality = 0.85
        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        while (dataUrl.length > MAX_SIZE_BYTES * 1.37 && quality > 0.3) {
          // 1.37 ≈ base64 overhead factor
          quality -= 0.1
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageUploadButton({ onImageCapture, disabled }) {
  const [preview, setPreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const handleClick = () => {
    if (disabled || isProcessing) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const base64DataUrl = await compressImage(file)
      setPreview(base64DataUrl)
    } catch (err) {
      console.error('Image compression failed:', err)
    } finally {
      setIsProcessing(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSend = () => {
    if (preview && onImageCapture) {
      onImageCapture(preview)
      setPreview(null)
    }
  }

  const handleCancel = () => {
    setPreview(null)
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card p-4 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">📸 Symptom Image</h3>
              <button onClick={handleCancel} className="text-surface-400 hover:text-white p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-surface-700/50">
              <img
                src={preview}
                alt="Symptom preview"
                className="w-full max-h-[300px] object-contain bg-surface-900"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-surface-300 text-sm font-medium hover:bg-surface-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-600/20"
              >
                <FiSend className="w-4 h-4" />
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera button */}
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title="Upload symptom image"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
          isProcessing
            ? 'bg-surface-700 text-surface-400'
            : 'bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white border border-surface-700/50'
        } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-surface-500 border-t-white rounded-full animate-spin" />
        ) : (
          <FiCamera className="w-4 h-4" />
        )}
      </button>
    </>
  )
}
