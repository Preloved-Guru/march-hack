import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import CatalogGrid from "@/components/CatalogGrid";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductFilters from "@/components/ProductFilters";
import { Loader2, Sliders, Search, Upload, X, Camera, ImageIcon, Heart, PlusCircle } from "lucide-react";

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Helper function to get a stable, deterministic product order that changes daily
// This creates a different but consistent product order each day
const getDailyProductOrder = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  
  // Get current date and use it as seed for ordering
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  
  // Use the day of year to determine how much to rotate the array
  // This ensures different ordering each day but consistent for all users on the same day
  const rotateAmount = dayOfYear % newArray.length;
  
  // Rotate array by the rotation amount (equivalent to taking last N elements and moving them to front)
  return [
    ...newArray.slice(newArray.length - rotateAmount),
    ...newArray.slice(0, newArray.length - rotateAmount)
  ];
};

// Define the structure of products from CSV
interface ProductCSV {
  "Style ID": string;
  Title: string;
  "Product Category": string;
  Size: string;
  "Image Src": string;
  Price: string;
  [key: string]: string;
}

// Define the structure needed for CatalogItem
interface FormattedProduct {
  id: string;
  title: string;
  image: string;
  price: string;
  category: string;
  size: string;
  style?: string;
  color: string;
}

// Define the filter state interface
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

// Helper function to validate image URLs
const isValidImageUrl = (url: string): boolean => {
  // Check if the URL is a valid format
  if (!url || url.trim() === "") return false;
  
  // Check if it's a common image extension or a CDN URL
  const isCommonImageFormat = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url);
  const isShopifyImage = url.includes('cdn.shopify.com');
  
  // Specifically filter out placeholder or empty image references
  const isPlaceholder = url.includes('placeholder') || url === 'undefined' || url === '';
  
  return (isCommonImageFormat || isShopifyImage) && !isPlaceholder;
};

// Format price correctly, handling existing $ signs and ensuring proper format
const formatPrice = (price: string): string => {
  if (!price) return "$0";
  
  // Remove any existing $ signs to prevent doubles
  const cleanPrice = price.replace(/\$/g, '');
  
  // Return with single $ sign
  return `$${cleanPrice}`;
};

// Standardize size formats
const standardizeSize = (size: string): string => {
  if (!size) return "One Size";
  
  // Normalize common size variations
  const normalized = size.trim();
  
  // Map standard abbreviations
  const sizeMap: Record<string, string> = {
    "XS": "Extra Small",
    "S": "Small",
    "M": "Medium",
    "L": "Large",
    "XL": "Extra Large",
    "XXL": "2X Large",
    "XXXL": "3X Large",
    "OS": "One Size",
  };
  
  return sizeMap[normalized] || normalized;
};

export default function NewArrivals() {
  const [allItems, setAllItems] = useState<FormattedProduct[]>([]);
  const [filteredItems, setFilteredItems] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchResults, setSearchResults] = useState<FormattedProduct[]>([]);
  const [matchFound, setMatchFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wishlistFileInputRef = useRef<HTMLInputElement>(null);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [wishlistImage, setWishlistImage] = useState<File | null>(null);
  const [wishlistImagePreview, setWishlistImagePreview] = useState<string | null>(null);
  const [wishlistName, setWishlistName] = useState("");
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [wishlistSuccess, setWishlistSuccess] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setLoading(true);
    
    fetch("/vico_products_export_1 .csv")
      .then((res) => {
        console.log("CSV fetch response:", res.status);
        if (!res.ok) {
          throw new Error("Failed to fetch CSV file");
        }
        return res.text();
      })
      .then((csvText) => {
        console.log("CSV text loaded, length:", csvText.length);
        Papa.parse<ProductCSV>(csvText, {
          header: true,
          complete: (results) => {
            console.log("CSV parsing complete, rows:", results.data.length);
            
            // Transform CSV data to the format expected by CatalogItem
            const formattedProducts = results.data
              .filter((item, index) => {
                const rowNumber = index + 1; // +1 because index is 0-based but rows are 1-based
                const isExcludedRow = rowNumber >= 81 && rowNumber <= 95;
                
                // Exclude specific item #9009 (Black Fit & Flare Dress)
                const isSpecificExcludedItem = item["Style ID"] === "9009";

                if (isExcludedRow) {
                  console.log(`Excluding row #${rowNumber} from shop display:`, item["Style ID"]);
                  return false;
                }
                
                if (isSpecificExcludedItem) {
                  console.log(`Excluding specific item from shop display:`, item["Style ID"], item.Title);
                  return false;
                }
                
                const hasRequiredFields = 
                  item["Style ID"] && 
                  item.Title &&
                  item["Image Src"];
                
                // Additional check for image URL validity
                const hasValidImage = hasRequiredFields && isValidImageUrl(item["Image Src"]);
                
                if (!hasRequiredFields) {
                  console.log("Missing required fields:", item["Style ID"] || "unknown");
                } else if (!hasValidImage) {
                  console.log("Invalid image URL:", item["Image Src"], "for item:", item["Style ID"]);
                }
                
                return hasValidImage;
              })
              .map(item => ({
                id: item["Style ID"],
                title: item.Title,
                image: item["Image Src"],
                price: formatPrice(item.Price),
                category: item["Product Category"] || "Uncategorized",
                size: standardizeSize(item.Size),
                style: item["Style ID"]?.substring(0, 1) === 'm' ? 'Vintage' : 'Modern',
                // In future, this color will come from AI image recognition
                // For now, we'll assign random colors based on the item ID for demonstration
                color: getPlaceholderColorFromId(item["Style ID"])
              }));
            
            console.log("Formatted products with valid images:", formattedProducts.length);
            
            // Extract unique categories, styles, and sizes
            const uniqueCategories = [...new Set(formattedProducts.map(item => item.category))];
            const uniqueStyles = [...new Set(formattedProducts.map(item => item.style || '').filter(Boolean))];
            const uniqueSizes = [...new Set(formattedProducts.map(item => item.size).filter(Boolean))];
            // Extract unique colors (for now these are our placeholder colors)
            const uniqueColors = [...new Set(formattedProducts.map(item => item.color).filter(Boolean))];
            
            // Sort sizes in a logical order
            const sizeOrder: Record<string, number> = {
              "Extra Small": 1,
              "Small": 2,
              "Medium": 3,
              "Large": 4,
              "Extra Large": 5,
              "2X Large": 6,
              "3X Large": 7,
            };
            
            const sortedSizes = uniqueSizes.sort((a, b) => {
              // Known sizes in logical order
              if (sizeOrder[a] && sizeOrder[b]) {
                return sizeOrder[a] - sizeOrder[b];
              }
              // One Size and numeric sizes at the end
              if (a === "One Size") return 1;
              if (b === "One Size") return -1;
              // Numeric sizes (like 10, 12) sorted numerically if possible
              const numA = parseInt(a);
              const numB = parseInt(b);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              // Alphabetical for everything else
              return a.localeCompare(b);
            });
            
            // Find the maximum price
            const highestPrice = Math.max(...formattedProducts.map(item => {
              const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
              return isNaN(numericPrice) ? 0 : numericPrice;
            }));
            
            setCategories(uniqueCategories);
            setStyles(uniqueStyles);
            setSizes(sortedSizes);
            setColors(uniqueColors);
            setMaxPrice(Math.ceil(highestPrice));
            setTotalItems(formattedProducts.length);
            
            // Save the original sorted products as allItems
            setAllItems(formattedProducts);
            
            // Use getDailyProductOrder for deterministic product order
            setFilteredItems(getDailyProductOrder(formattedProducts));
            setLoading(false);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            setError("Error parsing CSV: " + error.message);
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Error fetching CSV: " + err.message);
        setLoading(false);
      });
  }, []);
  
  // Handle image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Clear any existing search query to focus on image search
    if (searchQuery.trim()) {
      setSearchQuery("");
    }
  };
  
  // Image search handler - separate from text search
  const handleImageSearch = () => {
    if (!imageFile) return;
    
    setIsSearching(true);
    setSearchCompleted(false);
    setMatchFound(false);
    
    // Simulate delay for search (remove this in production with real backend)
    setTimeout(() => {
      // Instead of random selection, use attributes of the file to create a deterministic result
      // In production, this would be replaced with actual backend AI image recognition API
      
      // Create a simple hash from the file name and size for deterministic selection
      const fileHash = (imageFile.name.length * 13 + imageFile.size) % allItems.length;
      const sampleSize = Math.min(((fileHash % 5) + 5), allItems.length); // 5-10 items based on hash
      
      // Use the hash to select a starting point in the array
      const startIndex = fileHash % allItems.length;
      
      // Select items starting from the hash position and wrapping around
      const results = Array.from({ length: sampleSize }, (_, i) => {
        const index = (startIndex + i) % allItems.length;
        return allItems[index];
      });
      
      // Check if we found any matches
      const hasMatches = results.length > 0;
      setMatchFound(hasMatches);
      setSearchResults(results);
      setFilteredItems(results);
      setTotalItems(results.length);
      setIsSearching(false);
      setSearchCompleted(true);
      
      // Always set the image for wishlist regardless of matches
      // This ensures users can add to wishlist even when matches are found
      setWishlistImage(imageFile);
      setWishlistImagePreview(imagePreview);
    }, 1000);
  };
  
  // Text search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !imageFile) return;
    
    // If an image is provided, use image search handler
    if (imageFile) {
      handleImageSearch();
      return;
    }
    
    setIsSearching(true);
    setSearchCompleted(false);
    setMatchFound(false);
    
    // Simulate delay for search (remove this in production with real backend)
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = allItems.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.style?.toLowerCase().includes(query) ||
        item.size.toLowerCase().includes(query)
      );
      
      // Check if we found any matches
      setMatchFound(results.length > 0);
      setSearchResults(results);
      setFilteredItems(results);
      setTotalItems(results.length);
      setIsSearching(false);
      setSearchCompleted(true);
    }, 1000);
  };
  
  // Clear image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    clearImage();
    setFilteredItems(allItems);
    setTotalItems(allItems.length);
  };

  // Handler for filter changes
  const handleFilterChange = (filters: FilterState) => {
    // Start with items that match the search query if there is one
    let filtered = searchQuery.trim() || imageFile
      ? [...filteredItems]
      : [...allItems];

    // Apply product type (category) filter
    if (filters.productType.length > 0) {
      filtered = filtered.filter(item => filters.productType.includes(item.category));
    }

    // Apply size filter
    if (filters.size.length > 0) {
      filtered = filtered.filter(item => filters.size.includes(item.size));
    }

    // Apply style filter
    if (filters.style.length > 0) {
      filtered = filtered.filter(item => item.style && filters.style.includes(item.style));
    }

    // Apply color filter
    if (filters.color.length > 0) {
      filtered = filtered.filter(item => item.color && filters.color.includes(item.color));
    }

    // Apply price range filter
    filtered = filtered.filter(item => {
      const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return numericPrice >= filters.priceRange.min && numericPrice <= filters.priceRange.max;
    });

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name_asc':
          filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          break;
        case 'name_desc':
          filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
          break;
        case 'price_asc':
          filtered.sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return priceA - priceB;
          });
          break;
        case 'price_desc':
          filtered.sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return priceB - priceA;
          });
          break;
      }
    }

    setFilteredItems(filtered);
    setTotalItems(filtered.length);
  };

  // Initialize wishlist from search or image
  const initializeWishlistFromSearch = () => {
    // If we have a search query, use it as the wishlist name
    if (searchQuery.trim()) {
      setWishlistName(searchQuery);
    }
    
    // If we have an image file, use it as the wishlist image
    if (imageFile) {
      setWishlistImage(imageFile);
      setWishlistImagePreview(imagePreview);
    }
    
    // Show the wishlist modal
    setShowWishlistModal(true);
  };

  // Add to wishlist handler
  const handleAddToWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow text-only wishlist items (without requiring an image)
    if (!wishlistImage && !wishlistName.trim()) return;
    
    setIsAddingToWishlist(true);
    
    // This would be replaced with an actual API call to save the wishlist item
    setTimeout(() => {
      setIsAddingToWishlist(false);
      setWishlistSuccess(true);
      
      // Reset after showing success message
      setTimeout(() => {
        setShowWishlistModal(false);
        clearWishlistImage();
        setWishlistSuccess(false);
      }, 2000);
    }, 1500);
  };

  // Add wishlist image upload handler
  const handleWishlistImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setWishlistImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setWishlistImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Show the modal for adding details
    setShowWishlistModal(true);
  };
  
  // Clear wishlist image
  const clearWishlistImage = () => {
    setWishlistImage(null);
    setWishlistImagePreview(null);
    setWishlistName("");
    if (wishlistFileInputRef.current) {
      wishlistFileInputRef.current.value = "";
    }
  };

  // Function to generate placeholder colors until AI recognition is implemented
  const getPlaceholderColorFromId = (id: string): string => {
    // This is a temporary function that will be replaced by AI color detection
    // It assigns colors based on the item ID to simulate what AI will do later
    const placeholderColors = [
      "Black", "White", "Red", "Blue", "Green", 
      "Yellow", "Purple", "Pink", "Brown", "Grey",
      "Navy", "Beige", "Cream", "Orange", "Teal"
    ];
    
    // Generate a consistent index based on the ID
    const numberFromId = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return placeholderColors[numberFromId % placeholderColors.length];
  };

  return (
    <div className="min-h-screen bg-thrift-50">
      <Navbar />
      <div className="border-b border-gray-200 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-thrift-900"></h1>
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-gray-1000">New Arrivals</h2>
                <p className="mt-1 text-sm text-gray-600">
                Discover our latest vintage treasures and one-of-a-kind finds
                </p>
              </div>
            </div>
          </div>
      

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Search Bar */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-thrift-200 p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Text Search */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-thrift-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, category, size..."
                  className="w-full pl-10 pr-4 py-2 border border-thrift-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-thrift-500 focus:border-transparent"
                />
              </div>
              
              {/* OR divider */}
              <div className="flex items-center justify-center md:px-4">
                <span className="text-thrift-500 text-sm font-medium">OR</span>
              </div>
              
              {/* Image Upload */}
              <div className="w-full md:w-auto flex items-center space-x-2">
                <input 
                  type="file"
                  ref={fileInputRef} 
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 border border-thrift-200 rounded-lg text-thrift-700 bg-white hover:bg-thrift-50 cursor-pointer"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  <span>Upload Image</span>
                </label>
                
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-thrift-600 hover:bg-thrift-700"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      <span>Search</span>
                    </>
                  )}
                </button>
                
                {(searchQuery || imageFile) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center px-2 py-2 text-thrift-500 hover:text-thrift-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="flex items-start space-x-3">
                <div className="relative w-20 h-20 border rounded-md overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-0 right-0 bg-thrift-600 text-white rounded-bl p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-thrift-700">Image uploaded</p>
                  <p className="text-xs text-thrift-500 mt-1">
                    Our AI will find similar items in our inventory
                  </p>
                  <div className="mt-2 flex flex-col">
                    <p className="text-xs text-thrift-600 mb-1">You can:</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="text-xs font-medium text-thrift-600 hover:text-thrift-700 flex items-center"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        <span>Search for similar items</span>
                      </button>
                      <span className="text-xs text-thrift-400">or</span>
                      <button
                        type="button"
                        onClick={() => {
                          setWishlistImage(imageFile);
                          setWishlistImagePreview(imagePreview);
                          setShowWishlistModal(true);
                        }}
                        className="text-xs font-medium text-wish-600 hover:text-wish-700 flex items-center"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        <span>Add to wishlist directly</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wishlist button - always show after image search is completed */}
            {searchCompleted && imageFile && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={initializeWishlistFromSearch}
                  className="inline-flex items-center px-4 py-2 border border-wish-500 rounded-md text-wish-700 bg-white hover:bg-wish-50"
                >
                  <Heart className="h-4 w-4 mr-2 text-wish-600" />
                  <span>Add to Wishlist</span>
                </button>
              </div>
            )}
            
            {/* No match message - only show when no results are found */}
            {searchCompleted && !matchFound && (imageFile || searchQuery.trim()) && (
              <div className="mt-4 p-4 bg-wish-50 border border-wish-200 rounded-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-wish-800 font-medium">No exact matches found</p>
                    <p className="text-wish-600 text-sm mt-1">
                      {imageFile 
                        ? "We couldn't find this exact item in our current inventory. Add it to your wishlist and we'll notify you when similar items arrive."
                        : "Would you like to add this to your wishlist? We'll notify you when similar items arrive."
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={initializeWishlistFromSearch}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-wish-600 hover:bg-wish-700"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    <span>Add to Wishlist</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-thrift-600 animate-spin" />
            <span className="ml-3 text-thrift-600">Loading items...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center">
            <p className="font-medium">No items found matching your filters or search criteria.</p>
            {searchCompleted && (imageFile || searchQuery.trim()) && (
              <div className="mt-6">
                <div className="mb-4 max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium text-wish-800 mb-2">Would you like to add this to your wishlist?</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    {imageFile 
                      ? "Our image recognition system will be integrated soon to automatically find matches for your uploads. By adding to your wishlist now, you'll be notified when we find similar items in the future."
                      : "We'll notify you when items matching your search criteria become available in our inventory."
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={initializeWishlistFromSearch}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-wish-600 hover:bg-wish-700"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Add to Wishlist</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <ProductFilters 
                onFilterChange={handleFilterChange}
                maxPrice={maxPrice}
                availableProductTypes={categories}
                availableStyles={styles}
                availableSizes={sizes}
                availableColors={colors}
              />
            </div>
            
            {/* Product Grid with Wishlist Option */}
            <div className="flex-1">
              {searchCompleted && imageFile && matchFound && (
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-thrift-700">
                    {filteredItems.length} potential matches found
                  </p>
                  <button
                    type="button"
                    onClick={initializeWishlistFromSearch}
                    className="inline-flex items-center px-4 py-2 border border-wish-500 rounded-md text-wish-700 bg-white hover:bg-wish-50"
                  >
                    <Heart className="h-4 w-4 mr-2 text-wish-600" />
                    <span>Add to Wishlist Anyway</span>
                  </button>
                </div>
              )}
              <CatalogGrid products={filteredItems} />
            </div>
          </div>
        )}
        
        {/* Wishlist Modal */}
        {showWishlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Add to Wishlist</h3>
              </div>
              
              <form onSubmit={handleAddToWishlist} className="p-6">
                {wishlistSuccess ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Added to Wishlist!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      We'll notify you when matching items become available.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start space-x-4 mb-6">
                      {wishlistImagePreview && (
                        <div className="relative w-24 h-24 border rounded-md overflow-hidden flex-shrink-0">
                          <img src={wishlistImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label htmlFor="wishlist-name" className="block text-sm font-medium text-gray-700 mb-1">
                          What are you looking for?
                        </label>
                        <input
                          type="text"
                          id="wishlist-name"
                          value={wishlistName}
                          onChange={(e) => setWishlistName(e.target.value)}
                          placeholder="E.g., Vintage leather jacket, Red evening dress"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-wish-500 focus:border-wish-500"
                          required={!wishlistImage} // Only required if no image
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          {wishlistImage 
                            ? "We'll use AI to match both this image and description with similar items in our inventory"
                            : "We'll use AI to match this description with similar items in our inventory"
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Information about image recognition */}
                    {wishlistImage && (
                      <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800">How Image Recognition Works</h4>
                        <p className="mt-1 text-xs text-blue-600">
                          Our AI system will analyze your image to identify key attributes like color, pattern, style, and design. 
                          When new items arrive that match these attributes, we'll notify you immediately.
                        </p>
                        <p className="mt-2 text-xs text-blue-600">
                          Adding descriptive text along with your image improves matching accuracy!
                        </p>
                      </div>
                    )}
                    
                    {!wishlistImage && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">Or upload an image (optional)</p>
                        <input 
                          type="file"
                          ref={wishlistFileInputRef} 
                          onChange={handleWishlistImageUpload}
                          accept="image/*"
                          className="hidden"
                          id="wishlist-image-upload"
                        />
                        <label 
                          htmlFor="wishlist-image-upload"
                          className="inline-flex items-center px-4 py-2 border border-thrift-200 rounded-lg text-thrift-700 bg-white hover:bg-thrift-50 cursor-pointer"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          <span>Upload Image</span>
                        </label>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowWishlistModal(false);
                          clearWishlistImage();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-wish-600 hover:bg-wish-700"
                        disabled={isAddingToWishlist || (!wishlistImage && !wishlistName.trim())}
                      >
                        {isAddingToWishlist ? (
                          <>
                            <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Heart className="inline-block h-4 w-4 mr-2" />
                            Add to Wishlist
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}