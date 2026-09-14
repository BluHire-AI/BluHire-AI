'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recruitmentService, Application } from '@/services/recruitment.service';

interface ResumeTabProps {
  application: Application;
  formatDate: (date?: string | Date) => string;
  onDownloadResume: (fileName?: string) => void;
}

export function ResumeTab({ application, formatDate, onDownloadResume }: ResumeTabProps) {
  const resume = application.candidateId?.resume;
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated fetch: request PDF Blob with authorization headers
  useEffect(() => {
    let isMounted = true;
    let currentObjectUrl: string | null = null;

    async function loadResumeBlob() {
      if (!resume?.fileName) {
        setPdfBlobUrl(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Uses the authenticated Axios instance in recruitmentService
        const blob = await recruitmentService.downloadResume(resume.fileName);

        if (!isMounted) return;

        // Ensure MIME type is application/pdf for browser document viewer
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        currentObjectUrl = objectUrl;
        setPdfBlobUrl(objectUrl);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error loading authenticated resume PDF:', err);

        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setError('Authentication required or session expired. Please refresh your session.');
        } else if (status === 404) {
          setError('The requested resume document could not be found in storage.');
        } else {
          setError('Unable to stream the PDF document preview. You can still download the file below.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadResumeBlob();

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [resume?.fileName]);

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else if (resume?.fileName) {
      onDownloadResume(resume.fileName);
    }
  };

  const handleRetry = () => {
    if (resume?.fileName) {
      // Trigger effect re-run by setting state
      setLoading(true);
      setError(null);
      recruitmentService
        .downloadResume(resume.fileName)
        .then((blob) => {
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(url);
          setError(null);
        })
        .catch(() => {
          setError('Failed to reload resume PDF. Please verify your connection.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {resume?.fileName ? (
        <div className="flex-1 flex flex-col space-y-3">
          {/* File Header Bar */}
          <div className="border border-border/70 dark:border-white/10 rounded-xl p-3 flex items-center justify-between bg-muted/20 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-foreground dark:text-white truncate max-w-[220px] sm:max-w-[340px]">
                  {resume.fileName}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Uploaded: {formatDate(resume.uploadedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                onClick={() => onDownloadResume(resume.fileName)}
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 text-foreground"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                onClick={handleOpenInNewTab}
                size="sm"
                variant="outline"
                disabled={!pdfBlobUrl && loading}
                className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 text-foreground"
                title="Open PDF in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open</span>
              </Button>
            </div>
          </div>

          {/* PDF Preview Container */}
          <div className="flex-1 min-h-[480px] max-h-[64vh] border border-border/70 dark:border-white/10 rounded-xl overflow-hidden bg-muted/10 dark:bg-black/40 relative flex flex-col justify-center items-center">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-foreground dark:text-white">
                    Loading Resume Preview...
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Fetching authenticated document stream
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 max-w-sm">
                <AlertCircle className="w-9 h-9 text-rose-500/80" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-foreground dark:text-white">
                    Document Preview Unavailable
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {error}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-lg gap-1 border-border dark:border-white/10"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => onDownloadResume(resume.fileName)}
                    size="sm"
                    className="h-7 text-xs rounded-lg gap-1 bg-primary text-white"
                  >
                    <Download className="w-3 h-3" />
                    Download File
                  </Button>
                </div>
              </div>
            )}

            {/* Embedded Authenticated PDF Viewer */}
            {!loading && !error && pdfBlobUrl && (
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full min-h-[480px] border-0 bg-white dark:bg-[#1a1b26]"
                title="Candidate Resume Preview"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border dark:border-white/10 rounded-xl bg-card dark:bg-white/[0.02] space-y-2">
          <FileText className="w-9 h-9 text-muted-foreground/60 mx-auto" />
          <p className="font-bold text-xs text-foreground dark:text-white">
            No Resume Document Attached
          </p>
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            This applicant was registered without a PDF attachment.
          </p>
        </div>
      )}
    </div>
  );
}
