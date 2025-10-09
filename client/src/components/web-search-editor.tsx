import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Globe, Zap, Shield, Clock, Eye, EyeOff, Info, ChevronDown, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface WebSearchConfig {
  searchProvider?: "none" | "serper" | "searxng";
  scraperType?: "none" | "firecrawl" | "serper";
  rerankerType?: "none" | "jina" | "cohere";
  serperApiKey?: string;
  searxngInstanceUrl?: string;
  searxngApiKey?: string;
  firecrawlApiKey?: string;
  firecrawlApiUrl?: string;
  jinaApiKey?: string;
  jinaApiUrl?: string;
  cohereApiKey?: string;
  scraperTimeout?: number;
  safeSearch?: boolean;
  firecrawlOptions?: {
    formats?: ("markdown" | "html" | "links" | "screenshot")[];
    onlyMainContent?: boolean;
    timeout?: number;
    waitFor?: number;
    blockAds?: boolean;
    removeBase64Images?: boolean;
    mobile?: boolean;
    maxAge?: number;
    proxy?: string;
  };
}

interface WebSearchEditorProps {
  value: WebSearchConfig | null;
  onChange: (value: WebSearchConfig) => void;
  "data-testid"?: string;
}

export function WebSearchEditor({ value, onChange, "data-testid": testId }: WebSearchEditorProps) {
  const isSyncingFromProp = useRef(false);
  
  const [config, setConfig] = useState<WebSearchConfig>({
    searchProvider: "none",
    scraperType: "none", 
    rerankerType: "none",
    scraperTimeout: 30000,
    safeSearch: true,
    ...value
  });

  // Password visibility state
  const [showSearxngApiKey, setShowSearxngApiKey] = useState(false);
  const [showFirecrawlApiKey, setShowFirecrawlApiKey] = useState(false);
  const [showJinaApiKey, setShowJinaApiKey] = useState(false);
  
  // Firecrawl advanced options visibility
  const [showFirecrawlAdvanced, setShowFirecrawlAdvanced] = useState(false);

  // Sync internal state when value prop changes (e.g., from merge import)
  useEffect(() => {
    if (value) {
      isSyncingFromProp.current = true;
      setConfig({
        searchProvider: "none",
        scraperType: "none", 
        rerankerType: "none",
        scraperTimeout: 30000,
        safeSearch: true,
        ...value
      });
      // Reset flag after React completes the state update
      setTimeout(() => {
        isSyncingFromProp.current = false;
      }, 0);
    }
  }, [JSON.stringify(value)]);

  // Only call onChange when user is interacting, not when syncing from parent
  useEffect(() => {
    if (!isSyncingFromProp.current) {
      onChange(config);
    }
  }, [config, onChange]);

  const updateConfig = (updates: Partial<WebSearchConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const renderSearchProviderFields = () => {
    switch (config.searchProvider) {
      case "serper":
        return (
          <div>
            <Label htmlFor="serper-api-key">
              <Search className="h-3 w-3 inline mr-1" />
              Serper API Key *
            </Label>
            <Input
              id="serper-api-key"
              type="password"
              value={config.serperApiKey || ""}
              onChange={(e) => updateConfig({ serperApiKey: e.target.value })}
              placeholder="Enter your Serper API key"
              className="font-mono"
              data-testid="input-serper-api-key"
            />
          </div>
        );
      
      case "searxng":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="searxng-url">
                <Globe className="h-3 w-3 inline mr-1" />
                SearXNG Instance URL *
              </Label>
              <Input
                id="searxng-url"
                value={config.searxngInstanceUrl || ""}
                onChange={(e) => updateConfig({ searxngInstanceUrl: e.target.value })}
                placeholder="https://search.example.com"
                data-testid="input-searxng-url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                <Info className="h-3 w-3 inline mr-1" />
                Enter the URL of your external SearXNG instance
              </p>
            </div>
            <div>
              <Label htmlFor="searxng-api-key">SearXNG API Key (Optional)</Label>
              <div className="relative">
                <Input
                  id="searxng-api-key"
                  type={showSearxngApiKey ? "text" : "password"}
                  value={config.searxngApiKey || ""}
                  onChange={(e) => updateConfig({ searxngApiKey: e.target.value })}
                  placeholder="Optional API key if required"
                  className="font-mono pr-10"
                  data-testid="input-searxng-api-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSearxngApiKey(!showSearxngApiKey)}
                  data-testid="toggle-searxng-api-key-visibility"
                >
                  {showSearxngApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderScraperFields = () => {
    switch (config.scraperType) {
      case "firecrawl":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="firecrawl-api-key">
                <Zap className="h-3 w-3 inline mr-1" />
                Firecrawl API Key *
              </Label>
              <div className="relative">
                <Input
                  id="firecrawl-api-key"
                  type={showFirecrawlApiKey ? "text" : "password"}
                  value={config.firecrawlApiKey || ""}
                  onChange={(e) => updateConfig({ firecrawlApiKey: e.target.value })}
                  placeholder="Enter your Firecrawl API key"
                  className="font-mono pr-10"
                  data-testid="input-firecrawl-api-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowFirecrawlApiKey(!showFirecrawlApiKey)}
                  data-testid="toggle-firecrawl-api-key-visibility"
                >
                  {showFirecrawlApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="firecrawl-api-url">Firecrawl API URL</Label>
              <Input
                id="firecrawl-api-url"
                value={config.firecrawlApiUrl || ""}
                onChange={(e) => updateConfig({ firecrawlApiUrl: e.target.value })}
                placeholder="https://api.firecrawl.dev"
                data-testid="input-firecrawl-api-url"
              />
            </div>
            
            <Collapsible open={showFirecrawlAdvanced} onOpenChange={setShowFirecrawlAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  data-testid="toggle-firecrawl-advanced"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-3 w-3" />
                    Advanced Firecrawl Options
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFirecrawlAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firecrawl-timeout">Timeout (ms)</Label>
                    <Input
                      id="firecrawl-timeout"
                      type="number"
                      value={config.firecrawlOptions?.timeout || 20000}
                      onChange={(e) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, timeout: parseInt(e.target.value) || 20000 }
                      })}
                      placeholder="20000"
                      data-testid="input-firecrawl-timeout"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firecrawl-waitfor">Wait For (ms)</Label>
                    <Input
                      id="firecrawl-waitfor"
                      type="number"
                      value={config.firecrawlOptions?.waitFor || 1000}
                      onChange={(e) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, waitFor: parseInt(e.target.value) || 1000 }
                      })}
                      placeholder="1000"
                      data-testid="input-firecrawl-waitfor"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firecrawl-maxage">Max Age (ms)</Label>
                    <Input
                      id="firecrawl-maxage"
                      type="number"
                      value={config.firecrawlOptions?.maxAge || 0}
                      onChange={(e) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, maxAge: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      data-testid="input-firecrawl-maxage"
                    />
                    <p className="text-xs text-muted-foreground mt-1">0 = no cache</p>
                  </div>
                  <div>
                    <Label htmlFor="firecrawl-proxy">Proxy</Label>
                    <Input
                      id="firecrawl-proxy"
                      value={config.firecrawlOptions?.proxy || "auto"}
                      onChange={(e) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, proxy: e.target.value || "auto" }
                      })}
                      placeholder="auto"
                      data-testid="input-firecrawl-proxy"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="firecrawl-onlymain">Only Main Content</Label>
                    <Switch
                      id="firecrawl-onlymain"
                      checked={config.firecrawlOptions?.onlyMainContent ?? true}
                      onCheckedChange={(checked) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, onlyMainContent: checked }
                      })}
                      data-testid="switch-firecrawl-onlymain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="firecrawl-blockads">Block Ads</Label>
                    <Switch
                      id="firecrawl-blockads"
                      checked={config.firecrawlOptions?.blockAds ?? true}
                      onCheckedChange={(checked) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, blockAds: checked }
                      })}
                      data-testid="switch-firecrawl-blockads"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="firecrawl-removebase64">Remove Base64 Images</Label>
                    <Switch
                      id="firecrawl-removebase64"
                      checked={config.firecrawlOptions?.removeBase64Images ?? true}
                      onCheckedChange={(checked) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, removeBase64Images: checked }
                      })}
                      data-testid="switch-firecrawl-removebase64"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="firecrawl-mobile">Mobile Mode</Label>
                    <Switch
                      id="firecrawl-mobile"
                      checked={config.firecrawlOptions?.mobile ?? true}
                      onCheckedChange={(checked) => updateConfig({ 
                        firecrawlOptions: { ...config.firecrawlOptions, mobile: checked }
                      })}
                      data-testid="switch-firecrawl-mobile"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Output Formats</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["markdown", "html", "links", "screenshot"].map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <Switch
                          id={`format-${format}`}
                          checked={config.firecrawlOptions?.formats?.includes(format as any) ?? (format === "markdown" || format === "links")}
                          onCheckedChange={(checked) => {
                            const currentFormats = config.firecrawlOptions?.formats || ["markdown", "links"];
                            const newFormats = checked
                              ? [...currentFormats, format as any]
                              : currentFormats.filter(f => f !== format);
                            updateConfig({ 
                              firecrawlOptions: { ...config.firecrawlOptions, formats: newFormats as any }
                            });
                          }}
                          data-testid={`switch-format-${format}`}
                        />
                        <Label htmlFor={`format-${format}`} className="text-sm capitalize">{format}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );

      case "serper":
        return (
          <p className="text-xs text-muted-foreground">
            Using Serper for both search and scraping (API key configured above)
          </p>
        );

      default:
        return null;
    }
  };

  const renderRerankerFields = () => {
    switch (config.rerankerType) {
      case "jina":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="jina-api-key">
                <Zap className="h-3 w-3 inline mr-1" />
                Jina Reranker API Key *
              </Label>
              <div className="relative">
                <Input
                  id="jina-api-key"
                  type={showJinaApiKey ? "text" : "password"}
                  value={config.jinaApiKey || ""}
                  onChange={(e) => updateConfig({ jinaApiKey: e.target.value })}
                  placeholder="Enter your Jina API key"
                  className="font-mono pr-10"
                  data-testid="input-jina-api-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowJinaApiKey(!showJinaApiKey)}
                  data-testid="toggle-jina-api-key-visibility"
                >
                  {showJinaApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="jina-api-url">Jina API URL</Label>
              <Input
                id="jina-api-url"
                value={config.jinaApiUrl || ""}
                onChange={(e) => updateConfig({ jinaApiUrl: e.target.value })}
                placeholder="https://api.jina.ai/v1/rerank"
                data-testid="input-jina-api-url"
              />
            </div>
          </div>
        );

      case "cohere":
        return (
          <div>
            <Label htmlFor="cohere-api-key">
              <Zap className="h-3 w-3 inline mr-1" />
              Cohere Reranker API Key *
            </Label>
            <Input
              id="cohere-api-key"
              type="password"
              value={config.cohereApiKey || ""}
              onChange={(e) => updateConfig({ cohereApiKey: e.target.value })}
              placeholder="Enter your Cohere API key"
              className="font-mono"
              data-testid="input-cohere-api-key"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Provider Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Search Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search-provider">Choose Search Provider</Label>
            <Select
              value={config.searchProvider}
              onValueChange={(value: string) => 
                updateConfig({ searchProvider: value as WebSearchConfig["searchProvider"] })
              }
            >
              <SelectTrigger data-testid="select-search-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Disable Search)</SelectItem>
                <SelectItem value="serper">Serper (Google Search API)</SelectItem>
                <SelectItem value="searxng">SearXNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {renderSearchProviderFields()}
        </CardContent>
      </Card>

      {/* Scraper Section */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Web Scraper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="scraper-type">Choose Scraper Type</Label>
            <Select
              value={config.scraperType}
              onValueChange={(value: string) => 
                updateConfig({ scraperType: value as WebSearchConfig["scraperType"] })
              }
            >
              <SelectTrigger data-testid="select-scraper-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (No Scraping)</SelectItem>
                <SelectItem value="firecrawl">Firecrawl</SelectItem>
                <SelectItem value="serper">Serper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderScraperFields()}

          <Separator className="my-4" />

          <div>
            <Label htmlFor="scraper-timeout">
              <Clock className="h-3 w-3 inline mr-1" />
              Scraper Timeout (ms)
            </Label>
            <Input
              id="scraper-timeout"
              type="number"
              value={config.scraperTimeout || 30000}
              onChange={(e) => updateConfig({ scraperTimeout: parseInt(e.target.value) || 30000 })}
              min="1000"
              max="120000"
              data-testid="input-scraper-timeout"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum time to wait for scraper response (applies to all scraper types)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reranker Section */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Result Reranker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reranker-type">Choose Reranker Type</Label>
            <Select
              value={config.rerankerType}
              onValueChange={(value: string) => 
                updateConfig({ rerankerType: value as WebSearchConfig["rerankerType"] })
              }
            >
              <SelectTrigger data-testid="select-reranker-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (No Reranking)</SelectItem>
                <SelectItem value="jina">Jina AI Reranker</SelectItem>
                <SelectItem value="cohere">Cohere Reranker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderRerankerFields()}
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Additional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="safe-search">Safe Search</Label>
              <p className="text-xs text-muted-foreground">
                Filter adult content from search results
              </p>
            </div>
            <Switch
              id="safe-search"
              checked={config.safeSearch || false}
              onCheckedChange={(checked) => updateConfig({ safeSearch: checked })}
              data-testid="switch-safe-search"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}