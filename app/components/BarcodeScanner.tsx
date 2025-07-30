'use client'

import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    if (isActive) {
      checkPermissionsAndStart()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const checkPermissionsAndStart = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Check if we're in a secure context
      if (!window.isSecureContext) {
        setError('Camera access requires HTTPS. Please use a secure connection.')
        setHasPermission(false)
        setIsScanning(false)
        return
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser.')
        setHasPermission(false)
        setIsScanning(false)
        return
      }

      // Check current permission state
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          setPermissionState(permission.state)
          
          if (permission.state === 'denied') {
            setError('Camera permission denied. Please enable camera access in your browser settings and refresh the page.')
            setHasPermission(false)
            setIsScanning(false)
            return
          }
        } catch (err) {
          console.log('Permission query not supported, proceeding with getUserMedia')
        }
      }

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
      setPermissionState('granted')

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
    } catch (err: any) {
      console.error('Error starting camera:', err)
      setHasPermission(false)
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission and try again.')
        setPermissionState('denied')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.')
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not meet the required specifications.')
      } else if (err.name === 'TypeError') {
        setError('Camera access is not supported in this browser.')
      } else {
        setError(`Camera error: ${err.message || 'Unknown error occurred'}`)
      }
      
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

  const retryCamera = () => {
    setError(null)
    setHasPermission(null)
    setPermissionState('unknown')
    checkPermissionsAndStart()
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
      <div className="bg-black text-white safe-area-top">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-semibold">Scan Barcode</h2>
          <div className="w-11"></div> {/* Spacer for centering */}
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
              
              {/* Additional help for permission issues */}
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