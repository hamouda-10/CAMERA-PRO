import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  CAMERAS,
  CAMERA_IDS,
  COLUMN_TITLES,
  EXTRA_CATALOG_ROWS,
  formatUSD,
  higgsUrl,
  type CameraItem,
  type ExtraCatalogRow,
} from '../data/inventory';

interface CatalogSectionProps {
  onSelectCamera: (camera: CameraItem) => void;
  onExtraRowClick: (row: ExtraCatalogRow) => void;
}

type ColumnFilter = 'all' | 0 | 1 | 2;
type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'year-asc';

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  onSelectCamera,
  onExtraRowClick,
}) => {
  const [colFilter, setColFilter] = useState<ColumnFilter>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const columnsToRender = useMemo(() => {
    const colIndices: (0 | 1 | 2)[] =
      colFilter === 'all' ? [0, 1, 2] : [colFilter];

    return colIndices.map((colIdx) => {
      let cams = CAMERAS.filter((c) => c.column === colIdx);
      let extras = EXTRA_CATALOG_ROWS.filter((r) => r.column === colIdx);

      if (normalizedQuery) {
        cams = cams.filter(
          (c) =>
            c.name.toLowerCase().includes(normalizedQuery) ||
            c.type.toLowerCase().includes(normalizedQuery) ||
            c.chips.some((ch) => ch.toLowerCase().includes(normalizedQuery)) ||
            String(c.year).includes(normalizedQuery)
        );
        extras = extras.filter(
          (r) =>
            r.name.toLowerCase().includes(normalizedQuery) ||
            r.type.toLowerCase().includes(normalizedQuery) ||
            String(r.year).includes(normalizedQuery)
        );
      }

      if (inStockOnly) {
        extras = extras.filter((r) => r.tag === 'In stock');
      }

      const sortFn = <T extends { price: number; year: number }>(arr: T[]): T[] => {
        if (sortBy === 'price-asc') return [...arr].sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') return [...arr].sort((a, b) => b.price - a.price);
        if (sortBy === 'year-asc') return [...arr].sort((a, b) => a.year - b.year);
        return arr;
      };

      return {
        colIdx,
        title: COLUMN_TITLES[colIdx],
        cameras: sortFn(cams),
        extras: sortFn(extras),
      };
    });
  }, [colFilter, inStockOnly, sortBy, normalizedQuery]);

  const totalMatches = columnsToRender.reduce(
    (sum, col) => sum + col.cameras.length + col.extras.length,
    0
  );

  return (
    <section
      id="catalog"
      className="reveal-section relative py-24 sm:py-32 px-[max(20px,5vw)] border-t border-white/[0.08]"
    >
      <div className="w-full max-w-[1380px] mx-auto">
        {/* Heading + Shopping Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/10">
          <div>
            <p
              className="font-label font-semibold text-[12px] tracking-[0.28em]"
              style={{ color: 'var(--blue2)' }}
            >
              THE CATALOG · CAMERAS
            </p>
            <h2
              className="font-display font-semibold text-[#eef0f3] mt-3 leading-[0.88]"
              style={{ fontSize: 'clamp(48px, 6vw, 96px)' }}
            >
              EVERYTHING
              <br />
              ON THE SHELF
            </h2>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-none sm:w-[240px]">
              <Search className="w-4 h-4 text-[#8d929b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search body, format, year..."
                aria-label="Search vintage cameras"
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#121317] border border-white/12 text-[13px] text-[#eef0f3] placeholder:text-[#8d929b] focus:border-[#3d7bff] transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label="Sort cameras"
              className="h-10 px-4 rounded-full bg-[#121317] border border-white/12 font-label font-medium text-[11.5px] tracking-[0.16em] text-[#eef0f3] cursor-pointer focus:border-[#3d7bff]"
            >
              <option value="featured">SORT: FEATURED</option>
              <option value="price-asc">PRICE: LOW → HIGH</option>
              <option value="price-desc">PRICE: HIGH → LOW</option>
              <option value="year-asc">ERA: OLDEST FIRST</option>
            </select>

            <button
              type="button"
              onClick={() => setInStockOnly((v) => !v)}
              aria-pressed={inStockOnly}
              className={`h-10 px-4 rounded-full border font-label font-semibold text-[11px] tracking-[0.18em] transition-colors whitespace-nowrap cursor-pointer ${
                inStockOnly
                  ? 'border-[#3d7bff] bg-[#3d7bff]/15 text-[#7aa4ff]'
                  : 'border-white/12 bg-[#121317] text-[#8d929b] hover:text-[#eef0f3]'
              }`}
            >
              IN STOCK ONLY
            </button>
          </div>
        </div>

        {/* Camera Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: 'all', label: 'ALL CAMERAS' },
                { value: 0, label: 'RANGEFINDER & COMPACT' },
                { value: 1, label: 'SLR & CINE' },
                { value: 2, label: 'MEDIUM FORMAT' },
              ] as const
            ).map((tab) => {
              const active = colFilter === tab.value;
              return (
                <button
                  key={String(tab.value)}
                  type="button"
                  onClick={() => setColFilter(tab.value)}
                  className={`h-9 px-4 rounded-full font-label font-semibold text-[11px] tracking-[0.18em] transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#3d7bff] text-white'
                      : 'bg-white/[0.03] border border-white/10 text-[#8d929b] hover:text-[#eef0f3] hover:border-white/25'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="font-label font-medium text-[11.5px] tracking-[0.2em] text-[#8d929b] tabular-nums">
            {totalMatches} {totalMatches === 1 ? 'BODY' : 'BODIES'} LISTED · USD
          </p>
        </div>

        {/* 3 Columns Shelf */}
        {totalMatches === 0 ? (
          <div className="py-20 text-center border border-white/10 rounded-2xl bg-[#121317]/60">
            <p className="font-display font-semibold text-3xl text-[#eef0f3]">
              NO CAMERAS MATCH YOUR FILTER
            </p>
            <button
              type="button"
              onClick={() => {
                setColFilter('all');
                setInStockOnly(false);
                setQuery('');
              }}
              className="mt-4 h-10 px-5 rounded-full bg-[#3d7bff] text-white font-label font-semibold text-[11.5px] tracking-[0.2em] cursor-pointer"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-10 lg:gap-8 mt-4 ${
              colFilter === 'all' ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-[920px]'
            }`}
          >
            {columnsToRender.map((col) => (
              <div key={col.colIdx} className="flex flex-col">
                <div className="pb-4 mb-2 border-b border-white/12 flex items-center justify-between">
                  <h3 className="font-label font-semibold text-[12px] tracking-[0.26em] text-[#8d929b]">
                    {col.title}
                  </h3>
                  <span className="font-label text-[11px] tracking-[0.18em] text-[#8d929b]/70 tabular-nums">
                    {String(col.cameras.length + col.extras.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-white/[0.08]">
                  {/* Full Cameras with overflowing 74px round thumbnails */}
                  {col.cameras.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => onSelectCamera(cam)}
                      className="catalog-row group w-full text-left py-4 px-3 -mx-3 rounded-2xl border border-transparent flex items-center gap-4 cursor-pointer"
                    >
                      {/* 74px round dark thumbnail with overflowing camera */}
                      <div className="relative w-[74px] h-[74px] rounded-full bg-[#15171d] border border-white/10 shrink-0 flex items-center justify-center overflow-visible">
                        <img
                          src={higgsUrl(CAMERA_IDS[cam.assetKey], 240)}
                          alt={cam.name}
                          referrerPolicy="no-referrer"
                          className="catalog-thumb-img w-[88px] h-[88px] max-w-none object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.75)]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-[25px] leading-none tracking-[0.02em] text-[#eef0f3] group-hover:text-white truncate">
                          {cam.name}
                        </p>
                        <p className="font-label font-medium text-[11px] tracking-[0.2em] text-[#8d929b] mt-1.5">
                          {cam.type} · {cam.year}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-display font-semibold text-[24px] leading-none text-[#eef0f3] tabular-nums">
                          {formatUSD(cam.price)}
                        </p>
                        <p
                          className="font-label font-semibold text-[10.5px] tracking-[0.2em] mt-1.5"
                          style={{ color: 'var(--blue2)' }}
                        >
                          IN STOCK
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Extra Catalog Rows (without images) */}
                  {col.extras.map((row) => {
                    const isAvailable = row.tag === 'In stock';
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => onExtraRowClick(row)}
                        className="catalog-row group w-full text-left py-4 px-3 -mx-3 rounded-2xl border border-transparent flex items-center gap-4 cursor-pointer"
                      >
                        <div className="w-[74px] h-[74px] rounded-full bg-[#121317] border border-dashed border-white/12 shrink-0 flex items-center justify-center">
                          <span className="font-display font-semibold text-[20px] tracking-[0.06em] text-[#8d929b]/60">
                            {row.year.toString().slice(-2)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold text-[24px] leading-none tracking-[0.02em] text-[#eef0f3]/90 truncate">
                            {row.name}
                          </p>
                          <p className="font-label font-medium text-[11px] tracking-[0.2em] text-[#8d929b] mt-1.5">
                            {row.type} · {row.year}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-display font-semibold text-[23px] leading-none text-[#eef0f3]/90 tabular-nums">
                            {formatUSD(row.price)}
                          </p>
                          <p
                            className="font-label font-semibold text-[10.5px] tracking-[0.2em] mt-1.5"
                            style={{
                              color: isAvailable ? 'var(--blue2)' : '#e6a64c',
                            }}
                          >
                            {row.tag.toUpperCase()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
