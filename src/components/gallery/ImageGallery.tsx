import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Download, Heart, Share2, AlertCircle } from 'lucide-react';

// 图片数据类型定义
export interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl: string;
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
  // 为了向后兼容性保留这些属性，但不再使用
  aspectRatio?: 'square' | 'wide' | 'auto' | 'contain';
  maxHeight?: string;
  maxWidth?: string;
  defaultZoom?: number;
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
  // 这些参数为了兼容性保留，但不再使用
  aspectRatio,
  maxHeight,
  maxWidth,
  defaultZoom,
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 当前图片
  const currentImage = images[currentIndex];
  
  // 固定显示尺寸：30mm × 20mm
  // 在96dpi屏幕上：1mm = 3.78px，所以30mm = 113.4px，20mm = 75.6px
  const DISPLAY_WIDTH = 113; // 像素
  const DISPLAY_HEIGHT = 76; // 像素

  // 重置图片位置和缩放
  const resetImageTransform = useCallback(() => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, []);

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!galleryRef.current) return;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoomLevel(prev => {
        const newZoom = prev + delta;
        const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
        if (clampedZoom !== 1) {
          setIsZoomed(true);
        }
        return clampedZoom;
      });
    }
  }, []);

  // 处理鼠标拖动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 计算最大拖动范围
    const maxX = Math.max(0, (DISPLAY_WIDTH * zoomLevel - DISPLAY_WIDTH) / 2);
    const maxY = Math.max(0, (DISPLAY_HEIGHT * zoomLevel - DISPLAY_HEIGHT) / 2);
    
    setImagePosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 双击缩放功能
  const handleImageDoubleClick = useCallback(() => {
    if (Math.abs(zoomLevel - 1) < 0.01) {
      setZoomLevel(2);
      setIsZoomed(true);
    } else {
      resetImageTransform();
    }
  }, [zoomLevel, resetImageTransform]);

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryRef.current) return;
      
      switch (e.key) {
        case 'Escape':
          if (isZoomed) {
            resetImageTransform();
          } else {
            onClose?.();
          }
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
        case '0':
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetImageTransform();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, isZoomed, resetImageTransform, onClose]);

  // 添加事件监听器
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // 图片变化时重置状态
  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetImageTransform();
    setIsLoading(true);
  }, [initialIndex, images, resetImageTransform]);

  // 导航函数
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetImageTransform();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetImageTransform();
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    resetImageTransform();
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
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 0.1, 5);
      if (newZoom !== 1) {
        setIsZoomed(true);
      }
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.1, 0.1);
      if (newZoom === 1) {
        setIsZoomed(false);
        setImagePosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
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
    if (e.target === e.currentTarget && !isZoomed) {
      onClose?.();
    }
  };

  // 获取图片样式 - 强制固定尺寸
  const getImageStyle = () => {
    const baseStyle = {
      transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
      cursor: zoomLevel > 1 ? 'grab' : 'default',
      width: `${DISPLAY_WIDTH}px`,
      height: `${DISPLAY_HEIGHT}px`,
      objectFit: 'contain' as const,
      display: 'block' as const,
      boxSizing: 'border-box' as const,
    };
    
    if (isDragging) {
      return { ...baseStyle, cursor: 'grabbing' };
    }
    
    return baseStyle;
  };

  // 获取实际显示百分比
  const getDisplayPercentage = () => {
    return Math.round(zoomLevel * 100);
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
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50"
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
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="缩小 (Ctrl+-)"
                disabled={zoomLevel <= 0.1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <button
                onClick={resetImageTransform}
                className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded-full transition-colors"
                title="重置缩放 (Ctrl+0)"
              >
                {getDisplayPercentage()}%
              </button>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="放大 (Ctrl++)"
                disabled={zoomLevel >= 5}
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
            title={isFullscreen ? "退出全屏 (空格)" : "全屏 (空格)"}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 主图片展示区 - 绝对固定尺寸 */}
      <div className="relative" style={{ width: `${DISPLAY_WIDTH}px`, height: `${DISPLAY_HEIGHT}px` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-lg p-4">
            <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
            <p className="text-sm mb-1 text-white">图片加载失败</p>
            <p className="text-gray-400 text-xs text-center">{error}</p>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={currentImage.alt || `图片 ${currentIndex + 1}`}
              className="w-full h-full"
              onLoad={() => handleImageLoad(currentImage.id)}
              onError={() => handleImageError(currentImage.id)}
              onDoubleClick={handleImageDoubleClick}
              onMouseDown={handleMouseDown}
              style={getImageStyle()}
              draggable={false}
            />
          </div>
        )}
        
        {/* 导航箭头 */}
        {images.length > 1 && showControls && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm z-10 bg-black/50"
              title="上一张 (左箭头)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm z-10 bg-black/50"
              title="下一张 (右箭头)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      
      {/* 尺寸指示器 */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
        固定尺寸: {DISPLAY_WIDTH}px × {DISPLAY_HEIGHT}px (30mm×20mm)
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
                  title={`查看图片 ${index + 1}`}
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
      
      {/* 缩放提示 */}
      {isZoomed && (
        <div className="absolute bottom-44 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
          双击图片或按 Ctrl+0 重置到固定尺寸
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
