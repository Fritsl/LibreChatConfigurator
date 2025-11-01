import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { useLibreChatDefault, setFieldOverride, resetToDefault, clearAllOverrides } from "@/../../shared/config/field-overrides";
import type { Configuration } from "@shared/schema";
import { Search, RotateCcw, CheckCircle, Circle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { SettingInput } from "@/components/setting-input";

type SortField = "name" | "state" | "category";
type SortDirection = "asc" | "desc";

interface FieldStatesPanelProps {
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
}

type FileTypeFilter = "all" | "env" | "yaml";
type StateFilter = "all" | "hide-not-set";

export function FieldStatesPanel({
  configuration,
  onConfigurationChange,
}: FieldStatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Get current value for a field
  const getCurrentValue = (fieldId: string): any => {
    const field = FIELD_REGISTRY.find(f => f.id === fieldId);
    if (!field) return undefined;

    if (field.yamlPath) {
      const keys = field.yamlPath.split('.');
      let current: any = configuration;
      for (const key of keys) {
        if (current === undefined || current === null) return field.defaultValue;
        current = current[key];
      }
      return current !== undefined ? current : field.defaultValue;
    }
    return (configuration as any)[fieldId] !== undefined 
      ? (configuration as any)[fieldId] 
      : field.defaultValue;
  };

  // Calculate field states based on whether value differs from default
  const fieldStates = useMemo(() => {
    return FIELD_REGISTRY.map(field => {
      const currentValue = getCurrentValue(field.id);
      const isUsingDefault = useLibreChatDefault(configuration, field.id);
      const valueMatchesDefault = JSON.stringify(currentValue) === JSON.stringify(field.defaultValue);

      // State is determined by whether the VALUE differs from default, not by override flags
      let state: "not-set" | "explicit-default" | "explicit-modified";
      if (valueMatchesDefault) {
        state = "not-set"; // Using default value (regardless of override flag)
      } else {
        state = "explicit-modified"; // Value differs from default
      }

      return {
        field,
        currentValue,
        isUsingDefault,
        state,
      };
    });
  }, [configuration]);

  // Filter and sort fields
  const filteredAndSortedFields = useMemo(() => {
    let results = fieldStates;
    
    // Filter by file type
    if (fileTypeFilter === "env") {
      results = results.filter(({ field }) => field.envKey !== undefined);
    } else if (fileTypeFilter === "yaml") {
      results = results.filter(({ field }) => field.yamlPath !== undefined);
    }
    
    // Filter by state
    if (stateFilter === "hide-not-set") {
      results = results.filter(({ state }) => state !== "not-set");
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(({ field }) => {
        const id = field.id.toLowerCase();
        const envKey = field.envKey?.toLowerCase() || '';
        const yamlPath = field.yamlPath?.toLowerCase() || '';
        return id.includes(query) || envKey.includes(query) || yamlPath.includes(query);
      });
    }

    // Then, sort
    const sorted = [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.field.id.localeCompare(b.field.id);
          break;
        case "state":
          const stateOrder = { "explicit-modified": 0, "explicit-default": 1, "not-set": 2 };
          comparison = stateOrder[a.state] - stateOrder[b.state];
          break;
        case "category":
          const catA = a.field.category || "";
          const catB = b.field.category || "";
          comparison = catA.localeCompare(catB);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [fieldStates, searchQuery, sortField, sortDirection, fileTypeFilter, stateFilter]);

  // Statistics
  const stats = useMemo(() => {
    const usingDefault = fieldStates.filter(f => f.state === "not-set").length;
    const modified = fieldStates.filter(f => f.state === "explicit-modified").length;

    return { usingDefault, modified, total: fieldStates.length };
  }, [fieldStates]);

  const handleToggleState = (fieldId: string, currentlyUsingDefault: boolean) => {
    const updatedConfig = setFieldOverride(configuration, fieldId, !currentlyUsingDefault);
    onConfigurationChange(updatedConfig);
  };

  const handleResetToDefault = (fieldId: string) => {
    const updatedConfig = resetToDefault(configuration, fieldId);
    onConfigurationChange(updatedConfig);
  };

  const handleResetAll = () => {
    // Create a fresh configuration with all fields set to their default values
    let resetConfig: any = { ...configuration };
    
    // Reset all field values to their defaults
    FIELD_REGISTRY.forEach(field => {
      if (field.yamlPath) {
        // Handle nested fields (e.g., interface.customFooter)
        const keys = field.yamlPath.split('.');
        let current: any = resetConfig;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        // Set the default value
        current[keys[keys.length - 1]] = field.defaultValue;
      } else {
        // Handle flat fields (e.g., appTitle)
        resetConfig[field.id] = field.defaultValue;
      }
    });
    
    // Clear all override flags
    resetConfig = clearAllOverrides(resetConfig);
    
    onConfigurationChange(resetConfig);
  };

  const handleValueChange = (fieldId: string, newValue: any) => {
    const field = FIELD_REGISTRY.find(f => f.id === fieldId);
    if (!field) return;

    let updatedConfig = { ...configuration };

    // Set the value
    if (field.yamlPath) {
      const keys = field.yamlPath.split('.');
      let current: any = updatedConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = newValue;
    } else {
      (updatedConfig as any)[fieldId] = newValue;
    }

    // Ensure the field is marked as explicit
    updatedConfig = setFieldOverride(updatedConfig, fieldId, false);
    onConfigurationChange(updatedConfig);
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return "—";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value).substring(0, 50) + "...";
    if (typeof value === "string" && value.length > 50) return value.substring(0, 50) + "...";
    return String(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Get selected field data
  const selectedFieldData = selectedFieldId 
    ? fieldStates.find(fs => fs.field.id === selectedFieldId)
    : null;

  // Get the display name as it appears in config files
  const getFieldDisplayName = (field: typeof FIELD_REGISTRY[0]) => {
    // Prefer envKey (for .env files)
    if (field.envKey) return field.envKey;
    // Then yamlPath (for YAML-only fields)
    if (field.yamlPath) return field.yamlPath;
    // Fall back to field ID
    return field.id;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Field States Manager</CardTitle>
          <CardDescription>
            View and manage all 480+ configuration fields. See which fields are using default values vs which have been modified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-fields">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Using Default</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600" data-testid="stat-using-default">{stats.usingDefault}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Modified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="stat-modified">{stats.modified}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-field-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-clear-search"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              data-testid="button-reset-all-states"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All to Defaults
            </Button>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-12 gap-4 h-[700px]">
            {/* LEFT: Compact Field List (Master) */}
            <div className="col-span-4 border rounded-lg overflow-hidden flex flex-col bg-muted/20">
              <div className="p-3 border-b bg-background sticky top-0 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">All Fields ({filteredAndSortedFields.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("name")}
                    className="h-7 text-xs"
                    data-testid="sort-fields-list"
                  >
                    Sort
                    <SortIcon field={sortField} />
                  </Button>
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <Button
                      variant={fileTypeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFileTypeFilter("all")}
                      className="h-7 text-[10px] px-2"
                      data-testid="filter-all"
                    >
                      All
                    </Button>
                    <Button
                      variant={fileTypeFilter === "env" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFileTypeFilter("env")}
                      className="h-7 text-[10px] px-2"
                      data-testid="filter-env"
                    >
                      .env
                    </Button>
                    <Button
                      variant={fileTypeFilter === "yaml" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFileTypeFilter("yaml")}
                      className="h-7 text-[10px] px-2"
                      data-testid="filter-yaml"
                    >
                      YAML
                    </Button>
                  </div>
                  <Button
                    variant={stateFilter === "hide-not-set" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStateFilter(stateFilter === "all" ? "hide-not-set" : "all")}
                    className="h-7 text-[10px] px-2 whitespace-nowrap"
                    data-testid="filter-hide-not-set"
                  >
                    {stateFilter === "hide-not-set" ? "Show All" : "Hide Defaults"}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredAndSortedFields.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 px-4 text-sm">
                    {searchQuery.trim() ? (
                      `No fields found matching "${searchQuery}"`
                    ) : fileTypeFilter !== "all" || stateFilter !== "all" ? (
                      <>No fields match the current filters</>
                    ) : (
                      <>No fields available</>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAndSortedFields.map(({ field, state }) => {
                      const isSelected = selectedFieldId === field.id;
                      return (
                        <div
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`
                            p-3 cursor-pointer transition-all duration-200 border-l-4
                            ${isSelected 
                              ? 'bg-primary/10 border-l-primary dark:bg-primary/20 shadow-sm' 
                              : 'border-l-transparent hover:bg-accent hover:border-l-primary/40 hover:shadow-sm hover:scale-[1.01]'
                            }
                          `}
                          data-testid={`list-item-${field.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-mono text-xs font-medium flex-1 break-all">{getFieldDisplayName(field)}</div>
                            {state === "not-set" && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 flex-shrink-0">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Default
                              </Badge>
                            )}
                            {state === "explicit-modified" && (
                              <Badge className="text-[10px] h-5 px-1.5 gap-0.5 bg-orange-500 flex-shrink-0">
                                <AlertCircle className="h-2.5 w-2.5" />
                                Modified
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{field.category}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Field Editor (Detail) */}
            <div className="col-span-8 border rounded-lg overflow-hidden flex flex-col">
              {selectedFieldData ? (
                <>
                  <div className="border-b-2 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 sticky top-0 z-10 shadow-md">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">{getFieldDisplayName(selectedFieldData.field)}</h2>
                            {(selectedFieldData.field.envKey || selectedFieldData.field.yamlPath) && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                Internal ID: {selectedFieldData.field.id}
                              </p>
                            )}
                          </div>
                          {selectedFieldData.state === "not-set" && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Default Value
                            </Badge>
                          )}
                          {selectedFieldData.state === "explicit-modified" && (
                            <Badge className="gap-1 bg-orange-500">
                              <AlertCircle className="h-3 w-3" />
                              Modified
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {selectedFieldData.field.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedFieldData.field.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                      <Button
                        variant={selectedFieldData.isUsingDefault ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleState(selectedFieldData.field.id, selectedFieldData.isUsingDefault)}
                        data-testid={`button-toggle-${selectedFieldData.field.id}`}
                      >
                        {selectedFieldData.isUsingDefault ? "Set Explicit" : "Use Default"}
                      </Button>
                      {!selectedFieldData.isUsingDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetToDefault(selectedFieldData.field.id)}
                          data-testid={`button-reset-${selectedFieldData.field.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Default
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-background">
                    <div className="max-w-2xl">
                      <SettingInput
                        label={selectedFieldData.field.id}
                        description={selectedFieldData.field.description}
                        type={selectedFieldData.field.type as any}
                        value={selectedFieldData.currentValue}
                        onChange={(newValue) => handleValueChange(selectedFieldData.field.id, newValue)}
                        options={selectedFieldData.field.enumValues ? [...selectedFieldData.field.enumValues] : undefined}
                        fieldId={selectedFieldData.field.id}
                        defaultValue={selectedFieldData.field.defaultValue}
                        isUsingDefault={selectedFieldData.isUsingDefault}
                        data-testid={`detail-input-${selectedFieldData.field.id}`}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a field to edit</p>
                    <p className="text-sm mt-2">Click any field in the list to view and edit its settings</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset All Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Fields to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset <strong>all {stats.total} configuration fields</strong> back to LibreChat's default values.
              <br /><br />
              <strong className="text-destructive">⚠️ This action cannot be undone.</strong>
              <br /><br />
              You currently have <strong>{stats.modified} modified fields</strong> that will be lost.
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleResetAll();
                setShowResetConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reset"
            >
              Yes, Reset All Fields
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
