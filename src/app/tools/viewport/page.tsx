'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';

interface Device {
  name: string;
  width: number;
  height: number;
  dpr?: number;
  category: 'Mobile' | 'Tablet' | 'Desktop' | 'Watch';
}

const DEVICES: Device[] = [
  { name: 'iPhone SE (3rd)', width: 375, height: 667, dpr: 2, category: 'Mobile' },
  { name: 'iPhone 12/13/14', width: 390, height: 844, dpr: 3, category: 'Mobile' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, dpr: 3, category: 'Mobile' },
  { name: 'iPhone 15 Pro', width: 393, height: 852, dpr: 3, category: 'Mobile' },
  { name: 'Pixel 7', width: 412, height: 915, dpr: 2.625, category: 'Mobile' },
  { name: 'Samsung Galaxy S22', width: 360, height: 780, dpr: 3, category: 'Mobile' },
  { name: 'Galaxy Fold (folded)', width: 280, height: 653, dpr: 3, category: 'Mobile' },

  { name: 'iPad Mini', width: 768, height: 1024, dpr: 2, category: 'Tablet' },
  { name: 'iPad Air', width: 820, height: 1180, dpr: 2, category: 'Tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, dpr: 2, category: 'Tablet' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, dpr: 2, category: 'Tablet' },
  { name: 'Surface Pro 9', width: 1440, height: 960, dpr: 2, category: 'Tablet' },

  { name: 'Laptop (small)', width: 1280, height: 800, category: 'Desktop' },
  { name: 'Laptop (HD)', width: 1366, height: 768, category: 'Desktop' },
  { name: 'MacBook Air 13"', width: 1440, height: 900, dpr: 2, category: 'Desktop' },
  { name: 'MacBook Pro 14"', width: 1512, height: 982, dpr: 2, category: 'Desktop' },
  { name: 'MacBook Pro 16"', width: 1728, height: 1117, dpr: 2, category: 'Desktop' },
  { name: 'Full HD (1080p)', width: 1920, height: 1080, category: 'Desktop' },
  { name: '2K (1440p)', width: 2560, height: 1440, category: 'Desktop' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'Desktop' },

  { name: 'Apple Watch 45mm', width: 198, height: 242, dpr: 2, category: 'Watch' },
];

export default function ViewportPage() {
  const [filter, setFilter] = React.useState('');
  const [browser, setBrowser] = React.useState({ w: 0, h: 0, dpr: 1 });

  React.useEffect(() => {
    function update() {
      setBrowser({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const q = filter.trim().toLowerCase();
  const filtered = DEVICES.filter((d) => {
    if (!q) return true;
    // Match name OR either dimension OR the "WxH" form so users can search
    // "1080", "390x844", or just "iPhone" interchangeably.
    const hay = `${d.name} ${d.width} ${d.height} ${d.width}x${d.height}`.toLowerCase();
    return hay.includes(q);
  });
  const categories: Device['category'][] = ['Mobile', 'Tablet', 'Desktop', 'Watch'];

  return (
    <ToolPage slug="viewport">
      <Card>
        <CardHeader>
          <CardTitle>Your current viewport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat label="Width" value={`${browser.w}px`} />
            <Stat label="Height" value={`${browser.h}px`} />
            <Stat label="DPR" value={`${browser.dpr}x`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Filter</Label>
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-2"
                placeholder="iPhone, iPad, 1080…"
              />
            </div>
            <ResetButton onClick={() => setFilter('')} disabled={!filter} />
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const items = filtered.filter((d) => d.category === cat);
        if (!items.length) return null;
        return (
          <Card key={cat}>
            <CardHeader>
              <CardTitle>{cat}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[480px] text-xs">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Device</th>
                      <th className="px-3 py-2 text-left font-medium">Width</th>
                      <th className="px-3 py-2 text-left font-medium">Height</th>
                      <th className="px-3 py-2 text-left font-medium">DPR</th>
                      <th className="px-3 py-2 text-right font-medium">Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d) => (
                      <tr key={d.name} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{d.name}</td>
                        <td className="px-3 py-2 font-mono">{d.width}px</td>
                        <td className="px-3 py-2 font-mono">{d.height}px</td>
                        <td className="px-3 py-2 font-mono">{d.dpr ?? 1}x</td>
                        <td className="px-3 py-2 text-right">
                          <CopyButton
                            value={`${d.width}x${d.height}`}
                            label={`${d.width}×${d.height}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </ToolPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2 text-center sm:p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-base sm:text-lg">{value}</div>
    </div>
  );
}
