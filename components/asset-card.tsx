'use client';

import { getCategoryIcon } from '@/lib/utils';

interface AssetCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  isSelected: boolean;
  isBooked: boolean;
  onSelect: (id: string, name: string, price: number) => void;
}

export default function AssetCard({
  id,
  name,
  category,
  price,
  isSelected,
  isBooked,
  onSelect,
}: AssetCardProps) {
  return (
    <button
      onClick={() => !isBooked && onSelect(id, name, price)}
      disabled={isBooked}
      className={`asset-card ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
    >
      <div className="asset-icon">{getCategoryIcon(category)}</div>
      <p className="asset-name">{name}</p>
      <p className="asset-price">INR {price}</p>
      {isBooked && (
        <span className="mt-2 inline-block text-[10px] font-bold text-red-400 uppercase tracking-wider">
          Booked
        </span>
      )}
    </button>
  );
}
