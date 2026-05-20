const { v2: cloudinary } = require('cloudinary');
const stream = require('stream');
const config = require('../config');

// Configure Cloudinary if credentials exist
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} resourceType 'image' or 'video'
 * @returns {Promise<string>} public URL
 */
function uploadToCloudinary(buffer, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    if (!config.cloudinary.cloudName) {
      console.log(`[DEV] Would upload ${buffer.length} bytes to Cloudinary`);
      return resolve(`https://placeholder-cdn.example.com/mock_${Date.now()}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'proximity_chat' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Delete an object from Cloudinary (for CDN purge on post delete)
 * @param {string} publicUrl
 */
async function deleteFromCloudinary(publicUrl) {
  if (!config.cloudinary.cloudName) {
    console.log(`[DEV] Would delete ${publicUrl} from Cloudinary`);
    return;
  }
  
  try {
    // Extract public ID from URL
    // e.g. https://res.cloudinary.com/cloud_name/image/upload/v1234567890/proximity_chat/filename.jpg
    const parts = publicUrl.split('/');
    const fileWithExt = parts[parts.length - 1];
    const publicIdWithFolder = `proximity_chat/${fileWithExt.split('.')[0]}`;
    
    // Determine if it's a video or image based on URL
    const resourceType = publicUrl.includes('/video/upload/') ? 'video' : 'image';
    
    await cloudinary.uploader.destroy(publicIdWithFolder, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
