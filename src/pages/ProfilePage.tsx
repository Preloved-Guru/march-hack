import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, User, Bell, Settings, Clock, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
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

// Define the structure needed for CatalogItem
interface FormattedProduct {
  id: string;
  title: string;
  image: string;
  price: string;
  category: string;
  size: string;
  style?: string;
}

// Mock user data
const mockUser = {
  name: 'Ivy Harper',
  email: 'Ivy.harper@example.com',
  joinDate: 'March 2023',
  avatar: 'https://randomuser.me/api/portraits/women/8.jpg'
};

// Mock wishlist items
const mockWishlistItems = [
  {
    id: 'wish1',
    title: 'Pink Stripe Floral Top',
    addedDate: '2024-03-01',
    image: '/Preloved Guru Hack Images/IMG_8836.jpeg',
    status: 'match_found',
    keywords: ['Pink', 'top', 'white', 'casual', 'modern']
  },
  {
    id: 'wish2',
    title: 'Red Asymetrical dress',
    addedDate: '2024-01-20',
    image: '/Preloved Guru Hack Images/1167.jpg',
    status: 'watching',
    keywords: ['red', 'dress', 'formal', 'modern', ]
  },
 
  {
    id: 'wish3',
    title: 'Black Evening Dress',
    addedDate: '2024-01-10',
    image: '/Preloved Guru Hack Images/8989.jpg',
    status: 'match_found',
    keywords: ['black', 'dress', 'evening', 'formal']
  },
  {
    id: 'wish4',
    title: 'Sherpa Jacket',
    addedDate: '2024-03-05',
    image: '/Preloved Guru Hack Images/7777.jpg',
    status: 'watching',
    keywords: ['brown', 'outerwear', 'jacket', 'casual']
  },
  {
    id: 'wish5',
    title: 'Beige Skirt',
    addedDate: '2024-01-25',
    image: '/Preloved Guru Hack Images/2467.jpg',
    status: 'match_found',
    keywords: ['skirt', 'modern', 'beige', 'bottom']
  },
  {
    id: 'wish6',
    title: 'Patterned Blouse',
    addedDate: '2024-03-10',
    image: '/Preloved Guru Hack Images/9090.jpg',
    status: 'watching',
    keywords: ['pattern', 'blouse', 'vintage', 'top','white']
  }
];

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

// Purchase history
const mockPurchaseHistory = [
  {
    id: 'order123',
    date: 'March 15, 2024',
    total: '$95.00',
    status: 'Delivered',
    items: [
      {
        id: 'item1',
        title: 'Yellow Rain Jacket',
        price: '$45.00',
        image: '/Preloved Guru Hack Images/1458.jpg'
      },
      {
        id: 'item2',
        title: 'Formal Orange Dress',
        price: '$50.00',
        image: '/Preloved Guru Hack Images/3336.jpg'
      }
    ]
  },
  {
    id: 'order456',
    date: 'February 22, 2024',
    total: '$265.00',
    status: 'Delivered',
    items: [
      {
        id: 'item3',
        title: 'Vintage Accessories Set',
        price: '$225.00',
        image: '/Preloved Guru Hack Images/1234.jpeg'
      },
      {
        id: 'item4',
        title: 'Red Sweatshirt',
        price: '$40.00',
        image: '/Preloved Guru Hack Images/5899.jpg'
      }
    ]
  }
];

// Define wishlist item interface
interface WishlistItem {
  id: string;
  title: string;
  addedDate: string;
  image: string;
  status: 'watching' | 'match_found';
  keywords: string[];
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wishlist');
  const [inventoryItems, setInventoryItems] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Array<{
    id: string;
    wishlistId: string;
    wishlistTitle: string;
    matchedItem: FormattedProduct & { matchScore: string; matchDate: string; };
  }>>([]);
  const [deletedMatchIds, setDeletedMatchIds] = useState<string[]>(() => {
    // Load deleted match IDs from localStorage on component initialization
    const saved = localStorage.getItem('deletedMatchIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortWishlist, setSortWishlist] = useState<'date-desc' | 'date-asc' | 'matches' | 'alphabetical'>('date-desc');
  const [filterWishlist, setFilterWishlist] = useState<'all' | 'with-matches' | 'watching'>('all');

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
            // Transform CSV data to the format expected by CatalogItem
            const formattedProducts = results.data
              .filter((item, index) => {
                const rowNumber = index + 1; // +1 because index is 0-based but rows are 1-based
                const isExcludedRow = rowNumber >= 81 && rowNumber <= 95 || rowNumber === 79;
                
                // Exclude specific item #9009 (Black Fit & Flare Dress)
                const isSpecificExcludedItem = item["Style ID"] === "9009";

                if (isExcludedRow) {
                  // console.log(`Excluding row #${rowNumber} from display:`, item["Style ID"]);
                  return false;
                }
                
                const hasRequiredFields = 
                  item["Style ID"] && 
                  item.Title &&
                  item["Image Src"];
                
                const hasValidImage = hasRequiredFields && isValidImageUrl(item["Image Src"]);
                
                return hasValidImage;
              })
              .map(item => ({
                id: item["Style ID"],
                title: item.Title,
                image: item["Image Src"],
                price: item.Price ? `$${item.Price.replace(/\$/g, '')}` : "$0",
                category: item["Product Category"] || "Uncategorized",
                size: item.Size || "One Size",
                style: item["Style ID"]?.substring(0, 1) === 'm' ? 'Vintage' : 'Modern'
              }));
            
            setInventoryItems(formattedProducts);
            
            // Create matches based on the wishlist items and inventory
            generateMatches(formattedProducts);
            
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
  
  // Effect to save deleted match IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deletedMatchIds', JSON.stringify(deletedMatchIds));
  }, [deletedMatchIds]);
  
  // Generate matches from inventory items for wishlist items
  const generateMatches = (products: FormattedProduct[]) => {
    // Only generate matches for wishlist items with 'match_found' status
    const matchedWishlistItems = mockWishlistItems.filter(item => item.status === 'match_found');
    
    const newMatches = matchedWishlistItems.flatMap(wishlistItem => {
      // Use the predefined keywords from the wishlist item
      const keywords = wishlistItem.keywords || 
        wishlistItem.title.toLowerCase().split(' ').filter(word => word.length > 3);
      
      // Score products based on keyword matches
      const scoredProducts = products.map(product => {
        const productTitle = product.title.toLowerCase();
        const productCategory = product.category.toLowerCase();
        
        // Calculate a match score based on keyword appearances
        let score = 0;
        keywords.forEach(keyword => {
          // Higher score for title matches
          if (productTitle.includes(keyword)) {
            score += 10;
          }
          // Medium score for category matches
          if (productCategory.includes(keyword)) {
            score += 5;
          }
          // Lower score for style/size matches
          if (product.style?.toLowerCase().includes(keyword)) {
            score += 3;
          }
        });
        
        return {
          product,
          score
        };
      });
      
      // Sort by score and get top matches
      const topMatches = scoredProducts
        .filter(item => item.score > 0) // Only include items with at least some match
        .sort((a, b) => b.score - a.score) // Sort by descending score
        .slice(0, 3); // Get top 3 matches
      
      // If we don't have enough matches, add some random products that match at least the category
      if (topMatches.length < 2) {
        const categoryProducts = products.filter(product => 
          !topMatches.find(match => match.product.id === product.id) && // Not already matched
          keywords.some(keyword => product.category.toLowerCase().includes(keyword)) // Category matches some keyword
        ).slice(0, 2 - topMatches.length);
        
        categoryProducts.forEach(product => {
          topMatches.push({
            product,
            score: 1 // Lower score for category-only matches
          });
        });
      }
      
      // Convert scores to percentages
      const maxScore = Math.max(...topMatches.map(item => item.score));
      
      // Create match objects
      return topMatches.map((match, index) => {
        // Calculate match percentage - normalize to a range between 75% and 98%
        const normalizedScore = Math.min(98, Math.max(75, Math.round((match.score / maxScore) * 98)));
        
        return {
          id: `match-${wishlistItem.id}-${index}`,
          wishlistId: wishlistItem.id,
          wishlistTitle: wishlistItem.title,
          matchedItem: {
            ...match.product,
            matchScore: `${normalizedScore}%`,
            matchDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Random date within last month
          }
        };
      });
    })
    .filter(match => !deletedMatchIds.includes(match.id)); // Filter out deleted matches
    
    setMatches(newMatches);
  };
  
  // Handler to navigate to item detail
  const handleViewItemDetails = (itemId: string) => {
    // Navigate to the inventory item detail page
    navigate(`/new?itemId=${itemId}`);
  };

  const handleDeleteMatch = (matchId: string) => {
    // Add to deleted matches
    setDeletedMatchIds(prev => [...prev, matchId]);
    
    // Remove from displayed matches
    setMatches(prevMatches => prevMatches.filter(match => match.id !== matchId));

    // Show feedback to the user
    alert('Item removed from matches');
    
    // Check if this was the last match for a wishlist item
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const remainingMatchesForItem = matches.filter(
        m => m.wishlistId === match.wishlistId && m.id !== matchId
      ).length;
      
      // If no matches left for this wishlist item, we could update its status
      // In a real app, we would call an API to update the backend
      if (remainingMatchesForItem === 0) {
        console.log(`No more matches for wishlist item ${match.wishlistId}`);
        // Example: api.updateWishlistItemStatus(match.wishlistId, 'watching')
      }
    }
  };

  return (
    <div className="min-h-screen bg-thrift-50">
      <Navbar />
      
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-thrift-700 text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white">
                <img 
                  src={mockUser.avatar} 
                  alt={mockUser.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">{mockUser.name}</h1>
                <p className="mt-1 text-thrift-100">{mockUser.email}</p>
                <p className="mt-1 text-thrift-200">Member since {mockUser.joinDate}</p>
              </div>
              
              <div className="md:ml-auto">
                <button className="bg-white text-thrift-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-thrift-50 transition-colors">
                  <Settings size={16} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="wishlist" className="flex items-center gap-2">
                <Heart size={16} />
                <span>Wishlist</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Bell size={16} />
                <span>Matches</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock size={16} />
                <span>Purchase History</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-xl font-bold text-thrift-900">My Wishlist</h2>
                  <p className="text-sm text-thrift-600">
                    {(() => {
                      const filteredCount = mockWishlistItems.filter(item => {
                        switch (filterWishlist) {
                          case 'with-matches':
                            return item.status === 'match_found';
                          case 'watching':
                            return item.status === 'watching';
                          case 'all':
                          default:
                            return true;
                        }
                      }).length;
                      
                      const totalCount = mockWishlistItems.length;
                      
                      if (filterWishlist === 'all') {
                        return `${totalCount} items`;
                      } else {
                        return `${filteredCount} of ${totalCount} items`;
                      }
                    })()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="filter-wishlist" className="text-sm text-thrift-700">
                      Show:
                    </label>
                    <select 
                      id="filter-wishlist" 
                      value={filterWishlist}
                      onChange={(e) => setFilterWishlist(e.target.value as any)}
                      className="py-1 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-thrift-500 focus:border-thrift-500"
                    >
                      <option value="all">All items</option>
                      <option value="with-matches">With matches</option>
                      <option value="watching">Still watching</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-0 sm:ml-4">
                    <label htmlFor="sort-wishlist" className="text-sm text-thrift-700">
                      Sort by:
                    </label>
                    <select 
                      id="sort-wishlist" 
                      value={sortWishlist}
                      onChange={(e) => setSortWishlist(e.target.value as any)}
                      className="py-1 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-thrift-500 focus:border-thrift-500"
                    >
                      <option value="date-desc">Newest first</option>
                      <option value="date-asc">Oldest first</option>
                      <option value="matches">Match count</option>
                      <option value="alphabetical">A to Z</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockWishlistItems
                  .filter(item => {
                    switch (filterWishlist) {
                      case 'with-matches':
                        return item.status === 'match_found';
                      case 'watching':
                        return item.status === 'watching';
                      case 'all':
                      default:
                        return true;
                    }
                  })
                  .slice() // Create a copy to avoid mutating the original
                  .sort((a, b) => {
                    switch (sortWishlist) {
                      case 'date-desc':
                        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
                      case 'date-asc':
                        return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
                      case 'matches':
                        const aMatchCount = a.status === 'match_found' ? matches.filter(match => match.wishlistId === a.id).length : 0;
                        const bMatchCount = b.status === 'match_found' ? matches.filter(match => match.wishlistId === b.id).length : 0;
                        return bMatchCount - aMatchCount;
                      case 'alphabetical':
                        return a.title.localeCompare(b.title);
                      default:
                        return 0;
                    }
                  })
                  .map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-64">
                        <img 
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain bg-gray-50"
                          onError={(e) => {
                            // Fallback image if local image fails to load
                            (e.target as HTMLImageElement).src = '/Preloved Guru Hack Images/1234.jpeg';
                          }}
                        />
                        {item.status === 'match_found' && (
                          <div className="absolute top-2 right-2 bg-wish-600 text-white text-xs font-medium px-2 py-1 rounded-md">
                            {matches.filter(match => match.wishlistId === item.id).length} Matches Found!
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-thrift-900 text-lg">{item.title}</h3>
                        <p className="text-sm text-thrift-500 mt-1">Added on {new Date(item.addedDate).toLocaleDateString()}</p>
                        
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          {item.keywords.map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-thrift-100 text-thrift-700 text-xs rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex justify-between">
                          {item.status === 'match_found' ? (
                            <button 
                              onClick={() => setActiveTab('matches')}
                              className="text-sm text-wish-600 font-medium hover:text-wish-700 flex items-center gap-1"
                            >
                              <Bell size={14} />
                              View Matches
                            </button>
                          ) : (
                            <p className="text-sm text-thrift-600 flex items-center gap-1">
                              <Clock size={14} />
                              Watching for matches
                            </p>
                          )}
                          
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {/* Add new wishlist item card */}
                <div className="border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-thrift-100 flex items-center justify-center mb-3">
                    <Heart className="h-8 w-8 text-thrift-600" />
                  </div>
                  <p className="text-thrift-600 font-medium text-lg">Add to Wishlist</p>
                  <p className="text-sm text-thrift-400 mt-1 text-center max-w-xs px-4">
                    Upload an image or describe what you're looking for and we'll notify you when matching items arrive
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Matches Tab */}
            <TabsContent value="matches">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 text-thrift-600 animate-spin" />
                  <span className="ml-3 text-thrift-600">Loading matches from inventory...</span>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Group matches by wishlist item */}
                  {mockWishlistItems
                    .filter(item => item.status === 'match_found')
                    .map(wishlistItem => {
                      const itemMatches = matches.filter(match => match.wishlistId === wishlistItem.id);
                      if (itemMatches.length === 0) return null;
                      
                      return (
                        <div key={wishlistItem.id} className="border-2 border-wish-200 rounded-xl overflow-hidden bg-wish-50 p-3">
                          <div className="flex items-center gap-3 mb-4 border-b border-wish-100 pb-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                              <img 
                                src={wishlistItem.image}
                                alt={wishlistItem.title}
                                className="w-full h-full object-contain bg-gray-50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/Preloved Guru Hack Images/1234.jpeg';
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="font-bold text-thrift-900 text-lg">{wishlistItem.title}</h3>
                              <p className="text-xs text-thrift-600">
                                {itemMatches.length} {itemMatches.length === 1 ? 'match' : 'matches'} found for this wishlist item
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itemMatches.map(match => (
                              <div key={match.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="p-2 border-b border-gray-200 bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-thrift-500">Found on {new Date(match.matchedItem.matchDate).toLocaleDateString()}</p>
                                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                      {match.matchedItem.matchScore} Match
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col h-full">
                                  <div className="relative h-40 overflow-hidden">
                                    <img 
                                      src={match.matchedItem.image}
                                      alt={match.matchedItem.title}
                                      className="w-full h-full object-contain bg-gray-50"
                                      onError={(e) => {
                                        // Fallback image if the product image fails to load
                                        (e.target as HTMLImageElement).src = '/Preloved Guru Hack Images/1234.jpeg';
                                      }}
                                    />
                                    {match.matchedItem.size && (
                                      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm text-thrift-800 text-xs font-medium px-2 py-0.5 rounded">
                                        Size: {match.matchedItem.size}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="p-3 flex-grow flex flex-col">
                                    <h4 className="font-medium text-base text-thrift-900 line-clamp-1">{match.matchedItem.title}</h4>
                                    
                                    <div className="flex items-center mt-2 flex-wrap gap-1">
                                      <div className="font-bold text-lg text-thrift-700">{match.matchedItem.price}</div>
                                      {match.matchedItem.category && (
                                        <div className="ml-2 bg-thrift-100 text-thrift-700 text-xs font-medium px-1.5 py-0.5 rounded">
                                          {match.matchedItem.category}
                                        </div>
                                      )}
                                      {match.matchedItem.style && (
                                        <div className="ml-1 bg-thrift-100 text-thrift-700 text-xs font-medium px-1.5 py-0.5 rounded">
                                          {match.matchedItem.style}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {wishlistItem.keywords.slice(0, 3).map((keyword, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                          {keyword}
                                        </span>
                                      ))}
                                      {wishlistItem.keywords.length > 3 && (
                                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                          +{wishlistItem.keywords.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="mt-auto pt-3 flex gap-2">
                                      <button 
                                        onClick={() => handleViewItemDetails(match.matchedItem.id)}
                                        className="flex-1 px-2 py-1.5 text-xs bg-thrift-600 text-white rounded-md hover:bg-thrift-700 transition-colors"
                                      >
                                        View in Inventory
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteMatch(match.id)}
                                        className="px-2 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center justify-center"
                                        title="Not Interested"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  
                  {matches.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No matches yet</h3>
                      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        We're still looking for items that match your wishlist. We'll notify you when we find something you might like.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Purchase History Tab */}
            <TabsContent value="history">
              <div className="space-y-6">
                {mockPurchaseHistory.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center">
                      <div>
                        <h3 className="font-medium text-thrift-800">Order #{order.id}</h3>
                        <p className="text-sm text-thrift-500 mt-1">Placed on {order.date}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <div className="font-bold text-thrift-900">{order.total}</div>
                        <div className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                          {order.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {order.items.map(item => (
                        <div key={item.id} className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          
                          <div className="flex-grow">
                            <h4 className="font-medium text-thrift-900">{item.title}</h4>
                            <p className="text-sm text-thrift-500">{item.price}</p>
                          </div>
                          
                          <button 
                            className="text-sm text-thrift-600 hover:text-thrift-700"
                            onClick={() => handleViewItemDetails('item-' + item.id)}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {mockPurchaseHistory.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No purchase history</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                      You haven't made any purchases yet. When you buy something, it will appear here.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfilePage; 