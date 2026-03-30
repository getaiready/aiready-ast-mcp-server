import { useState, useMemo, useCallback } from 'react';
import { AIReadyConfig } from '@aiready/core/client';
import { DEFAULT_SETTINGS, ALIAS_MAP } from '../_components/constants';

export function useScanSettings(
  initialSettings: AIReadyConfig | null,
  onSave: (settings: AIReadyConfig | null) => Promise<void>
) {
  const mergedInitialSettings = useMemo<AIReadyConfig>(() => {
    if (!initialSettings) return DEFAULT_SETTINGS;

    const normalizedTools = (initialSettings.scan?.tools || []).map(
      (t) => ALIAS_MAP[t] || t
    );

    return {
      ...DEFAULT_SETTINGS,
      ...initialSettings,
      scan: {
        ...DEFAULT_SETTINGS.scan,
        ...initialSettings.scan,
        tools:
          normalizedTools.length > 0
            ? normalizedTools
            : DEFAULT_SETTINGS.scan!.tools,
      },
      tools: {
        ...DEFAULT_SETTINGS.tools,
        ...initialSettings.tools,
      },
      scoring: {
        ...DEFAULT_SETTINGS.scoring,
        ...initialSettings.scoring,
      },
    };
  }, [initialSettings]);

  const [settings, setSettings] = useState<AIReadyConfig>(
    mergedInitialSettings
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(mergedInitialSettings);
  }, [settings, mergedInitialSettings]);

  const handleToggleTool = useCallback((tool: string) => {
    setSettings((prev) => {
      const tools = prev.scan?.tools || [];
      const newTools = tools.includes(tool)
        ? tools.filter((t) => t !== tool)
        : [...tools, tool];
      return {
        ...prev,
        scan: { ...prev.scan, tools: newTools },
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await onSave(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }, [hasChanges, onSave, settings]);

  const handleReset = useCallback(async () => {
    if (confirm('Are you sure you want to reset to smart defaults?')) {
      await onSave(null);
      window.location.reload();
    }
  }, [onSave]);

  const updateToolConfig = useCallback((tool: string, config: any) => {
    setSettings((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        [tool]: {
          ...(prev.tools as any)?.[tool],
          ...config,
        },
      },
    }));
  }, []);

  const updateScanConfig = useCallback((config: any) => {
    setSettings((prev) => ({
      ...prev,
      scan: {
        ...prev.scan,
        ...config,
      },
    }));
  }, []);

  const updateScoringConfig = useCallback((config: any) => {
    setSettings((prev) => ({
      ...prev,
      scoring: {
        ...prev.scoring,
        ...config,
      },
    }));
  }, []);

  return {
    settings,
    setSettings,
    saving,
    success,
    hasChanges,
    handleToggleTool,
    handleSave,
    handleReset,
    updateToolConfig,
    updateScanConfig,
    updateScoringConfig,
  };
}
