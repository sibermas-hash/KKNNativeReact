'use client';

import { Virtuoso } from 'react-virtuoso';
import { useCallback } from 'react';

interface VirtualListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Estimated item height in px (helps initial render) */
  estimatedHeight?: number;
  /** Called when user scrolls near bottom */
  onEndReached?: () => void;
  /** Distance from bottom to trigger onEndReached (px) */
  endReachedThreshold?: number;
  /** Show loading indicator at bottom */
  isLoadingMore?: boolean;
  /** Empty state component */
  emptyContent?: React.ReactNode;
  /** Header component */
  header?: React.ReactNode;
  /** Additional className for the scroller */
  className?: string;
  /** Overscan — items rendered outside viewport */
  overscan?: number;
}

/**
 * Virtualized list component for rendering large datasets efficiently.
 * Only renders visible items + overscan buffer.
 * 
 * Usage:
 *   <VirtualList
 *     data={mahasiswaList}
 *     renderItem={(item) => <MahasiswaCard data={item} />}
 *     onEndReached={fetchNextPage}
 *     isLoadingMore={isFetchingNextPage}
 *   />
 */
export function VirtualList<T>({
  data,
  renderItem,
  estimatedHeight = 72,
  onEndReached,
  endReachedThreshold = 200,
  isLoadingMore = false,
  emptyContent,
  header,
  className = '',
  overscan = 5,
}: VirtualListProps<T>): React.JSX.Element {
  const handleEndReached = useCallback(() => {
    if (onEndReached && !isLoadingMore) {
      onEndReached();
    }
  }, [onEndReached, isLoadingMore]);

  if (data.length === 0 && emptyContent) {
    return (
      <div className={className}>
        {header}
        {emptyContent}
      </div>
    );
  }

  return (
    <Virtuoso
      className={className}
      data={data}
      defaultItemHeight={estimatedHeight}
      overscan={overscan}
      endReached={handleEndReached}
      atBottomThreshold={endReachedThreshold}
      itemContent={(_index, item) => renderItem(item, _index)}
      components={{
        Header: header ? () => <>{header}</> : undefined,
        Footer: isLoadingMore
          ? () => (
              <div className="flex items-center justify-center py-4">
                <svg className="h-5 w-5 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="ml-2 text-sm text-slate-500">Memuat...</span>
              </div>
            )
          : undefined,
        EmptyPlaceholder: emptyContent
          ? () => <>{emptyContent}</>
          : undefined,
      }}
    />
  );
}

/**
 * Virtualized table body — for use with @tanstack/react-table.
 * Renders only visible rows for tables with 100+ rows.
 */
interface VirtualTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  estimatedRowHeight?: number;
  className?: string;
  tableHeight?: number | string;
}

export function VirtualTable<T>({
  data,
  renderRow,
  estimatedRowHeight = 48,
  className = '',
  tableHeight = 600,
}: VirtualTableProps<T>): React.JSX.Element {
  return (
    <Virtuoso
      className={className}
      style={{ height: tableHeight }}
      data={data}
      defaultItemHeight={estimatedRowHeight}
      overscan={10}
      itemContent={(_index, item) => renderRow(item, _index)}
    />
  );
}
