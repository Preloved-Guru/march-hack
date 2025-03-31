import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductFilters from "@/components/ProductFilters";
import CatalogGrid from "@/components/CatalogGrid";
import { 
  Sliders, 
  Upload, 
  Box, 
  Tag, 
  RefreshCw, 
  Camera, 
  Check, 
  X,
  ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
  ShoppingBag, 
  Bell,
  Users,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";
import Papa from "papaparse";

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

// Define the structure needed for FormattedProduct
interface FormattedProduct {
  id: string;
  title: string;
  image: string;
  price: string;
  category_prediction: string;
  size: string;
  style?: string;
  color_prediction?: string;
  pattern_prediction?: string;
  occasion_prediction?: string;
}

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

interface SelectedProduct {
  id: string;
  title: string;
  category_prediction: string;
  image: string;
  price: string;
  size: string;
  style?: string;
}

// Add a new interface for a new item being created
interface NewInventoryItem {
  title: string;
  size: string;
  price: string;
  style?: string;
  color_prediction?: string;
  pattern_prediction?: string;
  occasion_prediction?: string;
}

// Helper function to validate image URLs
const isValidImageUrl = (url: string): boolean => {
  // Check if the URL is a valid format
  if (!url || url.trim() === "") return false;
  
  // Accept more image URL formats
  // 1. Common image extensions
  const isCommonImageFormat = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)($|\?)/i.test(url);
  
  // 2. Common CDN and image hosting URLs
  const isKnownImageHost = 
    url.includes('cdn.shopify.com') ||
    url.includes('images.') ||
    url.includes('.cloudfront.net') ||
    url.includes('.s3.amazonaws.com') ||
    url.includes('img.') ||
    url.includes('cloudinary.com') ||
    url.includes('assets.') ||
    url.includes('media.');
  
  // 3. Image data URLs
  const isDataUrl = url.startsWith('data:image/');
  
  // Specifically filter out placeholder or empty image references
  const isPlaceholder = url.includes('placeholder') || url === 'undefined' || url === '';
  
  return (isCommonImageFormat || isKnownImageHost || isDataUrl) && !isPlaceholder;
};

// Load deleted item IDs from localStorage
const loadDeletedItemsFromStorage = (): string[] => {
  const storedItems = localStorage.getItem('deletedInventoryItems');
  return storedItems ? JSON.parse(storedItems) : [];
};

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

const RetailDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inventoryItems, setInventoryItems] = useState<FormattedProduct[]>([]);
  const [filteredItems, setFilteredItems] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [uploadMode, setUploadMode] = useState(location.pathname === "/retail/upload");
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiResults, setAiResults] = useState<{
    color_prediction?: string;
    size?: string;
    style?: string;
    occasion_prediction?: string;
    pattern_prediction?: string;
    category_prediction?: string;
    price?: string;
  } | null>(null);
  const [confirmResults, setConfirmResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // New state variables for adding new items
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState<NewInventoryItem>({
    title: "",
    size: "Medium",
    price: "$0",
    style: "Modern",
  });
  // New state variables for deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  // State for tracking deleted items
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>(loadDeletedItemsFromStorage());
  // Add this near your other state variables at the top of your component
  const [imageUrl, setImageUrl] = useState("");
  const [matchFound, setMatchFound] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Available filter options
  const [availableFilters] = useState({
    styles: ['Casual', 'Formal', 'Vintage', 'Streetwear', 'Bohemian'],
    patterns: ['Solid', 'Striped', 'Floral', 'Plaid', 'Polka Dot'],
    colors: ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Multi'],
    conditions: ['New with tags', 'Like new', 'Good', 'Fair'],
    productTypes: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'],
    sizes: ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large', 'XXL', 'One Size'],
    genders: ['Women', 'Men', 'Unisex'],
    occasions: ['Casual', 'Formal', 'Office', 'Party', 'Outdoor', 'Athletic']
  });

  // Save deleted item IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('deletedInventoryItems', JSON.stringify(deletedItemIds));
  }, [deletedItemIds]);

  // Initialize state after availableFilters is defined
  useEffect(() => {
    setNewItemData({
      title: "",
      size: availableFilters.sizes[2] || "Medium", // Index 2 is typically Medium
      price: "$0",
      style: availableFilters.styles[0] || "Modern",
    });
  }, [availableFilters]);

  // Fetch inventory data
  useEffect(() => {
    setLoading(true);
    
    fetch("/vico_products_export_1 .csv")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch CSV file");
        }
        return res.text();
      })
      .then((csvText) => {
        Papa.parse<ProductCSV>(csvText, {
          header: true,
          complete: (results) => {
            
            const specificProductIds = [
              "m1114",
              "m1146", 
              "4448",
              "m1129",
              "8455",
              "1111",
              "1149",
              "2458",
              "4456",
              "2467",
              "0469",
            ];
            
            // Transform CSV data to the format expected by FormattedProduct
            const formattedProducts: FormattedProduct[] = results.data
              // Filter to only include our specific product IDs
              .filter(item => {
                // Check if this is one of our specific product IDs
                const isSpecificProduct = specificProductIds.includes(item["Style ID"]);
                
                // Basic validation checks
                const hasRequiredFields = 
                  item["Style ID"] && 
                  item.Title &&
                  item["Image Src"];
                
                const hasValidImage = hasRequiredFields && isValidImageUrl(item["Image Src"]);
                
                // Also filter out deleted items
                const notDeleted = !deletedItemIds.includes(item["Style ID"]);
                
                return isSpecificProduct && hasValidImage && notDeleted;
              })
              .map(item => ({
                id: item["Style ID"],
                title: item.Title,
                image: item["Image Src"],
                price: item.Price ? `$${item.Price.replace(/\$/g, '')}` : "$0",
                category_prediction: item["category_prediction"] || item["Product Category"] || "Uncategorized",
                size: item.Size || "One Size",
                style: item["Style ID"]?.substring(0, 1) === 'm' ? 'Vintage' : 'Modern',
                color_prediction: item["color_prediction"] || null,
                pattern_prediction: item["pattern_prediction"] || null,
                occasion_prediction: item["occasion_prediction"] || null,
              }));
            
            // Sort the products in the same order as the specificProductIds array
            const orderedProducts = formattedProducts.sort((a, b) => {
              const indexA = specificProductIds.indexOf(a.id);
              const indexB = specificProductIds.indexOf(b.id);
              return indexA - indexB;
            });
            
            setInventoryItems(orderedProducts);
            setFilteredItems(orderedProducts);
            setLoading(false);
            
            // If we're in upload mode from the URL but no product is selected yet,
            // and we have products available, select the first one
            if (location.pathname === "/retail/upload" && !selectedProduct && orderedProducts.length > 0) {
              const firstProduct = orderedProducts[0];
              setSelectedProduct({
                id: firstProduct.id,
                title: firstProduct.title,
                category_prediction: firstProduct.category_prediction,
                image: firstProduct.image,
                price: firstProduct.price,
                size: firstProduct.size,
                style: firstProduct.style
              });
            }
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
  }, [location.pathname, selectedProduct, deletedItemIds]);

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...inventoryItems];

    // Apply filters
    if (filters.size.length > 0) {
      filtered = filtered.filter(product => product.size && filters.size.includes(product.size));
    }
    if (filters.productType.length > 0) {
      filtered = filtered.filter(product => filters.productType.includes(product.category_prediction));
    }
    if (filters.style.length > 0) {
      filtered = filtered.filter(product => product.style && filters.style.includes(product.style));
    }
    if (filters.pattern.length > 0) {
      filtered = filtered.filter(product => product.pattern_prediction && filters.pattern.includes(product.pattern_prediction));
    }
    if (filters.color.length > 0) {
      filtered = filtered.filter(product => product.color_prediction && filters.color.includes(product.color_prediction));
    }

    // Apply price range filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) {
      filtered = filtered.filter(product => {
        const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
        return numericPrice >= filters.priceRange.min && numericPrice <= filters.priceRange.max;
      });
    }

    // Apply sorting (or keep original shuffled order if no sorting specified)
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
            const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return aPrice - bPrice;
          });
          break;
        case 'price_desc':
          filtered.sort((a, b) => {
            const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return bPrice - aPrice;
          });
          break;
        case 'newest':
          // We don't have a date field, so this is a placeholder
          filtered.reverse();
          break;
      }
    }

    setFilteredItems(filtered);
  };

  // Handle product selection for image upload
  const handleSelectProduct = (product: FormattedProduct) => {
    setSelectedProduct({
      id: product.id,
      title: product.title,
      category_prediction: product.category_prediction,
      image: product.image,
      price: product.price,
      size: product.size,
      style: product.style
    });
    setUploadMode(true);
  };

  // Handle drag events for image upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const uploadedImageUrl = reader.result as string;
        setUploadedImage(uploadedImageUrl);
        
        // Instead of simulating AI, check if this file matches any product
        const matchingProduct = findProductByImageUrl(uploadedImageUrl);
        
        if (matchingProduct) {
          setMatchFound(true);
          console.log("Found matching product for uploaded file:", matchingProduct);
          
          // Set results from the matched product data
          setAiResults({
            color_prediction: matchingProduct.color_prediction,
            size: matchingProduct.size,
            style: matchingProduct.style,
            occasion_prediction: matchingProduct.occasion_prediction,
            pattern_prediction: matchingProduct.pattern_prediction,
            category_prediction: matchingProduct.category_prediction,
            price: matchingProduct.price
          });
          
          // Update the new item data with matched product details
          if (matchingProduct.size) {
            handleNewItemChange('size', matchingProduct.size);
          }
          if (matchingProduct.price) {
            handleNewItemChange('price', matchingProduct.price);
          }
          if (matchingProduct.color_prediction) {
            handleNewItemChange('color_prediction', matchingProduct.color_prediction);
          }
          if (matchingProduct.pattern_prediction) {
            handleNewItemChange('pattern_prediction', matchingProduct.pattern_prediction);
          }
          if (matchingProduct.occasion_prediction) {
            handleNewItemChange('occasion_prediction', matchingProduct.occasion_prediction);
          }
        } else {
          // No match found, clear and alert the user
          setUploadedImage(null);
          alert("The uploaded image doesn't match any products in our database. Please try uploading an image that exists in our product catalog.");
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
  };

  // Helper to get a random item from an array
  const getRandomFromArray = (array: string[]) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const handleConfirmUpload = () => {
    if (selectedProduct && aiResults) {
      // In a real application, we would make an API call to update the product
      alert(`Image uploaded for ${selectedProduct.title}! AI-detected attributes have been added to the inventory.`);
      resetUploadState();
    }
  };

  // Handle starting the process to add a new item
  const handleAddNewItem = () => {
    setIsAddingNewItem(true);
    setUploadMode(true);
    setSelectedProduct(null);
  };

  // Handle input changes for new item form
  const handleNewItemChange = (field: keyof NewInventoryItem, value: string) => {
    setNewItemData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle saving the new item to inventory
  const handleSaveNewItem = () => {
    if (!uploadedImage) {
      alert("Please provide an image URL for the new item");
      return;
    }

    if (!aiResults?.category_prediction) {
      alert("Cannot detect product category. Please try a different image.");
      return;
    }

    // Generate a unique ID for the new item
    const newItemId = `new-item-${Date.now()}`;
    
    // Create the new item with the image URL and form data
    const newItem: FormattedProduct = {
      id: newItemId,
      title: newItemData.title || "New Item",
      image: uploadedImage, // This is now the image URL
      price: newItemData.price || "$0",
      category_prediction: aiResults.category_prediction || "Uncategorized",
      size: newItemData.size || "One Size",
      style: newItemData.style || "Modern",
      color_prediction: newItemData.color_prediction,
      pattern_prediction: newItemData.pattern_prediction,
      occasion_prediction: newItemData.occasion_prediction,
    };

    // Add the new item to the inventory
    setInventoryItems(prev => [newItem, ...prev]);
    setFilteredItems(prev => [newItem, ...prev]);
    
    // Show confirmation
    alert(`New item "${newItem.title}" has been added to your inventory!`);
    
    // Reset state
    resetUploadState();
  };

  const resetUploadState = () => {
    setUploadMode(false);
    setSelectedProduct(null);
    setUploadedImage(null);
    setImageUrl("");
    setAiResults(null);
    setConfirmResults(false);
    setIsAddingNewItem(false);
    setNewItemData({
      title: "",
      size: availableFilters.sizes[2] || "Medium", // Index 2 is typically Medium
      price: "$0",
      style: availableFilters.styles[0] || "Modern",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Navigate back to main retail dashboard
    if (location.pathname === "/retail/upload") {
      navigate("/retail");
    }
    setMatchFound(false);
  };

  // Handle deleting an item from inventory
  const handleDeleteItem = (itemId: string, event: React.MouseEvent) => {
    // Stop event propagation to prevent selecting the item when clicking delete
    event.stopPropagation();
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  // Confirm deletion of an item
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      // Add the item ID to deletedItemIds
      setDeletedItemIds(prev => [...prev, itemToDelete]);
      
      // Remove the item from both inventoryItems and filteredItems
      setInventoryItems(prev => prev.filter(item => item.id !== itemToDelete));
      setFilteredItems(prev => prev.filter(item => item.id !== itemToDelete));
      
      // Show confirmation
      alert(`Item has been removed from your inventory.`);
      
      // Reset delete confirmation state
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDeleteItem = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Add this handler function
  const handleImageUrl = () => {
    if (!imageUrl) {
      alert('Please enter a valid image URL');
      return;
    }
    
    // Basic URL sanitization and validation
    let processedUrl = imageUrl.trim();
    
    // If URL doesn't start with http:// or https://, add https:// as default
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'https://' + processedUrl;
    }
    
    // Set loading state
    setUploadedImage(processedUrl);
    setAiResults(null); // Clear previous results to show loading spinner
    
    // Try to find a matching product in our inventory
    const matchingProduct = findProductByImageUrl(processedUrl);
    
    if (matchingProduct) {
      setMatchFound(true);
      console.log("Found matching product:", matchingProduct);
      
      // Set results from the matched product data
      setAiResults({
        color_prediction: matchingProduct.color_prediction,
        size: matchingProduct.size,
        style: matchingProduct.style,
        occasion_prediction: matchingProduct.occasion_prediction,
        pattern_prediction: matchingProduct.pattern_prediction,
        category_prediction: matchingProduct.category_prediction,
        price: matchingProduct.price
      });
      
      // Update the new item data with matched product details
      if (matchingProduct.size) {
        handleNewItemChange('size', matchingProduct.size);
      }
      if (matchingProduct.price) {
        handleNewItemChange('price', matchingProduct.price);
      }
      if (matchingProduct.color_prediction) {
        handleNewItemChange('color_prediction', matchingProduct.color_prediction);
      }
      if (matchingProduct.pattern_prediction) {
        handleNewItemChange('pattern_prediction', matchingProduct.pattern_prediction);
      }
      if (matchingProduct.occasion_prediction) {
        handleNewItemChange('occasion_prediction', matchingProduct.occasion_prediction);
      }
      
      // Also update the title from the matching product if it exists
      if (matchingProduct.title) {
        handleNewItemChange('title', matchingProduct.title);
      }
    } else {
      // No match found
      console.log("No matching product found for URL:", processedUrl);
      
      // We'll still allow using the image, just without auto-detected attributes
      // This is more user-friendly than entirely clearing the image
      setMatchFound(false);
      setTimeout(() => {
        // After a short delay, set empty AI results
        setAiResults({
          color_prediction: null,
          size: newItemData.size,
          style: newItemData.style,
          occasion_prediction: null,
          pattern_prediction: null,
          category_prediction: null,
          price: newItemData.price
        });
      }, 1000);
    }
  };

  // Add this helper function to find a product by its image URL
  const findProductByImageUrl = (url: string) => {
    if (!url) return null;
    
    // Normalize URLs for comparison by removing query parameters, trailing slashes, and protocol
    const normalizeUrl = (inputUrl: string) => {
      return inputUrl
        .split('?')[0]       // Remove query parameters
        .replace(/\/$/, '')  // Remove trailing slash
        .replace(/^https?:\/\//, '') // Remove protocol (http:// or https://)
        .toLowerCase();      // Convert to lowercase for case-insensitive comparison
    };
    
    const normalizedUrl = normalizeUrl(url);
    
    // Try exact URL match (after normalization)
    let matchingProduct = inventoryItems.find(item => {
      if (!item.image) return false;
      return normalizeUrl(item.image) === normalizedUrl;
    });
    
    // If no exact match, try to match by filename
    if (!matchingProduct) {
      const urlParts = normalizedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      if (filename) {
        matchingProduct = inventoryItems.find(item => {
          if (!item.image) return false;
          const itemUrlParts = normalizeUrl(item.image).split('/');
          const itemFilename = itemUrlParts[itemUrlParts.length - 1];
          return itemFilename === filename;
        });
      }
    }
    
    // Try an even looser match - check if the URLs share significant portions
    if (!matchingProduct) {
      // Extract a significant portion of the URL (minimum 10 chars) to use for matching
      const urlSignature = normalizedUrl.length > 20 
        ? normalizedUrl.substring(normalizedUrl.length - 20)
        : normalizedUrl;
      
      if (urlSignature.length >= 10) {
        matchingProduct = inventoryItems.find(item => {
          if (!item.image) return false;
          const normalizedItemUrl = normalizeUrl(item.image);
          return normalizedItemUrl.includes(urlSignature) || urlSignature.includes(normalizedItemUrl);
        });
      }
    }
    
    // If we still don't have a match, check the database for partial matches with the filename
    if (!matchingProduct && url.includes('/')) {
      const filename = url.split('/').pop() || '';
      if (filename.length > 5) {
        const filenameWithoutExtension = filename.split('.')[0];
        matchingProduct = inventoryItems.find(item => {
          return item.id.includes(filenameWithoutExtension) || 
                 filenameWithoutExtension.includes(item.id);
        });
      }
    }
    
    return matchingProduct;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {!uploadMode ? (
        <>
          {/* Dashboard Header - moved to the top */}
          <div className="border-b border-gray-200 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-thrift-900"></h1>
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-gray-1000">Retail Hub</h2>
                <p className="mt-1 text-sm text-gray-600">
                Alert Shoppers & Seal the Deal!
                </p>
              </div>
            </div>
          </div>
          
          {/* Metrics Dashboard - moved below the header */}
          <div className="py-5 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Products Metric */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <ShoppingBag className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Products</span>
                    </div>
                    <div className="mt-1">
                      <h3 className="text-2xl font-semibold text-gray-900">{inventoryItems.length}</h3>
                      <p className="text-xs text-green-600 mt-1">+{Math.max(3, Math.floor(inventoryItems.length * 0.05))} this week</p>
                    </div>
                  </div>
                </div>

                {/* Alerts Metric */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <Bell className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Alerts</span>
                    </div>
                    <div className="mt-1">
                      <h3 className="text-2xl font-semibold text-gray-900">45</h3>
                      <p className="text-xs text-gray-500 mt-1">Sent this month</p>
                    </div>
                  </div>
                </div>

                {/* Customers Metric */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <Users className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Customers</span>
                    </div>
                    <div className="mt-1">
                      <h3 className="text-2xl font-semibold text-gray-900">573</h3>
                      <p className="text-xs text-green-600 mt-1">+12 new customers</p>
                    </div>
                  </div>
                </div>

                {/* Conversion Metric */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Conversion</span>
                    </div>
                    <div className="mt-1">
                      <div className="flex items-center">
                        <h3 className="text-2xl font-semibold text-gray-900">24%</h3>
                        <span className="ml-2 flex items-center text-xs font-medium text-green-600">
                          <ArrowUpRight className="h-3 w-3 mr-0.5" />
                          3.2%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">From alerts to sales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add New Item Button - Now a dedicated section before filters */}
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-4">
                    Use the "Add New Item" button to create a new inventory item, or hover over the trash icon to delete items from inventory
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddNewItem}
                    className="inline-flex items-center px-4 py-2 bg-thrift-600 text-white shadow-sm text-sm font-medium rounded-md hover:bg-thrift-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-thrift-500"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Item
                  </button>
                  
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Inventory section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
                <ProductFilters 
                  onFilterChange={handleFilterChange}
                  maxPrice={1000}
                  availableProductTypes={availableFilters.productTypes}
                  availableStyles={availableFilters.styles}
                  availablePatterns={availableFilters.patterns}
                  availableColors={availableFilters.colors}
                  availableConditions={availableFilters.conditions}
                  availableSizes={availableFilters.sizes}
                />
              </div>
              
              {/* Product Grid */}
              <div className="flex-1">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading inventory...</span>
                  </div>
                ) : error ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredItems.map((product) => (
                        <div
                          key={product.id}
                          className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
                        >
                          {/* Delete button added to top-right corner */}
                          <button
                            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteItem(product.id, e)}
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="h-64 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                            />
                          </div>
                          <div className="p-3 space-y-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {product.title}
                            </h3>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-800">
                                {product.price}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                {product.size}
                              </span>
                            </div>
                            
                            {/* Customer Matches Section */}
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <div className="flex items-center mb-2">
                                <Users size={14} className="text-gray-500 mr-1.5" />
                                <span className="text-xs font-medium text-gray-700">
                                  {/* Generate a random number between 3 and 28 */}
                                  {Math.floor(Math.random() * 26) + 3} Customer Matches
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded py-1 transition-colors"
                                  title="Send SMS to matched customers"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  Text
                                </button>
                                <button 
                                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded py-1 transition-colors"
                                  title="Email matched customers"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                                  Email
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                          No products found. Try adjusting your filters or adding new items.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this item from your inventory? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDeleteItem}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteItem}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Image Upload Mode */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-14">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Add New Item to Inventory
              </h1>
              <button
                onClick={resetUploadState}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Inventory
              </button>
            </div>

            {/* New Item Form - Always show this since we removed the update existing item feature */}
            <div className="mb-8 p-4 border rounded-lg bg-gray-50">
              <h2 className="font-medium text-lg mb-4">New Item Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newItemData.title}
                    onChange={(e) => handleNewItemChange('title', e.target.value)}
                    placeholder="Enter item title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thrift-500 focus:border-thrift-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="text"
                    value={newItemData.price}
                    onChange={(e) => handleNewItemChange('price', e.target.value)}
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thrift-500 focus:border-thrift-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size *
                  </label>
                  <select
                    value={newItemData.size}
                    onChange={(e) => handleNewItemChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thrift-500 focus:border-thrift-500"
                  >
                    {availableFilters.sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <select
                    value={newItemData.style}
                    onChange={(e) => handleNewItemChange('style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thrift-500 focus:border-thrift-500"
                  >
                    {availableFilters.styles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-gray-500 italic mt-4">
                    * Required fields. Other attributes will be detected by AI after image upload.
                  </p>
                </div>
              </div>
            </div>

            {/* Replace the existing upload area with this URL input version */}
            {!uploadedImage ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300 hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Enter product image URL
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    If you use an image URL that matches our database, we'll automatically detect the product category and attributes
                  </p>
                  
                  {/* Image URL input field */}
                  <div className="mt-4 w-full max-w-md">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-thrift-500 focus:border-thrift-500"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                  
                  {/* Submit button for the URL */}
                  <button
                    onClick={handleImageUrl}
                    disabled={!imageUrl}
                    className="mt-4 px-4 py-2 bg-thrift-600 text-white rounded-md hover:bg-thrift-700 focus:outline-none disabled:opacity-50"
                  >
                    Use This Image
                  </button>
                  
                  <p className="mt-4 text-sm text-thrift-600">
                    Try copying an image URL from your existing inventory
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Uploaded Image</h3>
                  <div className="rounded-lg overflow-hidden h-64 bg-gray-100">
                    <img 
                      src={uploadedImage} 
                      alt="Product preview" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        // If image fails to load, show fallback but don't clear the URL
                        e.currentTarget.src = '/placeholder-image.jpg'; 
                        console.error('Image failed to load:', uploadedImage);
                        
                        // Show warning to user
                        const warningElement = document.createElement('div');
                        warningElement.className = 'absolute inset-0 bg-red-50 bg-opacity-70 flex items-center justify-center p-4';
                        warningElement.innerHTML = `
                          <div class="text-center">
                            <p class="text-sm text-red-600 font-medium">Image could not be loaded</p>
                            <p class="text-xs text-red-500 mt-1">The URL might be invalid or the image is not accessible</p>
                          </div>
                        `;
                        
                        // Add warning as a sibling to the image
                        e.currentTarget.parentNode?.appendChild(warningElement);
                      }}
                      style={{ display: uploadedImage ? 'block' : 'none' }}
                    />
                    
                    {/* Show loading indicator while image is being processed */}
                    {uploadedImage && !aiResults && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60">
                        <RefreshCw className="h-8 w-8 text-thrift-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="mt-3 px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove image
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    AI-Detected Attributes
                  </h3>

                  {!aiResults ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <RefreshCw className="h-8 w-8 text-thrift-500 animate-spin" />
                      <p className="mt-4 text-sm text-gray-600">
                        {matchFound ? 'Retrieving product data...' : 'Looking for matching products...'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        We'll match this image to our database to retrieve Category, Color, Pattern and Occasion values from your CSV file
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">{aiResults.category_prediction}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Detected from the CSV data
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Size
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">
                                {newItemData.size || aiResults.size}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Color
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">{aiResults.color_prediction}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Pattern
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">{aiResults.pattern_prediction}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Style
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">
                                {newItemData.style || aiResults.style}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Occasion
                            </label>
                            <div className="mt-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={confirmResults}
                                onChange={() => setConfirmResults(!confirmResults)}
                                className="h-4 w-4 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-900">{aiResults.occasion_prediction}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 mt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={confirmResults}
                              onChange={() => setConfirmResults(!confirmResults)}
                              className="h-5 w-5 text-thrift-600 focus:ring-thrift-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              I confirm these AI-detected attributes are correct
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Add this after the AI-Detected Attributes heading */}
            {matchFound && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <p className="text-sm text-green-700">
                    Found matching product in your inventory!
                  </p>
                </div>
              </div>
            )}

            {/* Add a basic submit button or completion flow */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={resetUploadState}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewItem}
                className="px-4 py-2 bg-thrift-600 text-white rounded-md hover:bg-thrift-700 focus:outline-none"
                disabled={!uploadedImage || !confirmResults}
              >
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RetailDashboard;