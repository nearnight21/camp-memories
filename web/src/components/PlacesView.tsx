import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Globe2 } from 'lucide-react';
import { Memory } from '../types';

interface PlacesViewProps {
  memories: Memory[];
  onSelectMemory: (m: Memory) => void;
}

const countryOf = (m: Memory): string => m.country?.trim() || '未标注';
const cityOf = (m: Memory): string => m.city?.trim() || '未标注';

export default function PlacesView({ memories, onSelectMemory }: PlacesViewProps) {
  const [viewCountry, setViewCountry] = useState<string | null>(null);
  const [viewCity, setViewCity] = useState<string | null>(null);

  const countries = Array.from(new Set(memories.map(countryOf))).sort((a, b) => {
    if (a === '未标注') return 1;
    if (b === '未标注') return -1;
    return a.localeCompare(b, 'zh');
  });

  const countryMemories =
    viewCountry === null ? [] : memories.filter((m) => countryOf(m) === viewCountry);
  const cities = Array.from(new Set(countryMemories.map(cityOf))).sort((a, b) => {
    if (a === '未标注') return 1;
    if (b === '未标注') return -1;
    return a.localeCompare(b, 'zh');
  });

  const cityMemories =
    viewCity === null
      ? []
      : countryMemories
          .filter((m) => cityOf(m) === viewCity)
          .sort((a, b) => b.date.localeCompare(a.date));

  const backToCountries = () => {
    setViewCountry(null);
    setViewCity(null);
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-[#1A1A18] text-[#E8DEC8]">
      <div className="max-w-5xl mx-auto px-5 pt-20 pb-24">
        {/* 面包屑 */}
        <nav className="flex items-center gap-1.5 text-xs font-mono text-[#9C947C] mb-6">
          <button
            onClick={backToCountries}
            className={`hover:text-amber-400 transition-colors ${viewCountry === null ? 'text-amber-400' : ''}`}
          >
            <Globe2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
            地区
          </button>
          {viewCountry !== null && (
            <>
              <span>/</span>
              <button
                onClick={() => setViewCity(null)}
                className={`hover:text-amber-400 transition-colors ${viewCity === null ? 'text-amber-400' : ''}`}
              >
                {viewCountry}
              </button>
            </>
          )}
          {viewCity !== null && (
            <>
              <span>/</span>
              <span className="text-amber-400">{viewCity}</span>
            </>
          )}
        </nav>

        {memories.length === 0 ? (
          <p className="text-sm text-[#9C947C] font-mono pt-16 text-center">
            还没有记忆。回到软木板钉入第一张吧。
          </p>
        ) : (
          <AnimatePresence mode="wait">
            {/* 层级 1：国家 */}
            {viewCountry === null && (
              <motion.div
                key="countries"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {countries.map((c) => {
                  const list = memories.filter((m) => countryOf(m) === c);
                  const cityCount = new Set(list.map(cityOf)).size;
                  const cover = list[0]?.image;
                  return (
                    <button
                      key={c}
                      onClick={() => setViewCountry(c)}
                      className="relative h-36 rounded-xl overflow-hidden border border-[#3a352e] bg-[#23211D] text-left group cursor-pointer"
                    >
                      {cover && c !== '未标注' && (
                        <img
                          src={cover}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <div className="text-2xl font-bold font-display flex items-center gap-2">
                          {c === '未标注' ? '📌' : '🌏'} {c}
                        </div>
                        <div className="text-[11px] font-mono text-[#9C947C] mt-0.5">
                          {cityCount} 个城市 · {list.length} 条记忆
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* 层级 2：城市 */}
            {viewCountry !== null && viewCity === null && (
              <motion.div
                key={`cities-${viewCountry}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {cities.map((city) => {
                  const list = countryMemories.filter((m) => cityOf(m) === city);
                  return (
                    <button
                      key={city}
                      onClick={() => setViewCity(city)}
                      className="h-20 rounded-lg border border-[#3a352e] bg-[#23211D] text-left px-4 flex flex-col justify-center hover:border-amber-600/50 hover:bg-[#2a2721] transition-colors cursor-pointer"
                    >
                      <div className="text-base font-bold font-display flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                        {city}
                      </div>
                      <div className="text-[11px] font-mono text-[#9C947C] mt-0.5">
                        {list.length} 条记忆
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* 层级 3：该城市记忆 */}
            {viewCity !== null && (
              <motion.div
                key={`memories-${viewCountry}-${viewCity}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {cityMemories.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMemory(m)}
                    className="group bg-[#23211D] border border-[#3a352e] rounded-lg overflow-hidden text-left hover:border-amber-600/50 transition-colors cursor-pointer"
                  >
                    <div className="h-28 overflow-hidden bg-stone-900">
                      <img
                        src={m.image}
                        alt={m.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-semibold font-display line-clamp-1">{m.title}</div>
                      <div className="text-[10px] font-mono text-[#9C947C] mt-1">
                        {m.date}
                        {m.tag ? ` · ${m.tag}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
