import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Calendar, Users, Filter, ZoomIn } from 'lucide-react';
import ImageGallery, { GalleryImage } from './ImageGallery';
import { extractGalleryImagesFromPosts } from './galleryUtils';
import './gallery.css';

interface FriendPost {
  id: string;
  content: string;
  image_urls: string[] | null; // 明确类型为字符串数组
  user_id: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

interface FriendPostsGalleryProps {
  posts: FriendPost[];
  initialView?: 'grid' | 'masonry';
  itemsPerPage?: number;
  enableFilter?: boolean;
  onImageClick?: (image: GalleryImage, index: number) => void;
}

// 响应式获取网格列数类名
const getGridColumns = () => {
  if (typeof window === 'undefined') return 'grid-cols-3';
  const width = window.innerWidth;
  if (width < 640) return 'grid-cols-2';      // 手机
  if (width < 768) return 'grid-cols-3';      // 大手机/小平板
  if (width < 1024) return 'grid-cols-4';     // 平板
  return 'grid-cols-5';                       // 桌面
};

// 缩略图组件
const ThumbnailImage: React.FC<{
  image: GalleryImage;
  index: number;
  onClick: (image: GalleryImage, index: number) => void;
}> = ({ image, index, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div 
      className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:z-10 hover:-translate-y-1 cursor-pointer group"
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
        className={`w-full h-full object-cover transition-transform duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } group-hover:scale-110`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      
      {/* 悬停遮罩层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="text-sm font-medium truncate">{image.uploader?.name || '好友'}</p>
          {image.caption && (
            <p className="text-xs opacity-90 truncate mt-1">{image.caption}</p>
          )}
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ZoomIn className="w-8 h-8 text-white/90" />
        </div>
      </div>
      
      {/* 点赞数标签 */}
      {(image.likes || 0) > 0 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          ❤️ {image.likes}
        </div>
      )}
    </div>
  );
};

const FriendPostsGallery: React.FC<FriendPostsGalleryProps> = ({
  posts,
  initialView = 'grid',
  itemsPerPage = 15,
  enableFilter = true,
  onImageClick
}) => {
  // 状态管理
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>(initialView);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'popular'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [gridColumns, setGridColumns] = useState(getGridColumns()); // 响应式列数
  
  // 响应式监听窗口大小变化
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setGridColumns(getGridColumns());
      }, 100); // 防抖处理
    };
    
    window.addEventListener('resize', handleResize);
    // 初始执行一次
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // 从帖子数据中提取图片信息
  const allImages = useMemo(() => {
    return extractGalleryImagesFromPosts(posts);
  }, [posts]);
  
  // 应用筛选逻辑
  const filteredImages = useMemo(() => {
    let filtered = [...allImages];
    
    switch (filter) {
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        // 'all' 保持原顺序
        break;
    }
    
    return filtered;
  }, [allImages, filter]);
  
  // 分页处理
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 处理图片点击 - 打开大图浏览
  const handleImageClick = (image: GalleryImage, index: number) => {
    // 计算在全量图片中的索引
    const globalIndex = filteredImages.findIndex(img => img.id === image.id);
    setSelectedImageIndex(globalIndex >= 0 ? globalIndex : index);
    onImageClick?.(image, index);
  };
  
  // 关闭大图浏览
  const handleCloseGallery = () => {
    setSelectedImageIndex(null);
  };
  
  // 大图浏览中的导航
  const handleGalleryNavigate = (newIndex: number) => {
    setSelectedImageIndex(newIndex);
  };
  
  // 处理点赞
  const handleLike = (imageId: string) => {
    console.log('点赞图片:', imageId);
    // TODO: 调用Supabase API更新点赞状态
  };
  
  // 处理分享
  const handleShare = (imageId: string) => {
    if (navigator.share && selectedImageIndex !== null) {
      const image = filteredImages[selectedImageIndex];
      navigator.share({
        title: '好友动态图片',
        text: image.caption || '看看这张图片',
        url: image.url
      }).catch(err => {
        console.log('分享失败:', err);
        // 降级方案：复制到剪贴板
        navigator.clipboard.writeText(image.url);
        alert('链接已复制到剪贴板');
      });
    } else if (selectedImageIndex !== null) {
      // 降级方案
      navigator.clipboard.writeText(filteredImages[selectedImageIndex].url);
      alert('链接已复制到剪贴板');
    }
  };
  
  // 处理下载
  const handleDownload = async (imageId: string) => {
    const image = filteredImages.find(img => img.id === imageId);
    if (!image) return;
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-journal-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };
  
  // 分页按钮组件
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageButtons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let page = startPage; page <= endPage; page++) {
      pageButtons.push(
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium transition-colors ${
            currentPage === page
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {page}
        </button>
      );
    }
    
    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          上一页
        </button>
        
        <div className="flex items-center gap-1">{pageButtons}</div>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          下一页
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
          第 {currentPage} / {totalPages} 页 · 共 {filteredImages.length} 张图片
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 md:p-6">
      {/* 控制栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <Users className="w-6 h-6 mr-2" />
            好友动态图片
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({filteredImages.length}张图片)
            </span>
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* 视图切换 */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="网格视图"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          
          {/* 筛选器 */}
          {enableFilter && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 dark:text-gray-300"
              >
                <option value="all">全部图片</option>
                <option value="recent">最近发布</option>
                <option value="popular">最多点赞</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* 图片展示区 */}
      {paginatedImages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
            <Users className="w-full h-full opacity-50" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">暂无好友动态图片</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            去发布一些图片，或者等待好友分享他们的生活
          </p>
        </div>
      ) : (
        <>
          {/* 网格视图 */}
          {viewMode === 'grid' && (
            <div className={`grid ${gridColumns} gap-3 md:gap-4`}>
              {paginatedImages.map((image, index) => (
                <ThumbnailImage
                  key={image.id}
                  image={image}
                  index={index}
                  onClick={handleImageClick}
                />
              ))}
            </div>
          )}
          
          {/* 瀑布流视图（可选） */}
          {viewMode === 'masonry' && (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {paginatedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="mb-3 md:mb-4 break-inside-avoid"
                  onClick={() => handleImageClick(image, index)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.alt || ''}
                      className="w-full rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 px-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {image.uploader?.name}
                    </p>
                    {image.caption && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {image.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 分页控件 */}
          {renderPagination()}
        </>
      )}
      
      {/* 全屏大图浏览模态框 */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4 gallery-modal">
          <div className="absolute inset-0" onClick={handleCloseGallery} />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh]">
            <ImageGallery
              images={filteredImages}
              initialIndex={selectedImageIndex}
              onClose={handleCloseGallery}
              showThumbnails={true}
              showControls={true}
              showInfo={true}
              aspectRatio="auto"
              maxHeight="85vh"
              onLike={handleLike}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          </div>
          <button
            onClick={handleCloseGallery}
            className="absolute top-4 right-4 z-20 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* 使用提示 */}
      {paginatedImages.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              点击缩略图可放大浏览
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              支持键盘导航（← → 键）
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              鼠标滚轮可缩放图片
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendPostsGallery;
