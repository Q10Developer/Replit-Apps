import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { uploadCsvToProcess } from "@/lib/pythonApi";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Upload as UploadIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface FileUploaderProps {
  maxSizeMB?: number;
}

const FileUploader = ({ maxSizeMB = 10 }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch positions for dropdown
  const { data: positions } = useQuery({
    queryKey: ['/api/active-positions'],
  });

  // Fetch uploads to get last upload time
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    // Validate file type (only CSV)
    if (selectedFile && selectedFile.type !== "text/csv") {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size
    if (selectedFile && selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size exceeds ${maxSizeMB}MB limit`,
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
  }, [maxSizeMB, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      if (!selectedPosition) {
        toast({
          title: "Position required",
          description: "Please select a position before uploading",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      
      try {
        // Use the new Python API upload function
        const result = await uploadCsvToProcess(
          file, 
          selectedPosition,
          (progress) => setUploadProgress(progress)
        );
        
        // Reset after successful upload
        setTimeout(() => {
          setFile(null);
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);
        
        return result;
      } catch (error) {
        setUploadProgress(0);
        setIsUploading(false);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "CVs processed successfully by Python backend!",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Format last upload time
  const formatLastUpload = (date: string | null) => {
    if (!date) return "No previous uploads";
    return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upload CVs for Processing</h3>
        <div className="mt-4 max-w-3xl">
          {/* Position Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Position
            </label>
            <Select
              value={selectedPosition}
              onValueChange={setSelectedPosition}
              disabled={isUploading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position for these CVs" />
              </SelectTrigger>
              <SelectContent>
                {positions?.map((position: any) => (
                  <SelectItem key={position.id} value={position.title}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
              isDragActive ? "border-primary-400 bg-primary-50" : "border-gray-300 hover:border-primary-400"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className="space-y-1 text-center">
              {file ? (
                <>
                  <UploadIcon className="mx-auto h-12 w-12 text-primary-400" />
                  <p className="text-sm text-gray-600">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a CSV file</span>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV files up to {maxSizeMB}MB
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Upload Controls */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>
                Last upload:{" "}
                <span>
                  {stats?.lastUpload
                    ? formatLastUpload(stats.lastUpload)
                    : "No previous uploads"}
                </span>
              </p>
            </div>
            <Button
              type="button"
              onClick={() => uploadMutation.mutate()}
              disabled={!file || isUploading || !selectedPosition}
              className="inline-flex items-center px-4 py-2 text-sm font-medium"
            >
              {isUploading ? "Processing..." : "Process Files"}
            </Button>
          </div>
          
          {/* Progress Section */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">
                  Processing files...
                </div>
                <div className="text-sm text-gray-500">{uploadProgress}%</div>
              </div>
              <Progress value={uploadProgress} className="h-2 mb-4" />
              <div className="text-xs text-gray-500">
                Processing {file?.name}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
