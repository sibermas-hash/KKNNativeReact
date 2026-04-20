# 🚀 AI Configuration JSON - Quick Reference

## Files Tersedia

| File | Fungsi |
|------|--------|
| [`config/ai-config-schema.json`](../config/ai-config-schema.json) | Formal JSON Schema |
| [`config/ai-config-example.json`](../config/ai-config-example.json) | Full example config |
| [`docs/AI_CONFIG_JSON_FORMAT.md`](AI_CONFIG_JSON_FORMAT.md) | Detailed documentation |

---

## 🎯 Minimal Configuration

```json
{
  "ai_config": {
    "default_provider": "gemini",
    "enable_ai": true
  },
  "providers": {
    "gemini": {
      "name": "gemini",
      "api_key": "AIzaSy...",
      "enabled": true,
      "primary": true
    }
  },
  "models": {
    "gemini": {
      "text": {
        "default": "gemini-2.5-flash",
        "cheapest": "gemini-2.5-flash-lite",
        "smartest": "gemini-2.5-pro"
      }
    }
  }
}
```

---

## 📊 Scenario Configurations

### Scenario 1: Production (Recommended)

**Goal:** Reliable, balanced, good pricing

```json
{
  "ai_config": {
    "default_provider": "gemini",
    "fallback_provider": "openai",
    "enable_ai": true,
    "timeout_seconds": 15,
    "max_retries": 3
  },
  "providers": {
    "gemini": {
      "name": "gemini",
      "api_key": "AIzaSy...",
      "enabled": true,
      "primary": true
    },
    "openai": {
      "name": "openai",
      "api_key": "sk-proj-...",
      "enabled": true,
      "primary": false
    }
  },
  "usage_config": {
    "monthly_budget_usd": 100
  }
}
```

**Best for:** Mature applications, important features

---

### Scenario 2: Budget-Optimized

**Goal:** Minimize cost, use fast & cheap providers

```json
{
  "ai_config": {
    "default_provider": "groq",
    "fallback_provider": "mistral",
    "enable_ai": true
  },
  "providers": {
    "groq": {
      "name": "groq",
      "api_key": "gsk-...",
      "enabled": true,
      "primary": true
    },
    "mistral": {
      "name": "mistral",
      "api_key": "...",
      "enabled": true,
      "primary": false
    }
  },
  "usage_config": {
    "monthly_budget_usd": 20
  }
}
```

**Best for:** High-volume, non-critical tasks, budget-conscious

---

### Scenario 3: Enterprise

**Goal:** Maximum reliability, compliance, support

```json
{
  "ai_config": {
    "default_provider": "azure",
    "fallback_provider": "anthropic",
    "enable_ai": true,
    "max_retries": 5
  },
  "providers": {
    "azure": {
      "name": "azure",
      "api_key": "...",
      "enabled": true,
      "primary": true,
      "api_url": "https://your-resource.openai.azure.com/",
      "provider_specific": {
        "deployment": "gpt-4o",
        "api_version": "2024-10-21"
      }
    },
    "anthropic": {
      "name": "anthropic",
      "api_key": "sk-ant-...",
      "enabled": true,
      "primary": false
    }
  }
}
```

**Best for:** Enterprise, regulated industries, HIPAA/SOC2

---

### Scenario 4: Development

**Goal:** Fast iteration, local testing

```json
{
  "ai_config": {
    "default_provider": "ollama",
    "enable_ai": true,
    "timeout_seconds": 30
  },
  "providers": {
    "ollama": {
      "name": "ollama",
      "api_key": "",
      "enabled": true,
      "primary": true,
      "provider_specific": {
        "base_url": "http://localhost:11434"
      }
    }
  },
  "usage_config": {
    "enable_usage_tracking": false
  }
}
```

**Best for:** Local development, testing, no API costs

---

### Scenario 5: Multi-Model Comparison

**Goal:** Test different models, find best fit

```json
{
  "ai_config": {
    "default_provider": "gemini",
    "enable_ai": true
  },
  "providers": {
    "gemini": {
      "name": "gemini",
      "api_key": "AIzaSy...",
      "enabled": true
    },
    "openai": {
      "name": "openai",
      "api_key": "sk-proj-...",
      "enabled": true
    },
    "anthropic": {
      "name": "anthropic",
      "api_key": "sk-ant-...",
      "enabled": true
    },
    "groq": {
      "name": "groq",
      "api_key": "gsk-...",
      "enabled": true
    }
  }
}
```

**Best for:** Benchmarking, evaluation, finding optimal provider

---

## 🔑 Provider-Specific Setup

### Gemini

```json
{
  "name": "gemini",
  "api_key": "AIzaSy...",
  "enabled": true,
  "primary": true,
  "api_url": "https://generativelanguage.googleapis.com/v1"
}
```

Get key: https://aistudio.google.com/apikey

---

### OpenAI

```json
{
  "name": "openai",
  "api_key": "sk-proj-...",
  "enabled": true,
  "api_url": "https://api.openai.com/v1"
}
```

Get key: https://platform.openai.com/api-keys

---

### Anthropic

```json
{
  "name": "anthropic",
  "api_key": "sk-ant-...",
  "enabled": true,
  "api_url": "https://api.anthropic.com"
}
```

Get key: https://console.anthropic.com/account/keys

---

### Azure OpenAI

```json
{
  "name": "azure",
  "api_key": "your-api-key",
  "enabled": true,
  "api_url": "https://your-resource.openai.azure.com/",
  "provider_specific": {
    "deployment": "gpt-4o",
    "api_version": "2024-10-21"
  }
}
```

Setup: Azure Portal → Cognitive Services → OpenAI

---

### Groq (Ultra-Fast)

```json
{
  "name": "groq",
  "api_key": "gsk-...",
  "enabled": true,
  "api_url": "https://api.groq.com/openai/v1"
}
```

Get key: https://console.groq.com/keys

---

### Ollama (Local)

```json
{
  "name": "ollama",
  "api_key": "",
  "enabled": true,
  "provider_specific": {
    "base_url": "http://localhost:11434"
  }
}
```

Install: https://ollama.ai

---

## 📋 Model Selection Presets

### Preset: Speed Priority

```json
"models": {
  "gemini": {
    "text": {
      "default": "gemini-2.5-flash-lite",
      "cheapest": "gemini-2.5-flash-lite",
      "smartest": "gemini-2.5-flash"
    }
  }
}
```

---

### Preset: Quality Priority

```json
"models": {
  "gemini": {
    "text": {
      "default": "gemini-2.5-pro",
      "cheapest": "gemini-2.5-flash",
      "smartest": "gemini-2.5-pro"
    }
  }
}
```

---

### Preset: Cost Priority

```json
"models": {
  "groq": {
    "text": {
      "default": "mixtral-8x7b-32768",
      "cheapest": "mixtral-8x7b-32768",
      "smartest": "llama-3.1-70b-versatile"
    }
  }
}
```

---

## 🎯 Model Selection Reference

### By Speed (Fastest First)

| Model | Latency | Provider |
|-------|---------|----------|
| mixtral-8x7b | 150ms | Groq |
| llama-3.1-70b | 200ms | Groq |
| gpt-3.5-turbo | 400ms | OpenAI |
| mistral-small | 300ms | Mistral |
| gemini-2.5-flash-lite | 300ms | Gemini |
| deepseek-chat | 1000ms | DeepSeek |

### By Accuracy (Most Accurate First)

| Model | Accuracy | Provider |
|-------|----------|----------|
| claude-3-opus | 98% | Anthropic |
| gemini-2.5-pro | 98% | Gemini |
| gpt-4-turbo | 96% | OpenAI |
| mistral-large | 95% | Mistral |

### By Cost (Cheapest First)

| Model | Cost/1M | Provider |
|-------|---------|----------|
| mistral-small | $0.02 | Mistral |
| qwen-turbo | $0.02 | Alibaba |
| mixtral-8x7b | $0.03 | Groq |
| gpt-3.5-turbo | $0.01 | OpenAI |

---

## ✅ Configuration Checklist

```
□ Choose primary provider
□ Get API key from provider
□ Choose fallback provider (optional)
□ Get fallback API key (if using)
□ Select models for default, cheapest, smartest
□ Set usage limits (budget, tokens)
□ Enable feature flags needed
□ Test configuration
□ Set cache TTL (1 hour recommended)
□ Document changes
```

---

## 🔐 Security Checklist

```
□ Use environment variables for API keys
□ Never commit real keys to Git
□ Encrypt keys at rest
□ Restrict admin access
□ Audit all configuration changes
□ Rotate keys quarterly
□ Monitor for unusual usage
□ Implement rate limiting
□ Backup configuration regularly
```

---

## 🧪 Testing Configuration

### Validate JSON

```bash
# Validate against schema
jsonschema -i config/ai-config-example.json config/ai-config-schema.json
```

### Test via CLI (When Available)

```bash
# Test gemini connection
php artisan ai:test --provider gemini

# Test all enabled providers
php artisan ai:test --all

# Test specific model
php artisan ai:test --model gemini-2.5-flash
```

### Manual Test

```php
// In tinker
$ai = app('AI');
$result = $ai->generate('test query');
echo $result;
```

---

## 📈 Usage Monitoring

Monitor dalam admin dashboard:
- Total API calls
- Token usage (input/output)
- Cost tracking
- Error rates
- Response times

---

## 🔄 Updating Configuration

### Via Admin Panel

1. Visit `/admin/pengaturan-sistem`
2. Update provider/model settings
3. Click "Simpan Pengaturan AI"
4. Cache auto-invalidates

### Via JSON Import (Future)

```bash
php artisan ai:import config/ai-config.json
```

### Via Database

```sql
UPDATE system_settings 
SET config_value = encrypt('new_value')
WHERE config_key = 'gemini_api_key';
```

---

## 📚 Reference Links

- [Full Documentation](AI_CONFIG_JSON_FORMAT.md)
- [JSON Schema](../config/ai-config-schema.json)
- [Example Config](../config/ai-config-example.json)
- [Setup Guide](GEMINI_AI_SETUP_GUIDE.md)
- [Model Selection Guide](GEMINI_MODEL_SELECTION_GUIDE.md)

---

**Quick Start:** Copy one scenario above and customize for your needs!
