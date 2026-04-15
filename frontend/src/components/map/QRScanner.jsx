/**
 * MediGuide AI — QR Scanner Component
 * Scans QR codes to navigate to specific rooms/departments in the hospital.
 *
 * QR Format: mediguide://nav/{hospitalId}/{nodeId}
 * Or fallback: any text containing a valid node ID
 */

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { FiCamera, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

const LABELS = {
  hi: {
    title: 'QR कोड स्कैन करें',
    subtitle: 'अस्पताल के QR कोड को कैमरे के सामने रखें',
    success: 'स्कैन सफल!',
    error: 'QR कोड नहीं पहचाना गया',
    permError: 'कैमरा अनुमति नहीं दी गई',
    scanning: 'स्कैन हो रहा है...',
    close: 'बंद करें',
  },
  mr: {
    title: 'QR कोड स्कॅन करा',
    subtitle: 'हॉस्पिटलचा QR कोड कॅमेरासमोर धरा',
    success: 'स्कॅन यशस्वी!',
    error: 'QR कोड ओळखला गेला नाही',
    permError: 'कॅमेरा परवानगी दिली नाही',
    scanning: 'स्कॅनिंग...',
    close: 'बंद करा',
  },
  en: {
    title: 'Scan QR Code',
    subtitle: 'Point camera at the hospital room QR code',
    success: 'Scan successful!',
    error: 'QR code not recognized',
    permError: 'Camera permission denied',
    scanning: 'Scanning...',
    close: 'Close',
  },
}

export default function QRScanner({ hospitalId, nodes = [], language = 'en', onScanResult, onClose }) {
  const [status, setStatus] = useState('scanning') // scanning | success | error | permError
  const [scannedLabel, setScannedLabel] = useState('')
  const scannerRef = useRef(null)
  const containerRef = useRef(null)

  const t = LABELS[language] || LABELS.en

  useEffect(() => {
    let scanner = null

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Parse QR content
            const result = parseQRContent(decodedText, hospitalId, nodes)
            if (result) {
              setStatus('success')
              setScannedLabel(result.label)
              // Stop scanner after successful scan
              scanner.stop().catch(() => {})
              // Notify parent after brief delay for feedback
              setTimeout(() => {
                onScanResult?.(result)
              }, 1200)
            } else {
              setStatus('error')
              setTimeout(() => setStatus('scanning'), 2000)
            }
          },
          () => {} // Ignore scan failures (no QR in frame)
        )
      } catch (err) {
        console.error('[QRScanner] Start error:', err)
        if (err?.toString()?.includes('Permission')) {
          setStatus('permError')
        } else {
          setStatus('error')
        }
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [hospitalId, nodes, onScanResult])

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
      {/* Header */}
      <div className="w-full max-w-sm mb-4 text-center">
        <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
          <FiCamera className="w-5 h-5 text-primary-400" />
          {t.title}
        </h2>
        <p className="text-xs text-surface-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Scanner viewport */}
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-surface-700/50 bg-black">
        <div id="qr-reader" ref={containerRef} className="w-full h-full" />

        {/* Scan frame corners */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-3 border-l-3 border-primary-400 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-3 border-r-3 border-primary-400 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-3 border-l-3 border-primary-400 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-3 border-r-3 border-primary-400 rounded-br-lg" />
        </div>

        {/* Status overlay */}
        {status === 'success' && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <FiCheckCircle className="w-16 h-16 text-green-400 animate-bounce-in" />
            <p className="text-green-400 font-bold text-sm mt-3">{t.success}</p>
            <p className="text-green-300 text-xs mt-1">{scannedLabel}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 bg-red-500/10 flex items-end justify-center pb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
              <FiAlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{t.error}</span>
            </div>
          </div>
        )}

        {status === 'permError' && (
          <div className="absolute inset-0 bg-surface-900/80 flex flex-col items-center justify-center p-6 text-center">
            <FiAlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <p className="text-sm text-amber-300 font-medium">{t.permError}</p>
          </div>
        )}

        {/* Scanning indicator */}
        {status === 'scanning' && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-900/80 border border-surface-700/50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-surface-300">{t.scanning}</span>
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {})
          }
          onClose?.()
        }}
        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-surface-300 hover:text-white text-sm font-medium transition-all border border-surface-700/30 active:scale-95"
      >
        <FiX className="w-4 h-4" />
        {t.close}
      </button>
    </div>
  )
}

/**
 * Parse QR code content and match to a hospital node.
 * Supports formats:
 * - mediguide://nav/{hospitalId}/{nodeId}
 * - Just a nodeId UUID string
 * - Department name text match
 */
function parseQRContent(text, hospitalId, nodes) {
  if (!text || !nodes.length) return null

  // Format 1: mediguide://nav/{hospitalId}/{nodeId}
  const protocolMatch = text.match(/mediguide:\/\/nav\/([^/]+)\/([^/]+)/)
  if (protocolMatch) {
    const [, qrHospitalId, nodeId] = protocolMatch
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      return { nodeId: node.id, departmentId: node.department_id, label: node.label }
    }
  }

  // Format 2: Direct node UUID
  const uuidMatch = text.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (uuidMatch) {
    const nodeId = uuidMatch[1]
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      return { nodeId: node.id, departmentId: node.department_id, label: node.label }
    }
    // Try matching as department_id
    const deptNode = nodes.find(n => n.department_id === nodeId)
    if (deptNode) {
      return { nodeId: deptNode.id, departmentId: deptNode.department_id, label: deptNode.label }
    }
  }

  // Format 3: Text label match (fuzzy)
  const lowerText = text.toLowerCase().trim()
  const matchNode = nodes.find(n =>
    n.label?.toLowerCase().includes(lowerText) ||
    lowerText.includes(n.label?.toLowerCase())
  )
  if (matchNode) {
    return { nodeId: matchNode.id, departmentId: matchNode.department_id, label: matchNode.label }
  }

  return null
}
