import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Send,
  Eye,
  Settings
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-states";
import { RecipientSelector } from "@/components/approval/RecipientSelector";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WatermarkFeature } from "@/components/documents/WatermarkFeature";
import { useAuth } from "@/contexts/AuthContext";
import { FileViewer } from "@/components/documents/FileViewer";

interface DocumentUploaderProps {
  userRole: string;
  onSubmit: (data: any) => void;
}

export function DocumentUploader({ userRole, onSubmit }: DocumentUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [documentTitle, setDocumentTitle] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [documentAssignments, setDocumentAssignments] = useState<{ [key: string]: string[] }>({});
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<any>(null);
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  const documentTypeOptions = [
    { id: "letter", label: "Letter", icon: FileText },
    { id: "circular", label: "Circular", icon: File },
    { id: "report", label: "Report", icon: FileText },
  ];

  const handleDocumentTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setDocumentTypes([...documentTypes, typeId]);
    } else {
      setDocumentTypes(documentTypes.filter(id => id !== typeId));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleViewFile = (file: File) => {
    // Open the file in the FileViewer modal instead of a new tab
    setViewingFile(file);
    setShowFileViewer(true);
  };

  const handleSubmit = () => {
    if (!documentTitle.trim() || documentTypes.length === 0 || uploadedFiles.length === 0 || selectedRecipients.length === 0) {
      // Provide specific feedback on what's missing
      const missing = [];
      if (!documentTitle.trim()) missing.push("Document Title");
      if (documentTypes.length === 0) missing.push("Document Type");
      if (uploadedFiles.length === 0) missing.push("Files to upload");
      if (selectedRecipients.length === 0) missing.push("Recipients");

      toast({
        title: "Missing Required Fields",
        description: `Please provide: ${missing.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    submitDocuments();
  };

  const submitDocuments = () => {
    const data = {
      title: documentTitle,
      documentTypes,
      files: uploadedFiles,
      recipients: selectedRecipients,
      description,
      priority,
      timestamp: new Date().toISOString(),
      assignments: documentAssignments
    };

    // Submit directly without opening watermark modal
    setIsUploading(true);

    setTimeout(() => {
      toast({
        title: "Document Submitted Successfully",
        description: `Submitted ${uploadedFiles.length} file(s) to ${selectedRecipients.length} recipient(s)`,
        variant: "default"
      });

      onSubmit(data);
      setIsUploading(false);

      // Reset form after successful submission
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentTypes([]);
    setUploadedFiles([]);
    setSelectedRecipients([]);
    setDescription("");
    setPriority("normal");
    setDocumentAssignments({});
  };

  const handleWatermarkComplete = () => {
    setShowWatermarkModal(false);

    if (pendingSubmissionData) {
      setIsUploading(true);

      setTimeout(() => {
        toast({
          title: "Document Submitted Successfully",
          description: `Submitted ${uploadedFiles.length} file(s) to ${selectedRecipients.length} recipient(s) with watermark applied`,
          variant: "default"
        });

        onSubmit(pendingSubmissionData);
        setIsUploading(false);
        setPendingSubmissionData(null);

        // Reset form after successful submission
        resetForm();
      }, 1000);
    }
  };

  const handleAssignmentChange = (fileName: string, recipientId: string, assigned: boolean) => {
    setDocumentAssignments(prev => {
      const current = prev[fileName] || [];
      if (assigned) {
        return { ...prev, [fileName]: [...current, recipientId] };
      } else {
        return { ...prev, [fileName]: current.filter(id => id !== recipientId) };
      }
    });
  };

  const handleAssignmentSave = () => {
    setShowAssignmentModal(false);
    toast({
      title: "Assignment Saved",
      description: "Document assignments have been saved successfully.",
      variant: "default"
    });
  };

  const isSubmitDisabled = !documentTitle.trim() || documentTypes.length === 0 || uploadedFiles.length === 0 || selectedRecipients.length === 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Submit Document
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Document Title */}
          <div className="space-y-3">
            <Label htmlFor="documentTitle" className="text-base font-medium">Document Title</Label>
            <Input
              id="documentTitle"
              type="text"
              placeholder="Enter document title..."
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-base sm:text-sm"
            />
          </div>

          {/* Document Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Document Type</Label>
            <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 gap-3">
              {documentTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={option.id}
                    checked={documentTypes.includes(option.id)}
                    onCheckedChange={(checked) => handleDocumentTypeChange(option.id, !!checked)}
                  />
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                    <option.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{option.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Upload Documents</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                title="Upload document files"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, GIF, BMP, WebP, SVG
                  </p>
                </div>
              </Label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uploaded Files</Label>
                {uploadedFiles.map((file, index) => (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-accent/50 rounded-md gap-3 border border-border/50">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 min-w-0">
                      <div className="flex items-center gap-2 mr-2 min-w-0">
                        <File className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate font-medium">{file.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs cursor-pointer hover:bg-primary/10 flex items-center gap-1 active:scale-95 transition-transform"
                          onClick={() => handleViewFile(file)}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs cursor-pointer hover:bg-primary/10 flex items-center gap-1 active:scale-95 transition-transform"
                          onClick={() => setShowWatermarkModal(true)}
                        >
                          <Settings className="w-3 h-3" />
                          Watermark
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 self-end sm:self-auto hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Preview */}
          {uploadedFiles.length > 1 && selectedRecipients.length > 1 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Label className="text-base font-medium">Document Assignment</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignmentModal(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Assignment
                </Button>
              </div>
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-100">
                <p>Multiple files and recipients detected. You can customize which documents go to which recipients.</p>
              </div>
            </div>
          )}

          {/* Document Management Recipients */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Document Management Recipients</Label>
            <RecipientSelector
              userRole={userRole}
              selectedRecipients={selectedRecipients}
              onRecipientsChange={setSelectedRecipients}
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Normal Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Urgent Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">
              Document Description / Comments
            </Label>
            <Textarea
              id="description"
              placeholder="Provide additional context or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-base sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-2 pt-4">
            {/* Validation feedback */}
            {isSubmitDisabled && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium mb-1">Required to submit:</p>
                <ul className="space-y-1">
                  {!documentTitle.trim() && <li>• Enter a document title</li>}
                  {documentTypes.length === 0 && <li>• Select at least one document type</li>}
                  {uploadedFiles.length === 0 && <li>• Upload at least one file</li>}
                  {selectedRecipients.length === 0 && <li>• Select at least one recipient</li>}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {isUploading ? (
                <LoadingState
                  type="spinner"
                  message="Uploading document..."
                  className="py-4"
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setDocumentTitle("");
                      setDocumentTypes([]);
                      setUploadedFiles([]);
                      setSelectedRecipients([]);
                      setDescription("");
                      setPriority("normal");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    variant={isSubmitDisabled ? "secondary" : "gradient"}
                    size="lg"
                    className="w-full sm:min-w-32 sm:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitDisabled ? "Complete Form" : "Submit Document"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Assignment Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Documents to Recipients</DialogTitle>
            <DialogDescription>
              Select which documents should be sent to each recipient. By default, all documents will be sent to all recipients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {uploadedFiles.map((file, fileIndex) => (
              <Card key={fileIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <File className="w-4 h-4" />
                    {file.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRecipients.map((recipientId) => (
                      <div key={recipientId} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`${file.name}-${recipientId}`}
                          checked={documentAssignments[file.name]?.includes(recipientId) ?? true}
                          onCheckedChange={(checked) => handleAssignmentChange(file.name, recipientId, !!checked)}
                        />
                        <Label htmlFor={`${file.name}-${recipientId}`} className="text-xs sm:text-sm cursor-pointer truncate">
                          {recipientId.replace('-', ' ').toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignmentSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Watermark Feature Modal */}
      {showWatermarkModal && user && (
        <WatermarkFeature
          isOpen={showWatermarkModal}
          onClose={() => {
            setShowWatermarkModal(false);

            // If there's pending submission data, proceed with the submission
            if (pendingSubmissionData) {
              handleWatermarkComplete();
            }
          }}
          document={{
            id: `temp-${Date.now()}`,
            title: documentTitle || 'Circular Document',
            content: description || 'This circular document will be watermarked according to your specifications.',
            type: 'circular'
          }}
          user={{
            id: user.id,
            name: user.name || 'User',
            email: user.email || 'user@example.com',
            role: user.role || 'Employee'
          }}
          files={uploadedFiles}
          onFilesUpdate={(updatedFiles) => {
            setUploadedFiles(updatedFiles);
            toast({
              title: "Files Updated",
              description: "Watermark has been applied to your files.",
            });
          }}
        />
      )}

      {/* File Viewer Modal */}
      <FileViewer
        file={viewingFile}
        open={showFileViewer}
        onOpenChange={setShowFileViewer}
      />
    </div>
  );
}