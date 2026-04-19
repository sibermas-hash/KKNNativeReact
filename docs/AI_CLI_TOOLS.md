# 🖥️ AI Configuration via Terminal/CLI

Interact dengan AI API dan manage configuration langsung dari terminal tanpa perlu GUI.

---

## 🚀 Quick Start

### List Available Providers & Models
```bash
php artisan ai:list
# OR filter by provider:
php artisan ai:list --provider=gemini
```

Output:
```
🤖 Available AI Providers & Models

gemini (gemini) ✅
  Models:
    • default → gemini-2.5-flash ⭐ (PRIMARY)
    • cheapest → gemini-2.5-flash-lite 💰
    • smartest → gemini-2.5-pro 🧠

openai (openai) ❌
  Models:
    • default → gpt-4o ⭐ (PRIMARY)
    • cheapest → gpt-3.5-turbo 💰
    • smartest → gpt-4o 🧠

anthropic (anthropic) ❌
  Models:
    • default → claude-3-5-sonnet ⭐ (PRIMARY)
    • cheapest → claude-3-haiku 💰
    • smartest → claude-3-opus 🧠

Total providers: 3
```

### Test AI Connection dengan Model Tertentu
```bash
# Test dengan default model
php artisan ai:test

# Test dengan model spesifik
php artisan ai:test --model=smartest

# Test dengan prompt custom
php artisan ai:test --prompt="Apa nama saya?"

# Test provider lain
php artisan ai:test --provider=openai --model=gpt-4o

# Lihat full response detail
php artisan ai:test --verbose
```

---

## 📋 Command Reference

### 1. `ai:list` - List Providers & Models

**Usage:**
```bash
php artisan ai:list
php artisan ai:list --provider=gemini
```

**Output:**
- Nama provider
- Driver type
- API key status (✅ configured / ❌ not configured)
- Available models (default, cheapest, smartest)

**Options:**
- `--provider=PROVIDER` : Filter by specific provider

---

### 2. `ai:test` - Test AI Connection

Test connecting ke AI API dengan model pilihan.

**Basic Usage:**
```bash
php artisan ai:test
```

**Advanced Usage:**
```bash
# Test dengan model tertentu
php artisan ai:test --model=smartest

# Test dengan prompt custom
php artisan ai:test --prompt="Saya mahasiswa KKN di UIN Saizu"

# Test provider lain
php artisan ai:test --provider=openai --model=gpt-4o

# Lihat detail response
php artisan ai:test --verbose

# Kombinasi
php artisan ai:test \
  --model=smartest \
  --prompt="Analisa laporan KKN ini" \
  --provider=gemini \
  --verbose
```

**Options:**
- `--model=MODEL` : Model to test
  - `default` - Primary model
  - `cheapest` - Fast/cheap model
  - `smartest` - Most capable model
  - Or specific model name: `gemini-2.5-pro`, `gpt-4o`, etc.

- `--prompt=PROMPT` : Query/prompt (default: "Test prompt dari terminal")

- `--provider=PROVIDER` : AI provider (default: gemini)

- `--verbose` : Show full response detail (JSON)

**Example Outputs:**

✅ Success:
```
🤖 Portal KKN - AI Testing Tool

📊 Configuration:
  Provider: gemini
  Model: smartest
  Prompt: Berapa total mahasiswa KKN tahun ini?

🔄 Testing connection...
✅ AI Connection Success!

📝 Response:
Berdasarkan data sistem, total mahasiswa KKN tahun ini adalah 247 peserta...
```

❌ Failure:
```
❌ No API key configured for provider: gemini
Setup via: /admin/pengaturan-sistem → Monitor Intelegensi
```

---

### 3. `ai:config` - Manage API Keys

Set, get, remove, atau list API keys untuk providers.

**Usage:**
```bash
# Set API key (interactive)
php artisan ai:config set --provider=gemini

# Set API key (direct)
php artisan ai:config set --provider=gemini --key=AIzaSy...

# Get API key
php artisan ai:config get --provider=gemini

# Remove API key
php artisan ai:config remove --provider=gemini

# List all keys
php artisan ai:config list
```

**Options:**
- `action` : set | get | remove | list

- `--provider=PROVIDER` : Provider name (gemini, openai, anthropic, etc.)

- `--key=KEY` : API key value (for 'set' action)
  - If not provided, will prompt interactively
  - Secure input (hidden typing)

- `--force` : Skip confirmation prompts

**Examples:**

#### Set API Key (Interactive)
```bash
$ php artisan ai:config set --provider=gemini

Enter API key for gemini:
●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●

Provider: gemini
Config Key: gemini_api_key
Key Length: 39 chars

Proceed to save? (yes/no) [no]: yes

✅ API key saved for gemini
Config Key: gemini_api_key
Encrypted: Yes ✓
Cache invalidated: Yes ✓
```

#### Set API Key (Direct)
```bash
php artisan ai:config set \
  --provider=openai \
  --key=sk-proj-XXX... \
  --force
```

#### Get API Key
```bash
$ php artisan ai:config get --provider=gemini

API Key for: gemini
Masked: ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
Length: 39 chars
Stored: 2 hours ago
```

#### Remove API Key
```bash
$ php artisan ai:config remove --provider=gemini

Remove API key for gemini? (yes/no) [no]: yes

✅ API key removed for gemini
```

#### List All Keys
```bash
$ php artisan ai:config list

Configured AI Settings:

🔐 gemini_api_key → ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
🔐 openai_api_key → (empty)
🔐 anthropic_api_key → (empty)
📝 ai_provider → gemini
🔧 ai_model_default → gemini-2.5-flash
```

---

## 🎯 Real-World Scenarios

### Scenario 1: First Time Setup

```bash
# 1. List available providers
$ php artisan ai:list

# 2. Configure Gemini API
$ php artisan ai:config set --provider=gemini
# → Paste API key when prompted

# 3. Test connection
$ php artisan ai:test

# 4. Done! ✅
```

### Scenario 2: Testing Different Models

```bash
# List available models
$ php artisan ai:list --provider=gemini

# Test default model
$ php artisan ai:test --model=default --prompt="Test 1"

# Test cheapest model
$ php artisan ai:test --model=cheapest --prompt="Test 2"

# Test smartest model
$ php artisan ai:test --model=smartest --prompt="Test 3" --verbose

# Compare responses
```

### Scenario 3: Switching Provider

```bash
# Current provider
$ php artisan ai:config get --provider=gemini

# Setup new provider
$ php artisan ai:config set --provider=openai

# List all providers
$ php artisan ai:list

# Test new provider
$ php artisan ai:test --provider=openai --verbose
```

### Scenario 4: Quick Performance Test

```bash
# Time how fast different models respond
$ time php artisan ai:test --model=cheapest --prompt="Halo"
$ time php artisan ai:test --model=default --prompt="Halo"
$ time php artisan ai:test --model=smartest --prompt="Halo"
```

### Scenario 5: Batch Testing (Script)

```bash
#!/bin/bash
# test-all-models.sh

echo "Testing all AI models..."
echo ""

for model in "default" "cheapest" "smartest"; do
  echo "Testing: $model"
  php artisan ai:test \
    --model=$model \
    --prompt="Test prompt untuk model $model"
  echo "---"
done
```

Run:
```bash
chmod +x test-all-models.sh
./test-all-models.sh
```

---

## 🔐 Security Notes

### API Key Handling

```bash
# ✅ GOOD: Interactive input (hidden)
php artisan ai:config set --provider=gemini
# → Prompts for input securely

# ⚠️ CAUTION: Direct input (visible in history)
php artisan ai:config set --provider=gemini --key=AIzaSy...
# → Command appears in shell history

# Tips to avoid history:
# 1. Use interactive mode (don't use --key)
# 2. Clear history: history -c
# 3. Use a separate script file
```

### Key Encryption

All API keys stored in database are automatically encrypted:

```bash
# In database (encrypted):
config_key: gemini_api_key
config_value: eyJpdiI6IkFRQm...

# Decrypted only when needed
# Never displayed in plain text
```

---

## 📊 Comparison: Terminal vs GUI

| Feature | Terminal | GUI |
|---------|----------|-----|
| **Speed** | ⚡ Fast | 🐢 Slower |
| **Scripting** | ✅ Easy | ❌ Not easy |
| **Testing** | ✅ Batch | ❌ One-by-one |
| **Learning** | ⚠️ Steep | ✅ Easy |
| **Audit** | ✅ Logged | ⚠️ Limited |

---

## 🚀 DevOps Integration

### CI/CD Pipeline

```bash
#!/bin/bash
# .github/workflows/ai-test.yml

- name: Test AI Configuration
  run: |
    php artisan ai:list
    php artisan ai:test --prompt="CI/CD Test" --verbose
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

# 1. Deploy application
php artisan migrate

# 2. Verify AI setup
php artisan ai:list

# 3. Test connection
php artisan ai:test

echo "✅ Deployment complete"
```

### Monitoring

```bash
#!/bin/bash
# monitor-ai.sh (run daily)

echo "AI Health Check - $(date)"
php artisan ai:test --verbose >> ai-health.log 2>&1
```

---

## 🎓 Tips & Tricks

### 1. Get JSON Response (for scripting)

```bash
# Store response in variable
RESPONSE=$(php artisan ai:test --verbose 2>&1)

# Parse with jq
echo $RESPONSE | jq .
```

### 2. Pipe Prompts

```bash
# Read prompt from file
PROMPT=$(cat prompt.txt)
php artisan ai:test --prompt="$PROMPT" --verbose
```

### 3. Compare Providers

```bash
echo "Gemini:"
php artisan ai:test --provider=gemini --prompt="Apa itu KKN?" | head -3

echo ""
echo "OpenAI:"
php artisan ai:test --provider=openai --prompt="Apa itu KKN?" | head -3
```

### 4. Create Aliases (for .bashrc or .zshrc)

```bash
# Add to ~/.bashrc or ~/.zshrc

alias kkn-ai-list='php artisan ai:list'
alias kkn-ai-test='php artisan ai:test'
alias kkn-ai-config='php artisan ai:config'
```

Usage:
```bash
kkn-ai-list
kkn-ai-test --model=smartest --prompt="Test"
kkn-ai-config list
```

---

## ❓ FAQ

**Q: API key saya rusak/salah?**
```bash
php artisan ai:config remove --provider=gemini --force
php artisan ai:config set --provider=gemini
```

**Q: Ingin test semua model sekaligus?**
```bash
php artisan ai:test --model=default && \
php artisan ai:test --model=cheapest && \
php artisan ai:test --model=smartest
```

**Q: Bagaimana lihat API key?**
```bash
# Masked display:
php artisan ai:config get --provider=gemini

# Full display (hati-hati):
php artisan tinker
$key = \App\Models\KKN\SystemSetting::where('config_key', 'gemini_api_key')->first();
echo \Crypt::decryptString($key->value);
exit;
```

**Q: Bisa test dari script?**
```bash
#!/bin/bash
php artisan ai:test --prompt="$(cat test.txt)" --verbose
```

---

**Status:** ✅ Ready to use  
**Available Commands:** 3 (ai:list, ai:test, ai:config)  
**Updated:** April 19, 2026
