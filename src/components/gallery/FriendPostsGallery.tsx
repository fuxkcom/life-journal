import React, { useState, useEffect } from 'react';
import { Grid, Calendar, Users, Filter } from 'lucide-react';
import ImageGallery, { GalleryImage } from './ImageGallery';
import { extractGalleryImagesFromPosts } from './galleryUtils';
import './gallery.css';
import ThumbnailImage from './ThumbnailImage';

interface FriendPost {
  id: string;
  content: string;
  images: Array<{
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
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
  initialView?: 'grid' | 'masonry' | 'carousel';
  itemsPerPage?: number;
  enableFilter?: boolean;
  onImageClick?: (image: GalleryImage, index: number) => void;
}

const FriendPostsGallery: React.FC<FriendPostsGalleryProps> = ({
  posts,
  initialView = 'grid',
  itemsPerPage = 12,
  enableFilter = true,
  onImageClick
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'carousel'>(initialView);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'popular'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 提取图片数据
  const allImages = extractGalleryImagesFromPosts(posts);
  
  // 应用筛选
  const filteredImages = React.useMemo(() => {
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
    }
    
    return filtered;
  }, [allImages, filter]);
  
  // 分页
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 处理图片点击
  const handleImageClick = (image: GalleryImage, index: number) => {
    setSelectedImageIndex(index);
    onImageClick?.(image, index);
  };
  
  // 关闭画廊
  const handleCloseGallery = () => {
    setSelectedImageIndex(null);
  };
  
  // 画廊导航
  const handleGalleryNavigate = (newIndex: number) => {
    setSelectedImageIndex(newIndex);
  };
  
  // 处理点赞
  const handleLike = (imageId: string) => {
    console.log('点赞图片:', imageId);
    // 这里应该调用Supabase API更新点赞状态
  };
  
  // 处理分享
  const handleShare = (imageId: string) => {
    if (navigator.share && selectedImageIndex !== null) {
      navigator.share({
        title: '好友动态图片',
        text: filteredImages[selectedImageIndex].caption || '看看这张图片',
        url: filteredImages[selectedImageIndex].url
      });
    }
  };
  
  // 处理下载
  const handleDownload = async (imageId: string) => {
    const image = filteredImages.find(img => img.id === imageId);
    if (image) {
      try {
        // 使用工具函数下载
        const { downloadImage } = await import('./galleryUtils');
        await downloadImage(image.url, `friend-post-${imageId}.jpg`);
      } catch (error) {
        console.error('下载失败:', error);
      }
    }
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
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="网格视图"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'masonry' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="瀑布流视图"
            >
              <div className="flex flex-col space-y-0.5">
                <div className="w-4 h-1 bg-current rounded-full" />
                <div className="w-4 h-1 bg-current rounded-full" />
                <div className="w-4 h-1 bg-current rounded-full" />
              </div>
            </button>
          </div>
          
          {/* 筛选器 */}
          {enableFilter && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <Grid className="w-full h-full" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">暂无好友动态图片</p>
        </div>
      ) : (
        <>
          {/* 网格视图 */}
          {/* viewMode === 'grid' && (
           // <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {paginatedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                  onClick={() => handleImageClick(image, index)}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.alt || ''}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  /> */}
                  
                  {/* 悬停遮罩 */}
             {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center p-4">
                      <p className="font-medium truncate">{image.uploader?.name}</p>
                      {image.caption && (
                        <p className="text-sm mt-1 line-clamp-2">{image.caption}</p>
                      )}
                      {image.likes !== undefined && (
                        <div className="flex items-center justify-center mt-2">
                          <span className="text-sm">❤️ {image.likes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )} */}
         {/* 网格视图 */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
             {paginatedImages.map((image, index) => (
             <ThumbnailImage
               key={image.id}
               image={image}
               index={index}
               onClick={handleImageClick}
               size="md" // sm/md/lg 可选
               showOverlay={true}
                />
             ))}
           </div>
           )}
          
          {/* 瀑布流视图 */}
          {viewMode === 'masonry' && (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {paginatedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="mb-3 md:mb-4 break-inside-avoid cursor-pointer"
                  onClick={() => handleImageClick(image, index)}
                >
                 // <img
                 //   src={image.thumbnailUrl || image.url}
                  //  alt={image.alt || ''}
                  //  className="w-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                   // loading="lazy"
                //  />
                      // 修改后：
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <img
                     src={image.thumbnailUrl || image.url}
                     alt={image.alt || ''}
                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                     loading="lazy"
              // 添加点击事件，如果还没有的话
                     onClick={() => handleImageClick(image, index)}
                   />
                </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium truncate">{image.uploader?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                上一页
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
      
      {/* 全屏画廊 */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <ImageGallery
            images={filteredImages}
            initialIndex={selectedImageIndex}
            onClose={handleCloseGallery}
            showThumbnails={true}
            showControls={true}
            showInfo={true}
            onLike={handleLike}
            onShare={handleShare}
            onDownload={handleDownload}
          />
        </div>
      )}
    </div>
  );
};

export default FriendPostsGallery;
