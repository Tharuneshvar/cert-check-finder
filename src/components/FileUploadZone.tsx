import { useState, useCallback } from "react";
import { Upload, FileJson, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "idle" | "uploading" | "verified" | "failed";

export const FileUploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const verifyFile = async (file: File) => {
    setStatus("uploading");
    setFileName(file.name);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (!jsonData.certificationId) {
        throw new Error("No certification ID found in JSON file");
      }

      const { data, error } = await supabase.functions.invoke("verify-certification", {
        body: { certificationId: jsonData.certificationId },
      });

      if (error) throw error;

      if (data.verified) {
        setStatus("verified");
        setMessage(data.message);
        toast.success("Verification Complete", {
          description: data.message,
        });
      } else {
        setStatus("failed");
        setMessage(data.message);
        toast.error("Verification Failed", {
          description: data.message,
        });
      }
    } catch (error) {
      setStatus("failed");
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON file";
      setMessage(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      verifyFile(file);
    } else {
      toast.error("Invalid file type. Please upload a JSON file.");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      verifyFile(file);
    }
  };

  const resetUpload = () => {
    setStatus("idle");
    setFileName("");
    setMessage("");
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <Card
        className={`
          relative overflow-hidden p-12 transition-all duration-300
          ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border"}
          ${status === "verified" ? "border-green-500 bg-green-500/5" : ""}
          ${status === "failed" ? "border-destructive bg-destructive/5" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {status === "idle" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-3">Upload Certification File</h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your JSON file here, or click to browse
            </p>

            <label htmlFor="file-upload">
              <Button variant="default" className="cursor-pointer" asChild>
                <span>
                  <FileJson className="w-4 h-4 mr-2" />
                  Select JSON File
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {status === "uploading" && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3">Verifying Certification</h3>
            <p className="text-muted-foreground">
              Checking database for: <span className="text-foreground font-mono">{fileName}</span>
            </p>
          </div>
        )}

        {status === "verified" && (
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 20px hsl(142 76% 36% / 0.5))' }} />
            <h3 className="text-2xl font-semibold mb-3 text-green-500">Zer0 Trace Found!</h3>
            <p className="text-foreground mb-6">{message}</p>
            <Button onClick={resetUpload} variant="outline">
              Verify Another File
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-destructive">Verification Failed</h3>
            <p className="text-foreground mb-6">{message}</p>
            <Button onClick={resetUpload} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
