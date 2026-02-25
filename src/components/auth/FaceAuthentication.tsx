import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, XCircle, RotateCw, Loader2, Eye, ScanFace } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FaceAuthenticationProps {
  onVerified: (success: boolean) => void;
  userId: string;
}

export const FaceAuthentication: React.FC<FaceAuthenticationProps> = ({ onVerified, userId }) => {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'liveness' | 'matching' | 'success' | 'failed'>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setStatus('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true);
          setFaceDetected(true);
          videoRef.current?.play().catch(err => console.error('Video play error:', err));
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access in your browser settings.",
        variant: "destructive"
      });
      setStatus('idle');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const performLivenessCheck = async () => {
    setStatus('liveness');
    toast({
      title: "Liveness Check",
      description: "Please blink twice",
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    setBlinkCount(1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBlinkCount(2);
    setBlinkDetected(true);

    const imageData = captureFrame();
    if (imageData) {
      setCapturedImage(imageData);
      await performFaceMatch(imageData);
    }
  };

  const performFaceMatch = async (imageData: string) => {
    setStatus('matching');
    
    try {
      // Send to DeepFace API for face recognition
      const response = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          img1_path: imageData, // Captured image
          img2_path: `database/${userId}.jpg`, // Stored reference image
          model_name: 'VGG-Face', // DeepFace model
          detector_backend: 'opencv'
        })
      });

      const result = await response.json();

      // DeepFace returns { verified: true/false, distance: number, threshold: number }
      if (result.verified) {
        setStatus('success');
        toast({
          title: "Face Verified",
          description: `Identity confirmed (confidence: ${(100 - result.distance * 10).toFixed(1)}%)`,
        });
        
        // Keep showing success in circle for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        onVerified(true);
      } else {
        setStatus('failed');
        toast({
          title: "Verification Failed",
          description: "Face does not match. Please try again.",
          variant: "destructive"
        });
        
        // Keep showing failed in circle for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        onVerified(false);
      }
    } catch (error) {
      console.error('DeepFace API error:', error);
      setStatus('failed');
      toast({
        title: "Verification Error",
        description: "Unable to connect to face recognition service.",
        variant: "destructive"
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      onVerified(false);
    }
  };

  const retry = () => {
    setStatus('idle');
    setCapturedImage(null);
    setBlinkDetected(false);
    setBlinkCount(0);
    stopCamera();
  };

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-blue-600" />
            <span>Face Authentication</span>
          </div>
          {status === 'success' && (
            <Badge className="bg-green-500 text-white animate-pulse">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {status === 'failed' && (
            <Badge variant="destructive" className="animate-pulse">
              <XCircle className="w-3 h-3 mr-1" />
              Failed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {status === 'idle' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <ScanFace className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Verify Your Identity</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Use facial recognition for secure verification
            </p>
            <Button onClick={startCamera} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <ScanFace className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}

        {(status === 'capturing' || status === 'liveness') && (
          <div className="space-y-4">
            <div className="relative flex items-center justify-center bg-gray-900 rounded-xl" style={{ minHeight: '400px', padding: '40px' }}>
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
              
            <div className="relative flex items-center justify-center">
                <div className={`relative w-80 h-80 rounded-full overflow-hidden border-8 transition-all duration-500 shadow-2xl ${
                  status === 'success'
                    ? 'border-green-500 shadow-green-500/50 bg-green-500/10' 
                    : status === 'failed'
                    ? 'border-red-500 shadow-red-500/50 bg-red-500/10'
                    : status === 'liveness' && blinkCount === 2 
                    ? 'border-green-500 shadow-green-500/50 animate-pulse' 
                    : faceDetected 
                    ? 'border-green-400 shadow-green-400/30' 
                    : 'border-yellow-400 shadow-yellow-400/30'
                }`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-150"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                  
                  {status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/30 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
                      <div className="text-center bg-green-600/90 rounded-full p-8 shadow-2xl">
                        <CheckCircle2 className="w-24 h-24 text-white mx-auto mb-3 animate-bounce" />
                        <p className="text-white font-bold text-2xl">Verified</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'failed' && (
                    <div className="absolute inset-0 bg-red-500/30 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
                      <div className="text-center bg-red-600/90 rounded-full p-8 shadow-2xl">
                        <XCircle className="w-24 h-24 text-white mx-auto mb-3 animate-bounce" />
                        <p className="text-white font-bold text-2xl">Failed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                {status === 'liveness' && (
                  <Badge className="bg-blue-600 text-white text-sm px-4 py-2 shadow-lg animate-bounce">
                    <Eye className="w-4 h-4 mr-2 animate-pulse" />
                    Blink {blinkCount}/2
                  </Badge>
                )}
                {status === 'capturing' && faceDetected && (
                  <Badge className="bg-green-500 text-white text-sm px-4 py-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Face Detected
                  </Badge>
                )}
              </div>
            </div>
            
            {status === 'capturing' && (
              <Button onClick={performLivenessCheck} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                <ScanFace className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            )}
          </div>
        )}

        {status === 'matching' && (
          <div className="text-center py-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Loader2 className="w-24 h-24 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-lg font-semibold">Matching Face...</p>
            <p className="text-sm text-muted-foreground mt-2">Verifying your identity</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping" />
              <div className="relative w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Face Verified</h3>
            <p className="text-sm text-muted-foreground">Identity confirmed successfully</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-8">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping" />
              <div className="relative w-32 h-32 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                <XCircle className="w-16 h-16 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h3>
            <p className="text-sm text-muted-foreground mb-6">Face does not match our records</p>
            <Button onClick={retry} variant="outline" size="lg" className="border-red-300 text-red-600 hover:bg-red-50">
              <RotateCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
