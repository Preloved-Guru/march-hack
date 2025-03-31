import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';

interface CSVData {
  [key: string]: string;
}

const CSVImport: React.FC = () => {
  const [csvData, setCSVData] = useState<CSVData[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setIsLoading(true);
    setError('');
    setSuccess(false);

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      setIsLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parse results:', results); // Debug log
        
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(err => 
            `Row ${err.row}: ${err.message || 'Unknown error'}`
          ).join('; ');
          setError(`CSV parsing errors: ${errorMessages}`);
          setIsLoading(false);
          return;
        }

        if (results.data.length === 0) {
          setError('The CSV file appears to be empty');
          setIsLoading(false);
          return;
        }

        // Validate required columns
        const requiredColumns = ['title', 'description', 'price', 'category', 'image_url'];
        const headers = Object.keys(results.data[0]);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setIsLoading(false);
          return;
        }
        
        setCSVData(results.data as CSVData[]);
        setSuccess(true);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('Parse error:', error); // Debug log
        setError('Error reading CSV file: ' + error.message);
        setIsLoading(false);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-wish-500 bg-wish-50' : 'border-thrift-200 hover:border-thrift-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <div className="animate-pulse">
              <FileText size={40} className="text-thrift-400" />
              <p className="mt-2 text-thrift-600">Processing file...</p>
            </div>
          ) : error ? (
            <div className="text-red-500">
              <AlertCircle size={40} />
              <p className="mt-2 text-sm whitespace-pre-wrap">{error}</p>
              <p className="text-sm mt-1">Try uploading again</p>
            </div>
          ) : success ? (
            <div className="text-green-500">
              <Check size={40} />
              <p className="mt-2">CSV file successfully imported!</p>
              <p className="text-sm mt-1">{csvData.length} rows loaded</p>
            </div>
          ) : (
            <>
              <Upload size={40} className="text-thrift-400" />
              <div>
                <p className="text-lg font-medium text-thrift-700">
                  {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-thrift-500 mt-1">or click to select file</p>
              </div>
              <div className="mt-4 text-sm text-thrift-500">
                <p>Required columns:</p>
                <p>title, description, price, category, image_url</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {csvData.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-thrift-200">
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-thrift-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-thrift-200">
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td
                        key={i}
                        className="px-6 py-4 whitespace-nowrap text-sm text-thrift-700"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <p className="text-sm text-thrift-500 mt-2 text-center">
                Showing first 5 rows of {csvData.length} total rows
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport; 