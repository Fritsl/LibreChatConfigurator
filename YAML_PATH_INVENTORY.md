# YAML Path Inventory for FIELD_REGISTRY Migration

**Generated:** 2025-10-30  
**Purpose:** Comprehensive checklist of ALL YAML paths that need `yamlPath` metadata in FIELD_REGISTRY

## Data Sources
1. ✅ `scripts/field-manifest.json` (174 YAML fields identified)
2. ✅ Git history analysis (generateYamlFile function from commit 493c853)
3. ✅ Multiple librechat.yaml examples from attached_assets
4. ✅ Current FIELD_REGISTRY state

---

## Top-Level Configuration

### General Settings
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `version` | `version` | ✅ DEFINED | Version string |
| `cache` | `cache` | ✅ DEFINED | Boolean flag |
| `fileStrategy` | `fileStrategy` | ⚠️ MISSING | File handling strategy |
| `imageOutputType` | `imageOutputType` | ⚠️ MISSING | Image output format |
| `secureImageLinks` | `secureImageLinks` | ⚠️ MISSING | Secure image link flag |
| `temporaryChatRetention` | `temporaryChatRetention` | ⚠️ MISSING | Chat retention time (minutes) |

---

## Namespace: `mcpServers`

### MCP Server Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `mcpServers.*` | `mcpServers` | ⚠️ COMPLEX | Dynamic object - each server is a key |
| `mcpServers.*.type` | N/A | ⚠️ MISSING | Server type (e.g., streamable-http) |
| `mcpServers.*.url` | N/A | ⚠️ MISSING | Server URL |
| `mcpServers.*.command` | N/A | ⚠️ MISSING | Command to run |
| `mcpServers.*.args` | N/A | ⚠️ MISSING | Array of arguments |
| `mcpServers.*.timeout` | N/A | ⚠️ MISSING | Timeout in ms |
| `mcpServers.*.initTimeout` | N/A | ⚠️ MISSING | Init timeout |

---

## Namespace: `endpoints`

### Endpoints - Agents
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `endpoints.agents.disableBuilder` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `endpoints.agents.recursionLimit` | ⚠️ TBD | ✅ IN MANIFEST | Number (default: 50) |
| `endpoints.agents.maxRecursionLimit` | ⚠️ TBD | ✅ IN MANIFEST | Number (default: 100) |
| `endpoints.agents.capabilities` | ⚠️ TBD | ✅ IN MANIFEST | Array of strings |
| `endpoints.agents.maxCitations` | ⚠️ TBD | ✅ IN MANIFEST | Number (default: 30) |
| `endpoints.agents.maxCitationsPerFile` | ⚠️ TBD | ✅ IN MANIFEST | Number (default: 7) |
| `endpoints.agents.minRelevanceScore` | ⚠️ TBD | ✅ IN MANIFEST | Number (default: 0.45) |

**Capabilities Array Values:**
- `execute_code`
- `file_search`
- `actions`
- `tools`
- `artifacts`
- `context`
- `ocr`
- `chain`
- `web_search`

### Endpoints - OpenAI
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `endpoints.openAI.title` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `endpoints.openAI.apiKey` | ⚠️ TBD | ✅ IN MANIFEST | String (env var ref) |
| `endpoints.openAI.models` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `endpoints.openAI.models.fetch` | ⚠️ TBD | ⚠️ MISSING | Boolean |
| `endpoints.openAI.models.default` | ⚠️ TBD | ⚠️ MISSING | Array of model names |
| `endpoints.openAI.dropParams` | ⚠️ TBD | ✅ IN MANIFEST | Array of param names |
| `endpoints.openAI.titleConvo` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `endpoints.openAI.titleModel` | ⚠️ TBD | ✅ IN MANIFEST | String |

### Endpoints - Custom (Dynamic Array)
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `endpoints.custom` | ⚠️ TBD | ⚠️ ARRAY | Array of custom endpoint configs |
| `endpoints.custom[].name` | N/A | ⚠️ MISSING | Endpoint name |
| `endpoints.custom[].apiKey` | N/A | ⚠️ MISSING | API key or placeholder |
| `endpoints.custom[].baseURL` | N/A | ⚠️ MISSING | Base URL |
| `endpoints.custom[].models` | N/A | ⚠️ MISSING | Models object |
| `endpoints.custom[].models.fetch` | N/A | ⚠️ MISSING | Boolean |
| `endpoints.custom[].models.default` | N/A | ⚠️ MISSING | Array of models |
| `endpoints.custom[].titleConvo` | N/A | ⚠️ MISSING | Boolean |
| `endpoints.custom[].titleModel` | N/A | ⚠️ MISSING | String |
| `endpoints.custom[].titleMethod` | N/A | ⚠️ MISSING | String (completion/chat) |
| `endpoints.custom[].summarize` | N/A | ⚠️ MISSING | Boolean |
| `endpoints.custom[].summaryModel` | N/A | ⚠️ MISSING | String |
| `endpoints.custom[].forcePrompt` | N/A | ⚠️ MISSING | Boolean |
| `endpoints.custom[].modelDisplayLabel` | N/A | ⚠️ MISSING | String |
| `endpoints.custom[].dropParams` | N/A | ⚠️ MISSING | Array |

### Endpoints - Other Providers
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `endpoints.anthropic.*` | ⚠️ TBD | ⚠️ MISSING | Similar structure to openAI |
| `endpoints.google.*` | ⚠️ TBD | ⚠️ MISSING | Similar structure to openAI |
| `endpoints.mistral.*` | ⚠️ TBD | ⚠️ MISSING | Similar structure to openAI |
| `endpoints.azureOpenAI.*` | ⚠️ TBD | ⚠️ MISSING | Azure-specific fields |
| `endpoints.gptPlugins.*` | ⚠️ TBD | ⚠️ MISSING | Plugin configuration |
| `endpoints.*` | ⚠️ TBD | ✅ IN MANIFEST | Wildcard for any endpoint |

---

## Namespace: `interface`

### Interface / UI Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `interface.agents` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show agents UI |
| `interface.modelSelect` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show model selector |
| `interface.parameters` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show parameters |
| `interface.sidePanel` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show side panel |
| `interface.presets` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show presets |
| `interface.prompts` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show prompts |
| `interface.bookmarks` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show bookmarks |
| `interface.multiConvo` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - multi-conversation |
| `interface.webSearch` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - web search UI |
| `interface.fileSearch` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - file search UI |
| `interface.fileCitations` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - show citations |
| `interface.runCode` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - code execution UI |
| `interface.artifacts` | ⚠️ TBD | ✅ IN MANIFEST | Boolean - artifacts support |
| `interface.temporaryChatRetention` | ⚠️ TBD | ✅ IN MANIFEST | Number (minutes) |
| `interface.defaultPreset` | ⚠️ TBD | ✅ IN MANIFEST | String - default preset ID |
| `interface.customWelcome` | `customWelcome` | ✅ IN MANIFEST | String - welcome message |
| `interface.customFooter` | `customFooter` | ✅ IN MANIFEST | String - footer text |
| `interface.uploadAsText` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.marketplace` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `interface.marketplace.use` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.mcpServers` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `interface.mcpServers.placeholder` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `interface.privacyPolicy` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `interface.privacyPolicy.externalUrl` | ⚠️ TBD | ✅ IN MANIFEST | URL |
| `interface.privacyPolicy.openNewTab` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.termsOfService` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `interface.termsOfService.externalUrl` | ⚠️ TBD | ✅ IN MANIFEST | URL |
| `interface.termsOfService.openNewTab` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.termsOfService.modalAcceptance` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.termsOfService.modalTitle` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `interface.termsOfService.modalContent` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `interface.peoplePicker` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `interface.peoplePicker.users` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.peoplePicker.groups` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `interface.peoplePicker.roles` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |

---

## Namespace: `modelSpecs`

### Model Specs / Presets
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `modelSpecs.enforce` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `modelSpecs.prioritize` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `modelSpecs.addedEndpoints` | ⚠️ TBD | ✅ IN MANIFEST | Array of endpoint names |
| `modelSpecs.list` | ⚠️ TBD | ✅ IN MANIFEST | Array of preset objects |
| `modelSpecs.list[].name` | N/A | ⚠️ MISSING | Preset name |
| `modelSpecs.list[].label` | N/A | ⚠️ MISSING | Display label |
| `modelSpecs.list[].description` | N/A | ⚠️ MISSING | Description |
| `modelSpecs.list[].default` | N/A | ⚠️ MISSING | Boolean - is default |
| `modelSpecs.list[].preset` | N/A | ⚠️ MISSING | Preset config object |
| `modelSpecs.list[].preset.endpoint` | N/A | ⚠️ MISSING | Endpoint name |
| `modelSpecs.list[].preset.model` | N/A | ⚠️ MISSING | Model name |
| `modelSpecs.list[].preset.agent_id` | N/A | ⚠️ MISSING | Agent ID |

---

## Namespace: `fileConfig`

### File Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `fileConfig.serverFileSizeLimit` | ⚠️ TBD | ✅ IN MANIFEST | Number (MB) |
| `fileConfig.avatarSizeLimit` | ⚠️ TBD | ✅ IN MANIFEST | Number (MB) |
| `fileConfig.endpoints` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `fileConfig.endpoints.*` | ⚠️ TBD | ✅ IN MANIFEST | Wildcard per endpoint |
| `fileConfig.endpoints.*.fileLimit` | N/A | ⚠️ MISSING | Number of files |
| `fileConfig.endpoints.*.fileSizeLimit` | N/A | ⚠️ MISSING | Per-file size (MB) |
| `fileConfig.endpoints.*.totalSizeLimit` | N/A | ⚠️ MISSING | Total size (MB) |
| `fileConfig.endpoints.*.supportedMimeTypes` | N/A | ⚠️ MISSING | Array of MIME types |
| `fileConfig.endpoints.*.disabled` | N/A | ⚠️ MISSING | Boolean |
| `fileConfig.clientImageResize` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `fileConfig.clientImageResize.enabled` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `fileConfig.clientImageResize.maxWidth` | ⚠️ TBD | ✅ IN MANIFEST | Number (pixels) |
| `fileConfig.clientImageResize.maxHeight` | ⚠️ TBD | ✅ IN MANIFEST | Number (pixels) |
| `fileConfig.clientImageResize.quality` | ⚠️ TBD | ✅ IN MANIFEST | Number (0-1) |
| `fileConfig.clientImageResize.compressFormat` | ⚠️ TBD | ✅ IN MANIFEST | String (jpeg/webp) |

**Common MIME Types:**
- text/plain
- application/pdf
- image/jpeg, image/png, image/webp, image/gif
- application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX)
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (XLSX)
- application/vnd.openxmlformats-officedocument.presentationml.presentation (PPTX)
- text/csv, text/markdown, text/html, text/xml
- application/json, application/zip

---

## Namespace: `rateLimits`

### Rate Limits Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `rateLimits.fileUploads` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `rateLimits.fileUploads.ipMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.fileUploads.ipWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.fileUploads.userMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.fileUploads.userWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.conversationsImport` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `rateLimits.conversationsImport.ipMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.conversationsImport.ipWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.conversationsImport.userMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.conversationsImport.userWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.stt` | ⚠️ TBD | ✅ IN MANIFEST | Object (Speech-to-Text) |
| `rateLimits.stt.ipMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.stt.ipWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.stt.userMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.stt.userWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.tts` | ⚠️ TBD | ✅ IN MANIFEST | Object (Text-to-Speech) |
| `rateLimits.tts.ipMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.tts.ipWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.tts.userMax` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `rateLimits.tts.userWindowInMinutes` | ⚠️ TBD | ✅ IN MANIFEST | Number |

---

## Namespace: `memory`

### Memory Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `memory.disabled` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `memory.personalize` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `memory.messageWindowSize` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `memory.tokenLimit` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `memory.validKeys` | ⚠️ TBD | ✅ IN MANIFEST | Array |
| `memory.agent` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `memory.agent.id` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `memory.agent.provider` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `memory.agent.model` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `memory.agent.instructions` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `memory.agent.model_parameters` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `memory.agent.model_parameters.temperature` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `memory.agent.model_parameters.top_p` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `memory.agent.model_parameters.frequency_penalty` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `memory.agent.model_parameters.max_tokens` | ⚠️ TBD | ✅ IN MANIFEST | Number |

---

## Namespace: `webSearch`

### Web Search Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `webSearch.searchProvider` | ⚠️ TBD | ✅ IN MANIFEST | String (serper/searxng) |
| `webSearch.serperApiKey` | `serperApiKey` | ✅ IN MANIFEST | String (env var) |
| `webSearch.searxngInstanceUrl` | `searxngInstanceUrl` | ✅ IN MANIFEST | URL |
| `webSearch.searxngApiKey` | `searxngApiKey` | ✅ IN MANIFEST | String |
| `webSearch.scraperType` | ⚠️ TBD | ✅ IN MANIFEST | String (firecrawl/jina) |
| `webSearch.firecrawlApiKey` | `firecrawlApiKey` | ✅ IN MANIFEST | String |
| `webSearch.firecrawlApiUrl` | `firecrawlApiUrl` | ✅ IN MANIFEST | URL |
| `webSearch.firecrawlOptions` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `webSearch.firecrawlOptions.formats` | ⚠️ TBD | ✅ IN MANIFEST | Array |
| `webSearch.firecrawlOptions.onlyMainContent` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `webSearch.firecrawlOptions.timeout` | ⚠️ TBD | ✅ IN MANIFEST | Number (ms) |
| `webSearch.firecrawlOptions.waitFor` | ⚠️ TBD | ✅ IN MANIFEST | Number (ms) |
| `webSearch.firecrawlOptions.blockAds` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `webSearch.firecrawlOptions.removeBase64Images` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `webSearch.firecrawlOptions.mobile` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `webSearch.firecrawlOptions.maxAge` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `webSearch.firecrawlOptions.proxy` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `webSearch.rerankerType` | ⚠️ TBD | ✅ IN MANIFEST | String (jina/cohere) |
| `webSearch.jinaApiKey` | `jinaApiKey` | ✅ IN MANIFEST | String |
| `webSearch.jinaApiUrl` | `jinaApiUrl` | ✅ IN MANIFEST | URL |
| `webSearch.cohereApiKey` | `cohereApiKey` | ✅ IN MANIFEST | String |
| `webSearch.scraperTimeout` | ⚠️ TBD | ✅ IN MANIFEST | Number (ms) |
| `webSearch.safeSearch` | ⚠️ TBD | ✅ IN MANIFEST | Number (0-2) |

---

## Namespace: `ocr`

### OCR Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `ocr.apiKey` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `ocr.baseURL` | ⚠️ TBD | ✅ IN MANIFEST | URL |
| `ocr.strategy` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `ocr.mistralModel` | ⚠️ TBD | ✅ IN MANIFEST | String |

---

## Namespace: `stt` (Speech-to-Text)

### STT Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `stt.provider` | ⚠️ TBD | ✅ IN MANIFEST | String (openai/whisper) |
| `stt.model` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `stt.apiKey` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `stt.baseURL` | ⚠️ TBD | ✅ IN MANIFEST | URL |
| `stt.language` | ⚠️ TBD | ✅ IN MANIFEST | String (language code) |
| `stt.streaming` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `stt.punctuation` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `stt.profanityFilter` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |

---

## Namespace: `tts` (Text-to-Speech)

### TTS Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `tts.provider` | ⚠️ TBD | ✅ IN MANIFEST | String (openai/elevenlabs) |
| `tts.model` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `tts.apiKey` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `tts.baseURL` | ⚠️ TBD | ✅ IN MANIFEST | URL |
| `tts.voice` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `tts.speed` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `tts.quality` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `tts.streaming` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |

---

## Namespace: `speech` (UI-Level Speech Configuration)

### Speech Tab Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `speech.preset` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `speech.preset.selected` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.preset.customVoice` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.preset.customLanguage` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `speech.speechTab.advancedMode` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `speech.speechTab.conversationMode` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `speech.speechTab.speechToText` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `speech.speechTab.speechToText.engineSTT` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab.speechToText.languageSTT` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab.speechToText.autoTranscribeAudio` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `speech.speechTab.speechToText.decibelValue` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `speech.speechTab.speechToText.autoSendText` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `speech.speechTab.textToSpeech` | ⚠️ TBD | ✅ IN MANIFEST | Object |
| `speech.speechTab.textToSpeech.engineTTS` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab.textToSpeech.voice` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab.textToSpeech.languageTTS` | ⚠️ TBD | ✅ IN MANIFEST | String |
| `speech.speechTab.textToSpeech.automaticPlayback` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |
| `speech.speechTab.textToSpeech.playbackRate` | ⚠️ TBD | ✅ IN MANIFEST | Number |
| `speech.speechTab.textToSpeech.cacheTTS` | ⚠️ TBD | ✅ IN MANIFEST | Boolean |

**Note:** In v1.3.0+, speech structure changed to include stt/tts under speech namespace

---

## Namespace: `actions`

### Actions Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `actions.allowedDomains` | ⚠️ TBD | ✅ IN MANIFEST | Array of domain strings |
| `actions.e2b_code_execution` | ⚠️ TBD | ✅ IN MANIFEST | Object (E2B config) |
| `actions.e2b_code_execution.type` | N/A | ⚠️ MISSING | String (typically "action") |
| `actions.e2b_code_execution.url` | N/A | ⚠️ MISSING | URL to proxy service |
| `actions.e2b_code_execution.description` | N/A | ⚠️ MISSING | String |

---

## Namespace: `registration`

### Registration Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `registration.allowedDomains` | ⚠️ TBD | ✅ IN MANIFEST | Array of email domains |
| `registration.socialLogins` | ⚠️ TBD | ✅ IN MANIFEST | Array of providers |

---

## Other YAML-Only Fields

### Tool Configuration
| YAML Path | Config Field | Status | Notes |
|-----------|--------------|--------|-------|
| `filteredTools` | ⚠️ TBD | ✅ IN MANIFEST | Array of tool names to hide |
| `includedTools` | ⚠️ TBD | ✅ IN MANIFEST | Array of tool names to show |

---

## Summary Statistics

### Coverage Analysis
- **Total YAML paths identified:** 174 (from field-manifest.json)
- **Currently in FIELD_REGISTRY with yamlPath:** ~10
- **Missing yamlPath annotations:** ~164
- **Complex nested objects:** ~15 (mcpServers, endpoints.custom, modelSpecs.list, etc.)

### Top-Level Namespaces
1. ✅ `version` - DEFINED
2. ✅ `cache` - DEFINED
3. ⚠️ `mcpServers` - MISSING (complex object)
4. ⚠️ `endpoints` - PARTIAL (agents paths defined, many missing)
5. ⚠️ `interface` - PARTIAL (customWelcome/Footer defined, ~30 missing)
6. ⚠️ `modelSpecs` - MISSING
7. ⚠️ `fileConfig` - MISSING
8. ⚠️ `rateLimits` - MISSING
9. ⚠️ `memory` - MISSING
10. ⚠️ `webSearch` - PARTIAL (some keys defined, options missing)
11. ⚠️ `ocr` - MISSING
12. ⚠️ `stt` - MISSING
13. ⚠️ `tts` - MISSING
14. ⚠️ `speech` - MISSING
15. ⚠️ `actions` - MISSING
16. ⚠️ `registration` - MISSING
17. ⚠️ `filteredTools` - MISSING
18. ⚠️ `includedTools` - MISSING

---

## Action Items

### Critical Gaps (Data Loss Risk)
These fields appear in YAML files but have NO corresponding registry entry:

1. **Agent Capabilities Array** - `endpoints.agents.capabilities`
   - Multiple capability flags (execute_code, file_search, etc.)
   
2. **Custom Endpoints** - `endpoints.custom[]`
   - Entire array of custom endpoint configurations
   - Critical for Ollama, local models, etc.

3. **Model Specs/Presets** - `modelSpecs.list[]`
   - Preset configurations for quick model selection
   
4. **File Configuration** - `fileConfig.endpoints.*`
   - Per-endpoint file limits and MIME type restrictions
   
5. **Rate Limits** - All `rateLimits.*` paths
   - Critical for production deployments

6. **Memory System** - All `memory.*` paths
   - Personalization and context window settings

7. **Speech Configuration** - All `speech.*`, `stt.*`, `tts.*` paths
   - Voice interface settings

8. **MCP Servers** - `mcpServers.*`
   - Model Context Protocol server configurations

### Recommended Migration Strategy

**Phase 1: Critical Fields (Prevent Data Loss)**
- Add yamlPath to all simple scalar fields first
- Focus on commonly-used sections: interface, webSearch, endpoints.agents

**Phase 2: Complex Objects**
- Design pattern for nested objects (modelSpecs, memory, speech)
- Consider array handling for endpoints.custom, mcpServers

**Phase 3: Advanced Features**
- Registration, actions, OCR, specialized rate limits
- Less commonly used but important for completeness

---

## Notes on Complex Structures

### Dynamic Objects (Key-Value Maps)
These structures use dynamic keys and need special handling:
- `mcpServers.*` - Server name is the key
- `endpoints.*` - Endpoint name is the key
- `fileConfig.endpoints.*` - Endpoint name is the key

### Arrays of Objects
These are arrays where each element is a complex object:
- `endpoints.custom[]` - Array of custom endpoint configs
- `modelSpecs.list[]` - Array of preset configs
- `endpoints.agents.capabilities[]` - Array of capability strings

### Transformer Requirements
Some fields need custom transformers:
- Environment variable arrays (comma-separated → array)
- Nested objects (YAML → flat config structure)
- Default value merging (YAML ?? defaults)

---

**Last Updated:** 2025-10-30  
**Source Commits:** 493c853, bc867a4, 22086d5, 8ce1322  
**Manifest Version:** 1.0 (174 fields)
