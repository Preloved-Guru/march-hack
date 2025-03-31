import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageUpload from '@/components/ImageUpload';
import CSVImport from '@/components/CSVImport';
import { Camera, List, FileText } from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: FileWithPreview[]) => {
    setFiles(acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    ));
  }, []);

  const removeFile = (index: number) => {
    setFiles(files => {
      const newFiles = [...files];
      URL.revokeObjectURL(newFiles[index].preview || '');
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

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
    const droppedFiles = Array.from(e.dataTransfer.files);
    onDrop(droppedFiles as FileWithPreview[]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onDrop(selectedFiles as FileWithPreview[]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Upload New Items
          </h1>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-thrift-600 bg-thrift-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-12 h-12 bg-thrift-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-thrift-700" />
            </div>
            <p className="text-gray-600 mb-4">
              Drag and drop your images here, or click to select files
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-thrift-600 hover:bg-thrift-700 cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Selected Files ({files.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle upload logic here
                console.log('Uploading files:', files);
              }}
              className="px-4 py-2 bg-thrift-600 text-white rounded-md hover:bg-thrift-700"
              disabled={files.length === 0}
            >
              Upload Items
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default UploadPage;
