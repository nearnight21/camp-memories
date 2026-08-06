import { useEffect, useRef, useState, type FormEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Globe2, MapPin, X, CalendarDays } from 'lucide-react';
import { Memory } from '../types';
import { resolvePlace, geocodeAddress } from '../lib/geo';
import { CITY_LABELS } from '../lib/labels';

// 底图模式：'amap' = 高德瓦片（国内直连、中文标注、浅色）；'dark' = CARTO 深色无标注 + 自绘中文标注层
const TILE_MODE: 'amap' | 'dark' = 'amap';

// 自适应层级阈值：zoom < CITY_ZOOM → 国家气泡；CITY_ZOOM ≤ zoom < POINT_ZOOM → 城市气泡；zoom ≥ POINT_ZOOM → 具体点位
const CITY_ZOOM = 5;
const POINT_ZOOM = 9;

interface MapViewProps {
  memories: Memory[];
  onSelectMemory: (m: Memory) => void;
}

interface PanelState {
  title: string;
  list: Memory[];
}

const countryOf = (m: Memory): string => m.country?.trim() || '';
// 城市为空时回退用「地点」名（如 "大理古城"），保证只填地点的记忆也能上图
const cityOf = (m: Memory): string => m.city?.trim() || m.location?.name?.trim() || '';

function groupBy<T>(list: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of list) {
    const k = keyFn(item);
    if (!k) continue;
    (out[k] ||= []).push(item);
  }
  return out;
}

const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bubbleIcon(img: string, count: number, label: string): L.DivIcon {
  return L.divIcon({
    className: 'map-bubble-wrap',
    html: `
      <div class="map-bubble">
        <img src="${escHtml(img)}" referrerpolicy="no-referrer" alt="" />
        ${count > 1 ? `<span class="map-bubble-count">${count}</span>` : ''}
        <span class="map-bubble-label">${escHtml(label)}</span>
      </div>
    `,
    iconSize: [54, 54],
    iconAnchor: [27, 27],
  });
}

export default function MapView({ memories, onSelectMemory }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [viewCountry, setViewCountry] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [enriched, setEnriched] = useState<Memory[]>(memories);
  // zoom 变化后 +1，触发气泡按当前缩放级别重建（自适应层级）
  const [zoomTick, setZoomTick] = useState(0);
  // 地区线时间筛选：'all' 显示全部年份，否则只显示该年份的记忆
  const [timeFilter, setTimeFilter] = useState<'all' | number>('all');
  const [timeBarOpen, setTimeBarOpen] = useState(false);
  // range 本地值（跟手拖动），外部状态变化时由 effect 同步
  const [rangeVal, setRangeVal] = useState(0);

  // 全部可用年份作为滑块的固定刻度；不能从 filtered 计算，否则选中一年后滑块会塌缩成单值
  const allYears: number[] = Array.from(new Set<number>(enriched.map((m) => m.year))).sort(
    (a, b) => a - b
  );

  // 外部改变筛选（点「全部时间」/年份按钮）时同步滑块位置
  useEffect(() => {
    setRangeVal(
      timeFilter === 'all'
        ? Math.max(0, allYears.length - 1)
        : Math.max(0, allYears.indexOf(timeFilter))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  // 只填了「地点」没填「国家」的记忆：地理编码自动归组到国家/城市气泡（结果有 localStorage 缓存）
  useEffect(() => {
    setEnriched(memories);
    let cancelled = false;
    const run = async () => {
      const out = [...memories];
      let changed = false;
      for (let i = 0; i < out.length; i++) {
        const m = out[i];
        if (!m.country?.trim() && m.location?.name?.trim()) {
          const geo = await geocodeAddress(m.location.name);
          if (geo?.country && !cancelled) {
            out[i] = { ...m, country: geo.country, city: m.city?.trim() ? m.city : geo.city };
            changed = true;
          }
        }
      }
      if (changed && !cancelled) setEnriched(out);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [memories]);

  // 时间筛选后的数据源（气泡/面板/未标注计数共用）
  const filtered = timeFilter === 'all' ? enriched : enriched.filter((m) => m.year === timeFilter);
  const filteredUnlabeled = filtered.filter((m) => !countryOf(m));

  // --- 地图生命周期 ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const zoomEndHandlers: (() => void)[] = [];
    // 构造时即锁定中国视野（zoom 6：中国主体占满屏），不依赖后续计算
    const map = L.map(containerRef.current, {
      center: [35, 108],
      zoom: 6,
      zoomControl: false,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 14,
      attributionControl: true,
    });
    if (TILE_MODE === 'dark') {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
    } else {
      // 高德瓦片：国内直连快、中文标注（webrd0{1-4}.is.autonavi.com）
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: '1234',
          attribution: '&copy; 高德地图',
          maxZoom: 18,
        }
      ).addTo(map);
    }
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    if (TILE_MODE === 'dark') {
      // 中文地名标注层：随缩放级别显示对应城市名（全中文）
      const labelLayer = L.layerGroup().addTo(map);
      const renderLabels = () => {
        labelLayer.clearLayers();
        const z = map.getZoom();
        for (const c of CITY_LABELS) {
          if (z < c.minZoom) continue;
          L.marker([c.lat, c.lng], {
            icon: L.divIcon({
              className: 'map-city-label-wrap',
              html: `<span class="map-city-label">${c.name}</span>`,
              iconSize: [0, 0],
            }),
          }).addTo(labelLayer);
        }
      };
      renderLabels();
      map.on('zoomend', renderLabels);
      zoomEndHandlers.push(renderLabels);
    }

    // 缩放变化：回退层级状态并触发气泡按新缩放级别重建（自适应）
    const onZoomEnd = () => {
      if (map.getZoom() < CITY_ZOOM) {
        setViewCountry(null);
        setPanel(null);
      }
      setZoomTick((t) => t + 1);
    };
    map.on('zoomend', onZoomEnd);
    zoomEndHandlers.push(onZoomEnd);

    // 容器尺寸就绪后仅修正尺寸，不改变视野
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      zoomEndHandlers.forEach((h) => map.off('zoomend', h));
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // --- 气泡构建：随缩放级别自适应层级 ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const layer = layerRef.current;
    layer.clearLayers();

    let cancelled = false;

    const build = async () => {
      const zoom = map.getZoom();

      if (zoom < CITY_ZOOM) {
        // 层级 1（zoom < 5）：国家气泡
        const countries = groupBy(filtered, countryOf);
        for (const [country, list] of Object.entries(countries)) {
          const coords = await resolvePlace(country);
          if (cancelled || !coords) continue;
          L.marker(coords, { icon: bubbleIcon(list[0].image, list.length, country) })
            .on('click', () => {
              setPanel(null);
              setViewCountry(country);
              map.flyTo(coords, CITY_ZOOM, { duration: 0.8 });
            })
            .addTo(layer);
        }
      } else if (zoom < POINT_ZOOM) {
        // 层级 2（5 ≤ zoom < 9）：当前视野内城市气泡（同城记忆聚合）
        const bounds = map.getBounds();
        const cities = groupBy(filtered, cityOf);
        for (const [city, list] of Object.entries(cities)) {
          const country = countryOf(list[0]);
          const coords = await resolvePlace(country, city);
          if (cancelled || !coords) continue;
          if (!bounds.contains(coords)) continue;
          L.marker(coords, { icon: bubbleIcon(list[0].image, list.length, city) })
            .on('click', () => {
              setPanel({ title: city, list });
              map.flyTo(coords, POINT_ZOOM, { duration: 0.8 });
            })
            .addTo(layer);
        }
      } else {
        // 层级 3（zoom ≥ 9）：视野内有坐标记忆的精确点位；
        // 同坐标多条记忆按屏幕像素半径展开成环，避免完全重叠堆叠
        const bounds = map.getBounds();
        const byCoord = new Map<string, Memory[]>();
        for (const m of filtered) {
          if (cancelled) return;
          if (typeof m.lat !== 'number' || typeof m.lng !== 'number') continue;
          if (!bounds.contains([m.lat, m.lng])) continue;
          const key = `${m.lat.toFixed(6)},${m.lng.toFixed(6)}`;
          const list = byCoord.get(key);
          if (list) list.push(m);
          else byCoord.set(key, [m]);
        }
        // 展开半径：固定屏幕像素（约 28px），换算成当前缩放下的度数，保证任意 zoom 都能错开
        const pxPerDeg = (256 * Math.pow(2, map.getZoom())) / 360;
        const spreadDeg = 28 / pxPerDeg;
        for (const [key, list] of byCoord) {
          const [lat, lng] = key.split(',').map(Number);
          if (list.length === 1) {
            L.marker([lat, lng], { icon: bubbleIcon(list[0].image, 1, list[0].title) })
              .on('click', () => onSelectMemory(list[0]))
              .addTo(layer);
            continue;
          }
          const n = list.length;
          const angleStep = (2 * Math.PI) / n;
          const startAngle = Math.random() * 2 * Math.PI;
          const lngScale = Math.cos((lat * Math.PI) / 180) || 0.5;
          list.forEach((m, i) => {
            const a = startAngle + i * angleStep;
            const dLat = Math.cos(a) * spreadDeg;
            const dLng = (Math.sin(a) * spreadDeg) / lngScale;
            L.marker([lat + dLat, lng + dLng], { icon: bubbleIcon(m.image, 1, m.title) })
              .on('click', () => onSelectMemory(m))
              .addTo(layer);
          });
        }
      }
    };

    build();
    return () => {
      cancelled = true;
    };
  }, [zoomTick, filtered]);

  const backToWorld = () => {
    setPanel(null);
    setViewCountry(null);
    mapRef.current?.flyTo([35, 108], CITY_ZOOM - 1, { duration: 0.8 });
  };

  const handleTimeSliderInput = (e: FormEvent<HTMLInputElement>) => {
    const index = Number(e.currentTarget.value);
    setRangeVal(index);
    const year = allYears[index];
    if (typeof year === 'number') setTimeFilter(year);
  };

  return (
    <div className="h-screen w-screen relative bg-[#1A1A18] text-[#E8DEC8]">
      {/* 地图本体 */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* 面包屑 */}
      <nav className="absolute top-4 left-5 z-[1000] flex items-center gap-1.5 text-xs font-mono text-[#9C947C] bg-stone-900/85 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2 shadow-xl">
        <button
          onClick={backToWorld}
          className={`hover:text-amber-400 transition-colors cursor-pointer ${viewCountry === null ? 'text-amber-400' : ''}`}
        >
          <Globe2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          地区
        </button>
        {viewCountry !== null && (
          <>
            <span>/</span>
            <button
              onClick={async () => {
                setPanel(null);
                const coords = await resolvePlace(viewCountry);
                if (coords) mapRef.current?.flyTo(coords, CITY_ZOOM, { duration: 0.8 });
              }}
              className={`hover:text-amber-400 transition-colors cursor-pointer ${panel === null ? 'text-amber-400' : ''}`}
            >
              {viewCountry}
            </button>
          </>
        )}
        {panel !== null && (
          <>
            <span>/</span>
            <span className="text-amber-400">{panel.title}</span>
          </>
        )}
      </nav>

      {/* 未标注分组入口 */}
      {filteredUnlabeled.length > 0 && (
        <button
          onClick={() => setPanel({ title: '未标注地区', list: filteredUnlabeled })}
          className="absolute top-[60px] left-5 z-[1000] flex items-center gap-1.5 text-[11px] font-mono text-[#9C947C] hover:text-amber-300 bg-stone-900/85 backdrop-blur-md border border-stone-700/50 rounded-full px-3.5 py-1.5 shadow-xl transition-colors cursor-pointer"
        >
          <MapPin className="h-3 w-3" />
          未标注地区（{filteredUnlabeled.length}）
        </button>
      )}

      {/* 时间筛选开关（默认收起） */}
      <button
        onClick={() => setTimeBarOpen((v) => !v)}
        className={`absolute top-4 right-5 z-[1000] flex items-center gap-1.5 text-[11px] font-mono bg-stone-900/85 backdrop-blur-md border rounded-full px-3.5 py-2 shadow-xl transition-colors cursor-pointer ${
          timeFilter !== 'all'
            ? 'text-amber-300 border-amber-600/50'
            : 'text-[#9C947C] hover:text-amber-300 border-stone-700/50'
        }`}
        title="时间筛选"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {timeFilter === 'all' ? '全部时间' : `${timeFilter}年`}
        <span className="text-[9px]">{timeBarOpen ? '▼' : '▲'}</span>
      </button>

      {/* 时间栏（展开后显示，默认全部时间） */}
      <AnimatePresence>
        {timeBarOpen && allYears.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-stone-900/90 backdrop-blur-md border border-stone-700/50 rounded-full px-5 py-2.5 shadow-2xl"
          >
            <button
              onClick={() => setTimeFilter('all')}
              className={`text-[11px] font-mono font-bold rounded-full px-3 py-1 transition-colors cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-[#9C947C] hover:text-amber-300'
              }`}
            >
              全部时间
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-[#9C947C] min-w-7 text-right">
                {allYears[0]}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, allYears.length - 1)}
                step={1}
                value={rangeVal}
                onInput={handleTimeSliderInput}
                onChange={handleTimeSliderInput}
                onPointerDown={(e) => e.stopPropagation()}
                className="time-range"
                style={{ touchAction: 'none' }}
                aria-label="按年份筛选"
              />
              <span className="text-[10px] font-mono text-[#9C947C] min-w-7">
                {allYears[allYears.length - 1]}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 城市 / 未标注记忆面板 */}
      <AnimatePresence>
        {panel !== null && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute top-0 right-0 h-full w-[300px] bg-[#1A1A18]/95 backdrop-blur-md border-l border-[#3a352e] z-[1001] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#1A1A18]/95 backdrop-blur-md border-b border-[#3a352e] px-4 py-3.5 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold font-display flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-500" />
                {panel.title}
                <span className="text-[10px] font-mono text-[#9C947C] font-normal">
                  {panel.list.length} 条
                </span>
              </h3>
              <button
                onClick={() => setPanel(null)}
                className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 space-y-2.5">
              {panel.list.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMemory(m)}
                  className="w-full flex gap-3 bg-[#23211D] border border-[#3a352e] rounded-lg p-2.5 text-left hover:border-amber-600/50 transition-colors cursor-pointer group"
                >
                  <img
                    src={m.image}
                    alt={m.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-md object-cover bg-stone-900 shrink-0 group-hover:scale-[1.03] transition-transform"
                  />
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="text-xs font-semibold font-display line-clamp-1">{m.title}</div>
                    <div className="text-[10px] font-mono text-[#9C947C] mt-1">
                      {m.date}
                      {m.tag ? ` · ${m.tag}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
