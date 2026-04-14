/**
 * MediGuide AI — ImageUploadButton
 * Camera/gallery button for uploading symptom images.
 * Compresses to max 1MB, converts to base64, shows preview.
 * Uses React Portal so the preview overlay renders at document.body level
 * (avoids CSS transform/backdrop-filter breaking position:fixed).
 */

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
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

/** Full-screen preview overlay rendered via Portal */
function PreviewOverlay({ preview, onSend, onCancel }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '24px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
            📸 Symptom Image
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Image preview */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            backgroundColor: '#0f172a',
          }}
        >
          <img
            src={preview}
            alt="Symptom preview"
            style={{
              width: '100%',
              maxHeight: '280px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid rgba(71, 85, 105, 0.5)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <FiSend size={16} />
            Analyze
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
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

      {/* Preview overlay — rendered via Portal at document.body */}
      {preview && (
        <PreviewOverlay
          preview={preview}
          onSend={handleSend}
          onCancel={handleCancel}
        />
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
