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
  
  const thumbnailUrl = `${url}?width=300&height=300&resize=cover&quality=80`;
  
  return { url, thumbnailUrl };
};

/**
 * 处理好友动态数据，提取图片信息
 * 重要：现在处理的是 string[] 格式的 image_urls
 */
export const extractGalleryImagesFromPosts = (posts: any[]): GalleryImage[] => {
  return posts.flatMap(post => {
    // 获取图片数组，处理 null 值
    const postImages = post.image_urls || [];
    
    if (!Array.isArray(postImages) || postImages.length === 0) {
      return [];
    }
    
    const galleryImages = postImages.map((imgItem: any, index: number): GalleryImage | null => {
      let url: string = '';
      let thumbnailUrl: string = '';
      
      // 情况1：imgItem 是字符串（直接是URL）
      if (typeof imgItem === 'string') {
        url = imgItem;
        thumbnailUrl = imgItem; // 同一URL作为缩略图
      } 
      // 情况2：imgItem 是对象（包含 url 等属性）
      else if (imgItem && typeof imgItem === 'object') {
        url = imgItem.url || '';
        thumbnailUrl = imgItem.thumbnail_url || imgItem.thumbnailUrl || url;
      }
      
      // 如果URL无效，跳过
      if (!url || !url.startsWith('http')) {
        console.warn(`无效的图片URL: ${url}`, imgItem);
        return null;
      }
      
      // 构建 GalleryImage 对象
      const galleryImage: GalleryImage = {
        id: `${post.id}-${index}`,
        url: url,
        thumbnailUrl: thumbnailUrl,
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
    
    // 过滤掉 null 值
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
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
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
    console.log(' 内容:', post.content);
    console.log(' image_urls 类型:', typeof post.image_urls);
    console.log(' 是数组吗:', Array.isArray(post.image_urls));
    console.log(' 数组长度:', Array.isArray(post.image_urls) ? post.image_urls.length : 'N/A');
    
    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      post.image_urls.forEach((item: any, imgIndex: number) => {
        console.log(`  图片 ${imgIndex}:`, {
          类型: typeof item,
          值: item,
          是字符串: typeof item === 'string',
          是对象: typeof item === 'object' && item !== null
        });
      });
    }
  });
  console.log('==================');
};

/**
 * 智能生成缩略图URL
 */
export const generateThumbnailUrl = (
  originalUrl: string, 
  size: { width: number; height: number } = { width: 400, height: 400 }
): string => {
  // 如果是Supabase Storage的URL，可以添加转换参数
  if (originalUrl.includes('supabase.co/storage')) {
    return `${originalUrl}?width=${size.width}&height=${size.height}&resize=cover&quality=80`;
  }
  
  // 其他图床或URL，可以尝试添加通用参数或使用图片服务
  if (originalUrl.includes('unsplash') || originalUrl.includes('cloudinary')) {
    return originalUrl.replace(/w=\d+/, `w=${size.width}`);
  }
  
  // 普通URL，直接返回
  return originalUrl;
};

// 修改 extractGalleryImagesFromPosts 函数中的thumbnailUrl生成
const thumbnailUrl = generateThumbnailUrl(url, { width: 400, height: 400 });
