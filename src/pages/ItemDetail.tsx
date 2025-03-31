import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Trash2 } from 'lucide-react';

interface ItemDetailProps {}

const ItemDetail: React.FC<ItemDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [matchDate, setMatchDate] = useState<string>('');

  useEffect(() => {
    // This would be replaced with a real API call in production
    // Simulating API call to get item details
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // Example: const response = await api.getItemDetails(id);
        
        // For demo, we're using mock data
        const mockItem = {
          id: id,
          title: "Upcycled Vintage Top - Lilac and White Gingham Elsie Size Small",
          price: "$145",
          category: "Top",
          style: "Vintage",
          image: "https://cdn.shopify.com/s/files/1/0683/3281/4566/files/IMG_9872.jpg?v=1710296801",
          tags: ["Pink", "top", "white", "casual", "modern"]
        };
        
        setItem(mockItem);
        setMatchDate("3/3/2025");
      } catch (error) {
        console.error("Error fetching item details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const handleNotInterested = () => {
    // In a real app, this would call an API to mark the item as not interested
    // Example: await api.markNotInterested(id);
    
    // Show confirmation
    alert("Item removed from matches");
    
    // Navigate back to profile or wishlist page
    navigate('/profile');
  };

  const handleViewInventory = () => {
    // In a real app, navigate to the real inventory page for this item
    window.open(`/inventory/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-thrift-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-thrift-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-thrift-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-thrift-900">Item not found</h1>
            <p className="mt-2 text-thrift-600">The item you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 px-4 py-2 bg-thrift-600 text-white rounded-md hover:bg-thrift-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-thrift-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Match Date */}
          <div className="bg-thrift-100 p-4 border-b border-thrift-200">
            <div className="flex justify-between items-center">
              <p className="text-thrift-600">Found on {matchDate}</p>
              <button
                onClick={handleNotInterested}
                className="px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors flex items-center gap-1 text-sm"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Details Section */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-2xl font-bold text-thrift-900">{item.title}</h1>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="text-2xl font-bold text-thrift-900">{item.price}</div>
                <div className="bg-thrift-100 px-3 py-1 rounded-full text-thrift-700">{item.category}</div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">{item.style}</div>
              </div>
              
              <div className="mt-6">
                <p className="text-thrift-600">
                  This item matches what you're looking for! Our AI has found this item based on your wishlist preferences.
                </p>
              </div>
              
              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags?.map((tag: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleViewInventory}
                  className="px-4 py-2 bg-thrift-600 text-white rounded-md hover:bg-thrift-700 transition-colors"
                >
                  View in Inventory
                </button>
                <button
                  onClick={handleNotInterested}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Not Interested
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ItemDetail; 