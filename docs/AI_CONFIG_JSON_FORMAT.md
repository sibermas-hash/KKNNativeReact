# 📋 AI Configuration JSON Format

## Overview

Portal KKN menyediakan **JSON schema** yang comprehensive untuk konfigurasi AI provider dan model selection. Format ini bisa digunakan untuk:

- 📝 **Form Builder** - Generate forms dari JSON schema
- 📤 **Import/Export** - Backup & restore konfigurasi
- 🤖 **Automation** - Scripting dan batch configuration
- 📚 **Documentation** - Reference untuk administrator
- 🔄 **API Integration** - Programmatic configuration

---

## 📄 Files

| File | Fungsi |
|------|--------|
| `config/ai-config-schema.json` | JSON Schema (formal definition) |
| `config/ai-config-example.json` | Contoh configuration (ready to use) |

---

## 🎯 Structure Overview

```json
{
  "ai_config": {
    // Global AI settings
    "default_provider": "gemini",
    "enable_ai": true,
    "timeout_seconds": 15
  },

  "providers": {
    // API provider configurations
    "gemini": { ... },
    "openai": { ... },
    "anthropic": { ... }
  },

  "models": {
    // Model configurations per provider
    "gemini": {
      "text": { ... }
    },
    "openai": {
      "text": { ... },
      "vision": { ... }
    }
  },

  "usage_config": {
    // Track and limit usage
    "monthly_token_limit": 100000000,
    "monthly_budget_usd": 100
  },

  "feature_flags": {
    // Enable/disable features
    "student_assistant": true,
    "document_verification": true
  }
}
```

---

## 🔧 Configuration Sections

### 1. Global AI Config

```json
"ai_config": {
  "default_provider": "gemini",
  // Primary AI provider to use
  
  "fallback_provider": "openai",
  // Fallback if primary fails
  
  "enable_ai": true,
  // Enable/disable all AI features
  
  "cache_ttl_hours": 1,
  // Cache duration (minimize API calls)
  
  "timeout_seconds": 15,
  // API call timeout
  
  "max_retries": 3
  // Retry attempts on failure
}
```

### 2. Provider Configuration

```json
"providers": {
  "gemini": {
    "name": "gemini",
    // Provider identifier
    
    "api_key": "AIzaSy...",
    // API key (encrypted at rest)
    
    "enabled": true,
    // Enable/disable provider
    
    "primary": true,
    // Set as default provider
    
    "api_url": "https://generativelanguage.googleapis.com/v1",
    // Custom endpoint (if needed)
    
    "provider_specific": {
      // Provider-specific settings
      // For Azure: deployment, api_version
      // For Ollama: base_url
    }
  }
}
```

**Supported Providers:**
- `gemini` - Google Gemini
- `openai` - OpenAI GPT
- `anthropic` - Anthropic Claude
- `groq` - Groq (ultra-fast)
- `mistral` - Mistral AI
- `deepseek` - DeepSeek
- `cohere` - Cohere
- `alibaba` - Alibaba Qwen
- `azure` - Azure OpenAI
- `ollama` - Local Ollama

### 3. Model Configuration

```json
"models": {
  "gemini": {
    "text": {
      "type": "text",
      // Capability type: text, vision, audio, embeddings
      
      "default": "gemini-2.5-flash",
      // Default model for general use
      
      "cheapest": "gemini-2.5-flash-lite",
      // Fastest/cheapest for high-volume
      
      "smartest": "gemini-2.5-pro",
      // Most capable for complex tasks
      
      "models": [
        {
          "id": "gemini-2.5-flash",
          // Model identifier (as used in API)
          
          "name": "Gemini 2.5 Flash",
          // Human-readable name
          
          "tier": "standard",
          // Tier: lite, standard, pro, enterprise
          
          "latency_ms": 800,
          // Average response time
          
          "accuracy_score": 95,
          // Accuracy percentage (0-100)
          
          "cost_per_1m_tokens": 0.075,
          // Cost per 1M input tokens
          
          "context_window": 1000000,
          // Max context tokens
          
          "supported": true,
          // Currently supported
          
          "use_cases": [
            "Student assistance",
            "Real-time recommendations"
          ]
          // Recommended use cases
        }
      ]
    }
  }
}
```

### 4. Usage Tracking

```json
"usage_config": {
  "enable_usage_tracking": true,
  // Track all API calls
  
  "monthly_token_limit": 100000000,
  // Monthly cap (null = unlimited)
  
  "daily_token_limit": null,
  // Daily cap (null = unlimited)
  
  "monthly_budget_usd": 100
  // Monthly budget limit
}
```

### 5. Feature Flags

```json
"feature_flags": {
  "student_assistant": true,
  "document_verification": true,
  "report_analysis": true,
  "placement_recommendation": true,
  "notification_generation": true
}
```

---

## 📋 Use Cases & Examples

### Example 1: Production Setup (Gemini Primary)

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

### Example 2: Cost-Optimized (Groq Primary)

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
  "models": {
    "groq": {
      "text": {
        "default": "llama-3.1-70b-versatile",
        "cheapest": "mixtral-8x7b-32768",
        "smartest": "llama-3.1-70b-versatile"
      }
    }
  },
  "usage_config": {
    "monthly_budget_usd": 20
  }
}
```

### Example 3: Multi-Provider Failover

```json
{
  "ai_config": {
    "default_provider": "gemini",
    "fallback_provider": "openai",
    "enable_ai": true,
    "max_retries": 5
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

### Example 4: Local Development (Ollama)

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
  "models": {
    "ollama": {
      "text": {
        "default": "llama2",
        "cheapest": "phi",
        "smartest": "llama2"
      }
    }
  }
}
```

---

## 🔐 Security Considerations

### API Key Handling

```
❌ DO NOT:
- Commit config with real API keys to Git
- Store in plain text files
- Share with unauthorized users

✅ DO:
- Use environment variables for keys
- Encrypt keys in database
- Restrict access to admin panel
- Rotate keys regularly
- Audit all changes
```

### Example Secure Setup

```json
{
  "providers": {
    "gemini": {
      "api_key": "${GEMINI_API_KEY}",
      // Use environment variable reference
      
      "enabled": true,
      "primary": true
    }
  }
}
```

---

## 📤 Import/Export Usage

### Export Current Config

```php
// In controller or command
$config = SystemSetting::where('group', 'ai_settings')->get();
$jsonConfig = $config->mapToConfigFormat();
// Return or save as JSON file
```

### Import Config

```php
// Load JSON file
$json = json_decode(file_get_contents('config.json'), true);

// Process each provider
foreach ($json['providers'] as $provider => $settings) {
    SystemSetting::updateOrCreate(
        ['config_key' => "{$provider}_api_key"],
        ['value' => encrypt($settings['api_key'])]
    );
}
```

---

## 🎨 Form Generation (Frontend)

### React Form Component Pattern

```tsx
// Generate form from JSON schema
import { useFormBuilder } from '@/hooks/useFormBuilder';

export default function AiConfigForm() {
  const schema = require('@/config/ai-config-schema.json');
  const { form, fields } = useFormBuilder(schema);
  
  return (
    <form onSubmit={form.submit}>
      {fields.map(field => (
        <FormField key={field.name} {...field} />
      ))}
      <button type="submit">Save Configuration</button>
    </form>
  );
}
```

---

## ✅ Validation

### JSON Validation Command

```bash
# Validate example against schema
jsonschema -i config/ai-config-example.json config/ai-config-schema.json

# Expected: No errors
```

### PHP Validation

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($config, [
    'ai_config.default_provider' => 'required|string',
    'providers.*.name' => 'required|string',
    'providers.*.api_key' => 'required|string',
    'models.*.text.default' => 'required|string',
]);

if ($validator->fails()) {
    throw new ValidationException($validator);
}
```

---

## 📚 Model Comparison Data

### Built-in Model Metrics

Setiap model dalam `ai-config-example.json` sudah include:

| Metrik | Value | Contoh |
|--------|-------|--------|
| **latency_ms** | Response time | 800ms (gemini-2.5-flash) |
| **accuracy_score** | 0-100 | 95% (gemini-2.5-flash) |
| **cost_per_1m_tokens** | USD per 1M | $0.075 (gemini-2.5-flash) |
| **context_window** | Max tokens | 1M tokens |
| **use_cases** | Recommended | Array of use cases |

### Usage di UI

```tsx
// Filter models by cost
const cheapModels = providers['gemini'].text.models
  .sort((a, b) => a.cost_per_1m_tokens - b.cost_per_1m_tokens);

// Filter by speed
const fastModels = providers['gemini'].text.models
  .sort((a, b) => a.latency_ms - b.latency_ms);

// Filter by accuracy
const accurateModels = providers['gemini'].text.models
  .sort((a, b) => b.accuracy_score - a.accuracy_score);
```

---

## 🔄 Migration Guide

### From .env to JSON

```
BEFORE (.env):
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...

AFTER (JSON):
{
  "ai_config": { "default_provider": "gemini" },
  "providers": {
    "gemini": {
      "api_key": "AIzaSy..."
    }
  }
}
```

---

## 📖 Schema Reference

Full schema available at: `config/ai-config-schema.json`

Key definitions:
- `apiProvider` - Provider configuration structure
- `modelConfig` - Model capability configuration
- Provider-specific schemas for Azure, Ollama, etc.

---

## 💡 Tips & Best Practices

1. **Use environment variable references** in keys
2. **Validate JSON** before importing
3. **Keep backup** of working configurations
4. **Document custom provider_specific** settings
5. **Test failover** providers in staging
6. **Monitor usage** metrics regularly
7. **Rotate API keys** quarterly

---

**Status:** Ready for Production  
**Format:** JSON Schema Draft 7  
**Version:** 1.0
