import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Sparkles, Shield, Info, Zap } from "lucide-react";
import { useState } from "react";

interface SpeechPreset {
  id: "chatgpt-feel" | "private-cheap";
  name: string;
  description: string;
  icon: any;
  color: string;
  settings: {
    "stt.provider": string;
    "stt.model": string;
    "stt.streaming": boolean;
    "stt.punctuation": boolean;
    "stt.profanityFilter": boolean;
    "tts.provider": string;
    "tts.model": string;
    "tts.voice"?: string;
    "tts.quality": string;
    "tts.streaming": boolean;
    "speech.speechTab.conversationMode": boolean;
    "speech.speechTab.advancedMode": boolean;
    "speech.speechTab.speechToText.engineSTT": string;
    "speech.speechTab.speechToText.autoTranscribeAudio": boolean;
    "speech.speechTab.speechToText.decibelValue": number;
    "speech.speechTab.speechToText.autoSendText": number;
    "speech.speechTab.textToSpeech.engineTTS": string;
    "speech.speechTab.textToSpeech.automaticPlayback": boolean;
    "speech.speechTab.textToSpeech.playbackRate": number;
    "speech.speechTab.textToSpeech.cacheTTS": boolean;
  };
  requiresApiKey: boolean;
  requiredFields: string[];
}

const PRESETS: SpeechPreset[] = [
  {
    id: "chatgpt-feel",
    name: "ChatGPT Feel",
    description: "High-quality OpenAI-powered speech with conversation mode",
    icon: Sparkles,
    color: "from-blue-500 to-purple-500",
    requiresApiKey: true,
    requiredFields: ["language", "apiKey"],
    settings: {
      "stt.provider": "openai",
      "stt.model": "whisper-1",
      "stt.streaming": false,
      "stt.punctuation": true,
      "stt.profanityFilter": false,
      "tts.provider": "openai",
      "tts.model": "tts-1-hd",
      "tts.voice": "alloy",
      "tts.quality": "hd",
      "tts.streaming": true,
      "speech.speechTab.conversationMode": true,
      "speech.speechTab.advancedMode": false,
      "speech.speechTab.speechToText.engineSTT": "external",
      "speech.speechTab.speechToText.autoTranscribeAudio": true,
      "speech.speechTab.speechToText.decibelValue": -45,
      "speech.speechTab.speechToText.autoSendText": 1000,
      "speech.speechTab.textToSpeech.engineTTS": "external",
      "speech.speechTab.textToSpeech.automaticPlayback": true,
      "speech.speechTab.textToSpeech.playbackRate": 1.0,
      "speech.speechTab.textToSpeech.cacheTTS": true,
    }
  },
  {
    id: "private-cheap",
    name: "Private & Cheap",
    description: "Browser-based speech processing, no API keys or external calls",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    requiresApiKey: false,
    requiredFields: ["language"],
    settings: {
      "stt.provider": "local",
      "stt.model": "",
      "stt.streaming": false,
      "stt.punctuation": true,
      "stt.profanityFilter": false,
      "tts.provider": "local",
      "tts.model": "",
      "tts.quality": "standard",
      "tts.streaming": false,
      "speech.speechTab.conversationMode": true,
      "speech.speechTab.advancedMode": false,
      "speech.speechTab.speechToText.engineSTT": "browser",
      "speech.speechTab.speechToText.autoTranscribeAudio": true,
      "speech.speechTab.speechToText.decibelValue": -45,
      "speech.speechTab.speechToText.autoSendText": 1000,
      "speech.speechTab.textToSpeech.engineTTS": "browser",
      "speech.speechTab.textToSpeech.automaticPlayback": true,
      "speech.speechTab.textToSpeech.playbackRate": 1.0,
      "speech.speechTab.textToSpeech.cacheTTS": false,
    }
  }
];

interface SpeechPresetSelectorProps {
  currentPreset?: string;
  configuration: any;
  onApplyPreset: (presetId: string, customValues: any) => void;
}

export function SpeechPresetSelector({ currentPreset, configuration, onApplyPreset }: SpeechPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentPreset || "");
  const [language, setLanguage] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [ttsVoice, setTtsVoice] = useState<string>("alloy");

  const preset = PRESETS.find(p => p.id === selectedPreset);
  const isApplied = currentPreset === selectedPreset;

  const handleApply = () => {
    if (!selectedPreset || !preset) return;

    const customValues: any = {
      "speech.preset.selected": selectedPreset,
      "speech.preset.customLanguage": language,
      "speech.preset.customVoice": ttsVoice,
    };

    // Set language fields
    if (language) {
      if (preset.id === "chatgpt-feel") {
        // OpenAI uses ISO 639-1 (en, es, fr)
        customValues["stt.language"] = language;
        customValues["speech.speechTab.speechToText.languageSTT"] = `${language}-${language.toUpperCase()}`; // UI uses BCP-47
        customValues["speech.speechTab.textToSpeech.languageTTS"] = language;
      } else if (preset.id === "private-cheap") {
        // Browser uses BCP-47 format (en-US, es-ES) for all fields
        customValues["stt.language"] = language;
        customValues["speech.speechTab.speechToText.languageSTT"] = language;
        customValues["speech.speechTab.textToSpeech.languageTTS"] = language;
      }
    }

    // Set API key if required
    if (preset.requiresApiKey && apiKey) {
      customValues["stt.apiKey"] = apiKey;
      customValues["tts.apiKey"] = apiKey;
    }

    // Set voice (only for ChatGPT preset; browser preset doesn't set specific voice)
    if (preset.id === "chatgpt-feel" && ttsVoice) {
      customValues["tts.voice"] = ttsVoice;
      customValues["speech.speechTab.textToSpeech.voice"] = ttsVoice;
    }

    onApplyPreset(selectedPreset, customValues);
  };

  const canApply = selectedPreset && language && (!preset?.requiresApiKey || apiKey);

  return (
    <div className="space-y-6">
      <Alert data-testid="alert-preset-info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Setup:</strong> Choose a preset below to instantly configure all speech settings across STT, TTS, and Speech Experience tabs. You'll only need to provide language and any required API keys.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Choose a Preset
          </CardTitle>
          <CardDescription>
            Select a preset configuration that matches your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset}>
            <div className="grid gap-4">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                
                return (
                  <div 
                    key={p.id} 
                    className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPreset(p.id)}
                    data-testid={`preset-option-${p.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={p.id} id={p.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-5 w-5 bg-gradient-to-r ${p.color} text-transparent bg-clip-text`} />
                          <Label htmlFor={p.id} className="font-semibold text-base cursor-pointer">
                            {p.name}
                          </Label>
                          {isApplied && p.id === currentPreset && (
                            <Badge variant="secondary" className="ml-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {p.requiresApiKey && (
                            <Badge variant="outline" className="text-xs">
                              Requires API Key
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            STT: {p.settings["stt.provider"]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            TTS: {p.settings["tts.provider"]}
                          </Badge>
                          {p.settings["speech.speechTab.conversationMode"] && (
                            <Badge variant="outline" className="text-xs">
                              Conversation Mode
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {preset && (
        <Card>
          <CardHeader>
            <CardTitle>Required Configuration</CardTitle>
            <CardDescription>
              Provide the following details to complete your preset setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">
                {preset.id === "chatgpt-feel" ? "Language (ISO 639-1 code) *" : "Language (BCP-47 code) *"}
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" data-testid="select-preset-language">
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {preset.id === "chatgpt-feel" ? (
                    <>
                      <SelectItem value="en">English (en)</SelectItem>
                      <SelectItem value="es">Spanish (es)</SelectItem>
                      <SelectItem value="fr">French (fr)</SelectItem>
                      <SelectItem value="de">German (de)</SelectItem>
                      <SelectItem value="it">Italian (it)</SelectItem>
                      <SelectItem value="pt">Portuguese (pt)</SelectItem>
                      <SelectItem value="ru">Russian (ru)</SelectItem>
                      <SelectItem value="ja">Japanese (ja)</SelectItem>
                      <SelectItem value="ko">Korean (ko)</SelectItem>
                      <SelectItem value="zh">Chinese (zh)</SelectItem>
                      <SelectItem value="ar">Arabic (ar)</SelectItem>
                      <SelectItem value="hi">Hindi (hi)</SelectItem>
                      <SelectItem value="nl">Dutch (nl)</SelectItem>
                      <SelectItem value="pl">Polish (pl)</SelectItem>
                      <SelectItem value="tr">Turkish (tr)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="en-US">English US (en-US)</SelectItem>
                      <SelectItem value="en-GB">English GB (en-GB)</SelectItem>
                      <SelectItem value="es-ES">Spanish (es-ES)</SelectItem>
                      <SelectItem value="fr-FR">French (fr-FR)</SelectItem>
                      <SelectItem value="de-DE">German (de-DE)</SelectItem>
                      <SelectItem value="it-IT">Italian (it-IT)</SelectItem>
                      <SelectItem value="pt-BR">Portuguese BR (pt-BR)</SelectItem>
                      <SelectItem value="ru-RU">Russian (ru-RU)</SelectItem>
                      <SelectItem value="ja-JP">Japanese (ja-JP)</SelectItem>
                      <SelectItem value="ko-KR">Korean (ko-KR)</SelectItem>
                      <SelectItem value="zh-CN">Chinese CN (zh-CN)</SelectItem>
                      <SelectItem value="ar-SA">Arabic (ar-SA)</SelectItem>
                      <SelectItem value="hi-IN">Hindi (hi-IN)</SelectItem>
                      <SelectItem value="nl-NL">Dutch (nl-NL)</SelectItem>
                      <SelectItem value="pl-PL">Polish (pl-PL)</SelectItem>
                      <SelectItem value="tr-TR">Turkish (tr-TR)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {preset.requiresApiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  data-testid="input-preset-apikey"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for both STT and TTS
                </p>
              </div>
            )}

            {preset.id === "chatgpt-feel" && (
              <div className="space-y-2">
                <Label htmlFor="ttsVoice">TTS Voice (optional)</Label>
                <Select value={ttsVoice} onValueChange={setTtsVoice}>
                  <SelectTrigger id="ttsVoice" data-testid="select-preset-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy</SelectItem>
                    <SelectItem value="echo">Echo</SelectItem>
                    <SelectItem value="fable">Fable</SelectItem>
                    <SelectItem value="onyx">Onyx</SelectItem>
                    <SelectItem value="nova">Nova</SelectItem>
                    <SelectItem value="shimmer">Shimmer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleApply} 
              disabled={!canApply}
              className="w-full"
              data-testid="button-apply-preset"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply Preset
            </Button>
          </CardContent>
        </Card>
      )}

      {isApplied && (
        <Alert variant="default" className="bg-green-50 border-green-200" data-testid="alert-preset-applied">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{preset?.name} preset is active!</strong> All speech settings have been configured. You can still customize individual settings in the other tabs if needed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
