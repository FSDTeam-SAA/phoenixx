import { getImageUrl } from '../../../../utils/getImageUrl';

const PostCardImageGrid = ({ postData, handleImageClick }) => {
  if (!postData.images?.length) return null;

  const { images, title } = postData;
  const imageCount = images.length;

  // Facebook-style image grid layouts
  if (imageCount === 1) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center bg-[#f0f2f5]">
          <img
            src={getImageUrl(images[0])}
            alt={title}
            className="max-w-full max-h-[500px] object-contain cursor-pointer hover:opacity-95 transition-opacity rounded-lg"
            onClick={() => handleImageClick(0)}
          />
        </div>
      </div>
    );
  }

  if (imageCount === 2) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="flex gap-1 h-[300px]">
          {images.map((image, index) => (
            <div key={index} className="w-1/2 h-full flex items-center justify-center bg-[#f0f2f5] rounded-lg overflow-hidden">
              <img
                src={getImageUrl(image)}
                alt={title}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleImageClick(index)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (imageCount === 3) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="flex gap-1 h-[300px]">
          <div className="w-1/2 h-full flex items-center justify-center bg-[#f0f2f5] rounded-l-lg overflow-hidden">
            <img
              src={getImageUrl(images[0])}
              alt={title}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(0)}
            />
          </div>
          <div className="w-1/2 flex flex-col gap-1">
            <div className="h-1/2 flex items-center justify-center bg-[#f0f2f5] rounded-tr-lg overflow-hidden">
              <img
                src={getImageUrl(images[1])}
                alt={title}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleImageClick(1)}
              />
            </div>
            <div className="h-1/2 flex items-center justify-center bg-[#f0f2f5] rounded-br-lg overflow-hidden">
              <img
                src={getImageUrl(images[2])}
                alt={title}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleImageClick(2)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (imageCount === 4) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2 gap-1 h-[300px]">
          {images.map((image, index) => (
            <div key={index} className="flex items-center justify-center bg-[#f0f2f5] overflow-hidden">
              <img
                src={getImageUrl(image)}
                alt={title}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleImageClick(index)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For 5 or more images
  return (
    <div className="mb-4 rounded-lg overflow-hidden">
      <div className="grid grid-cols-3 gap-1 h-[300px]">
        {images.slice(0, 5).map((image, index) => (
          <div
            key={index}
            className={`relative flex items-center justify-center bg-[#f0f2f5] overflow-hidden ${index === 4 ? 'col-span-1' : ''
              }`}
          >
            <img
              src={getImageUrl(image)}
              alt={title}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(index)}
            />
            {index === 4 && imageCount > 5 && (
              <div
                className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                onClick={() => handleImageClick(4)}
              >
                +{imageCount - 5}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostCardImageGrid;