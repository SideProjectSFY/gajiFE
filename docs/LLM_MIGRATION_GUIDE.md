# Local LLM Migration Guide

**Date**: 2025-11-13  
**Status**: Documentation Update - OpenAI → Local LLM

## Overview

This document tracks the migration from OpenAI's cloud-based GPT models to self-hosted Local LLM models (Llama-2, Mistral, or similar open-source models) across the Gaji project documentation.

## Benefits of Local LLM

- **Cost Reduction**: No API call costs; one-time hardware investment
- **Data Privacy**: All processing happens locally; no data sent to third parties
- **No Rate Limits**: Full control over inference capacity
- **Customization**: Fine-tune models for specific storytelling tasks
- **Offline Operation**: No dependency on external API availability

## Recommended Local LLM Models

| Model                   | Size               | Use Case              | Requirements   |
| ----------------------- | ------------------ | --------------------- | -------------- |
| **Llama-2-7B-Chat**     | 7B params (~8GB)   | General conversations | 8GB+ RAM/VRAM  |
| **Mistral-7B-Instruct** | 7B params (~8GB)   | Instruction following | 8GB+ RAM/VRAM  |
| **Llama-2-13B-Chat**    | 13B params (~16GB) | Higher quality        | 16GB+ RAM/VRAM |
| **CodeLlama-7B**        | 7B params (~8GB)   | Code generation       | 8GB+ RAM/VRAM  |

## Key Technical Changes

### 1. API Integration

**Before (OpenAI)**:

```python
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[...],
    stream=True
)
```

**After (Local LLM)**:

```python
from llama_cpp import Llama
llm = Llama(
    model_path=os.getenv("LLM_MODEL_PATH"),
    n_ctx=4096,
    n_threads=8
)
response = llm.create_chat_completion(
    messages=[...],
    stream=True
)
```

### 2. Environment Variables

**Before**:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
```

**After**:

```bash
LLM_MODEL_PATH=/path/to/llama-2-7b-chat.gguf
LLM_MODEL_TYPE=llama
LLM_MAX_TOKENS=4096
LLM_CONTEXT_LENGTH=4096
LLM_THREADS=8
```

### 3. Service Names

| Old Name      | New Name                | Purpose                |
| ------------- | ----------------------- | ---------------------- |
| OpenAIService | LLMService              | Core inference service |
| OpenAI API    | Local LLM               | Model provider         |
| GPT-4 Turbo   | Llama-2-7B / Mistral-7B | Default model          |
| tiktoken      | Custom tokenizer        | Token counting         |

## Documentation Files Updated

### ✅ Completed

1. **README.md**

   - Architecture diagram: "OpenAI API" → "Local LLM"
   - Technology stack table
   - Acknowledgments section

2. **docs/PRD.md**

   - Context management section
   - Three-week timeline section

3. **docs/DEVELOPMENT_SETUP.md**

   - AI Backend dependencies
   - Environment configuration
   - Docker compose configuration
   - Troubleshooting section

4. **docs/epics/epic-4-conversation-system.md**

   - Story 4.2 title and description
   - Acceptance criteria
   - Service wrapper naming
   - Unit test references

5. **docs/stories/epic-0-story-0.2-fastapi-ai-service-setup.md** ✅

   - Description: GPT-4 API → Local LLM
   - Acceptance criteria: OpenAI client → Local LLM client
   - Project structure: openai_client.py → llm_client.py
   - Environment variables: OPENAI_API_KEY → LLM_MODEL_PATH/LLM_MODEL_TYPE
   - Health check: OpenAI client → Local LLM client

6. **docs/stories/epic-2-story-2.1-scenario-to-prompt-engine.md** ✅

   - Description: GPT-4 system prompts → Local LLM system prompts
   - Prompt quality testing: GPT-4 → Local LLM

7. **docs/stories/epic-4-story-4.2-message-streaming-ai-integration.md** ✅

   - Description: GPT-4 responses → Local LLM responses
   - Acceptance criteria: GPT-4 streaming → Local LLM streaming
   - Message flow: GPT-4 Streaming API → Local LLM Streaming API
   - Context window: 8000 tokens (GPT-4) → 4096 tokens (Local LLM)

8. **docs/stories/epic-0-story-0.6-inter-service-health-check.md** ✅

   - Acceptance criteria: OpenAI API key validation → Local LLM model loading
   - Health indicators: openai_api → llm_model

9. **docs/stories/epic-2-story-2.4-scenario-context-testing-refinement.md** ✅

   - Acceptance criteria: GPT-4 as judge → Local LLM as judge
   - Code examples: openai.ChatCompletion → llm_client.generate
   - Automated evaluation: GPT-4 judge → Local LLM judge

10. **docs/stories/epic-0-story-0.7-novel-ingestion-pipeline.md** ✅

    - Passage size optimization: GPT-4 context windows → Local LLM context windows

11. **docs/stories/epic-2-story-2.3-multi-timeline-character-consistency.md** ✅

    - Acceptance criteria: GPT-4 extraction → Local LLM extraction
    - Code examples: openai.ChatCompletion → llm_client.generate
    - Performance: GPT-4 call → Local LLM call
    - Future inference: GPT-4 → Local LLM

12. **docs/stories/epic-2-story-2.2-conversation-context-window-manager.md** ✅

    - Description: GPT-4 token limits → Local LLM token limits
    - Acceptance criteria: tiktoken library → custom tokenizer
    - Context strategy: 8000 tokens → 4096 tokens
    - Token counting: tiktoken.encoding_for_model("gpt-4") → custom tokenizer
    - Compression: GPT-3.5-turbo → Local LLM
    - Validation: GPT-4 tokenization → Local LLM tokenization

13. **docs/stories/epic-0-story-0.5-docker-configuration.md** ✅

    - AI service environment variables: OPENAI_API_KEY → LLM_MODEL_PATH, LLM_MODEL_TYPE
    - Added volume mount for models: ./models:/models

14. **docs/stories/epic-0-story-0.8-llm-character-extraction.md** ✅
    - Analysis metadata: gpt-4o-mini → llama-2-7b-chat
    - Rate limiting: OpenAI → Local LLM
    - Code examples: AsyncOpenAI → LocalLLMClient
    - Model name: gpt-4o-mini → llama-2-7b-chat
    - API calls: openai.ChatCompletion → llm_client.generate
    - Cost calculation: OpenAI API cost → Local LLM compute cost
    - Dependencies: OpenAI integration → Local LLM integration
    - Processing cost: <$2.00 → <$0.50

### ✅ Completed Updates

The following documentation files have been successfully migrated:

#### Epic Files (5 files - 100% complete)

1. **docs/epics/epic-0-project-setup-infrastructure.md** ✅

   - 8 replacements completed
   - Updated: Dependencies, Docker env vars, health checks, cost targets, embeddings

2. **docs/epics/epic-1-what-if-scenario-foundation.md** ✅

   - 4 replacements completed
   - Updated: Validation system, cost calculations, dependencies, testing

3. **docs/epics/epic-2-ai-character-adaptation.md** ✅

   - 7 replacements completed
   - Updated: Token counting (tiktoken → custom), context window, model selection, testing

4. **docs/epics/epic-3-scenario-discovery-forking.md** ✅

   - 1 replacement completed
   - Updated: Risk mitigation references

5. **docs/epics/epic-4-conversation-system.md** ✅
   - 7 replacements completed
   - Updated: Streaming, cost monitoring, rate limiting, service names, testing

#### Security Documentation (1 file - 100% complete)

6. **docs/SECURITY.md** ✅
   - 13 replacements completed
   - Updated: Attack surface, circuit breaker, CSP headers, env vars, model security, data processing

### 🔄 Requires Manual Update

The following files contain additional references that should be updated:

#### Medium Priority (Remaining)

7. **docs/API_DOCUMENTATION.md**

   - AI service endpoints
   - Request/response examples

8. **docs/architecture.md**
   - Technology stack references
   - AI service description

## Search and Replace Patterns

### Pattern 1: Model Names

```bash
# Find
GPT-4 Turbo|gpt-4-turbo-preview|GPT-4|gpt-4|GPT-3.5-turbo|gpt-3.5-turbo|GPT-4o|GPT-4 mini

# Replace with
Local LLM (Llama-2-7B/Mistral-7B)
```

### Pattern 2: Service Names

```bash
# Find
OpenAI|OpenAIService|OpenAI API

# Replace with
Local LLM|LLMService|Local LLM
```

### Pattern 3: Environment Variables

```bash
# Find
OPENAI_API_KEY|OPENAI_MODEL|OPENAI_MAX_TOKENS|OPENAI_TEMPERATURE

# Replace with
LLM_MODEL_PATH|LLM_MODEL_TYPE|LLM_MAX_TOKENS|LLM_TEMPERATURE
```

### Pattern 4: Cost References

```bash
# Find
"$X per million tokens"|"API costs"|"OpenAI rate limits"

# Replace with
"Local compute costs"|"Infrastructure costs"|"Model inference capacity"
```

### Pattern 5: Libraries

```bash
# Find
from openai import|import openai|tiktoken

# Replace with
from llama_cpp import|import llama_cpp|custom tokenizer
```

## Cost Comparison

### OpenAI (Before)

- **GPT-4 Turbo**: $10/1M input, $30/1M output tokens
- **GPT-3.5 Turbo**: $0.50/1M input, $1.50/1M output tokens
- **Monthly cost** (10K conversations): $35-420/month

### Local LLM (After)

- **Initial investment**:
  - GPU: RTX 3090 (24GB) ~$1,500 or RTX 4090 (24GB) ~$1,800
  - OR CPU-only: High-end CPU with 32GB+ RAM ~$800-1,200
- **Monthly cost**:
  - Electricity: ~$20-50/month (24/7 operation)
  - Cooling: included
- **Break-even**: 3-6 months for high usage scenarios

## Performance Considerations

### Latency

- **OpenAI GPT-4**: ~500-1000ms first token, 50-100 tokens/sec
- **Local Llama-2-7B** (GPU): ~200-500ms first token, 30-60 tokens/sec
- **Local Llama-2-7B** (CPU): ~1000-2000ms first token, 5-15 tokens/sec

### Recommendations

- Use GPU acceleration for production (CUDA/Metal)
- Use quantized models (GGUF format) for efficiency
- Implement model caching to reduce loading time
- Consider batch processing for non-real-time tasks

## Implementation Checklist

- [x] Update README.md
- [x] Update docs/PRD.md
- [x] Update docs/DEVELOPMENT_SETUP.md
- [x] Update docs/epics/epic-4-conversation-system.md (partial)
- [x] Update docs/stories/epic-0-story-0.2-fastapi-ai-service-setup.md
- [x] Update docs/stories/epic-2-story-2.1-scenario-to-prompt-engine.md
- [x] Update docs/stories/epic-4-story-4.2-message-streaming-ai-integration.md
- [x] Update docs/stories/epic-0-story-0.6-inter-service-health-check.md
- [x] Update docs/stories/epic-2-story-2.4-scenario-context-testing-refinement.md
- [x] Update docs/stories/epic-0-story-0.7-novel-ingestion-pipeline.md
- [x] Update docs/stories/epic-2-story-2.3-multi-timeline-character-consistency.md
- [x] Update docs/stories/epic-2-story-2.2-conversation-context-window-manager.md
- [x] Update docs/stories/epic-0-story-0.5-docker-configuration.md
- [x] Update docs/stories/epic-0-story-0.8-llm-character-extraction.md
- [ ] Update docs/SECURITY.md
- [ ] Update docs/epics/epic-1-what-if-scenario-foundation.md
- [ ] Update docs/epics/epic-2-ai-character-adaptation.md
- [ ] Update docs/epics/epic-0-project-setup-infrastructure.md
- [ ] Update docs/epics/epic-3-scenario-discovery-forking.md
- [ ] Update all story files in docs/stories/
- [ ] Update docs/API_DOCUMENTATION.md
- [ ] Update docs/architecture.md
- [ ] Update .env.example files
- [ ] Update docker-compose.yml
- [ ] Update requirements.txt (ai-backend)
- [ ] Create LLM model download scripts
- [ ] Add model fine-tuning documentation

## Next Steps

1. **Complete Documentation Updates**: Use the search patterns above to find and replace remaining references
2. **Update Code**: Modify actual Python/Java code to use llama-cpp-python or similar libraries
3. **Model Selection**: Download and test Llama-2-7B-Chat or Mistral-7B-Instruct
4. **Performance Testing**: Benchmark local LLM vs original OpenAI performance
5. **Fine-tuning**: Consider fine-tuning models on story-specific datasets
6. **Deployment**: Update Railway/Docker configurations for GPU support if needed

## Resources

- **Llama 2**: https://huggingface.co/meta-llama
- **Mistral**: https://huggingface.co/mistralai
- **llama-cpp-python**: https://github.com/abetlen/llama-cpp-python
- **Transformers**: https://huggingface.co/docs/transformers
- **Model Quantization**: https://github.com/ggerganov/llama.cpp

---

**Note**: This migration significantly reduces operational costs while increasing data privacy and control. The main trade-off is initial setup complexity and hardware requirements.
