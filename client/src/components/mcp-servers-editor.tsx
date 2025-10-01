import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Server, Settings, Globe, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface MCPServer {
  name?: string;
  type?: "stdio" | "websocket" | "sse" | "streamable-http";
  command?: string;
  args?: string[];
  url?: string;
  timeout?: number;
  initTimeout?: number;
  headers?: Record<string, string>;
  serverInstructions?: string | boolean;
  iconPath?: string;
  chatMenu?: boolean;
  customUserVars?: Record<string, any>;
}

interface MCPServersEditorProps {
  value: MCPServer[] | Record<string, MCPServer> | null;
  onChange: (value: MCPServer[] | Record<string, MCPServer>) => void;
  "data-testid"?: string;
}

export function MCPServersEditor({ value, onChange, "data-testid": testId }: MCPServersEditorProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);

  // Convert value to array format for editing
  useEffect(() => {
    if (!value) {
      setServers([]);
      return;
    }

    if (Array.isArray(value)) {
      setServers(value);
    } else {
      // Convert object to array
      const serverArray = Object.entries(value).map(([name, server]) => ({
        name,
        ...server
      }));
      setServers(serverArray);
    }
  }, [value]);

  // Update parent when servers change
  const updateServers = (updatedServers: MCPServer[]) => {
    setServers(updatedServers);
    
    // Convert back to object format (using name as key)
    const serverObject: Record<string, MCPServer> = {};
    updatedServers.forEach((server, index) => {
      const serverName = server.name || `server-${index}`;
      const { name, ...serverConfig} = server;
      serverObject[serverName] = serverConfig;
    });
    
    console.log("[MCP Editor] Calling onChange with servers:", serverObject);
    onChange(serverObject);
  };

  const addServer = () => {
    const newServer: MCPServer = {
      name: `server-${servers.length}`,
      type: "streamable-http",
      timeout: 30000,
      headers: {},
      chatMenu: true,
      serverInstructions: true
    };
    updateServers([...servers, newServer]);
  };

  const removeServer = (index: number) => {
    updateServers(servers.filter((_, i) => i !== index));
  };

  const updateServer = (index: number, updates: Partial<MCPServer>) => {
    const updatedServers = servers.map((server, i) => 
      i === index ? { ...server, ...updates } : server
    );
    updateServers(updatedServers);
  };

  const addHeader = (serverIndex: number) => {
    const server = servers[serverIndex];
    const headers = server.headers || {};
    const newKey = `header-${Object.keys(headers).length}`;
    updateServer(serverIndex, {
      headers: { ...headers, [newKey]: "" }
    });
  };

  const removeHeader = (serverIndex: number, headerKey: string) => {
    const server = servers[serverIndex];
    const headers = { ...server.headers };
    delete headers[headerKey];
    updateServer(serverIndex, { headers });
  };

  const updateHeader = (serverIndex: number, oldKey: string, newKey: string, value: string) => {
    const server = servers[serverIndex];
    const headers = { ...server.headers };
    
    if (oldKey !== newKey && headers.hasOwnProperty(oldKey)) {
      delete headers[oldKey];
    }
    headers[newKey] = value;
    
    updateServer(serverIndex, { headers });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          <span className="text-sm font-medium">MCP Servers</span>
          <Badge variant="secondary">{servers.length} servers</Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addServer}
          data-testid="button-add-mcp-server"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </Button>
      </div>

      {servers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No MCP servers configured</p>
              <p className="text-xs text-muted-foreground">Click "Add Server" to get started</p>
            </div>
          </CardContent>
        </Card>
      )}

      {servers.map((server, serverIndex) => (
        <Card key={serverIndex} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Server {serverIndex + 1}
                {server.name && (
                  <Badge variant="outline">{server.name}</Badge>
                )}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeServer(serverIndex)}
                data-testid={`button-remove-mcp-server-${serverIndex}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Server Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`server-name-${serverIndex}`}>Server Name *</Label>
                <Input
                  id={`server-name-${serverIndex}`}
                  value={server.name || ""}
                  onChange={(e) => updateServer(serverIndex, { name: e.target.value })}
                  placeholder="unique-server-name"
                  data-testid={`input-mcp-server-name-${serverIndex}`}
                />
              </div>

              {/* Server Type */}
              <div>
                <Label htmlFor={`server-type-${serverIndex}`}>Server Type</Label>
                <Select
                  value={server.type || "streamable-http"}
                  onValueChange={(value: string) => updateServer(serverIndex, { type: value as MCPServer["type"] })}
                >
                  <SelectTrigger data-testid={`input-mcp-server-type-${serverIndex}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stdio">stdio</SelectItem>
                    <SelectItem value="websocket">websocket</SelectItem>
                    <SelectItem value="sse">SSE</SelectItem>
                    <SelectItem value="streamable-http">streamable-http</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Server URL */}
            <div>
              <Label htmlFor={`server-url-${serverIndex}`}>
                <Globe className="h-3 w-3 inline mr-1" />
                Server URL
              </Label>
              <Input
                id={`server-url-${serverIndex}`}
                value={server.url || ""}
                onChange={(e) => updateServer(serverIndex, { url: e.target.value })}
                placeholder="https://api.example.com/mcp"
                data-testid={`input-mcp-server-url-${serverIndex}`}
              />
            </div>

            {/* Timeout */}
            <div>
              <Label htmlFor={`server-timeout-${serverIndex}`}>Timeout (ms)</Label>
              <Input
                id={`server-timeout-${serverIndex}`}
                type="number"
                value={server.timeout || 30000}
                onChange={(e) => updateServer(serverIndex, { timeout: parseInt(e.target.value) || 30000 })}
                min="1000"
                max="300000"
                data-testid={`input-mcp-server-timeout-${serverIndex}`}
              />
            </div>

            {/* HTTP Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>HTTP Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addHeader(serverIndex)}
                  data-testid={`button-add-header-${serverIndex}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Header
                </Button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(server.headers || {}).map(([key, value], headerIndex) => (
                  <div key={`${key}-${headerIndex}`} className="flex gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => updateHeader(serverIndex, key, e.target.value, value)}
                      placeholder="Header-Name"
                      className="flex-1"
                      data-testid={`input-header-key-${serverIndex}-${headerIndex}`}
                    />
                    <Input
                      value={value}
                      onChange={(e) => updateHeader(serverIndex, key, key, e.target.value)}
                      placeholder="header value"
                      className="flex-1"
                      data-testid={`input-header-value-${serverIndex}-${headerIndex}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(serverIndex, key)}
                      data-testid={`button-remove-header-${serverIndex}-${headerIndex}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {Object.keys(server.headers || {}).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No custom headers configured</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Server Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Server Instructions</strong> tell the AI how to use this MCP server effectively.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                    <li><strong>Auto-inject:</strong> LibreChat automatically generates instructions based on the server's capabilities (recommended for most cases)</li>
                    <li><strong>Custom:</strong> Write specific instructions when you need fine-grained control over how the AI uses this server</li>
                    <li><strong>None:</strong> Leave both unchecked if no instructions are needed</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`auto-inject-instructions-${serverIndex}`}
                  checked={server.serverInstructions === true}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateServer(serverIndex, { serverInstructions: true });
                    } else {
                      updateServer(serverIndex, { serverInstructions: undefined });
                    }
                  }}
                  data-testid={`checkbox-auto-inject-instructions-${serverIndex}`}
                />
                <Label 
                  htmlFor={`auto-inject-instructions-${serverIndex}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Auto-inject server instructions (recommended)
                </Label>
              </div>

              {server.serverInstructions !== true && (
                <div>
                  <Label htmlFor={`server-instructions-${serverIndex}`}>Custom Instructions (optional)</Label>
                  <Textarea
                    id={`server-instructions-${serverIndex}`}
                    value={typeof server.serverInstructions === "string" ? server.serverInstructions : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateServer(serverIndex, { 
                        serverInstructions: value.trim() === "" ? undefined : value 
                      });
                    }}
                    placeholder="Enter detailed instructions for how the AI should use this MCP server..."
                    rows={4}
                    className="resize-y"
                    data-testid={`input-mcp-server-instructions-${serverIndex}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only use custom instructions if auto-inject doesn't meet your needs
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}