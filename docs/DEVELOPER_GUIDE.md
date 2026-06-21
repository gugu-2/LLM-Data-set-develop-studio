# Developer Guide — Hypasia AI v2.0

> How to add new features, understand the codebase, and contribute effectively.

---

## Adding a New Feature

Every feature in Hypasia follows the same pattern: **one backend route file + one frontend page**.

### Step 1: Create the Backend Route

Create `src/hypasia/api/routes/myfeature.py`:

```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class MyRequest(BaseModel):
    input: str
    api_key: str = None

@router.post("/myfeature/run")
def run_myfeature(req: MyRequest):
    # Your logic here
    return {"status": "ok", "result": "..."}
```

### Step 2: Register in `main.py`

```python
# Add import
from hypasia.api.routes import myfeature

# Add router
app.include_router(myfeature.router, prefix="/api", tags=["My Feature"])
```

### Step 3: Create the Frontend Page

Create `web/src/pages/MyFeature.jsx`:

```jsx
import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export default function MyFeature() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/myfeature/run`, { input: 'test' });
      setResult(res.data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">My Feature</h1>
      <div className="surface-card">
        <button className="btn-primary" onClick={handleRun} disabled={loading}>
          {loading ? 'Running...' : 'Run'}
        </button>
        {result && <pre>{result}</pre>}
      </div>
    </div>
  );
}
```

### Step 4: Add to `App.jsx`

```jsx
// Import
import MyFeature from './pages/MyFeature'

// Add nav link (in the right SidebarSection)
<NavLink to="/myfeature" className={nav}>
  <StarIcon size={18} />My Feature
</NavLink>

// Add route (in <Routes>)
<Route path="/myfeature" element={<MyFeature />} />
```

---

## CSS Design System

Use these pre-built classes instead of writing raw CSS:

### Layout
```css
.surface-card     /* White card with border + shadow */
.fade-in          /* Smooth entry animation */
.input-group      /* Label + input vertical stack */
.btn-primary      /* Red action button */
.btn-secondary    /* Ghost secondary button */
.badge-gold       /* Gold tier badge */
.badge-silver     /* Silver tier badge */
.badge-rejected   /* Red reject badge */
```

### Typography
```css
.display-font     /* Bricolage Grotesque heading */
.mono             /* JetBrains Mono code text */
```

### Always use CSS variables for colors:
```css
color: var(--ink);           /* Dark text */
color: var(--charcoal);      /* Secondary text */
color: var(--primary);       /* Hypasia Red */
background: var(--canvas);   /* Page background */
background: var(--surface-card); /* Card background */
border: 1px solid var(--hairline); /* Subtle border */
```

---

## Reading Settings from localStorage

All API keys and settings are stored by the `Settings.jsx` page. To read them in any component:

```jsx
const settings = JSON.parse(localStorage.getItem('hypasia_settings') || '{}');
const apiKey = settings.gemini_api_key || '';
```

---

## Streaming API Responses

For long-running operations (like Synth Factory), use fetch + ReadableStream:

```jsx
const response = await fetch(`${API}/synth/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic, count }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(Boolean);
  for (const line of lines) {
    const pair = JSON.parse(line);
    setPairs(prev => [...prev, pair]); // Update state incrementally
  }
}
```

---

## Backend: Using the Gemini API

```python
from hypasia.config import cfg

def my_route(req):
    active_key = req.api_key or cfg.gemini_api_key
    if not active_key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    from google import genai
    client = genai.Client(api_key=active_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Your prompt here"
    )
    return {"text": response.text}
```

---

## Running Tests

```bash
# Run all backend tests
cd "hypasia-ai"
python -m pytest tests/ -v

# Run frontend lint
cd web
npm run lint

# Run frontend build check
cd web
npm run build
```

---

## Code Style

**Python:**
- Use `ruff` for formatting: `ruff check . --fix`
- Use Pydantic models for all request/response bodies
- Always wrap external API calls in try/except
- Use `Optional[str] = None` for optional fields

**JavaScript/React:**
- No `import React` (using React 18 JSX transform)
- Use `useCallback` for functions that are dependencies of `useEffect`
- Empty catch blocks must have a `/* comment */`
- Use `useState(() => ...)` initializer form for expensive initial values

---

## Environment Variables

All env vars are in `.env`:

```bash
# AI APIs
GEMINI_API_KEY=AIzaSy...
HF_TOKEN=hf_...

# Scoring defaults
DEFAULT_JUDGE=heuristic        # heuristic | ollama | gemini
DEFAULT_THRESHOLD=7.0
DEFAULT_OLLAMA_MODEL=llama3.1

# Server
HOST=0.0.0.0
PORT=8000
```

The `config.py` reads these via Pydantic Settings:

```python
from pydantic_settings import BaseSettings

class Config(BaseSettings):
    gemini_api_key: str = ""
    hf_token: str = ""
    default_judge: str = "heuristic"
    default_threshold: float = 7.0

    class Config:
        env_file = ".env"

cfg = Config()
```

---

## Common Pitfalls

| Problem | Fix |
|---------|-----|
| `CUDA out of memory` | Reduce `batch_size` to 1, increase `gradient_accumulation_steps` |
| `import trafilatura` fails | Run `pip install trafilatura` |
| `import playwright` fails | Run `pip install playwright && playwright install chromium` |
| Recharts shows `-1 width/height` | Add `minWidth: 0` to chart wrapper div and use `width="100%" height="100%"` on `ResponsiveContainer` |
| React hook exhaustive-deps warning | Wrap function in `useCallback` and add it to the dependency array |
| `Date.now()` in useState | Use initializer form: `useState(() => Date.now())` |
| CORS error from frontend | Ensure backend is running on `:8000` and CORS middleware is active |
| Ollama not responding | Check Ollama is running: `ollama serve` |
