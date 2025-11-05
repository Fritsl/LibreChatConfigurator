import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, Zap, Info, CheckCircle2, XCircle } from "lucide-react";
import { type Configuration } from "@shared/schema";

interface OfficeDocumentsQuickSetupProps {
  configuration: Configuration;
  onApplySetup: () => void;
}

export function OfficeDocumentsQuickSetup({ configuration, onApplySetup }: OfficeDocumentsQuickSetupProps) {
  // Check if Office documents are supported in all THREE required locations
  // Location A: endpoints.agents.fileConfig.supportedMimeTypes (RAG vector search)
  const ragFileTypes = configuration.endpoints?.agents?.fileConfig?.supportedMimeTypes || [];
  const hasRagOfficeSupport = ragFileTypes.some(type => 
    type.includes('word') || 
    type.includes('excel') || 
    type.includes('powerpoint') ||
    type.includes('officedocument')
  );
  
  // Location B: fileConfig.endpoints.agents.supportedMimeTypes (file picker UI)
  const pickerFileTypes = configuration.fileConfig?.endpoints?.agents?.supportedMimeTypes || [];
  const hasPickerOfficeSupport = pickerFileTypes.some(type => 
    type.includes('word') || 
    type.includes('excel') || 
    type.includes('powerpoint') ||
    type.includes('officedocument')
  );
  
  // Location C: fileConfig.text.supportedMimeTypes (text extraction)
  const textFileTypes = configuration.fileConfig?.text?.supportedMimeTypes || [];
  const hasTextOfficeSupport = textFileTypes.some(type => 
    type.includes('word') || 
    type.includes('excel') || 
    type.includes('powerpoint') ||
    type.includes('officedocument') ||
    type.includes('msword') ||
    type.includes('ms-excel') ||
    type.includes('ms-powerpoint')
  );
  
  // All THREE locations must have office support for it to work properly
  const hasOfficeSupport = hasRagOfficeSupport && hasPickerOfficeSupport && hasTextOfficeSupport;

  // Check if RAG is configured
  const isRAGConfigured = !!(
    configuration.ragApiURL ||
    configuration.ragPort ||
    configuration.ragHost ||
    configuration.collectionName
  );

  const isFullyConfigured = hasOfficeSupport && isRAGConfigured;

  return (
    <Card className={`border-2 ${isFullyConfigured ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20' : 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFullyConfigured ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
              <FileText className={`h-6 w-6 ${isFullyConfigured ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div>
              <CardTitle className="text-xl">Office Documents Support</CardTitle>
              <CardDescription>
                Enable Word, Excel, PowerPoint & PDF file processing
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isFullyConfigured ? "default" : "secondary"}
            className={`${isFullyConfigured ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' : 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700'} text-white text-sm px-3 py-1`}
            data-testid="badge-office-status"
          >
            {isFullyConfigured ? (
              <><CheckCircle2 className="h-4 w-4 mr-1" /> Ready</>
            ) : (
              <><XCircle className="h-4 w-4 mr-1" /> Not Configured</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFullyConfigured && (
          <Alert variant="info" data-testid="alert-office-setup-info">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What this enables:</strong> Users will be able to upload and chat with Office documents (Word, Excel, PowerPoint, PDFs). LibreChat will use AI to read and search through the document contents.
            </AlertDescription>
          </Alert>
        )}

        {isFullyConfigured && (
          <Alert variant="default" className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50" data-testid="alert-office-configured">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>✓ Office documents are fully configured!</strong> Your users can now upload and chat with Word, Excel, PowerPoint, and PDF files. The RAG system will process and search through document contents.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3 text-sm">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Setup will configure:</div>
          
          <div className="space-y-2">
            <div className={`flex items-start gap-3 ${hasOfficeSupport ? 'opacity-60' : ''}`}>
              <div className={`mt-0.5 p-1 rounded ${hasOfficeSupport ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {hasOfficeSupport ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-500 dark:border-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">File Types</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Enable Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF (.pdf)</div>
              </div>
            </div>

            <div className={`flex items-start gap-3 ${isRAGConfigured ? 'opacity-60' : ''}`}>
              <div className={`mt-0.5 p-1 rounded ${isRAGConfigured ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {isRAGConfigured ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-500 dark:border-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">RAG API Configuration</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">
                  Set up document processing with pgVector + RAG API (auto-included in Docker Compose)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="mt-0.5 p-1 rounded bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">API Key Setup</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Uses your existing OPENAI_API_KEY (no separate key needed)</div>
              </div>
            </div>
          </div>
        </div>

        {!isFullyConfigured ? (
          <Button 
            onClick={onApplySetup}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-base py-6"
            data-testid="button-enable-office-documents"
          >
            <Zap className="h-5 w-5 mr-2" />
            Enable Office Documents (One-Click Setup)
          </Button>
        ) : (
          <Button 
            onClick={onApplySetup}
            variant="outline"
            className="w-full text-base py-6 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50"
            data-testid="button-reconfigure-office-documents"
          >
            <Zap className="h-5 w-5 mr-2" />
            Reconfigure Office Documents
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          After setup, your LibreChat package will include all necessary infrastructure (pgVector database, RAG API service, and Docker configuration)
        </p>
      </CardContent>
    </Card>
  );
}
