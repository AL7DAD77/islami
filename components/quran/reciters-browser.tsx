'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuranPlayer } from '@/lib/quran-player'
import { useLanguage } from '@/lib/language-context'

export function RecitersBrowser({ reciters }: { reciters: any[] }) {
  const { dict, locale } = useLanguage()
  const router = useRouter()
  const { changeReciter } = useQuranPlayer() 
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReciters = (reciters || []).filter((reciter) => {
    const name = reciter?.name || reciter?.reciter_name || ''
    const rewaya = reciter?.rewaya || reciter?.rewaya_name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || rewaya.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSelectReciter = (reciter: any) => {
    let serverUrl = reciter?.moshaf?.[0]?.server || reciter?.Server || reciter?.server || reciter?.server_url || 'https://server8.mp3quran.net/afs/'
    if (!serverUrl.endsWith('/')) serverUrl += '/'

    const reciterName = reciter?.name || reciter?.reciter_name || dict.quranComponents.recitersBrowser.defaultReciter

    try {
      localStorage.setItem('selected_reciter_server', serverUrl)
      localStorage.setItem('selected_reciter_name', reciterName)
    } catch (e) {}

    const fullReciter = {
      id: reciter.id || 1,
      name: reciterName,
      featured: false,
      moshaf: [{ id: 1, name: 'حفص', server: serverUrl, surahs: [] }]
    }
    
    changeReciter(fullReciter, serverUrl)
    router.back()
  }

  return (
    <div className="w-full flex flex-col gap-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder={dict.quranComponents.recitersBrowser.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary shadow-inner text-sm md:text-base"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">🔍</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
        {filteredReciters.length > 0 ? (
          filteredReciters.map((reciter, index) => {
            const name = reciter?.name || reciter?.reciter_name || dict.quranComponents.recitersBrowser.defaultReciter;
            const rewaya = reciter?.rewaya || reciter?.moshaf?.[0]?.name || 'حفص عن عاصم';

            return (
              <button
                type="button"
                key={reciter?.id || index}
                onClick={() => handleSelectReciter(reciter)}
                className="w-full bg-card border border-border hover:border-primary p-4 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:bg-secondary active:scale-[0.98] flex items-center justify-between text-start"
              >
                <div className="flex flex-col gap-1 pointer-events-none">
                  <h3 className="text-foreground font-bold text-base hover:text-primary transition-colors">{name}</h3>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit border border-primary/20">{rewaya}</span>
                </div>
                <div className="flex items-center gap-2 pointer-events-none">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{dict.quranComponents.recitersBrowser.moshafMurattal}</span>
                  <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base shadow-sm">▶</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">{dict.quranComponents.recitersBrowser.noResults}</div>
        )}
      </div>
    </div>
  );
}