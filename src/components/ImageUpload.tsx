import { useState, useCallback } from 'react';
import { Upload, FileImage, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  onUploadComplete: (files: Array<{ file: File; preview: string }>) => void;
}

export const ImageUpload = ({ onUploadComplete }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload image files only.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const filePromises = imageFiles.map(file => {
        return new Promise<{ file: File; preview: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ file, preview: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(filePromises);
      onUploadComplete(results);

      toast({
        title: "Files loaded successfully",
        description: `${imageFiles.length} chart image(s) ready for analysis.`,
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Upload failed",
        description: "Error processing the files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
      <div
        className={`relative p-8 text-center transition-smooth ${
          dragActive ? 'border-primary bg-primary/5' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="p-6 rounded-full bg-chart-bg border border-border/30">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary/10 border border-primary/20">
              <Upload className="w-4 h-4 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Upload MNQ Chart Images
            </h3>
            <p className="text-muted-foreground">
              Drag & drop your 5-minute timeframe chart screenshots or{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                browse files
              </Button>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted/30">PNG</span>
            <span className="px-2 py-1 rounded bg-muted/30">JPG</span>
            <span className="px-2 py-1 rounded bg-muted/30">WEBP</span>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Processing images...</span>
            </div>
          )}
        </div>

        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </div>
    </Card>
  );
};