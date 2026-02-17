import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, Monitor, MonitorOff, Maximize, Minimize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    gapi: any;
  }
}

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  onCallStart?: (meetingId: string) => void;
  onCallEnd?: (meetingId: string, duration: number) => void;
  channelMembers?: string[];
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({ 
  isOpen, 
  onClose, 
  channelName, 
  onCallStart,
  onCallEnd,
  channelMembers = []
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingId, setMeetingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [googleMeetUrl, setGoogleMeetUrl] = useState<string>('');
  const [isGoogleMeetReady, setIsGoogleMeetReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const GOOGLE_MEET_API_KEY = 'AIzaSyCmLf2e17ukWMdJrp1oBGwmSj6LV-qTmHQ';

  useEffect(() => {
    if (channelMembers.length > 0) {
      setParticipants([user?.name || 'You', ...channelMembers]);
    } else {
      setParticipants([user?.name || 'You']);
    }
  }, [channelMembers, user]);

  useEffect(() => {
    if (isOpen) {
      startCall();
    } else {
      endCall();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const startCall = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Initialize Google Meet API
      await initializeGoogleMeetAPI();
      
      // Create Google Meet room
      const meetingData = await createGoogleMeetRoom();
      setMeetingId(meetingData.meetingId);
      setGoogleMeetUrl(meetingData.meetingUrl);
      setIsGoogleMeetReady(true);
      
      // Get local media stream for preview
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      setStream(mediaStream);
      
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error('Play error:', e));
        }
      }, 0);
      
      setCallStartTime(new Date());
      onCallStart?.(meetingData.meetingId);
      
    } catch (err) {
      console.error('Meeting creation error:', err);
      setError('Failed to create Google Meet session');
      toast({
        title: 'Google Meet Failed',
        description: 'Unable to create meeting room',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGoogleMeetAPI = async () => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve(window.gapi);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://apis.google.com/js/api.js?key=${GOOGLE_MEET_API_KEY}`;
      script.onload = () => {
        window.gapi.load('client', () => {
          window.gapi.client.init({
            apiKey: GOOGLE_MEET_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
          }).then(resolve).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const createGoogleMeetRoom = async () => {
    const meetingId = `iaoms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetingUrl = `https://meet.google.com/${meetingId}`;
    
    try {
      // In production, this would create actual Google Meet room via Calendar API
      // For now, return mock data with proper Google Meet URL structure
      return {
        meetingId,
        meetingUrl,
        joinUrl: meetingUrl
      };
    } catch (error) {
      console.error('Google Meet API error:', error);
      // Fallback to basic meeting room
      return {
        meetingId,
        meetingUrl,
        joinUrl: meetingUrl
      };
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const shareScreen = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
          }
        };
        
      } else {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      toast({
        title: 'Screen Share Failed',
        description: 'Unable to share screen',
        variant: 'destructive'
      });
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (callStartTime && meetingId) {
      const duration = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      onCallEnd?.(meetingId, duration);
    }
    
    setMeetingId('');
    setCallStartTime(null);
    setIsScreenSharing(false);
    setError('');
    onClose();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (modalRef.current?.requestFullscreen) {
          await modalRef.current.requestFullscreen();
        } else if ((modalRef.current as any)?.webkitRequestFullscreen) {
          await (modalRef.current as any).webkitRequestFullscreen();
        } else if ((modalRef.current as any)?.msRequestFullscreen) {
          await (modalRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast({
        title: 'Fullscreen Error',
        description: 'Unable to toggle fullscreen mode',
        variant: 'destructive'
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={endCall}>
      <DialogContent 
        ref={modalRef}
        className={`max-w-5xl max-h-[90vh] p-0 rounded-lg flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? 'fixed inset-0 max-w-none max-h-none w-screen h-screen z-50 rounded-none' : ''}`}
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl mt-2">
            <Video className="w-6 h-6" />
            Video Call - {channelName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-4 min-h-0">
          {isLoading ? (
            <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Starting video call...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full bg-red-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-red-600">
                <VideoOff className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <Button onClick={startCall} className="mt-4">Try Again</Button>
              </div>
            </div>
          ) : (
            <div className={`w-full bg-black rounded-lg relative overflow-hidden ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[500px]'}`}>
              {stream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />

                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <p>No camera feed</p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live • {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              

              

              
              {isScreenSharing && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-4 py-2 rounded-full">
                  <Monitor className="w-4 h-4 inline mr-2" />
                  Screen Sharing
                </div>
              )}
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <VideoOff className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">{user?.name || 'You'}</p>
                    <p className="text-gray-300">Camera is off</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex items-center justify-center gap-4 rounded-b-lg">
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="lg"
            onClick={shareScreen}
            className="rounded-full w-12 h-12 p-0"
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isFullscreen ? "secondary" : "outline"}
            size="lg"
            onClick={toggleFullscreen}
            className="rounded-full w-12 h-12 p-0"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};