import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Sparkles, Check, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../supabase';
import { Memory, CategoryType, PinnedBy } from '../types';
import LocationPicker from './LocationPicker';

interface AddMemoryDialogProps {
  onClose: () => void;
  onAddMemory: (newMemory: Omit<Memory, 'id' | 'px' | 'py' | 'rotation'>) => void;
}

export default function AddMemoryDialog({
  onClose,
  onAddMemory,
}: AddMemoryDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<CategoryType>('travel');
  const [tag, setTag] = useState('');
  const [pastSelf, setPastSelf] = useState('');
  const [presentSelf, setPresentSelf] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pinnedBy, setPinnedBy] = useState<PinnedBy>('pin');
  const [locationName, setLocationName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-configured elegant themed Unsplash stock pools
  const categoryImagePresets: Record<CategoryType, string[]> = {
    travel: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80',
    ],
    growth: [
      'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    ],
    motorcycle: [
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    photography: [
      'https://images.unsplash.com/photo-1508615070457-7baebe4003ab?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
    ],
  };

  const autofillPresetImage = () => {
    const list = categoryImagePresets[category];
    const item = list[Math.floor(Math.random() * list.length)];
    setImageUrl(item);
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImage(file, 'camp_');
        setImageUrl(url);
      } catch (err: any) {
        console.error('Upload failed:', err);
        alert('Image upload failed: ' + (err.message || 'Unknown error'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !pastSelf || !presentSelf) return;

    // Use current customized or fall back to preset
    const activeImage = imageUrl.trim() || categoryImagePresets[category][0];

    // Auto-extract year from date string (e.g., "2025-04-12" or "2025.04.12")
    let parsedYear = 2025;
    if (date) {
      const parts = date.split(/[-.]/);
      if (parts.length > 0) {
        const y = parseInt(parts[0], 10);
        if (!isNaN(y) && y > 1900 && y < 2100) {
          parsedYear = y;
        }
      }
    }

    onAddMemory({
      title,
      date: date.includes('-') ? date.replace(/-/g, '.') : date,
      year: parsedYear,
      category,
      tag: tag.trim() || (category === 'travel' ? '足迹' : category === 'growth' ? '成长' : category === 'motorcycle' ? '日常' : '瞬间'),
      image: activeImage,
      gallery: [
        activeImage,
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80'
      ],
      pastSelf,
      presentSelf,
      pinnedBy,
      location: locationName.trim() ? { name: locationName.trim(), mx: 0, my: 0 } : undefined,
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Clicking outside stops dialog */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-[#faf6ed] shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-amber-900/40 w-full max-w-xl rounded-2xl overflow-hidden text-stone-800 flex flex-col p-6 relative paper-grain z-10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-405 hover:text-stone-700 bg-stone-200/50 hover:bg-stone-200 rounded-full transition-all"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Title */}
        <div className="border-b border-stone-250 pb-3.5 mb-4">
          <h3 className="text-lg font-bold font-display text-amber-950 uppercase flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-amber-700" />
            <span>钉入一张新记忆的照片</span>
          </h3>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5 uppercase">PIN A NEW MEMOIR CARD ON THE CORKBOARD</p>
        </div>

        {isSuccess ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-md">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h5 className="font-bold text-center text-sm font-display text-emerald-800">记忆已牢固钉入！</h5>
              <p className="text-xs text-stone-500 font-sans mt-1">
                Polaroid 照片卡将会出现在旅行木板的分类区域中...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Title & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  记忆标题 *
                </label>
                <input
                  id="add-input-title"
                  type="text"
                  required
                  placeholder="例如：京都竹林寻幽"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-display"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  类别角标 (可选标签)
                </label>
                <input
                  id="add-input-tag"
                  type="text"
                  placeholder="例如：独自出发 / 热烈"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Row 2: Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  记忆具体日期 *
                </label>
                <input
                  id="add-input-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker();
                    } catch (err) {}
                  }}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono cursor-pointer w-full text-stone-700 hover:border-amber-600/55 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  白板分类区域
                </label>
                <select
                  id="add-select-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer text-stone-700"
                >
                  <option value="travel">左上：旅途足迹 (Travel & Journeys)</option>
                  <option value="growth">右上：自我成长 (Inner Growth)</option>
                  <option value="motorcycle">左下：日常烟火 (Daily Joys & Life)</option>
                  <option value="photography">右下：美好瞬间 (Captured Moments)</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  地点
                </label>
                <LocationPicker
                  value={locationName}
                  onChange={setLocationName}
                  onSelect={(c) => {
                    setLocationName(c.shortName);
                    if (c.country) setCountry(c.country);
                    if (c.city) setCity(c.city);
                    setLat(c.lat);
                    setLng(c.lng);
                  }}
                  placeholder="搜索并选择地点，例如：大理古城"
                  inputClassName="w-full bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
                <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                  从候选中选择后自动填入国家/城市与精确坐标；仅手动输入则地图按名称解析
                </p>
              </div>

            {/* Row 2.5: Country & City（地区线钻取） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  国家
                </label>
                <input
                  id="add-input-country"
                  type="text"
                  placeholder="例如：日本 / 中国"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  城市
                </label>
                <input
                  id="add-input-city"
                  type="text"
                  placeholder="例如：京都 / 杭州"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Row 3: Photo URL & Fastener */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                    照片图像链接
                  </label>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={autofillPresetImage}
                      className="text-[9px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 px-1 py-0.5 rounded border border-amber-200/50 transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                      <span>自动配图</span>
                    </button>

                    <label
                      className="text-[9px] font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-1 py-0.5 rounded border border-stone-250 transition-colors"
                    >
                      <Upload className="h-2.5 w-2.5 text-stone-500" />
                      <span>上传照片</span>
                      <input
                        type="file"
                        accept="image/*" disabled={isUploading}
                        onChange={handleLocalUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-[#fdfcf7] border border-amber-900/25 rounded px-2.5 py-1.5 min-h-[34px]">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-5 h-5 rounded object-cover border border-amber-950/20 shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-stone-400 shrink-0" />
                  )}
                  <input
                    id="add-input-image"
                    type="text"
                    required={false}
                    placeholder="粘贴 URL 或点击上方上传"
                    value={isUploading ? '[Uploading...]' : imageUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow clearing or non-base64 typing
                      if (val === '') {
                        setImageUrl('');
                      } else if (!imageUrl.startsWith('data:image/')) {
                        setImageUrl(val);
                      }
                    }}
                    className="bg-transparent text-xs outline-none w-full font-mono text-ellipsis overflow-hidden text-stone-700"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-stone-400 hover:text-stone-600 px-1 focus:outline-none"
                      title="清除照片"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  固定方式 (选择图钉样式)
                </label>
                <div className="grid grid-cols-4 gap-2 py-1">
                  {(['pin', 'magnet', 'clip', 'tape'] as PinnedBy[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPinnedBy(type)}
                      className={`text-[10px] py-1.5 rounded border capitalize transition-all cursor-pointer ${
                        pinnedBy === type
                          ? 'bg-amber-950 text-stone-100 border-amber-950 shadow-md font-semibold'
                          : 'bg-[#fdfcf7] text-stone-600 border-stone-250 hover:bg-stone-200/40'
                      }`}
                    >
                      {type === 'pin' 
                        ? '📌 图钉' 
                        : type === 'magnet' 
                        ? '🧲 磁铁' 
                        : type === 'clip' 
                        ? '📎 夹子' 
                        : '📜 胶带'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Diaries side-by-side */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  当时的我 (当时感受与心情记录) *
                </label>
                <textarea
                  id="add-input-past"
                  required
                  rows={2}
                  placeholder="描写你刚站在那一刻时的激动、恐惧、迷路或憧憬..."
                  value={pastSelf}
                  onChange={(e) => setPastSelf(e.target.value)}
                  className="w-full bg-[#fdfcf7] border border-amber-900/25 rounded p-2.5 text-stone-800 font-hand text-lg leading-relaxed focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                  现在的我留书 (沉淀感悟) *
                </label>
                <textarea
                  id="add-input-present"
                  required
                  rows={2}
                  placeholder="多年后再坐回到帐篷中的自己，对这段回忆如何评价？有什么收获与自豪？"
                  value={presentSelf}
                  onChange={(e) => setPresentSelf(e.target.value)}
                  className="w-full bg-[#fdfcf7] border border-[#a18262]/50 rounded p-2.5 text-stone-800 font-hand text-lg leading-relaxed focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Submit row */}
            <div className="mt-4 pt-3 border-t border-stone-250 flex items-center justify-between">
              <span className="text-[10px] text-stone-500 font-mono">
                * 为必填字段。照片会自动随机分配位置角度
              </span>

              <button
                id="btn-confirm-add-memory"
                type="submit"
                className="bg-amber-950 hover:bg-stone-900 border border-amber-900/20 text-stone-100 font-display text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>将回忆钉到白板</span>
                <span>✦</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
