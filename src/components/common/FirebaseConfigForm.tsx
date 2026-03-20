import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { cn } from '@/lib/utils.ts'
import type { UserFirebaseConfig } from '@/types/user.ts'
import { validateFirebaseConfig } from '@/lib/validators.ts'
import { Loader2, Shield, AlertCircle, FileJson } from 'lucide-react'

interface FirebaseConfigFormProps {
  onValidate: (config: UserFirebaseConfig) => Promise<boolean>
  onConnect: (config: UserFirebaseConfig) => Promise<boolean>
  isProjectUsedCheck?: (projectId: string) => Promise<boolean>
}

function parseFirebaseConfig(text: string): UserFirebaseConfig | null {
  try {
    const parsed = JSON.parse(text)

    // Format 1: Android google-services.json
    if (parsed.project_info && parsed.client) {
      const projectInfo = parsed.project_info
      const client = parsed.client[0]
      return {
        apiKey: client?.api_key?.[0]?.current_key ?? '',
        projectId: projectInfo.project_id ?? '',
        appId: client?.client_info?.mobilesdk_app_id ?? '',
        storageBucket: projectInfo.storage_bucket ?? '',
        messagingSenderId: projectInfo.project_number ?? '',
      }
    }

    // Format 2: Web config object (direct or nested)
    const cfg = parsed.firebaseConfig ?? parsed.config ?? parsed
    if (cfg.apiKey || cfg.api_key) {
      return {
        apiKey: cfg.apiKey ?? cfg.api_key ?? '',
        projectId: cfg.projectId ?? cfg.project_id ?? '',
        appId: cfg.appId ?? cfg.app_id ?? '',
        storageBucket: cfg.storageBucket ?? cfg.storage_bucket ?? '',
        messagingSenderId: cfg.messagingSenderId ?? cfg.messaging_sender_id ?? '',
      }
    }

    return null
  } catch {
    // Format 3: JS snippet — const firebaseConfig = { apiKey: "...", ... }
    const apiKey = text.match(/apiKey:\s*["']([^"']+)["']/)?.[1] ?? ''
    const projectId = text.match(/projectId:\s*["']([^"']+)["']/)?.[1] ?? ''
    const appId = text.match(/appId:\s*["']([^"']+)["']/)?.[1] ?? ''
    const storageBucket = text.match(/storageBucket:\s*["']([^"']+)["']/)?.[1] ?? ''
    const messagingSenderId = text.match(/messagingSenderId:\s*["']([^"']+)["']/)?.[1] ?? ''

    if (apiKey && projectId && appId) {
      return { apiKey, projectId, appId, storageBucket, messagingSenderId }
    }
    return null
  }
}

export function FirebaseConfigForm({ onValidate, onConnect, isProjectUsedCheck }: FirebaseConfigFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<UserFirebaseConfig>({
    apiKey: '', projectId: '', appId: '', storageBucket: '', messagingSenderId: '',
  })
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [saving, setSaving] = useState(false)

  function updateField(field: keyof UserFirebaseConfig, value: string) {
    setConfig(c => ({ ...c, [field]: value }))
    setValidated(false)
    setError('')
  }

  function handlePaste(text: string) {
    setPasteText(text)
    const parsed = parseFirebaseConfig(text)
    if (parsed) {
      setConfig(parsed)
      setError('')
      setValidated(false)
    } else {
      setError('Could not parse Firebase config. Paste the config object or JSON file content.')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      handlePaste(text)
    }
    reader.readAsText(file)
  }

  async function handleValidate() {
    const err = validateFirebaseConfig(config)
    if (err) { setError(err); return }
    setError('')
    setValidating(true)

    if (isProjectUsedCheck) {
      const used = await isProjectUsedCheck(config.projectId)
      if (used) { setError('This project is already linked to another account'); setValidating(false); return }
    }

    const valid = await onValidate(config)
    setValidating(false)
    if (valid) { setValidated(true) }
    else { setError('Could not connect. Check your credentials.') }
  }

  async function handleConnect() {
    setSaving(true)
    const ok = await onConnect(config)
    setSaving(false)
    if (!ok) setError('Failed to save configuration.')
  }

  const fields: { key: keyof UserFirebaseConfig; label: string; placeholder: string; required: boolean }[] = [
    { key: 'apiKey', label: 'API Key', placeholder: 'AIza...', required: true },
    { key: 'projectId', label: 'Project ID', placeholder: 'my-project-123', required: true },
    { key: 'appId', label: 'App ID', placeholder: '1:123:web:abc...', required: true },
    { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'my-project.appspot.com', required: false },
    { key: 'messagingSenderId', label: 'Sender ID', placeholder: '123456789', required: true },
  ]

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      {validated && (
        <div className="flex items-center gap-1.5 rounded-md bg-income/10 px-3 py-2 text-[12px] text-income">
          <Shield className="h-3 w-3" />Connection verified!
        </div>
      )}

      <Tabs defaultValue="paste">
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1 text-xs">Paste Config</TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 text-xs">Upload JSON</TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 text-xs">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Firebase Config Snippet
            </Label>
            <textarea
              value={pasteText}
              onChange={e => handlePaste(e.target.value)}
              placeholder={'Paste your Firebase config here:\n\nconst firebaseConfig = {\n  apiKey: "...",\n  projectId: "...",\n  ...\n}'}
              className="flex h-28 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground/40 resize-none"
            />
          </div>
          {config.projectId && (
            <div className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-[11px]">
              Detected: <span className="font-mono font-semibold">{config.projectId}</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-3 space-y-3">
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/50 bg-secondary/20 px-4 py-6 text-center transition-colors hover:border-brand/30 hover:bg-secondary/40'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/80">
              <FileJson className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[12px] font-semibold">Upload Firebase config</p>
              <p className="text-[10px] text-muted-foreground">google-services.json (Android) or web config JSON</p>
            </div>
          </button>
          {config.projectId && (
            <div className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-[11px]">
              Loaded: <span className="font-mono font-semibold">{config.projectId}</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-3 space-y-2">
          {fields.map(f => (
            <div key={f.key} className="space-y-0.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {f.label}{f.required && ' *'}
              </Label>
              <Input
                value={config[f.key]}
                onChange={e => updateField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="h-8 rounded-md text-xs font-mono"
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {!validated ? (
          <Button size="sm" className="flex-1 bg-brand hover:bg-brand-light" onClick={handleValidate} disabled={validating || !config.apiKey}>
            {validating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Test Connection
          </Button>
        ) : (
          <Button size="sm" className="flex-1 bg-brand hover:bg-brand-light" onClick={handleConnect} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Save & Connect
          </Button>
        )}
      </div>
    </div>
  )
}
