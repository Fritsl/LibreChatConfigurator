import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, X, CheckCircle, AlertCircle, MinusCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { Configuration } from "@shared/schema";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { getCategoryColor } from "@/lib/category-colors";

type ChangeType = 'added' | 'modified' | 'unchanged' | 'removed';

interface FieldChange {
  fieldKey: string;
  fieldName: string;
  category: string;
  changeType: ChangeType;
  currentValue: any;
  newValue: any;
  yamlPath?: string;
  envKey?: string;
}

interface ConfigurationComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'yaml' | 'env';
  fileName: string;
  currentConfig: Configuration;
  proposedChanges: Partial<Configuration>;
  onApply: () => void;
}

export function ConfigurationComparison({
  open,
  onOpenChange,
  type,
  fileName,
  currentConfig,
  proposedChanges,
  onApply
}: ConfigurationComparisonProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'changes-only'>('changes-only');
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // Compute field changes
  const fieldChanges = useMemo(() => {
    const changes: FieldChange[] = [];

    // Helper to get nested value from configuration
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // Helper to compare values
    const areValuesEqual = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (a === null || a === undefined) return b === null || b === undefined;
      if (b === null || b === undefined) return false;
      if (typeof a !== typeof b) return false;
      if (typeof a === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
      }
      return false;
    };

    // Iterate through all fields in the registry
    Object.entries(FIELD_REGISTRY).forEach(([key, field]) => {
      // Use yamlPath for configuration structure, fall back to field.id for flat fields
      const path = field.yamlPath || field.id;
      const currentValue = getNestedValue(currentConfig, path);
      const newValue = getNestedValue(proposedChanges, path);

      let changeType: ChangeType;
      if (newValue === undefined) {
        // Field not in proposed changes
        changeType = 'unchanged';
      } else if (currentValue === undefined && newValue !== undefined) {
        changeType = 'added';
      } else if (areValuesEqual(currentValue, newValue)) {
        changeType = 'unchanged';
      } else {
        changeType = 'modified';
      }

      changes.push({
        fieldKey: key,
        fieldName: field.id,
        category: field.category,
        changeType,
        currentValue,
        newValue: newValue !== undefined ? newValue : currentValue,
        yamlPath: field.yamlPath,
        envKey: field.envKey
      });
    });

    return changes;
  }, [currentConfig, proposedChanges]);

  // Filter changes
  const filteredChanges = useMemo(() => {
    let filtered = fieldChanges;

    // Filter by change type
    if (filterType === 'changes-only') {
      filtered = filtered.filter(change => 
        change.changeType === 'added' || change.changeType === 'modified'
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(change =>
        change.fieldName.toLowerCase().includes(query) ||
        change.category.toLowerCase().includes(query) ||
        change.fieldKey.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [fieldChanges, filterType, searchQuery]);

  // Compute statistics
  const stats = useMemo(() => {
    const added = fieldChanges.filter(c => c.changeType === 'added').length;
    const modified = fieldChanges.filter(c => c.changeType === 'modified').length;
    const unchanged = fieldChanges.filter(c => c.changeType === 'unchanged').length;
    
    return { added, modified, unchanged, total: fieldChanges.length };
  }, [fieldChanges]);

  const toggleFieldExpanded = (fieldKey: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldKey)) {
      newExpanded.delete(fieldKey);
    } else {
      newExpanded.add(fieldKey);
    }
    setExpandedFields(newExpanded);
  };

  const getChangeIcon = (changeType: ChangeType) => {
    switch (changeType) {
      case 'added':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'modified':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'unchanged':
        return <MinusCircle className="h-4 w-4 text-gray-400" />;
      case 'removed':
        return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getChangeBadge = (changeType: ChangeType) => {
    const variants: Record<ChangeType, { label: string; className: string }> = {
      added: { label: 'New', className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' },
      modified: { label: 'Differs', className: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100' },
      unchanged: { label: 'Identical', className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
      removed: { label: 'Deleted', className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100' }
    };

    const variant = variants[changeType];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(not set)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Configuration Changes</DialogTitle>
          <DialogDescription>
            Preview changes from <span className="font-mono text-xs">{fileName}</span> before applying
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.added}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.modified}</div>
            <div className="text-xs text-muted-foreground">Differs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.unchanged}</div>
            <div className="text-xs text-muted-foreground">Identical</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              data-testid="input-search-comparison"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={filterType === 'changes-only' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('changes-only')}
            data-testid="filter-changes-only"
          >
            Differences Only
          </Button>
        </div>

        {/* Comparison List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-1">
            {filteredChanges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {filterType === 'changes-only' ? 
                  'No differences detected' : 
                  'No fields match your search'
                }
              </div>
            ) : (
              filteredChanges.map((change) => {
                const isExpanded = expandedFields.has(change.fieldKey);
                const categoryColor = getCategoryColor(change.category);

                return (
                  <div
                    key={change.fieldKey}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleFieldExpanded(change.fieldKey)}
                    >
                      <div className="pt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getChangeIcon(change.changeType)}
                          <span className="font-medium">{change.fieldName}</span>
                          {getChangeBadge(change.changeType)}
                          <Badge
                            className={categoryColor}
                            variant="outline"
                          >
                            {change.category}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {change.yamlPath && <span className="font-mono">YAML: {change.yamlPath}</span>}
                          {change.yamlPath && change.envKey && <span className="mx-2">•</span>}
                          {change.envKey && <span className="font-mono">ENV: {change.envKey}</span>}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">Current Value</div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {formatValue(change.currentValue)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">New Value</div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {formatValue(change.newValue)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-comparison"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            disabled={stats.added === 0 && stats.modified === 0}
            data-testid="button-apply-changes"
          >
            Import {stats.added + stats.modified > 0 && `${stats.added + stats.modified} Differences`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
