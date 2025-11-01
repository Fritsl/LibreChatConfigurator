import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { useLibreChatDefault, setFieldOverride, resetToDefault, clearAllOverrides } from "@/../../shared/config/field-overrides";
import type { Configuration } from "@shared/schema";
import { Search, RotateCcw, CheckCircle, Circle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SettingInput } from "@/components/setting-input";

type SortField = "name" | "state" | "category";
type SortDirection = "asc" | "desc";

interface FieldStatesPanelProps {
  configuration: Configuration;
  onConfigurationChange: (updates: Partial<Configuration>) => void;
}

export function FieldStatesPanel({
  configuration,
  onConfigurationChange,
}: FieldStatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

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

  // Calculate field states
  const fieldStates = useMemo(() => {
    return FIELD_REGISTRY.map(field => {
      const currentValue = getCurrentValue(field.id);
      const isUsingDefault = useLibreChatDefault(configuration, field.id);
      const valueMatchesDefault = JSON.stringify(currentValue) === JSON.stringify(field.defaultValue);

      let state: "not-set" | "explicit-default" | "explicit-modified";
      if (isUsingDefault) {
        state = "not-set";
      } else if (valueMatchesDefault) {
        state = "explicit-default";
      } else {
        state = "explicit-modified";
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
    // First, filter by field name only
    let results = fieldStates;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = fieldStates.filter(({ field }) => 
        field.id.toLowerCase().includes(query)
      );
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
  }, [fieldStates, searchQuery, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const notSet = fieldStates.filter(f => f.state === "not-set").length;
    const explicit = fieldStates.filter(f => f.state === "explicit-default" || f.state === "explicit-modified").length;
    const modified = fieldStates.filter(f => f.state === "explicit-modified").length;

    return { notSet, explicit, modified, total: fieldStates.length };
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
    const clearedConfig = clearAllOverrides(configuration);
    onConfigurationChange(clearedConfig);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Field States Manager</CardTitle>
          <CardDescription>
            Control which fields use LibreChat defaults vs explicit values. Fields marked "Not Set" will be commented out in exports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Not Set</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600" data-testid="stat-not-set">{stats.notSet}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Explicit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-explicit">{stats.explicit}</div>
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-field-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleResetAll}
              data-testid="button-reset-all-states"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All to "Not Set"
            </Button>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-12 gap-4 h-[700px]">
            {/* LEFT: Compact Field List (Master) */}
            <div className="col-span-4 border rounded-lg overflow-hidden flex flex-col bg-muted/20">
              <div className="p-3 border-b bg-background sticky top-0">
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
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredAndSortedFields.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 px-4 text-sm">
                    No fields found matching "{searchQuery}"
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
                            p-3 cursor-pointer transition-all border-l-4
                            ${isSelected 
                              ? 'bg-primary/10 border-l-primary dark:bg-primary/20' 
                              : 'border-l-transparent hover:bg-muted/50 hover:border-l-muted-foreground/20'
                            }
                          `}
                          data-testid={`list-item-${field.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-mono text-xs font-medium flex-1 break-all">{field.id}</div>
                            {state === "not-set" && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 flex-shrink-0">
                                <Circle className="h-2.5 w-2.5" />
                                Not Set
                              </Badge>
                            )}
                            {state === "explicit-default" && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5 border-blue-300 text-blue-700 flex-shrink-0">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Explicit
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
                  <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="font-mono text-xl font-bold">{selectedFieldData.field.id}</h2>
                          {selectedFieldData.state === "not-set" && (
                            <Badge variant="secondary" className="gap-1">
                              <Circle className="h-3 w-3" />
                              Not Set
                            </Badge>
                          )}
                          {selectedFieldData.state === "explicit-default" && (
                            <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700">
                              <CheckCircle className="h-3 w-3" />
                              Explicit Default
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
                        <p className="text-sm text-muted-foreground">{selectedFieldData.field.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
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
                  <div className="flex-1 overflow-y-auto p-6 bg-background">
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
    </div>
  );
}
