import { GalleryImage } from './ImageGallery';

/**
 * 从Supabase存储URL生成图片URL
 */
export const generateImageUrls = (
  storagePath: string, 
  bucketName: string = 'posts'
): { url: string; thumbnailUrl: string } => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;
  
  const thumbnailUrl = `${url}?width=400&height=400&resize=cover&quality=85`;
  
  return { url, thumbnailUrl };
};

/**
 * 智能生成缩略图URL
 */
export const generateThumbnailUrl = (
  originalUrl: string, 
  size: { width: number; height: number } = { width: 400, height: 400 }
): string => {
  if (!originalUrl) return '';
  
  // 如果是Supabase Storage的URL，添加转换参数
  if (originalUrl.includes('supabase.co/storage')) {
    return `${originalUrl}?width=${size.width}&height=${size.height}&resize=cover&quality=85`;
  }
  
  return originalUrl;
};

/**
 * 处理好友动态数据，提取图片信息
 */
export const extractGalleryImagesFromPosts = (posts: any[]): GalleryImage[] => {
  return posts.flatMap(post => {
    const postImages = post.image_urls || [];
    
    if (!Array.isArray(postImages) || postImages.length === 0) return [];
    
    const galleryImages = postImages.map((imgItem: any, index: number): GalleryImage | null => {
      let url: string = '';
      let thumbnailUrl: string = '';
      
      // 情况1：imgItem是字符串（直接是URL）
      if (typeof imgItem === 'string') {
        url = imgItem;
        thumbnailUrl = generateThumbnailUrl(imgItem);
      } 
      // 情况2：imgItem是对象（包含url等属性）
      else if (imgItem && typeof imgItem === 'object') {
        url = imgItem.url || '';
        thumbnailUrl = imgItem.thumbnail_url || imgItem.thumbnailUrl || generateThumbnailUrl(url);
      }
      
      // 如果URL无效，跳过
      if (!url || !url.startsWith('http')) {
        console.warn(`无效的图片URL: ${url}`, imgItem);
        return null;
      }
      
      // 构建GalleryImage对象
      const galleryImage: GalleryImage = {
        id: `${post.id}-${index}`,
        url: url,
        thumbnailUrl: thumbnailUrl || url, // 确保thumbnailUrl有值
      };
      
      // 添加可选字段
      if (post.content) {
        galleryImage.alt = post.content;
        galleryImage.caption = post.content;
      }
      
      if (post.user_id) {
        galleryImage.uploader = {
          id: post.user_id,
          name: post.user?.name || '好友',
        };
        if (post.user?.avatar_url) {
          galleryImage.uploader.avatar = post.user.avatar_url;
        }
      }
      
      if (post.created_at) {
        galleryImage.createdAt = post.created_at;
      }
      
      galleryImage.likes = post.likes_count || 0;
      galleryImage.isLiked = post.is_liked || false;
      
      return galleryImage;
    });
    
    // 过滤掉null值
    return galleryImages.filter((item): item is GalleryImage => item !== null);
  });
};

/**
 * 预加载图片
 */
export const preloadImages = (images: GalleryImage[]): Promise<void[]> => {
  const promises = images.map(img => {
    return new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Failed to load image: ${img.url}`));
      image.src = img.url;
    });
  });
  
  return Promise.all(promises);
};

/**
 * 下载图片
 */
export const downloadImage = async (imageUrl: string, filename?: string): Promise<void> => {
  try {
    if (!imageUrl) {
      throw new Error('图片URL不能为空');
    }
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || `life-journal-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('下载图片失败:', error);
    throw error;
  }
};

/**
 * 调试函数：检查数据格式
 */
export const debugImageData = (posts: any[]): void => {
  console.log('=== 图片数据调试 ===');
  posts.forEach((post, postIndex) => {
    console.log(`帖子 ${postIndex} (ID: ${post.id}):`);
    console.log('  内容:', post.content);
    console.log('  image_urls类型:', typeof post.image_urls);
    console.log('  是数组吗:', Array.isArray(post.image_urls));
    
    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      console.log('  数组长度:', post.image_urls.length);
      post.image_urls.forEach((item: any, imgIndex: number) => {
        console.log(`  图片 ${imgIndex}:`, {
          类型: typeof item,
          是字符串: typeof item === 'string',
          值: typeof item === 'string' ? item.substring(0, 50) + '...' : item
        });
      });
    } else {
      console.log('  无图片数据');
    }
  });
  console.log('==================');
};
