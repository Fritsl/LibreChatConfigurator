import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MimeTypeDefinition {
  id: string;
  label: string;
  description: string;
  mimePattern: string;
  category: 'documents' | 'media' | 'code' | 'audio';
  requiredCapabilities?: string[];
}

// MIME type definitions matching LibreChat RC4 documentation
const MIME_TYPES: MimeTypeDefinition[] = [
  // Documents
  {
    id: 'office_modern',
    label: 'Office Documents (.docx, .xlsx, .pptx)',
    description: 'Modern Microsoft Office formats - Word, Excel, PowerPoint',
    mimePattern: '^application/vnd\\.openxmlformats-officedocument\\.(wordprocessingml\\.document|presentationml\\.presentation|spreadsheetml\\.sheet)$',
    category: 'documents',
    requiredCapabilities: ['context', 'ocr']
  },
  {
    id: 'office_legacy',
    label: 'Legacy Office (.doc, .xls, .ppt)',
    description: 'Legacy Microsoft Office formats (limited support)',
    mimePattern: '^application/vnd\\.ms-(word|powerpoint|excel)$',
    category: 'documents',
    requiredCapabilities: ['context', 'ocr']
  },
  {
    id: 'pdf',
    label: 'PDF Documents',
    description: 'Portable Document Format files',
    mimePattern: '^application/pdf$',
    category: 'documents',
    requiredCapabilities: ['context']
  },
  {
    id: 'epub',
    label: 'EPUB Books',
    description: 'Electronic publication format',
    mimePattern: '^application/epub\\+zip$',
    category: 'documents',
    requiredCapabilities: ['context', 'ocr']
  },
  
  // Media
  {
    id: 'images',
    label: 'Images (.jpg, .png, .webp, .gif)',
    description: 'Common image formats',
    mimePattern: '^image/(jpeg|gif|png|webp|heic|heif)$',
    category: 'media',
    requiredCapabilities: ['context']
  },
  
  // Code/Text
  {
    id: 'text_basic',
    label: 'Text Files (.txt, .md, .csv, .json)',
    description: 'Plain text, Markdown, CSV, JSON',
    mimePattern: '^text/(plain|markdown|csv|json)$',
    category: 'code'
  },
  {
    id: 'text_web',
    label: 'Web Files (.html, .css, .xml)',
    description: 'HTML, CSS, XML files',
    mimePattern: '^text/(xml|html|css)$',
    category: 'code'
  },
  {
    id: 'text_code',
    label: 'Code Files (.js, .py, .java, .cpp, etc.)',
    description: 'Programming language source files',
    mimePattern: '^text/(javascript|typescript|x-python|x-java|x-csharp|x-php|x-ruby|x-go|x-rust|x-kotlin|x-swift|x-scala|x-perl|x-lua|x-shell|x-sql|x-yaml|x-toml)$',
    category: 'code'
  },
  
  // Audio
  {
    id: 'audio',
    label: 'Audio Files (.mp3, .wav, .ogg, .flac)',
    description: 'Audio files for speech-to-text',
    mimePattern: '^audio/(mp3|mpeg|mpeg3|wav|wave|x-wav|ogg|vorbis|mp4|x-m4a|flac|x-flac|webm)$',
    category: 'audio',
    requiredCapabilities: ['context']
  }
];

interface MimeTypeCheckboxEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  fieldId?: string;
  configuration?: any;
  onNavigateToCapabilities?: () => void;
}

export function MimeTypeCheckboxEditor({ 
  value = [], 
  onChange,
  disabled = false,
  fieldId,
  configuration,
  onNavigateToCapabilities
}: MimeTypeCheckboxEditorProps) {
  
  // Determine context from fieldId
  const isOcrContext = fieldId?.includes('ocr') || fieldId?.includes('Ocr');
  const isSttContext = fieldId?.includes('stt') || fieldId?.includes('Stt');
  const isTextContext = fieldId?.includes('text') || fieldId?.includes('Text');
  
  // Get agent capabilities from configuration
  const agentCapabilities = configuration?.endpointsAgentsCapabilities || 
                           configuration?.endpoints?.agents?.capabilities || 
                           [];
  
  // Check which required capabilities are missing
  const getMissingCapabilities = (mimeType: MimeTypeDefinition): string[] => {
    if (!mimeType.requiredCapabilities) return [];
    return mimeType.requiredCapabilities.filter(cap => !agentCapabilities.includes(cap));
  };
  
  // Check if this MIME type is selected
  const isSelected = (mimeType: MimeTypeDefinition): boolean => {
    return value.some(pattern => pattern === mimeType.mimePattern);
  };
  
  // Toggle MIME type selection
  const handleToggle = (mimeType: MimeTypeDefinition) => {
    if (disabled) return;
    
    const pattern = mimeType.mimePattern;
    const newValue = isSelected(mimeType)
      ? value.filter(p => p !== pattern)
      : [...value, pattern];
    
    onChange(newValue);
  };
  
  // Filter MIME types by context
  const getRelevantMimeTypes = (): MimeTypeDefinition[] => {
    if (isSttContext) {
      return MIME_TYPES.filter(m => m.category === 'audio');
    }
    if (isTextContext) {
      return MIME_TYPES.filter(m => m.category === 'code');
    }
    if (isOcrContext) {
      return MIME_TYPES.filter(m => m.category === 'documents' || m.category === 'media');
    }
    // Default: show all
    return MIME_TYPES;
  };
  
  const relevantMimeTypes = getRelevantMimeTypes();
  const documentTypes = relevantMimeTypes.filter(m => m.category === 'documents');
  const mediaTypes = relevantMimeTypes.filter(m => m.category === 'media');
  const codeTypes = relevantMimeTypes.filter(m => m.category === 'code');
  const audioTypes = relevantMimeTypes.filter(m => m.category === 'audio');
  
  // Check if any selected MIME types have missing capabilities
  const selectedWithMissingCaps = relevantMimeTypes
    .filter(m => isSelected(m))
    .filter(m => getMissingCapabilities(m).length > 0);
  
  const showCapabilityWarning = selectedWithMissingCaps.length > 0 && isOcrContext;
  
  // Check if Office documents are selected (recommend RAG)
  const hasOfficeDocuments = relevantMimeTypes
    .filter(m => m.id === 'office_modern' || m.id === 'office_legacy')
    .some(m => isSelected(m));
  
  // Show RAG recommendation whenever Office documents are selected
  const showRagRecommendation = hasOfficeDocuments;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Capability Warning */}
        {showCapabilityWarning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Missing Agent Capabilities!</strong>
              <br />
              You've enabled office documents, but the following capabilities are not enabled:
              {selectedWithMissingCaps.map(m => {
                const missing = getMissingCapabilities(m);
                return missing.length > 0 ? (
                  <div key={m.id} className="mt-2 ml-4">
                    • <strong>{m.label}</strong> requires: {missing.map(cap => `"${cap}"`).join(', ')}
                  </div>
                ) : null;
              })}
              <br />
              {onNavigateToCapabilities ? (
                <button
                  onClick={onNavigateToCapabilities}
                  className="underline hover:no-underline mt-2"
                >
                  → Go to Agent Capabilities settings
                </button>
              ) : (
                <span className="mt-2 block">
                  → Enable these capabilities in the Endpoints tab under "Agent Capabilities"
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* RAG Recommendation for Office Documents */}
        {showRagRecommendation && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>💡 RAG Recommended for Office Documents</strong>
              <br />
              For best performance with Office documents (.docx, .xlsx, .pptx), LibreChat recommends enabling RAG (Retrieval Augmented Generation).
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <strong>Simple setup:</strong> Already included in docker-compose!
                </p>
                <ul className="text-sm ml-4 list-disc space-y-1">
                  <li>RAG API service with pgVector database (default)</li>
                  <li>Just configure embeddings provider (OpenAI recommended)</li>
                  <li>Dramatically improves document search and context retrieval</li>
                  <li>Enables semantic search across uploaded Office files</li>
                </ul>
              </div>
              <span className="mt-2 block text-sm">
                → Configure RAG in the <strong>Integrations & Services → RAG API</strong> tab
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Context Help */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
          <p className="font-medium mb-1">
            {isOcrContext && "📄 OCR Processing - Documents & Images"}
            {isTextContext && "📝 Text Parsing - Code & Plain Text"}
            {isSttContext && "🎤 Speech-to-Text - Audio Files"}
            {!isOcrContext && !isTextContext && !isSttContext && "📁 Supported File Types"}
          </p>
          <p>
            {isOcrContext && "These file types will be processed with OCR for text extraction (images, PDFs, Office documents). Requires 'context' capability."}
            {isTextContext && "These file types will be parsed as plain text (code files, JSON, CSV, etc.). Works without additional capabilities."}
            {isSttContext && "These audio file types will be processed with speech-to-text. Requires STT service configuration."}
            {!isOcrContext && !isTextContext && !isSttContext && "Select which file types should be allowed for upload and processing."}
          </p>
        </div>

        {/* Document Types */}
        {documentTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground flex items-center gap-2">
              📄 Documents
              {isOcrContext && (
                <span className="text-xs font-normal text-muted-foreground">
                  (Requires: context + ocr capabilities)
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {documentTypes.map(mimeType => {
                const missing = getMissingCapabilities(mimeType);
                const hasMissing = missing.length > 0;
                
                return (
                  <div
                    key={mimeType.id}
                    className={`flex items-start space-x-3 rounded-lg border p-3 transition-colors ${
                      hasMissing && isSelected(mimeType)
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <Checkbox
                      id={`mime-${mimeType.id}`}
                      checked={isSelected(mimeType)}
                      onCheckedChange={() => handleToggle(mimeType)}
                      disabled={disabled}
                      data-testid={`checkbox-mime-${mimeType.id}`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`mime-${mimeType.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {mimeType.label}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="mb-2">{mimeType.description}</p>
                            {mimeType.requiredCapabilities && mimeType.requiredCapabilities.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Requires: {mimeType.requiredCapabilities.join(', ')}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                        {hasMissing && isSelected(mimeType) && (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mimeType.description}
                        {hasMissing && isSelected(mimeType) && (
                          <span className="text-destructive ml-2">
                            ⚠ Missing: {missing.join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Media Types */}
        {mediaTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground">🖼️ Images & Media</h4>
            <div className="grid grid-cols-1 gap-3">
              {mediaTypes.map(mimeType => (
                <div
                  key={mimeType.id}
                  className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`mime-${mimeType.id}`}
                    checked={isSelected(mimeType)}
                    onCheckedChange={() => handleToggle(mimeType)}
                    disabled={disabled}
                    data-testid={`checkbox-mime-${mimeType.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`mime-${mimeType.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {mimeType.label}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {mimeType.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code/Text Types */}
        {codeTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground">💻 Code & Text Files</h4>
            <div className="grid grid-cols-1 gap-3">
              {codeTypes.map(mimeType => (
                <div
                  key={mimeType.id}
                  className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`mime-${mimeType.id}`}
                    checked={isSelected(mimeType)}
                    onCheckedChange={() => handleToggle(mimeType)}
                    disabled={disabled}
                    data-testid={`checkbox-mime-${mimeType.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`mime-${mimeType.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {mimeType.label}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {mimeType.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Types */}
        {audioTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground">🎤 Audio Files</h4>
            <div className="grid grid-cols-1 gap-3">
              {audioTypes.map(mimeType => (
                <div
                  key={mimeType.id}
                  className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`mime-${mimeType.id}`}
                    checked={isSelected(mimeType)}
                    onCheckedChange={() => handleToggle(mimeType)}
                    disabled={disabled}
                    data-testid={`checkbox-mime-${mimeType.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`mime-${mimeType.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {mimeType.label}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {mimeType.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Setup Guide */}
        <div className="text-xs text-muted-foreground bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="font-medium mb-2">💡 Quick Setup for Office Documents:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>✅ Enable <strong>Office Documents (.docx, .xlsx, .pptx)</strong> above</li>
            <li>✅ Go to Endpoints tab → Enable <strong>"context"</strong> and <strong>"ocr"</strong> capabilities</li>
            <li>✅ Export your configuration and deploy</li>
          </ol>
          <p className="mt-2">
            Users will then see "Upload as Text" and "File Context" options for office documents in agent chats!
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
