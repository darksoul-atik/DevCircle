import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button key="1" onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium hover:bg-subtle transition-colors">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots-start" className="w-8 h-8 flex items-center justify-center text-muted">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
            currentPage === i 
              ? 'bg-accent text-white shadow-sm' 
              : 'hover:bg-subtle text-primary'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots-end" className="w-8 h-8 flex items-center justify-center text-muted">...</span>);
      }
      pages.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium hover:bg-subtle transition-colors">
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-1 mt-12 border-t border-hairline pt-8 pb-4">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-subtle disabled:opacity-30 transition-colors mr-2 text-muted hover:text-primary"
      >
        <FiChevronLeft size={18} />
      </button>
      
      {renderPageNumbers()}
      
      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-subtle disabled:opacity-30 transition-colors ml-2 text-muted hover:text-primary"
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );
}
