import re

with open('resources/js/Pages/Admin/System/Settings/System.tsx', 'r') as f:
    content = f.read()

# We need to find the TAB CONTENT block
# Let's replace the <form onSubmit={handleSubmit} className="space-y-8 mt-6">
# inside the settings tab with a wrapper around both tabs.

# Actually, an easier way is to just define a helper component for the form render, 
# or copy the form block.

settings_map_regex = r"\{Object\.entries\(settings \|\| \{\}\)\.map\(\(\[group, items\]\) => \{"
settings_map_replacement = r"{Object.entries(settings || {}).filter(([g]) => g !== 'ai_settings').map(([group, items]) => {"

content = content.replace(settings_map_regex, settings_map_replacement)

# Next, we need to inject the ai_settings form into the AI tab.
# We will inject it right before the Digital Otonom footer.

footer_regex = r"(<ContentPanel title=\"Digital Otonom\" icon=\{Cpu\} theme=\"slate\">.*?</ContentPanel>)"
footer_replacement = r"""
            <div className="space-y-8">
              {Object.entries(settings || {}).filter(([g]) => g === 'ai_settings').map(([group, items]) => {
                const GroupIcon = GROUP_ICONS[group] || Layers;
                return (
                  <div key={group} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 w-full md:w-1/3 shrink-0">
                        <div className="h-10 w-10 bg-white border border-gray-200 text-gray-700 rounded flex items-center justify-center shadow-sm">
                          <GroupIcon size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{GROUP_TITLES[group] ?? group.toUpperCase()}</h3>
                          <p className="text-xs text-gray-700 hidden md:block mt-0.5">{items.length} pengaturan</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{GROUP_DESCRIPTIONS[group]}</p>
                      </div>
                    </div>

                    <div className="p-6 grid gap-6 md:grid-cols-2">
                      {items.map((setting) => {
                        const isSecret = setting.type === 'password';
                        const isLongText = setting.type === 'textarea';

                        return (
                          <div key={setting.id} className={clsx('space-y-2', isLongText && 'md:col-span-2')}>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">{LABEL_OVERRIDE[setting.config_key] || setting.label}</label>
                              <code className="text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{setting.config_key}</code>
                            </div>

                            <div className="relative">
                              {isLongText ? (
                                <textarea
                                  value={getValue(setting.id)}
                                  onChange={(event) => updateValue(setting.id, event.target.value)}
                                  rows={4}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a7a4a] focus:ring-[#1a7a4a] sm:text-sm text-gray-900"
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type={isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'}
                                    value={getValue(setting.id)}
                                    onChange={(event) => updateValue(setting.id, event.target.value)}
                                    className={clsx(
                                      'w-full rounded-md shadow-sm sm:text-sm',
                                      getError(setting.id) ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-300 text-gray-900 focus:ring-[#1a7a4a] focus:border-[#1a7a4a]',
                                      isSecret && 'pr-10 font-mono '
                                    )}
                                  />
                                  {isSecret && (
                                    <button type="button" onClick={() => setVisiblePasswords((prev) => ({ ...prev, [setting.id]: !prev[setting.id] }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-700 rounded">
                                      {visiblePasswords[setting.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {SETTING_HELPERS[setting.config_key] && (
                              <div className="flex gap-1.5 items-start mt-1">
                                <Info size={14} className="text-gray-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-700">{SETTING_HELPERS[setting.config_key]}</p>
                              </div>
                            )}

                            {getError(setting.id) && <p className="text-xs font-medium text-rose-500 mt-1">{getError(setting.id)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Perhatikan Perubahan</p>
                  <p className="text-xs text-gray-700">Perubahan pengaturan dapat memengaruhi alur sistem yang sedang berjalan secara langsung.</p>
                </div>
                <button type="button" onClick={handleSubmit} disabled={form.processing} className="inline-flex items-center gap-2 justify-center rounded-md border border-transparent bg-[#16a34a] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 disabled:opacity-50 transition-colors">
                  {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {form.processing ? 'Menyimpan...' : 'Simpan Kredensial AI'}
                </button>
              </div>
            </div>
\1"""

content = re.sub(footer_regex, footer_replacement, content, flags=re.DOTALL)

with open('resources/js/Pages/Admin/System/Settings/System.tsx', 'w') as f:
    f.write(content)
print("Done")
