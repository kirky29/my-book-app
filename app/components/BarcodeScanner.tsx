'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, X, Zap, ZapOff } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
  isActive: boolean
}

export default function BarcodeScanner({ onScan, onClose, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isActive) {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Initialize barcode reader
        codeReader.current = new BrowserMultiFormatReader()
        
        // Start scanning
        codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result) {
            const scannedText = result.getText()
            
            // Check if it looks like an ISBN (10 or 13 digits, possibly with hyphens)
            const isbnPattern = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/
            
            if (isbnPattern.test(scannedText) || scannedText.length >= 10) {
              onScan(scannedText)
              stopScanning()
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Barcode scanning error:', error)
          }
        })
      }
    } catch (err) {
      console.error('Error starting camera:', err)
      setHasPermission(false)
      setError('Camera access denied. Please allow camera permission and try again.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    if (codeReader.current) {
      codeReader.current.reset()
      codeReader.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const toggleFlash = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities() as any
      if (videoTrack && capabilities.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          })
          setFlashEnabled(!flashEnabled)
        } catch (err) {
          console.error('Flash toggle error:', err)
        }
      }
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-medium">Scan Book Barcode</h2>
        <button
          onClick={toggleFlash}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          disabled={!isScanning}
        >
          {flashEnabled ? (
            <Zap className="w-6 h-6 text-yellow-400" />
          ) : (
            <ZapOff className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-6 text-center">
            <div>
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
              <p className="text-gray-300 mb-4">
                Please allow camera access to scan book barcodes
              </p>
              <button
                onClick={startScanning}
                className="btn btn-primary"
              >
                <Camera className="w-4 h-4 mr-2" />
                Allow Camera Access
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-6 text-center">
            <div>
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  startScanning()
                }}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Scanning Frame */}
              <div className="w-64 h-40 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-lg"></div>
                
                {/* Scanning Line Animation */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="w-full h-0.5 bg-primary-400 shadow-lg animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-black text-white p-4 text-center">
        <p className="text-gray-300">
          Point your camera at the book's barcode (usually on the back cover)
        </p>
        <p className="text-sm text-gray-400 mt-1">
          The scanner will automatically detect ISBN barcodes
        </p>
      </div>
    </div>
  )
} 