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
  aspectRatio = 'contain',
  maxHeight = '80vh',
  maxWidth = '90vw',
  defaultZoom = 0.8,
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
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 当前图片
  const currentImage = images[currentIndex];

  // 重置图片位置和缩放
  const resetImageTransform = useCallback(() => {
    setZoomLevel(defaultZoom);
    setImagePosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, [defaultZoom]);

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!galleryRef.current || !isFullscreen) return;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoomLevel(prev => {
        const newZoom = prev + delta;
        const clampedZoom = Math.max(0.1, Math.min(3, newZoom));
        if (clampedZoom !== defaultZoom) {
          setIsZoomed(true);
        }
        return clampedZoom;
      });
    }
  }, [isFullscreen, defaultZoom]);

  // 处理鼠标拖动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= defaultZoom) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  }, [zoomLevel, defaultZoom, imagePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || zoomLevel <= defaultZoom) return;
    
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 限制拖动范围，防止图片被拖出可视区域
    const container = imageContainerRef.current;
    const image = imageRef.current;
    if (container && image) {
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      const maxX = Math.max(0, (imageRect.width * zoomLevel - containerRect.width) / 2);
      const maxY = Math.max(0, (imageRect.height * zoomLevel - containerRect.height) / 2);
      
      setImagePosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
  }, [isDragging, dragStart, zoomLevel, defaultZoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 双击缩放功能
  const handleImageDoubleClick = useCallback(() => {
    if (Math.abs(zoomLevel - defaultZoom) < 0.01) {
      setZoomLevel(2);
      setIsZoomed(true);
    } else {
      resetImageTransform();
    }
  }, [zoomLevel, defaultZoom, resetImageTransform]);

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
      const newZoom = Math.min(prev + 0.1, 3);
      if (Math.abs(newZoom - defaultZoom) > 0.01) {
        setIsZoomed(true);
      }
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.1, 0.1);
      if (Math.abs(newZoom - defaultZoom) < 0.01) {
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

  // 获取图片容器样式 - 这是关键修改点
  const getImageContainerStyle = () => {
    if (aspectRatio === 'contain') {
      return {
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        width: 'auto',
        height: 'auto',
      };
    }
    
    const aspectRatios = {
      square: '1/1',
      wide: '16/9',
      auto: currentImage?.width && currentImage?.height 
        ? `${currentImage.width}/${currentImage.height}`
        : '4/3'
    };
    
    return {
      aspectRatio: aspectRatios[aspectRatio] || 'auto',
      maxWidth: maxWidth,
      maxHeight: maxHeight,
    };
  };

  // 获取图片样式 - 这是关键修改点
  const getImageStyle = () => {
    const baseStyle = {
      transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
      cursor: zoomLevel > defaultZoom ? 'grab' : 'default',
      // 固定图片显示尺寸为30mm×20mm（约113px×76px）
      width: '113px', // 30mm ≈ 113px (在96dpi屏幕上)
      height: '76px', // 20mm ≈ 76px
      maxWidth: '113px',
      maxHeight: '76px',
      minWidth: '113px',
      minHeight: '76px',
    };
    
    if (isDragging) {
      return { ...baseStyle, cursor: 'grabbing' };
    }
    
    return baseStyle;
  };

  // 获取实际显示百分比（相对于原始尺寸）
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
                disabled={zoomLevel >= 3}
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

      {/* 主图片展示区 - 这是关键修改点 */}
      <div className="flex items-center justify-center min-h-[400px] p-4 md:p-8">
        <div 
          ref={imageContainerRef}
          className="relative flex items-center justify-center transition-all duration-200"
          style={{
            width: '113px', // 固定容器宽度
            height: '76px', // 固定容器高度
            minWidth: '113px',
            minHeight: '76px',
            maxWidth: '113px',
            maxHeight: '76px',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center justify-center text-white p-4">
              <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
              <p className="text-sm mb-1">图片加载失败</p>
              <p className="text-gray-400 text-xs">{error}</p>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={currentImage.alt || `图片 ${currentIndex + 1}`}
              className="rounded-lg shadow-lg select-none"
              onLoad={() => handleImageLoad(currentImage.id)}
              onError={() => handleImageError(currentImage.id)}
              onDoubleClick={handleImageDoubleClick}
              onMouseDown={handleMouseDown}
              style={getImageStyle()}
              draggable={false}
            />
          )}
          
          {/* 导航箭头 */}
          {images.length > 1 && showControls && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm z-10"
                title="上一张 (左箭头)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm z-10"
                title="下一张 (右箭头)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* 尺寸提示 */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            30mm × 20mm (113px × 76px)
          </div>
          
          {/* 缩放提示 */}
          {isZoomed && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm whitespace-nowrap">
              双击重置缩放
            </div>
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
                    className="w-8 h-8 rounded-full border-2 border-white/30"
                  />
                )}
                <div>
                  <p className="text-white font-medium text-sm">
                    {currentImage.uploader?.name || '未知用户'}
                  </p>
                  {currentImage.createdAt && (
                    <p className="text-gray-400 text-xs">
                      {new Date(currentImage.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onLike?.(currentImage.id)}
                  className={`flex items-center space-x-1 p-1.5 rounded-lg transition-colors ${
                    currentImage.isLiked 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${currentImage.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{currentImage.likes || 0}</span>
                </button>
                
                <button
                  onClick={() => onShare?.(currentImage.id)}
                  className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="分享"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onDownload?.(currentImage.id)}
                  className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="下载"
                >
                  <Download className="w-4 h-4" />
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
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
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
    </div>
  );
};

export default ImageGallery;
