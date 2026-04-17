import re

with open('resources/js/Pages/Admin/System/Settings/System.tsx', 'r') as f:
    content = f.read()

# 1. Remove ai_settings from the settings tab loop
settings_map_regex = r"\{Object\.entries\(settings \|\| \{\}\)\.map\(\(\[group, items\]\) => \{"
settings_map_replacement = r"{Object.entries(settings || {}).filter(([g]) => g !== 'ai_settings').map(([group, items]) => {"
content = content.replace(settings_map_regex, settings_map_replacement)

# 2. Add the AI Config Form into the AI Monitor Tab
# Find the end of the AI Monitor top metrics grid
ai_grid_regex = r"(<MetricCore icon=\{History\} label=\"Riwayat Pemulihan\".*?</div>)"
ai_grid_replacement = r"""\1

            {/* AI CONFIGURATION FORM (Injected via PRD) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-1/3 shrink-0">
                  <div className="h-10 w-10 bg-white border border-gray-200 text-gray-700 rounded flex items-center justify-center shadow-sm">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Kecerdasan Buatan (AI)</h3>
                    <p className="text-xs text-gray-700 hidden md:block mt-0.5">Konfigurasi & Koneksi API</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Konfigurasi teknologi kecerdasan buatan untuk membantu proses verifikasi dan pemulihan otonom.</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                 {/* This will be handled by a specialized React component logic we will inject manually */}
                 <AiConfigPanel settings={settings?.ai_settings || []} />
              </div>
            </div>
"""

content = re.sub(ai_grid_regex, ai_grid_replacement, content, flags=re.DOTALL)

with open('resources/js/Pages/Admin/System/Settings/System.tsx', 'w') as f:
    f.write(content)
