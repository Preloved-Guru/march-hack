import React, { useState, useCallback } from 'react';
import { Filter, Tag, Box, Palette } from 'lucide-react';

interface FilterState {
  size: string[];
  productType: string[];
  sortBy: string;
  priceRange: {
    min: number;
    max: number;
  };
  style: string[];
  pattern: string[];
  color: string[];
  condition: string[];
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  maxPrice?: number;
  availableProductTypes: string[];
  availableStyles?: string[];
  availablePatterns?: string[];
  availableColors?: string[];
  availableConditions?: string[];
  availableSizes?: string[];
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ 
  onFilterChange, 
  maxPrice = 1000,
  availableProductTypes = [],
  availableStyles = [],
  availablePatterns = [],
  availableColors = [],
  availableConditions = [],
  availableSizes = ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large', 'XXL', 'One Size']
}) => {
  const [filters, setFilters] = useState<FilterState>({
    size: [],
    productType: [],
    sortBy: '',
    priceRange: {
      min: 0,
      max: maxPrice
    },
    style: [],
    pattern: [],
    color: [],
    condition: []
  });

  const handleFilterChange = (category: keyof Omit<FilterState, 'sortBy' | 'priceRange'>, value: string) => {
    const updatedFilters = { ...filters };
    const index = updatedFilters[category].indexOf(value);
    
    if (index === -1) {
      updatedFilters[category] = [...updatedFilters[category], value];
    } else {
      updatedFilters[category] = updatedFilters[category].filter(item => item !== value);
    }
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSortChange = (value: string) => {
    const updatedFilters = {
      ...filters,
      sortBy: value
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handlePriceChange = useCallback((type: 'min' | 'max', value: number) => {
    const updatedFilters = {
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [type]: value
      }
    };
    
    if (type === 'min' && value > filters.priceRange.max) {
      updatedFilters.priceRange.min = filters.priceRange.max;
    } else if (type === 'max' && value < filters.priceRange.min) {
      updatedFilters.priceRange.max = filters.priceRange.min;
    }
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [filters, onFilterChange]);

  const clearAll = () => {
    const clearedFilters = {
      size: [],
      productType: [],
      sortBy: '',
      priceRange: {
        min: 0,
        max: maxPrice
      },
      style: [],
      pattern: [],
      color: [],
      condition: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    options, 
    category 
  }: { 
    title: string; 
    icon: React.ElementType; 
    options: string[]; 
    category: keyof Omit<FilterState, 'sortBy' | 'priceRange'>; 
  }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-gray-700" />
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters[category].includes(option)}
              onChange={() => handleFilterChange(category, option)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );

  // Helper function to convert color names to CSS color values
  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Green': '#008000',
      'Yellow': '#FFFF00',
      'Purple': '#800080',
      'Pink': '#FFC0CB',
      'Brown': '#A52A2A',
      'Grey': '#808080',
      'Navy': '#000080',
      'Beige': '#F5F5DC',
      'Cream': '#FFFDD0',
      'Orange': '#FFA500',
      'Teal': '#008080'
    };

    return colorMap[colorName] || '#CCCCCC'; // Default to gray if color not found
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-700" />
          <span className="font-medium text-gray-900">Product Filters</span>
        </div>
        <button
          onClick={clearAll}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          Clear All
        </button>
      </div>

      <div className="p-4">
        {/* Sort By */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">Sort By</h3>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select sort order</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Product Type Filter */}
        {availableProductTypes.length > 0 && (
          <FilterSection
            title="Product Type"
            icon={Box}
            options={availableProductTypes}
            category="productType"
          />
        )}

        {/* Size Filter */}
        <FilterSection
          title="Size"
          icon={Tag}
          options={availableSizes}
          category="size"
        />

        {/* Style Filter */}
        {availableStyles.length > 0 && (
          <FilterSection
            title="Style"
            icon={Tag}
            options={availableStyles}
            category="style"
          />
        )}

        {/* Pattern Filter */}
        {availablePatterns.length > 0 && (
          <FilterSection
            title="Pattern"
            icon={Tag}
            options={availablePatterns}
            category="pattern"
          />
        )}

        {/* Color Filter */}
        {availableColors.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} className="text-gray-700" />
              <h3 className="text-base font-medium text-gray-900">Color</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableColors.map((color) => {
                // Get CSS color value from color name
                const colorValue = getColorValue(color);
                
                return (
                  <label
                    key={color}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.color.includes(color)}
                      onChange={() => handleFilterChange('color', color)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-block w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorValue }}
                      />
                      <span className="text-sm text-gray-700">{color}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Condition Filter */}
        {availableConditions.length > 0 && (
          <FilterSection
            title="Condition"
            icon={Tag}
            options={availableConditions}
            category="condition"
          />
        )}

        {/* Price Range section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-medium text-gray-900">Price Range</h3>
            <div className="text-sm text-gray-600">
              ${filters.priceRange.min} - ${filters.priceRange.max}
            </div>
          </div>
          
          <div className="relative pt-2 pb-2">
            <div className="absolute left-0 right-0 h-6 bg-gray-200 rounded">
              <div
                className="absolute h-6 rounded"
                style={{
                  backgroundColor: '#D4DB69',
                  left: `${(filters.priceRange.min / maxPrice) * 100}%`,
                  right: `${100 - (filters.priceRange.max / maxPrice) * 100}%`
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={filters.priceRange.min}
              onChange={(e) => handlePriceChange('min', Number(e.target.value))}
              className="absolute w-full appearance-none bg-transparent pointer-events-none range-input"
              style={{
                height: '1.5rem',
                WebkitAppearance: 'none',
                zIndex: 3
              }}
            />
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={filters.priceRange.max}
              onChange={(e) => handlePriceChange('max', Number(e.target.value))}
              className="absolute w-full appearance-none bg-transparent pointer-events-none range-input"
              style={{
                height: '1.5rem',
                WebkitAppearance: 'none',
                zIndex: 4
              }}
            />
          </div>
          
          <style>
            {`
              .range-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                pointer-events: all;
                width: 12px;
                height: 20px;
                background-color: white;
                border: 2px solid #D4DB69;
                border-radius: 4px;
                cursor: pointer;
                margin-top: -2px;
              }
              .range-input::-moz-range-thumb {
                pointer-events: all;
                width: 12px;
                height: 20px;
                background-color: white;
                border: 2px solid #D4DB69;
                border-radius: 4px;
                cursor: pointer;
                margin-top: -2px;
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters; 