import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Info } from "lucide-react";
import { type Configuration } from "@shared/schema";

interface RAGQuickSetupProps {
  configuration: Configuration;
  onApplySetup: () => void;
}

export function RAGQuickSetup({ configuration, onApplySetup }: RAGQuickSetupProps) {
  const isRAGConfigured = !!(
    configuration.ragApiURL ||
    configuration.ragPort ||
    configuration.ragHost ||
    configuration.collectionName ||
    configuration.chunkSize ||
    configuration.chunkOverlap ||
    configuration.embeddingsProvider
  );

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Quick Setup RAG
        </CardTitle>
        <CardDescription>
          Automatically configure RAG with recommended settings for Office document support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="info" data-testid="alert-rag-quick-setup-info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What this does:</strong> Configures RAG API with sensible defaults, automatically includes pgVector + RAG API containers in Docker Compose, and uses your OpenAI API key for embeddings (no separate RAG key needed).
          </AlertDescription>
        </Alert>

        {isRAGConfigured && (
          <Alert variant="warning" data-testid="alert-rag-already-configured">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ RAG is already configured.</strong> Clicking "Apply Quick Setup" will overwrite your current RAG settings with recommended defaults.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2 text-sm">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Settings that will be applied:</div>
          <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-gray-600 dark:text-gray-400">
            <div className="font-medium">RAG API URL:</div>
            <div className="font-mono text-xs">http://rag_api:8000</div>
            
            <div className="font-medium">RAG Port:</div>
            <div className="font-mono text-xs">8000</div>
            
            <div className="font-medium">RAG Host:</div>
            <div className="font-mono text-xs">0.0.0.0</div>
            
            <div className="font-medium">Collection Name:</div>
            <div className="font-mono text-xs">librechat</div>
            
            <div className="font-medium">Chunk Size:</div>
            <div className="font-mono text-xs">1500</div>
            
            <div className="font-medium">Chunk Overlap:</div>
            <div className="font-mono text-xs">100</div>
            
            <div className="font-medium">Embeddings:</div>
            <div className="font-mono text-xs">openai</div>
            
            <div className="font-medium">API Key:</div>
            <div className="font-mono text-xs">Uses OPENAI_API_KEY</div>
          </div>
        </div>

        <Button 
          onClick={onApplySetup}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          data-testid="button-apply-rag-quick-setup"
        >
          <Zap className="h-4 w-4 mr-2" />
          Apply Quick Setup
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          After applying, the RAG API and pgVector services will automatically be included in your Docker Compose package
        </p>
      </CardContent>
    </Card>
  );
}
