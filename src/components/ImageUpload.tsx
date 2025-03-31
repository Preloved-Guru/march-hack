import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ImageUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        toast.success('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload an image file');
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const submitItem = () => {
    toast.success('Item added to catalog!');
    clearImage();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {!uploadedImage ? (
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 ease-in-out text-center",
            dragActive 
              ? "border-wish-500 bg-wish-50" 
              : "border-thrift-200 hover:border-thrift-300"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
          />
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-thrift-100 flex items-center justify-center">
              <Upload size={28} className="text-thrift-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-thrift-800">Upload Product Image</h3>
              <p className="mt-1 text-sm text-thrift-500">
                Drag and drop or click to upload
              </p>
              <p className="mt-2 text-xs text-thrift-400">
                Supports JPG, PNG, GIF up to 10MB
              </p>
            </div>
            
            <button
              className="btn-primary bg-thrift-800 hover:bg-thrift-700"
              onClick={() => inputRef.current?.click()}
            >
              Select Image
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-500 animate-fade-in">
          <div className="relative aspect-video bg-thrift-100">
            <img 
              src={uploadedImage} 
              alt="Uploaded product" 
              className="w-full h-full object-contain"
            />
            
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex justify-end gap-4">
              <button
                onClick={clearImage}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitItem}
                className="btn-primary bg-thrift-800 hover:bg-thrift-700"
              >
                Add to Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
