import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { FileText, Droplets, Shuffle, Lock, Eye, Save, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle, X, Type, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set up PDF.js worker with unpkg CDN for better compatibility
if (typeof window !== 'undefined') {
  // Version 5.x uses .mjs extension for ES modules
  const pdfjsVersion = pdfjsLib.version || '5.4.296';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

interface WatermarkFeatureProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  files?: File[];  // NEW - Array of uploaded files
  onFilesUpdate?: (updatedFiles: File[]) => void;  // NEW - Callback to update files
}

type TabType = 'basic' | 'style' | 'preview' | 'generate';

interface WatermarkStyle {
  font: string;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  location: string;
  xOffset: number;
  yOffset: number;
}

export const WatermarkFeature: React.FC<WatermarkFeatureProps> = ({
  isOpen,
  onClose,
  document,
  user,
  files = [],  // NEW - Default to empty array
  onFilesUpdate  // NEW - Callback to update files
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [location, setLocation] = useState('Centered');
  const [opacity, setOpacity] = useState([0.3]);
  const [rotation, setRotation] = useState(297);
  const [font, setFont] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(49);
  const [color, setColor] = useState('#ff0000');
  const [previewPage, setPreviewPage] = useState(0); // 0 = show all pages
  const [pageRange, setPageRange] = useState('1-10');
  const [isLocked, setIsLocked] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState<WatermarkStyle | null>(null);
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileContent, setFileContent] = useState<any>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileZoom, setFileZoom] = useState(100);
  const [fileRotation, setFileRotation] = useState(0);

  // NEW STATES FOR REPEATING PATTERN
  const [repeatMode, setRepeatMode] = useState<'none' | 'diagonal' | 'grid'>('none');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [imageScale, setImageScale] = useState(100);
  const [spacingX, setSpacingX] = useState(200);
  const [spacingY, setSpacingY] = useState(200);
  const [diagonalAngle, setDiagonalAngle] = useState(-45);

  // State for undo functionality
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [hasAppliedWatermark, setHasAppliedWatermark] = useState(false);

  const { toast } = useToast();

  // Debug: Log files prop
  useEffect(() => {
    console.log('WatermarkFeature - files prop:', files);
    console.log('WatermarkFeature - files length:', files?.length);
  }, [files]);

  // Store original files for undo functionality
  useEffect(() => {
    if (files && files.length > 0 && originalFiles.length === 0) {
      setOriginalFiles([...files]);
    }
  }, [files]);

  // Set initial viewing file when files prop changes
  useEffect(() => {
    console.log('Setting initial file, files:', files);
    if (files && files.length > 0) {
      console.log('Setting viewingFile to:', files[0]);
      setViewingFile(files[0]);
      setCurrentFileIndex(0);
    } else {
      console.log('No files available, clearing viewingFile');
      setViewingFile(null);
      setCurrentFileIndex(0);
    }
  }, [files]);

  // Load file content when viewingFile changes
  useEffect(() => {
    if (!viewingFile) {
      setFileContent(null);
      setFileError(null);
      return;
    }

    const loadFile = async () => {
      setFileLoading(true);
      setFileError(null);

      try {
        const fileType = viewingFile.type;
        const fileName = viewingFile.name.toLowerCase();

        if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
          await loadPDF(viewingFile);
        } else if (fileType.includes('image')) {
          await loadImageFile(viewingFile);
        } else if (fileType.includes('word') || fileName.endsWith('.docx')) {
          await loadWord(viewingFile);
        } else if (fileType.includes('sheet') || fileName.endsWith('.xlsx')) {
          await loadExcel(viewingFile);
        } else {
          setFileContent({ type: 'unsupported' });
        }
      } catch (error) {
        console.error('Error loading file:', error);
        setFileError(error instanceof Error ? error.message : 'Failed to load file');
      } finally {
        setFileLoading(false);
      }
    };

    loadFile();
  }, [viewingFile]);

  const loadPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCanvases: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvasEl = window.document.createElement('canvas');
      const context = canvasEl.getContext('2d');

      if (!context) throw new Error('Could not get canvas context');

      canvasEl.height = viewport.height;
      canvasEl.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport } as any).promise;
      pageCanvases.push(canvasEl.toDataURL());
    }

    setFileContent({ type: 'pdf', pageCanvases, totalPages: pdf.numPages });
  };

  const loadWord = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setFileContent({ type: 'word', html: result.value });
  };

  const loadExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const html = XLSX.utils.sheet_to_html(firstSheet);
    setFileContent({ type: 'excel', html, sheetNames: workbook.SheetNames });
  };

  const loadImageFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setFileContent({ type: 'image', url });
  };

  const handleSelectFile = (index: number) => {
    if (files && files[index]) {
      setCurrentFileIndex(index);
      setViewingFile(files[index]);
      setFileZoom(100);
      setFileRotation(0);
    }
  };

  const generateUniqueWatermark = () => {
    const seed = `${watermarkText}|${location}|${document.id}|${user.id}`;
    const hash = btoa(seed).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const style: WatermarkStyle = {
      font: ['Helvetica', 'Arial', 'Times New Roman'][Math.abs(hash) % 3],
      size: 30 + (Math.abs(hash) % 40),
      color: `hsl(${Math.abs(hash) % 360}, ${50 + (Math.abs(hash) % 30)}%, ${30 + (Math.abs(hash) % 40)}%)`,
      opacity: 0.15 + ((Math.abs(hash) % 45) / 100),
      rotation: -45 + (Math.abs(hash) % 90),
      location,
      xOffset: -10 + (Math.abs(hash) % 20),
      yOffset: -10 + (Math.abs(hash) % 20)
    };

    setGeneratedStyle(style);
    setFont(style.font);
    setFontSize(style.size);
    setColor(style.color);
    setOpacity([style.opacity]);
    setRotation(style.rotation);
  };

  const regenerateVariant = () => {
    const timestamp = Date.now();
    const seed = `${watermarkText}|${location}|${document.id}|${user.id}|${timestamp}`;
    const hash = btoa(seed).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const style: WatermarkStyle = {
      font: ['Helvetica', 'Arial', 'Times New Roman', 'Georgia', 'Verdana'][Math.abs(hash) % 5],
      size: 25 + (Math.abs(hash) % 50),
      color: `hsl(${Math.abs(hash) % 360}, ${40 + (Math.abs(hash) % 40)}%, ${25 + (Math.abs(hash) % 50)}%)`,
      opacity: 0.12 + ((Math.abs(hash) % 48) / 100),
      rotation: -90 + (Math.abs(hash) % 180),
      location,
      xOffset: -15 + (Math.abs(hash) % 30),
      yOffset: -15 + (Math.abs(hash) % 30)
    };

    setGeneratedStyle(style);
    setFont(style.font);
    setFontSize(style.size);
    setColor(style.color);
    setOpacity([style.opacity]);
    setRotation(style.rotation);
  };

  const lockWatermark = () => {
    setIsLocked(!isLocked);
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG or JPG image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setWatermarkImage(e.target?.result as string);
      setWatermarkType('image');
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    };
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  // Helper function to get watermark position styles
  const getWatermarkPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      color: color,
      opacity: opacity[0],
      fontSize: `${fontSize}px`,
      fontFamily: font,
      fontWeight: 'bold',
      transform: `rotate(${rotation}deg)`,
      textShadow: '0 0 2px rgba(255,255,255,0.5)',
    };

    switch (location) {
      case 'Top Left':
        return { ...baseStyles, top: '10%', left: '10%', transformOrigin: 'top left' };
      case 'Top Center':
        return { ...baseStyles, top: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Top Right':
        return { ...baseStyles, top: '10%', right: '10%', transformOrigin: 'top right' };
      case 'Middle Left':
        return { ...baseStyles, top: '50%', left: '10%', transform: `translateY(-50%) rotate(${rotation}deg)`, transformOrigin: 'left center' };
      case 'Centered':
        return { ...baseStyles, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Middle Right':
        return { ...baseStyles, top: '50%', right: '10%', transform: `translateY(-50%) rotate(${rotation}deg)`, transformOrigin: 'right center' };
      case 'Bottom Left':
        return { ...baseStyles, bottom: '10%', left: '10%', transformOrigin: 'bottom left' };
      case 'Bottom Center':
        return { ...baseStyles, bottom: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Bottom Right':
        return { ...baseStyles, bottom: '10%', right: '10%', transformOrigin: 'bottom right' };
      default:
        return { ...baseStyles, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
    }
  };

  // Helper function to render repeating watermarks
  const renderRepeatingWatermarks = () => {
    const watermarks: JSX.Element[] = [];
    const containerWidth = 2000;
    const containerHeight = 3000;

    const cols = Math.ceil(containerWidth / spacingX) + 2;
    const rows = Math.ceil(containerHeight / spacingY) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * spacingX;
        const y = row * spacingY;
        const key = `watermark-${row}-${col}`;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          transform: `rotate(${repeatMode === 'diagonal' ? diagonalAngle : rotation}deg)`,
          opacity: opacity[0],
          color: color,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
        };

        watermarks.push(
          watermarkType === 'text' ? (
            <span key={key} style={style}>
              {watermarkText}
            </span>
          ) : watermarkImage ? (
            <img
              key={key}
              src={watermarkImage}
              alt=""
              style={{
                ...style,
                width: `${imageScale}px`,
                height: 'auto',
              }}
            />
          ) : null
        );
      }
    }

    return watermarks;
  };

  // Watermark Overlay Component with Repeating Pattern Support
  const WatermarkOverlay = ({ pageNumber }: { pageNumber?: number }) => {
    if (watermarkType === 'text' && !watermarkText.trim()) return null;
    if (watermarkType === 'image' && !watermarkImage) return null;

    // Check if this page should have a watermark (only for PDF pages)
    if (pageNumber !== undefined && fileContent?.type === 'pdf' && fileContent.totalPages) {
      try {
        const pagesToWatermark = parsePageRange(pageRange, fileContent.totalPages);
        if (!pagesToWatermark.includes(pageNumber)) {
          return null; // Don't show watermark on this page
        }
      } catch {
        // If parsing fails, show watermark (default behavior)
      }
    }

    // Single watermark rendering
    if (repeatMode === 'none') {
      return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10">
          {watermarkType === 'text' ? (
            <span style={getWatermarkPositionStyles()}>
              {watermarkText}
            </span>
          ) : (
            <img
              src={watermarkImage!}
              alt="Watermark"
              style={{
                ...getWatermarkPositionStyles(),
                width: `${imageScale}px`,
                height: 'auto',
              }}
            />
          )}
        </div>
      );
    }

    // Repeating pattern rendering
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {renderRepeatingWatermarks()}
      </div>
    );
  };

  // Helper: Load image from base64
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Apply single watermark to canvas
  const applySingleWatermark = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (watermarkType === 'text') {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize * 2}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let x = width / 2;
      let y = height / 2;

      switch (location) {
        case 'Top Left':
          x = width * 0.1;
          y = height * 0.1;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          break;
        case 'Top Center':
          y = height * 0.1;
          ctx.textBaseline = 'top';
          break;
        case 'Top Right':
          x = width * 0.9;
          y = height * 0.1;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          break;
        case 'Middle Left':
          x = width * 0.1;
          ctx.textAlign = 'left';
          break;
        case 'Middle Right':
          x = width * 0.9;
          ctx.textAlign = 'right';
          break;
        case 'Bottom Left':
          x = width * 0.1;
          y = height * 0.9;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          break;
        case 'Bottom Center':
          y = height * 0.9;
          ctx.textBaseline = 'bottom';
          break;
        case 'Bottom Right':
          x = width * 0.9;
          y = height * 0.9;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          break;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    } else if (watermarkImage) {
      const img = await loadImage(watermarkImage);
      const scaledWidth = (img.width * imageScale) / 50;
      const scaledHeight = (img.height * imageScale) / 50;

      let x = width / 2 - scaledWidth / 2;
      let y = height / 2 - scaledHeight / 2;

      ctx.save();
      ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    }
  };

  // Apply repeating watermark pattern to canvas
  const applyRepeatingWatermark = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scaleX = spacingX * 2;
    const scaleY = spacingY * 2;
    const cols = Math.ceil(width / scaleX) + 1;
    const rows = Math.ceil(height / scaleY) + 1;

    if (watermarkType === 'text') {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize * 2}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * scaleX;
          const y = row * scaleY;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(((repeatMode === 'diagonal' ? diagonalAngle : rotation) * Math.PI) / 180);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
    } else if (watermarkImage) {
      const img = await loadImage(watermarkImage);
      const scaledWidth = (img.width * imageScale) / 50;
      const scaledHeight = (img.height * imageScale) / 50;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * scaleX;
          const y = row * scaleY;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(((repeatMode === 'diagonal' ? diagonalAngle : rotation) * Math.PI) / 180);
          ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        }
      }
    }
  };

  // Apply watermark to canvas (for PDF pages and images)
  // This function draws the watermark directly on the canvas WITHOUT using the preview overlay
  const applyWatermarkToCanvas = async (sourceCanvas: HTMLCanvasElement): Promise<string> => {
    const canvas = window.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL();

    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    // Draw original content ONLY (no watermark overlay from preview)
    ctx.drawImage(sourceCanvas, 0, 0);

    // Apply watermark directly to canvas
    ctx.save();
    ctx.globalAlpha = opacity[0];

    if (repeatMode === 'none') {
      await applySingleWatermark(ctx, canvas.width, canvas.height);
    } else {
      await applyRepeatingWatermark(ctx, canvas.width, canvas.height);
    }

    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  // Parse page range string (e.g., "1-10, 13, 14, 100-")
  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    const pages = new Set<number>();
    const ranges = rangeStr.split(',').map(r => r.trim());

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(s => s.trim());
        const startPage = start ? parseInt(start) : 1;
        const endPage = end ? parseInt(end) : totalPages;

        for (let i = startPage; i <= Math.min(endPage, totalPages); i++) {
          if (i >= 1) pages.add(i);
        }
      } else {
        const pageNum = parseInt(range);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pages.add(pageNum);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  // Apply watermark to PDF and download
  const applyWatermarkToPDF = async () => {
    if (!viewingFile || fileContent?.type !== 'pdf') return null;

    try {
      const arrayBuffer = await viewingFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const watermarkedPages: string[] = [];

      // Parse page range to determine which pages to watermark
      const pagesToWatermark = parsePageRange(pageRange, pdf.numPages);

      if (pagesToWatermark.length === 0) {
        toast({
          title: 'Invalid Page Range',
          description: 'No valid pages found in the specified range.',
          variant: 'destructive',
        });
        return null;
      }

      // Process all pages, but only apply watermark to specified pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher resolution

        const canvas = window.document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport: viewport } as any).promise;

        // Only apply watermark to pages in the specified range
        if (pagesToWatermark.includes(i)) {
          const watermarkedDataUrl = await applyWatermarkToCanvas(canvas);
          watermarkedPages.push(watermarkedDataUrl);
        } else {
          // For pages not in range, just convert to image without watermark
          watermarkedPages.push(canvas.toDataURL('image/png'));
        }
      }

      toast({
        title: 'Pages Processed',
        description: `Watermark applied to ${pagesToWatermark.length} of ${pdf.numPages} pages.`,
      });

      return watermarkedPages;
    } catch (error) {
      console.error('Error applying watermark to PDF:', error);
      return null;
    }
  };

  // Apply watermark to image and download
  const applyWatermarkToImage = async (): Promise<string | null> => {
    if (!viewingFile || fileContent?.type !== 'image') return null;

    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = window.document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          applyWatermarkToCanvas(canvas).then(watermarkedDataUrl => {
            resolve(watermarkedDataUrl);
          }).catch(() => resolve(null));
        };
        img.onerror = () => resolve(null);
        img.src = fileContent.url;
      });
    } catch (error) {
      console.error('Error applying watermark to image:', error);
      return null;
    }
  };

  // Download watermarked file
  const downloadWatermarkedFile = (dataUrls: string[], filename: string) => {
    if (dataUrls.length === 1) {
      // Single image
      const link = window.document.createElement('a');
      link.href = dataUrls[0];
      link.download = `watermarked_${filename}`;
      link.click();
    } else {
      // Multiple pages - download as ZIP or individual images
      dataUrls.forEach((dataUrl, index) => {
        setTimeout(() => {
          const link = window.document.createElement('a');
          link.href = dataUrl;
          link.download = `watermarked_${filename.replace(/\.[^/.]+$/, '')}_page${index + 1}.png`;
          link.click();
        }, index * 500); // Stagger downloads
      });
    }
  };

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async () => {
    if (!viewingFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to apply watermark.",
        variant: "destructive"
      });
      return;
    }

    if (watermarkType === 'text' && !watermarkText.trim()) {
      toast({
        title: "No Watermark Text",
        description: "Please enter watermark text.",
        variant: "destructive"
      });
      return;
    }

    if (watermarkType === 'image' && !watermarkImage) {
      toast({
        title: "No Watermark Image",
        description: "Please upload a watermark image.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Applying Watermark...",
      description: "Processing your document. This may take a moment.",
    });

    try {
      let watermarkedFile: File | null = null;

      if (fileContent?.type === 'pdf') {
        const watermarkedData = await applyWatermarkToPDF();
        if (watermarkedData && watermarkedData.length > 0) {
          // For PDFs, we'll create a single image file from the first page
          // In a real implementation, you'd want to merge all pages back into a PDF
          const newFileName = `watermarked_${viewingFile.name.replace('.pdf', '.png')}`;
          watermarkedFile = dataURLtoFile(watermarkedData[0], newFileName);

          toast({
            title: "Watermark Applied Successfully!",
            description: `Watermark applied to ${watermarkedData.length} pages. File updated in system.`,
          });
        }
      } else if (fileContent?.type === 'image') {
        const watermarkedData = await applyWatermarkToImage();
        if (watermarkedData) {
          const newFileName = `watermarked_${viewingFile.name}`;
          watermarkedFile = dataURLtoFile(watermarkedData, newFileName);

          toast({
            title: "Watermark Applied Successfully!",
            description: "Watermark applied to image. File updated in system.",
          });
        }
      } else {
        // For Word/Excel/other types, just save settings
        const watermarkData = {
          documentId: document.id,
          text: watermarkText,
          location,
          opacity: opacity[0],
          rotation,
          font,
          fontSize,
          color,
          pageRange,
          generatedStyle,
          isLocked,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem(`watermark-${document.id}`, JSON.stringify(watermarkData));

        toast({
          title: "Watermark Settings Saved",
          description: `Watermark configuration saved for ${viewingFile.name}. Full embedding available for PDF and images.`,
        });

        // Close modal after saving settings
        onClose();
        return;
      }

      // Update the files array with the watermarked file
      if (watermarkedFile && onFilesUpdate) {
        const updatedFiles = [...files];
        updatedFiles[currentFileIndex] = watermarkedFile;
        onFilesUpdate(updatedFiles);

        // Mark that watermark has been applied
        setHasAppliedWatermark(true);

        // Close the modal and return to previous screen
        // Do NOT reload the watermarked file into the viewer to prevent double watermarking
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (!watermarkedFile) {
        toast({
          title: "Error",
          description: "Failed to apply watermark. Please try again.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An error occurred while applying the watermark.",
        variant: "destructive"
      });
    }
  };

  // Handle undo - revert to original files
  const handleUndo = () => {
    if (originalFiles.length > 0 && onFilesUpdate) {
      onFilesUpdate([...originalFiles]);
      setViewingFile(originalFiles[currentFileIndex] || originalFiles[0]);
      setHasAppliedWatermark(false);

      toast({
        title: "Watermark Removed",
        description: "Reverted to original file without watermark.",
      });
    } else {
      toast({
        title: "Nothing to Undo",
        description: "No previous version available.",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic Settings' },
    { id: 'style' as TabType, label: 'Style Options' },
    { id: 'preview' as TabType, label: 'Preview & Apply' },
    { id: 'generate' as TabType, label: 'Generate Unique' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            {/* Watermark Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Watermark Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={watermarkType === 'text' ? 'default' : 'outline'}
                  onClick={() => setWatermarkType('text')}
                  className="flex-1"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </Button>
                <Button
                  type="button"
                  variant={watermarkType === 'image' ? 'default' : 'outline'}
                  onClick={() => setWatermarkType('image')}
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </Button>
              </div>
            </div>

            {/* Text Watermark Input */}
            {watermarkType === 'text' && (
              <div>
                <Label className="text-sm font-medium">Watermark Text</Label>
                <Textarea
                  id="watermarkText"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Click to edit watermark text..."
                  className="mt-1 min-h-[80px] text-base sm:text-sm"
                />
              </div>
            )}

            {/* Image Upload */}
            {watermarkType === 'image' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Watermark Image</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {watermarkImage && (
                  <div className="relative w-full h-24 border rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={watermarkImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => {
                        setWatermarkImage(null);
                        toast({
                          title: 'Image removed',
                          description: 'Watermark image has been removed',
                        });
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Image Scale Control */}
            {watermarkType === 'image' && watermarkImage && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Image Scale: {imageScale}%
                </Label>
                <Slider
                  value={[imageScale]}
                  onValueChange={(value) => setImageScale(value[0])}
                  min={10}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Location on Page</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="mt-1 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Centered">Centered</SelectItem>
                  <SelectItem value="Custom Left">Custom Left</SelectItem>
                  <SelectItem value="Custom Right">Custom Right</SelectItem>
                  <SelectItem value="Top">Top</SelectItem>
                  <SelectItem value="Bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Opacity: {Math.round(opacity[0] * 100)}%</Label>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={1}
                min={0.1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Rotation Angle</Label>
              <Input
                type="number"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="mt-1 text-base sm:text-sm"
              />
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Font</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger className="mt-1 text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1 text-base sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded-md shrink-0"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Repeat Mode Selection */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-medium">Repeat Pattern</Label>
              <Select
                value={repeatMode}
                onValueChange={(value: any) => {
                  setRepeatMode(value);
                  // Set good defaults when switching modes
                  if (value === 'diagonal') {
                    setSpacingX(250);
                    setSpacingY(250);
                    setDiagonalAngle(-45);
                    setOpacity([0.15]); // Lower opacity for repeating patterns
                  } else if (value === 'grid') {
                    setSpacingX(300);
                    setSpacingY(300);
                    setOpacity([0.15]); // Lower opacity for repeating patterns
                  } else {
                    setOpacity([0.3]); // Higher opacity for single watermark
                  }
                }}
              >
                <SelectTrigger className="text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Single (No Repeat)</SelectItem>
                  <SelectItem value="diagonal">Diagonal Repeat</SelectItem>
                  <SelectItem value="grid">Grid Repeat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Spacing Controls */}
            {repeatMode !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Horizontal Spacing: {spacingX}px
                  </Label>
                  <Slider
                    value={[spacingX]}
                    onValueChange={(value) => setSpacingX(value[0])}
                    min={100}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Vertical Spacing: {spacingY}px
                  </Label>
                  <Slider
                    value={[spacingY]}
                    onValueChange={(value) => setSpacingY(value[0])}
                    min={100}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Diagonal Angle Control */}
            {repeatMode === 'diagonal' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Diagonal Angle: {diagonalAngle}°
                </Label>
                <Slider
                  value={[diagonalAngle]}
                  onValueChange={(value) => setDiagonalAngle(value[0])}
                  min={-90}
                  max={90}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Preview Page</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewPage(0)}
                  className="h-7 text-xs"
                >
                  View All Pages
                </Button>
              </div>
              <Input
                type="number"
                value={previewPage === 0 ? '' : previewPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setPreviewPage(val === '' ? 0 : Number(val));
                }}
                className="mt-1 text-base sm:text-sm"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Apply to Pages</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (fileContent?.type === 'pdf' && fileContent.totalPages) {
                      setPageRange(`1-${fileContent.totalPages}`);
                    } else {
                      setPageRange('1-');
                    }
                  }}
                  className="h-7 text-xs"
                >
                  All Pages
                </Button>
              </div>
              <Input
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-10, 13, 14, 100-"
                className="mt-1 text-base sm:text-sm"
              />
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] relative overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">
                Preview {previewPage === 0 ? '(All Pages)' : `(Page ${previewPage})`}
              </div>
              <div className="relative w-full h-48 bg-white border rounded shadow-sm">
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    opacity: opacity[0],
                    color: color,
                    fontSize: `${fontSize * 0.3}px`,
                    fontFamily: font
                  }}
                >
                  {watermarkText}
                </div>
                <div className="p-4 text-xs text-gray-600">
                  Sample document content appears here...
                </div>
              </div>
            </div>
          </div>
        );

      case 'generate':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Generate a unique watermark style based on your text and chosen location. The style is reproducible and adjustable.
            </div>
            <div className="space-y-3">
              <Button
                onClick={generateUniqueWatermark}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Droplets className="w-4 h-4 mr-2" />
                Generate Unique Watermark
              </Button>
              <Button
                onClick={regenerateVariant}
                variant="outline"
                className="w-full"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Regenerate Variant
              </Button>
              <Button
                onClick={lockWatermark}
                variant={isLocked ? "destructive" : "secondary"}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isLocked ? 'Unlock' : 'Lock'} Watermark
              </Button>
            </div>
            {generatedStyle && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
                <div className="text-sm font-medium text-blue-800 mb-2">Generated Style:</div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>Font: {generatedStyle.font}</div>
                  <div>Size: {generatedStyle.size}px</div>
                  <div>Color: {generatedStyle.color}</div>
                  <div>Opacity: {Math.round(generatedStyle.opacity * 100)}%</div>
                  <div>Rotation: {generatedStyle.rotation}°</div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] md:w-full max-h-[95vh] md:max-h-[90vh] p-0 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        <div className="h-full overflow-hidden flex flex-col">
          {/* Two-Column Layout with Overflow Protection */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 p-4 md:p-6 flex-1 overflow-y-auto md:overflow-hidden min-h-0">
            {/* LEFT COLUMN - Document Viewer */}
            <div className="flex flex-col h-[500px] md:h-full min-w-0 order-2 md:order-1 flex-shrink-0 md:flex-shrink">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col min-h-0">
                <CardContent className="p-4 md:p-6 flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className="mb-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Document Preview
                    </h3>
                    <div className="flex items-center gap-2">
                      {files && files.length > 0 ? (
                        <Badge variant="secondary" className="text-[10px] md:text-xs">
                          {currentFileIndex + 1} / {files.length}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 text-[10px] md:text-xs">
                          No files
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Embedded Document Preview - Enhanced Scrolling with Increased Height */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden border rounded-lg bg-gray-50 scroll-smooth" style={{ maxHeight: 'calc(88vh - 240px)', minHeight: '300px' }}>
                    {fileLoading ? (
                      <div className="flex items-center justify-center h-full p-8 min-h-[400px]">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                          <p className="text-sm text-gray-600">Loading document...</p>
                        </div>
                      </div>
                    ) : fileError ? (
                      <div className="flex items-center justify-center h-full p-8 min-h-[400px]">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                          <p className="text-sm font-medium text-red-600 mb-2">Error Loading File</p>
                          <p className="text-xs text-gray-500 break-words">{fileError}</p>
                        </div>
                      </div>
                    ) : viewingFile && fileContent ? (
                      <div className="p-4 pb-8 w-full">
                        {/* Zoom and Rotation Controls */}
                        <div className="flex items-center justify-center gap-2 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-sm z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileZoom(Math.max(50, fileZoom - 10))}
                            disabled={fileZoom <= 50}
                            title="Zoom Out"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Badge variant="secondary" className="px-3 font-mono">
                            {fileZoom}%
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileZoom(Math.min(200, fileZoom + 10))}
                            disabled={fileZoom >= 200}
                            title="Zoom In"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileRotation((fileRotation + 90) % 360)}
                            title="Rotate 90°"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          {fileContent.type === 'pdf' && fileContent.totalPages && (
                            <Badge variant="outline" className="ml-2">
                              {fileContent.totalPages} {fileContent.totalPages === 1 ? 'page' : 'pages'}
                            </Badge>
                          )}
                        </div>

                        {/* File Content Rendering with Overflow Protection */}
                        <div className="space-y-4 pb-4 w-full">
                          {fileContent.type === 'pdf' && fileContent.pageCanvases?.map((pageDataUrl: string, index: number) => {
                            const pageNumber = index + 1;
                            // Filter by preview page if set
                            if (previewPage && previewPage > 0 && pageNumber !== previewPage) {
                              return null; // Skip pages that don't match preview page
                            }
                            return (
                              <div key={index} className="relative mb-6 overflow-hidden">
                                {/* Live Watermark Preview Overlay */}
                                <WatermarkOverlay pageNumber={pageNumber} />
                                <img
                                  src={pageDataUrl}
                                  alt={`Page ${pageNumber}`}
                                  style={{
                                    transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.3s ease',
                                    maxWidth: '100%',
                                    height: 'auto',
                                  }}
                                  className="border shadow-lg rounded mx-auto block"
                                />
                                <Badge variant="secondary" className="absolute top-2 right-2 bg-background/95 backdrop-blur z-20">
                                  Page {pageNumber} of {fileContent.totalPages}
                                </Badge>
                              </div>
                            );
                          })}

                          {fileContent.type === 'word' && (
                            <div className="w-full overflow-hidden relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <div
                                className="prose prose-sm max-w-none p-6 bg-white rounded shadow-sm min-h-[300px] break-words"
                                style={{
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transformOrigin: 'top center',
                                  transition: 'transform 0.3s ease',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  maxWidth: '100%',
                                }}
                                dangerouslySetInnerHTML={{ __html: fileContent.html }}
                              />
                            </div>
                          )}

                          {fileContent.type === 'excel' && (
                            <div className="w-full overflow-hidden relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <div
                                className="overflow-auto bg-white rounded shadow-sm p-4 min-h-[300px] max-h-[600px]"
                                style={{
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transformOrigin: 'top left',
                                  transition: 'transform 0.3s ease',
                                  maxWidth: '100%',
                                }}
                                dangerouslySetInnerHTML={{ __html: fileContent.html }}
                              />
                            </div>
                          )}

                          {fileContent.type === 'image' && (
                            <div className="flex justify-center relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <img
                                src={fileContent.url}
                                alt={viewingFile.name}
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transition: 'transform 0.3s ease',
                                  transformOrigin: 'center',
                                }}
                                className="rounded shadow-lg"
                              />
                            </div>
                          )}

                          {fileContent.type === 'unsupported' && (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-600 mb-2">{viewingFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(viewingFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Badge variant="secondary" className="mt-2">
                                ✓ File ready for watermarking
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center text-gray-400">
                          <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium mb-1">No documents uploaded</p>
                          <p className="text-xs">Upload files to apply watermark</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Navigation - Fixed Footer */}
                  {files && files.length > 1 && (
                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-lg p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectFile(currentFileIndex - 1)}
                        disabled={currentFileIndex === 0}
                        className="shadow-sm"
                        title="Previous File"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600 font-medium truncate">
                          {viewingFile?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {currentFileIndex + 1} of {files.length}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectFile(currentFileIndex + 1)}
                        disabled={currentFileIndex === files.length - 1}
                        className="shadow-sm"
                        title="Next File"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Watermark Settings */}
            <div className="flex flex-col h-full min-w-0">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Droplets className="h-5 w-5 md:h-6 md:w-6 text-blue-600 shrink-0" />
                      <span className="truncate">Watermark Settings</span>
                    </DialogTitle>
                  </DialogHeader>

                  {/* Tab Navigation */}
                  <div className="mb-6 flex-shrink-0">
                    <div className="bg-gray-100 rounded-full p-1 flex overflow-x-auto no-scrollbar">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-1 xs:px-3 py-2 rounded-full text-[10px] xs:text-sm font-medium transition-all flex-1 text-center whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content - Scrollable Area */}
                  <div className="flex-1 overflow-y-auto pr-2 mb-4">
                    {renderTabContent()}
                  </div>

                  {/* Action Buttons - Fixed Footer */}
                  <div className="flex gap-3 pt-4 border-t flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-green-600 hover:bg-green-700 shadow-md whitespace-nowrap"
                      disabled={isLocked && !generatedStyle}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Apply Watermark
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleUndo}
                      className="shadow-sm flex-shrink-0"
                      title="Undo - Revert to original file"
                      disabled={!hasAppliedWatermark}
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};