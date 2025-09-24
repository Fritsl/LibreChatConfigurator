import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Globe, Zap, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface WebSearchConfig {
  searchProvider?: "serper" | "searxng" | "brave" | "tavily" | "google" | "bing";
  scraperType?: "firecrawl" | "serper" | "brave";
  rerankerType?: "jina" | "cohere";
  serperApiKey?: string;
  searxngInstanceUrl?: string;
  searxngApiKey?: string;
  braveApiKey?: string;
  tavilyApiKey?: string;
  googleSearchApiKey?: string;
  googleCSEId?: string;
  bingSearchApiKey?: string;
  firecrawlApiKey?: string;
  firecrawlApiUrl?: string;
  jinaApiKey?: string;
  cohereApiKey?: string;
  scraperTimeout?: number;
  safeSearch?: boolean;
}

interface WebSearchEditorProps {
  value: WebSearchConfig | null;
  onChange: (value: WebSearchConfig) => void;
  "data-testid"?: string;
}

export function WebSearchEditor({ value, onChange, "data-testid": testId }: WebSearchEditorProps) {
  const [config, setConfig] = useState<WebSearchConfig>({
    searchProvider: "serper",
    scraperType: "firecrawl", 
    rerankerType: "jina",
    scraperTimeout: 30000,
    safeSearch: true,
    ...value
  });

  useEffect(() => {
    onChange(config);
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
            </div>
            <div>
              <Label htmlFor="searxng-api-key">SearXNG API Key</Label>
              <Input
                id="searxng-api-key"
                type="password"
                value={config.searxngApiKey || ""}
                onChange={(e) => updateConfig({ searxngApiKey: e.target.value })}
                placeholder="Optional API key"
                className="font-mono"
                data-testid="input-searxng-api-key"
              />
            </div>
          </div>
        );

      case "brave":
        return (
          <div>
            <Label htmlFor="brave-api-key">
              <Search className="h-3 w-3 inline mr-1" />
              Brave Search API Key *
            </Label>
            <Input
              id="brave-api-key"
              type="password"
              value={config.braveApiKey || ""}
              onChange={(e) => updateConfig({ braveApiKey: e.target.value })}
              placeholder="Enter your Brave Search API key"
              className="font-mono"
              data-testid="input-brave-api-key"
            />
          </div>
        );

      case "tavily":
        return (
          <div>
            <Label htmlFor="tavily-api-key">
              <Search className="h-3 w-3 inline mr-1" />
              Tavily Search API Key *
            </Label>
            <Input
              id="tavily-api-key"
              type="password"
              value={config.tavilyApiKey || ""}
              onChange={(e) => updateConfig({ tavilyApiKey: e.target.value })}
              placeholder="Enter your Tavily API key"
              className="font-mono"
              data-testid="input-tavily-api-key"
            />
          </div>
        );

      case "google":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="google-search-api-key">
                <Search className="h-3 w-3 inline mr-1" />
                Google Search API Key *
              </Label>
              <Input
                id="google-search-api-key"
                type="password"
                value={config.googleSearchApiKey || ""}
                onChange={(e) => updateConfig({ googleSearchApiKey: e.target.value })}
                placeholder="Enter your Google Search API key"
                className="font-mono"
                data-testid="input-google-search-api-key"
              />
            </div>
            <div>
              <Label htmlFor="google-cse-id">
                Google Custom Search Engine ID *
              </Label>
              <Input
                id="google-cse-id"
                value={config.googleCSEId || ""}
                onChange={(e) => updateConfig({ googleCSEId: e.target.value })}
                placeholder="Enter your Google CSE ID"
                data-testid="input-google-cse-id"
              />
            </div>
          </div>
        );

      case "bing":
        return (
          <div>
            <Label htmlFor="bing-search-api-key">
              <Search className="h-3 w-3 inline mr-1" />
              Bing Search API Key *
            </Label>
            <Input
              id="bing-search-api-key"
              type="password"
              value={config.bingSearchApiKey || ""}
              onChange={(e) => updateConfig({ bingSearchApiKey: e.target.value })}
              placeholder="Enter your Bing Search API key"
              className="font-mono"
              data-testid="input-bing-search-api-key"
            />
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
              <Input
                id="firecrawl-api-key"
                type="password"
                value={config.firecrawlApiKey || ""}
                onChange={(e) => updateConfig({ firecrawlApiKey: e.target.value })}
                placeholder="Enter your Firecrawl API key"
                className="font-mono"
                data-testid="input-firecrawl-api-key"
              />
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
          </div>
        );

      case "serper":
        return (
          <p className="text-xs text-muted-foreground">
            Using Serper for both search and scraping (API key configured above)
          </p>
        );

      case "brave":
        return (
          <p className="text-xs text-muted-foreground">
            Using Brave for both search and scraping (API key configured above)
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
          <div>
            <Label htmlFor="jina-api-key">
              <Zap className="h-3 w-3 inline mr-1" />
              Jina Reranker API Key *
            </Label>
            <Input
              id="jina-api-key"
              type="password"
              value={config.jinaApiKey || ""}
              onChange={(e) => updateConfig({ jinaApiKey: e.target.value })}
              placeholder="Enter your Jina API key"
              className="font-mono"
              data-testid="input-jina-api-key"
            />
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
                <SelectItem value="serper">Serper (Google Search API)</SelectItem>
                <SelectItem value="google">Google Custom Search</SelectItem>
                <SelectItem value="bing">Bing Search API</SelectItem>
                <SelectItem value="searxng">SearXNG (Self-hosted)</SelectItem>
                <SelectItem value="brave">Brave Search</SelectItem>
                <SelectItem value="tavily">Tavily Search</SelectItem>
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
                <SelectItem value="firecrawl">Firecrawl (Advanced)</SelectItem>
                <SelectItem value="serper">Serper (if using Serper search)</SelectItem>
                <SelectItem value="brave">Brave (if using Brave search)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderScraperFields()}
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
          </div>

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