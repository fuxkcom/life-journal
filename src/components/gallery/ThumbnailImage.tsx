import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { GalleryImage } from './ImageGallery';

interface ThumbnailImageProps {
  image: GalleryImage;
  index: number;
  onClick: (image: GalleryImage, index: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
}

const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  image,
  index,
  onClick,
  size = 'md',
  showOverlay = true
}) => {
  const [loaded, setLoaded] = useState(false);
  
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };
  
  const containerClasses = {
    sm: 'aspect-square',
    md: 'aspect-square',
    lg: 'aspect-square'
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg 
        bg-gray-100 dark:bg-gray-800 
        transition-all duration-300 
        hover:shadow-lg hover:z-10
        ${containerClasses[size]}
        group cursor-pointer
      `}
      onClick={() => onClick(image, index)}
    >
      {/* 加载占位 */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}
      
      {/* 缩略图 */}
      <img
        src={image.thumbnailUrl || image.url}
        alt={image.alt || `图片 ${index + 1}`}
        className={`
          w-full h-full object-cover transition-transform duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
          group-hover:scale-105
        `}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      
      {/* 悬停遮罩层 */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      
      {/* 多图指示器 */}
      {/* 如果需要，可以在这里添加角标显示图片数量 */}
    </div>
  );
};

export default ThumbnailImage;
