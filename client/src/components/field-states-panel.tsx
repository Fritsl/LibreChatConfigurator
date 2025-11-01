import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_REGISTRY } from "@/../../shared/config/field-registry";
import { useLibreChatDefault, setFieldOverride, resetToDefault, clearAllOverrides } from "@/../../shared/config/field-overrides";
import type { Configuration } from "@shared/schema";
import { Search, RotateCcw, CheckCircle, Circle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
  const [editingField, setEditingField] = useState<string | null>(null);

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
    setEditingField(null);
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

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort("name")}
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      data-testid="sort-name"
                    >
                      <span className="flex items-center">
                        Field Name
                        <SortIcon field="name" />
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort("category")}
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      data-testid="sort-category"
                    >
                      <span className="flex items-center">
                        Category
                        <SortIcon field="category" />
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead className="w-[200px]">Current Value</TableHead>
                  <TableHead className="w-[200px]">Default Value</TableHead>
                  <TableHead className="w-[150px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort("state")}
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      data-testid="sort-state"
                    >
                      <span className="flex items-center">
                        State
                        <SortIcon field="state" />
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No fields found matching "{searchQuery}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedFields.map(({ field, currentValue, isUsingDefault, state }) => (
                    <TableRow key={field.id} data-testid={`row-field-${field.id}`}>
                      <TableCell className="font-mono text-sm">{field.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{field.category}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {!isUsingDefault ? (
                          // Editable value for explicit fields
                          field.type === "boolean" ? (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={currentValue === true}
                                onCheckedChange={(checked) => handleValueChange(field.id, checked)}
                                data-testid={`checkbox-${field.id}`}
                              />
                              <span className="text-xs">{currentValue ? "true" : "false"}</span>
                            </div>
                          ) : field.type === "number" ? (
                            <Input
                              type="number"
                              value={currentValue || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? undefined : Number(e.target.value);
                                handleValueChange(field.id, val);
                              }}
                              className="h-7 text-xs"
                              data-testid={`input-${field.id}`}
                            />
                          ) : field.type === "object" || field.type === "array" ? (
                            <span className="text-muted-foreground italic">{formatValue(currentValue)}</span>
                          ) : (
                            <Input
                              type="text"
                              value={currentValue || ""}
                              onChange={(e) => handleValueChange(field.id, e.target.value)}
                              className="h-7 text-xs"
                              data-testid={`input-${field.id}`}
                            />
                          )
                        ) : (
                          // Read-only display for "Not Set" fields
                          <span className="text-muted-foreground italic">{formatValue(currentValue)}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatValue(field.defaultValue)}</TableCell>
                      <TableCell>
                        {state === "not-set" && (
                          <Badge variant="secondary" className="gap-1">
                            <Circle className="h-3 w-3" />
                            Not Set
                          </Badge>
                        )}
                        {state === "explicit-default" && (
                          <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700">
                            <CheckCircle className="h-3 w-3" />
                            Explicit
                          </Badge>
                        )}
                        {state === "explicit-modified" && (
                          <Badge variant="default" className="gap-1 bg-orange-500">
                            <AlertCircle className="h-3 w-3" />
                            Modified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleState(field.id, isUsingDefault)}
                            data-testid={`button-toggle-${field.id}`}
                          >
                            {isUsingDefault ? "Set Explicit" : "Use Default"}
                          </Button>
                          {!isUsingDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetToDefault(field.id)}
                              data-testid={`button-reset-${field.id}`}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
