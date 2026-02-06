import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Download, Heart, Share2, AlertCircle } from 'lucide-react';

// 图片数据类型定义
export interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  uploader?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
  likes?: number;
  isLiked?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  initialIndex?: number;
  onClose?: () => void;
  showThumbnails?: boolean;
  showControls?: boolean;
  showInfo?: boolean;
  aspectRatio?: 'square' | 'wide' | 'auto';
  maxHeight?: string;
  onLike?: (imageId: string) => void;
  onShare?: (imageId: string) => void;
  onDownload?: (imageId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  initialIndex = 0,
  onClose,
  showThumbnails = true,
  showControls = true,
  showInfo = true,
  aspectRatio = 'auto',
  maxHeight = '90vh',
  onLike,
  onShare,
  onDownload
}) => {
  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadStatus, setImageLoadStatus] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 当前图片
  const currentImage = images[currentIndex];
  
  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryRef.current) return;
      
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  // 图片变化时重置状态
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setIsLoading(true);
  }, [initialIndex, images]);

  // 导航函数
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      galleryRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 缩放控制
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // 图片加载处理
  const handleImageLoad = (imageId: string) => {
    setImageLoadStatus((prev) => ({ ...prev, [imageId]: true }));
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = (imageId: string) => {
    setImageLoadStatus((prev) => ({ ...prev, [imageId]: false }));
    setError(`无法加载图片: ${images[currentIndex]?.alt || '未知图片'}`);
    setIsLoading(false);
  };

  // 点击背景关闭（如果启用）
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  // 获取图片显示尺寸
  const getImageDimensions = () => {
    if (!currentImage) return { width: 'auto', height: 'auto' };
    
    const aspectRatios = {
      square: '1/1',
      wide: '16/9',
      auto: `${currentImage.width || 4}/${currentImage.height || 3}`
    };
    
    return {
      aspectRatio: aspectRatios[aspectRatio],
      maxHeight: maxHeight
    };
  };

  // 如果没有图片
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        暂无图片可展示
      </div>
    );
  }

  return (
    <div 
      ref={galleryRef}
      className="relative bg-black/95 backdrop-blur-sm rounded-xl overflow-hidden"
      onClick={handleBackdropClick}
    >
      {/* 顶部控制栏 */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.caption && (
            <span className="text-gray-300 truncate max-w-md">
              {currentImage.caption}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showControls && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="缩小"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded-full transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="放大"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 主图片展示区 */}
      <div className="flex items-center justify-center min-h-[60vh] p-4 md:p-8">
        <div 
          className="relative transition-transform duration-200"
          style={{ 
            transform: `scale(${zoomLevel})`,
            ...getImageDimensions()
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center justify-center text-white p-8">
              <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
              <p className="text-lg mb-2">图片加载失败</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={currentImage.alt || `图片 ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onLoad={() => handleImageLoad(currentImage.id)}
              onError={() => handleImageError(currentImage.id)}
              draggable={false}
            />
          )}
          
          {/* 导航箭头 */}
          {images.length > 1 && showControls && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                title="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                title="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 底部信息栏 */}
      {(showInfo || showThumbnails) && (
        <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent">
          {/* 图片信息 */}
          {showInfo && currentImage && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {currentImage.uploader?.avatar && (
                  <img
                    src={currentImage.uploader.avatar}
                    alt={currentImage.uploader.name}
                    className="w-10 h-10 rounded-full border-2 border-white/30"
                  />
                )}
                <div>
                  <p className="text-white font-medium">
                    {currentImage.uploader?.name || '未知用户'}
                  </p>
                  {currentImage.createdAt && (
                    <p className="text-gray-400 text-sm">
                      {new Date(currentImage.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onLike?.(currentImage.id)}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    currentImage.isLiked 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${currentImage.isLiked ? 'fill-current' : ''}`} />
                  <span>{currentImage.likes || 0}</span>
                </button>
                
                <button
                  onClick={() => onShare?.(currentImage.id)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="分享"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onDownload?.(currentImage.id)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="下载"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* 缩略图导航 */}
          {showThumbnails && images.length > 1 && (
            <div className="flex justify-center space-x-2 overflow-x-auto py-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-white scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={`缩略图 ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;