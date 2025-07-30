'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, X, Zap, ZapOff, AlertCircle } from 'lucide-react'

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
  const [permissionState, setPermissionState] = useState<string>('unknown')
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastScannedRef = useRef<string>('')
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef<boolean>(false)

  // Debounced scan handler to prevent multiple rapid scans
  const handleScan = useCallback((scannedText: string) => {
    if (isProcessingRef.current || scannedText === lastScannedRef.current) {
      return
    }

    // Simple validation - check if it looks like a barcode (10+ digits)
    const cleanText = scannedText.replace(/[^0-9X]/g, '')
    if (cleanText.length < 10) {
      return
    }

    isProcessingRef.current = true
    lastScannedRef.current = scannedText

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }

    // Small delay to prevent duplicate scans
    scanTimeoutRef.current = setTimeout(() => {
      onScan(scannedText)
      stopScanning()
      isProcessingRef.current = false
    }, 100)
  }, [onScan])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    
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

    isProcessingRef.current = false
    lastScannedRef.current = ''
  }, [])

  const checkPermissionsAndStart = useCallback(async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Quick checks
      if (!window.isSecureContext) {
        setError('Camera access requires HTTPS.')
        setHasPermission(false)
        setIsScanning(false)
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported.')
        setHasPermission(false)
        setIsScanning(false)
        return
      }

      // Request camera with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      })

      streamRef.current = stream
      setHasPermission(true)
      setPermissionState('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

                // Initialize optimized barcode reader
        codeReader.current = new BrowserMultiFormatReader()
        
        // Start scanning with optimized settings
         codeReader.current.decodeFromVideoDevice(
           null, 
           videoRef.current, 
           (result, error) => {
             if (result && !isProcessingRef.current) {
               handleScan(result.getText())
             }
             
             if (error && !(error instanceof NotFoundException)) {
               // Only log critical errors, not normal "not found" errors
               if (error.name !== 'NotFoundException') {
                 console.error('Barcode scanning error:', error)
               }
             }
           }
         )
      }
    } catch (err: any) {
      console.error('Error starting camera:', err)
      setHasPermission(false)
      
      // Simplified error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission.')
        setPermissionState('denied')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use.')
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`)
      }
      
      setIsScanning(false)
    }
  }, [handleScan])

  useEffect(() => {
    if (isActive) {
      checkPermissionsAndStart()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive, checkPermissionsAndStart, stopScanning])

  const retryCamera = useCallback(() => {
    setError(null)
    setHasPermission(null)
    setPermissionState('unknown')
    lastScannedRef.current = ''
    isProcessingRef.current = false
    checkPermissionsAndStart()
  }, [checkPermissionsAndStart])

  const toggleFlash = useCallback(async () => {
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
  }, [flashEnabled])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white safe-area-top">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-semibold">Scan Barcode</h2>
          <div className="w-11"></div>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanning Frame */}
            <div className="w-64 h-40 sm:w-80 sm:h-48 border-2 border-white rounded-lg relative">
              {/* Corner Indicators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
            </div>
            
            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 animate-pulse"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 text-center text-white px-4">
          <p className="text-lg sm:text-xl font-medium mb-2">Point camera at book barcode</p>
          <p className="text-sm sm:text-base text-white/80">Hold steady for automatic detection</p>
        </div>

        {/* Flash Toggle */}
        <button
          onClick={toggleFlash}
          className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          {flashEnabled ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
        </button>

        {/* Error Messages */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <div className="bg-red-600 text-white px-6 py-4 rounded-lg text-center max-w-sm">
              <div className="flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 mr-2" />
                <span className="font-semibold">Camera Error</span>
              </div>
              <p className="text-sm sm:text-base mb-4">{error}</p>
              
              {permissionState === 'denied' && (
                <div className="text-xs text-red-100 mb-4">
                  <p className="mb-2">To fix this:</p>
                  <ul className="text-left space-y-1">
                    <li>• Click the camera icon in your browser's address bar</li>
                    <li>• Select "Allow" for camera access</li>
                    <li>• Refresh the page and try again</li>
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={retryCamera}
                  className="flex-1 py-2 px-4 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-white text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isScanning && !error && hasPermission === null && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-black/80 text-white px-6 py-4 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm sm:text-base">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Scanning State */}
        {isScanning && !error && hasPermission === true && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-lg text-center">
            <p className="text-sm sm:text-base">Scanning...</p>
          </div>
        )}
      </div>
    </div>
  )
}