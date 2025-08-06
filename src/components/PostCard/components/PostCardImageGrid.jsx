import { getImageUrl } from '../../../../utils/getImageUrl';

const PostCardImageGrid = ({ postData, handleImageClick }) => {
  if (!postData.images?.length) return null;

  const { images } = postData;

  if (images.length === 1) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="h-[250px] flex items-center justify-center bg-gray-100">
          <img
            src={getImageUrl(images[0])}
            alt="Post content"
            className="w-full h-full object-cover object-center cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
            onClick={() => handleImageClick(0)}
          />
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="flex gap-2 h-[300px]">
          <div className="w-1/2 h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
            <img
              src={getImageUrl(images[0])}
              alt="Post content 1"
              className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(0)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className="w-1/2 h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
            <img
              src={getImageUrl(images[1])}
              alt="Post content 2"
              className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(1)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="flex gap-2 h-[300px]">
          <div className="w-1/2 h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
            <img
              src={getImageUrl(images[0])}
              alt="Post content 1"
              className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(0)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className="w-1/2 flex flex-col gap-2">
            <div className="w-full h-1/2 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
              <img
                src={getImageUrl(images[1])}
                alt="Post content 2"
                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(1)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
            <div className="w-full h-1/2 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
              <img
                src={getImageUrl(images[2])}
                alt="Post content 3"
                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(2)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (images.length >= 4) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2 gap-2 h-[300px]">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className="relative flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getImageUrl(image)}
                alt={`Post content ${index + 1}`}
                className={`max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity ${index === 3 && images.length > 4 ? 'opacity-80' : ''
                  }`}
                onClick={() => handleImageClick(index)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {index === 3 && images.length > 4 && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:bg-opacity-40 transition-all rounded-lg z-10"
                  onClick={() => handleImageClick(index)}
                >
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default PostCardImageGrid;