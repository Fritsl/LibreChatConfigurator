import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { FileText, Image, FileSpreadsheet, Presentation, Archive, Code, Film, Music, Plus, Info } from "lucide-react";

interface FileTypeSelectorEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  "data-testid"?: string;
}

interface FileTypeOption {
  id: string;
  label: string;
  mimeTypes: string[];
  description?: string;
}

interface FileTypeCategory {
  label: string;
  icon: any;
  types: FileTypeOption[];
}

const FILE_TYPE_CATEGORIES: FileTypeCategory[] = [
  {
    label: "Documents",
    icon: FileText,
    types: [
      {
        id: "pdf",
        label: "PDF Documents",
        mimeTypes: ["application/pdf"],
        description: ".pdf"
      },
      {
        id: "word",
        label: "Word Documents",
        mimeTypes: [
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "application/vnd.ms-word.document.macroEnabled.12"
        ],
        description: ".docx, .doc"
      },
      {
        id: "text",
        label: "Plain Text",
        mimeTypes: ["text/plain"],
        description: ".txt"
      },
      {
        id: "rtf",
        label: "Rich Text Format",
        mimeTypes: ["application/rtf", "text/rtf"],
        description: ".rtf"
      },
      {
        id: "markdown",
        label: "Markdown",
        mimeTypes: ["text/markdown"],
        description: ".md"
      }
    ]
  },
  {
    label: "Spreadsheets",
    icon: FileSpreadsheet,
    types: [
      {
        id: "excel",
        label: "Excel Spreadsheets",
        mimeTypes: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/vnd.ms-excel.sheet.macroEnabled.12",
          "application/vnd.ms-excel.sheet.binary.macroEnabled.12"
        ],
        description: ".xlsx, .xls, .xlsm, .xlsb"
      },
      {
        id: "csv",
        label: "CSV Files",
        mimeTypes: ["text/csv"],
        description: ".csv"
      }
    ]
  },
  {
    label: "Presentations",
    icon: Presentation,
    types: [
      {
        id: "powerpoint",
        label: "PowerPoint Presentations",
        mimeTypes: [
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-powerpoint",
          "application/vnd.ms-powerpoint.presentation.macroEnabled.12"
        ],
        description: ".pptx, .ppt, .pptm"
      }
    ]
  },
  {
    label: "Images",
    icon: Image,
    types: [
      {
        id: "png",
        label: "PNG Images",
        mimeTypes: ["image/png"],
        description: ".png"
      },
      {
        id: "jpeg",
        label: "JPEG Images",
        mimeTypes: ["image/jpeg"],
        description: ".jpg, .jpeg"
      },
      {
        id: "gif",
        label: "GIF Images",
        mimeTypes: ["image/gif"],
        description: ".gif"
      },
      {
        id: "webp",
        label: "WebP Images",
        mimeTypes: ["image/webp"],
        description: ".webp"
      },
      {
        id: "svg",
        label: "SVG Images",
        mimeTypes: ["image/svg+xml"],
        description: ".svg"
      },
      {
        id: "bmp",
        label: "BMP Images",
        mimeTypes: ["image/bmp"],
        description: ".bmp"
      }
    ]
  },
  {
    label: "Code & Data",
    icon: Code,
    types: [
      {
        id: "json",
        label: "JSON Files",
        mimeTypes: ["application/json"],
        description: ".json"
      },
      {
        id: "xml",
        label: "XML Files",
        mimeTypes: ["text/xml", "application/xml"],
        description: ".xml"
      },
      {
        id: "html",
        label: "HTML Files",
        mimeTypes: ["text/html"],
        description: ".html"
      },
      {
        id: "yaml",
        label: "YAML Files",
        mimeTypes: ["text/yaml", "application/x-yaml"],
        description: ".yaml, .yml"
      }
    ]
  },
  {
    label: "Archives",
    icon: Archive,
    types: [
      {
        id: "zip",
        label: "ZIP Archives",
        mimeTypes: ["application/zip"],
        description: ".zip"
      },
      {
        id: "tar",
        label: "TAR Archives",
        mimeTypes: ["application/x-tar"],
        description: ".tar"
      },
      {
        id: "gzip",
        label: "GZIP Archives",
        mimeTypes: ["application/gzip"],
        description: ".gz"
      }
    ]
  },
  {
    label: "Media",
    icon: Film,
    types: [
      {
        id: "mp4",
        label: "MP4 Video",
        mimeTypes: ["video/mp4"],
        description: ".mp4"
      },
      {
        id: "mp3",
        label: "MP3 Audio",
        mimeTypes: ["audio/mpeg"],
        description: ".mp3"
      },
      {
        id: "wav",
        label: "WAV Audio",
        mimeTypes: ["audio/wav"],
        description: ".wav"
      },
      {
        id: "webm",
        label: "WebM Video",
        mimeTypes: ["video/webm"],
        description: ".webm"
      }
    ]
  },
  {
    label: "Other Office Formats",
    icon: FileText,
    types: [
      {
        id: "outlook",
        label: "Outlook Messages",
        mimeTypes: ["application/vnd.ms-outlook"],
        description: ".msg"
      },
      {
        id: "visio",
        label: "Visio Diagrams",
        mimeTypes: ["application/vnd.visio"],
        description: ".vsd"
      },
      {
        id: "project",
        label: "MS Project Files",
        mimeTypes: ["application/vnd.ms-project"],
        description: ".mpp"
      }
    ]
  }
];

export function FileTypeSelectorEditor({ value, onChange, "data-testid": testId }: FileTypeSelectorEditorProps) {
  const [customMimeType, setCustomMimeType] = useState("");

  const currentMimeTypes = value || [];

  const isTypeSelected = (fileType: FileTypeOption): boolean => {
    return fileType.mimeTypes.every(mime => currentMimeTypes.includes(mime));
  };

  const handleTypeToggle = (fileType: FileTypeOption, checked: boolean) => {
    let newMimeTypes: string[];
    
    if (checked) {
      newMimeTypes = [...new Set([...currentMimeTypes, ...fileType.mimeTypes])];
    } else {
      newMimeTypes = currentMimeTypes.filter(mime => !fileType.mimeTypes.includes(mime));
    }
    
    onChange(newMimeTypes);
  };

  const handleAddCustomMimeType = () => {
    if (customMimeType.trim() && !currentMimeTypes.includes(customMimeType.trim())) {
      onChange([...currentMimeTypes, customMimeType.trim()]);
      setCustomMimeType("");
    }
  };

  const handleRemoveCustomMimeType = (mimeType: string) => {
    const allKnownMimeTypes = FILE_TYPE_CATEGORIES.flatMap(cat => 
      cat.types.flatMap(type => type.mimeTypes)
    );
    
    if (!allKnownMimeTypes.includes(mimeType)) {
      onChange(currentMimeTypes.filter(m => m !== mimeType));
    }
  };

  const customMimeTypes = currentMimeTypes.filter(mime => {
    const allKnownMimeTypes = FILE_TYPE_CATEGORIES.flatMap(cat => 
      cat.types.flatMap(type => type.mimeTypes)
    );
    return !allKnownMimeTypes.includes(mime);
  });

  // Check if Office documents are selected (Word, Excel, PowerPoint)
  const officeDocMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-word.document.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12"
  ];
  
  const hasOfficeDocuments = officeDocMimeTypes.some(mime => currentMimeTypes.includes(mime));

  const handleAddM365Types = () => {
    const m365MimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.ms-word.document.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
      "application/vnd.ms-outlook",
      "application/vnd.visio",
      "application/vnd.ms-project"
    ];
    
    const newMimeTypes = [...new Set([...currentMimeTypes, ...m365MimeTypes])];
    onChange(newMimeTypes);
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* RAG Recommendation for Office Documents */}
      {hasOfficeDocuments && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>📄 Office Documents Work Best with RAG</strong>
            <br />
            You've enabled Office documents (.docx, .xlsx, .pptx). For best performance, LibreChat recommends enabling RAG (Retrieval Augmented Generation).
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select file types that users can upload
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddM365Types}
          data-testid="button-add-m365-types"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add All Microsoft Office Types
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FILE_TYPE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {category.label}
              </div>
              <div className="space-y-2 pl-6">
                {category.types.map((type) => (
                  <div key={type.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`${testId}-${type.id}`}
                      checked={isTypeSelected(type)}
                      onCheckedChange={(checked) => handleTypeToggle(type, checked as boolean)}
                      data-testid={`checkbox-filetype-${type.id}`}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor={`${testId}-${type.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type.label}
                      </Label>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {customMimeTypes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom MIME Types</Label>
          <div className="flex flex-wrap gap-2">
            {customMimeTypes.map((mime) => (
              <div
                key={mime}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                data-testid={`custom-mime-${mime}`}
              >
                {mime}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomMimeType(mime)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-custom-mime-${mime}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Add Custom MIME Type</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., application/custom-format"
            value={customMimeType}
            onChange={(e) => setCustomMimeType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomMimeType();
              }
            }}
            data-testid="input-custom-mime-type"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomMimeType}
            disabled={!customMimeType.trim()}
            data-testid="button-add-custom-mime"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For advanced users: Add specific MIME types not listed above
        </p>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <strong>Currently selected:</strong> {currentMimeTypes.length} MIME type{currentMimeTypes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
