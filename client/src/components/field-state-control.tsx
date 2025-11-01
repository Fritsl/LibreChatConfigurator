import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { RotateCcw, Circle, CircleDot, CircleCheck, ChevronDown } from "lucide-react";

interface FieldStateControlProps {
  fieldId: string;
  fieldLabel: string;
  currentValue: any;
  defaultValue: any;
  isUsingDefault: boolean;
  onSetUseDefault: (useDefault: boolean) => void;
  onResetToDefault: () => void;
  "data-testid"?: string;
}

export function FieldStateControl({
  fieldId,
  fieldLabel,
  currentValue,
  defaultValue,
  isUsingDefault,
  onSetUseDefault,
  onResetToDefault,
  "data-testid": testId,
}: FieldStateControlProps) {
  // Determine field state
  const valueMatchesDefault = JSON.stringify(currentValue) === JSON.stringify(defaultValue);
  
  let state: "not-set" | "explicit-default" | "explicit-custom";
  let stateLabel: string;
  let stateColor: string;
  let StateIcon: typeof Circle;

  if (isUsingDefault) {
    state = "not-set";
    stateLabel = "Not Set";
    stateColor = "text-muted-foreground";
    StateIcon = Circle;
  } else if (valueMatchesDefault) {
    state = "explicit-default";
    stateLabel = "Set to Default";
    stateColor = "text-blue-600 dark:text-blue-400";
    StateIcon = CircleDot;
  } else {
    state = "explicit-custom";
    stateLabel = "Custom Value";
    stateColor = "text-orange-600 dark:text-orange-400";
    StateIcon = CircleCheck;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-2 text-xs"
            data-testid={`${testId}-state-menu`}
          >
            <StateIcon className={`h-3 w-3 ${stateColor}`} />
            <span className={stateColor}>{stateLabel}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Field State
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => onSetUseDefault(true)}
            className="flex items-start gap-2 cursor-pointer"
            data-testid={`${testId}-state-not-set`}
          >
            <Circle className={`h-4 w-4 mt-0.5 ${state === "not-set" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <div className="font-medium text-sm">Not Set</div>
              <div className="text-xs text-muted-foreground">
                Use LibreChat's default (commented in export)
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onSetUseDefault(false)}
            className="flex items-start gap-2 cursor-pointer"
            data-testid={`${testId}-state-explicit`}
          >
            <CircleCheck className={`h-4 w-4 mt-0.5 ${state === "explicit-custom" || state === "explicit-default" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <div className="font-medium text-sm">Set Explicitly</div>
              <div className="text-xs text-muted-foreground">
                Export this value (uncommented in export)
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onResetToDefault}
            className="flex items-start gap-2 cursor-pointer"
            data-testid={`${testId}-reset-to-default`}
          >
            <RotateCcw className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">Reset to Default</div>
              <div className="text-xs text-muted-foreground">
                Set value to default and mark as explicit
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!isUsingDefault && (
        <Badge 
          variant={state === "explicit-custom" ? "default" : "secondary"}
          className="h-5 text-xs"
        >
          {state === "explicit-custom" ? "Modified" : "Default"}
        </Badge>
      )}
    </div>
  );
}
