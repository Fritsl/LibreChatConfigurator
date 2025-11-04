import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardDrive, Cloud, Database, Image } from "lucide-react";

interface StrategyDropdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  strategyType: "file-storage" | "image-output";
  "data-testid"?: string;
}

interface StrategyOption {
  value: string;
  label: string;
  icon: any;
  description: string;
}

const FILE_STORAGE_STRATEGIES: StrategyOption[] = [
  {
    value: "local",
    label: "Local Storage",
    icon: HardDrive,
    description: "Store files on server disk"
  },
  {
    value: "s3",
    label: "Amazon S3",
    icon: Cloud,
    description: "AWS S3 cloud storage"
  },
  {
    value: "firebase",
    label: "Firebase Storage",
    icon: Database,
    description: "Google Firebase cloud storage"
  },
  {
    value: "azure_blob",
    label: "Azure Blob Storage",
    icon: Cloud,
    description: "Microsoft Azure cloud storage"
  }
];

const IMAGE_OUTPUT_FORMATS: StrategyOption[] = [
  {
    value: "png",
    label: "PNG",
    icon: Image,
    description: "Lossless, larger file size"
  },
  {
    value: "jpeg",
    label: "JPEG",
    icon: Image,
    description: "Lossy compression, smaller files"
  },
  {
    value: "webp",
    label: "WebP",
    icon: Image,
    description: "Modern format, best compression"
  }
];

export function StrategyDropdownEditor({ 
  value, 
  onChange, 
  strategyType, 
  "data-testid": testId 
}: StrategyDropdownEditorProps) {
  const options = strategyType === "file-storage" ? FILE_STORAGE_STRATEGIES : IMAGE_OUTPUT_FORMATS;
  const currentValue = value || "";

  return (
    <div className="space-y-3" data-testid={testId}>
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger data-testid={`${testId}-trigger`}>
          <SelectValue placeholder={`Select ${strategyType === "file-storage" ? "storage strategy" : "image format"}...`}>
            {currentValue && (() => {
              const selected = options.find(opt => opt.value === currentValue);
              if (!selected) return currentValue;
              const Icon = selected.icon;
              return (
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{selected.label}</span>
                </div>
              );
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                data-testid={`${testId}-option-${option.value}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {currentValue && (() => {
        const selected = options.find(opt => opt.value === currentValue);
        if (!selected) return null;
        return (
          <p className="text-xs text-muted-foreground">
            <strong>Selected:</strong> {selected.label} — {selected.description}
          </p>
        );
      })()}
    </div>
  );
}
