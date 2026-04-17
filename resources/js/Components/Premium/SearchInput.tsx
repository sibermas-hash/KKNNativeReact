import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ className, onSearch, ...props }) => {
  return (
    <div className={clsx("relative", className)}>
      <Search 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" 
      />
      <input
        {...props}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
        className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all placeholder:text-gray-400"
      />
    </div>
  );
};

export default SearchInput;
