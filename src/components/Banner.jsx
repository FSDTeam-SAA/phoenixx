import { useSilderQuery } from '@/features/report/reportApi';
import { useRef, useState, useEffect } from 'react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { baseURL } from '../../utils/BaseURL';

const CarouselBanner = () => {
  const { data, isLoading, isError } = useSilderQuery();
  const swiperRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({});
  const slides = data?.data || [];

  // Function to get image dimensions
  const getImageDimensions = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        // Default dimensions if image fails to load
        resolve({ width: 16, height: 9 });
      };
      img.src = url;
    });
  };

  // Preload images and get their dimensions
  useEffect(() => {
    if (slides.length > 0) {
      const loadImages = async () => {
        const dimensions = {};
        for (const slide of slides) {
          const url = `${baseURL}${slide.image}`;
          dimensions[slide.id || slide.image] = await getImageDimensions(url);
        }
        setImageDimensions(dimensions);
      };
      loadImages();
    }
  }, [slides]);

  // Loading, error, or no data handling
  if (isLoading) {
    return (
      <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 bg-gray-200 animate-pulse rounded-lg mx-4 sm:mx-4 md:mx-10"></div>
    );
  }

  if (isError || !slides.length) return null;

  return (
    <div className="w-full px-4 py-2">
      {/* Container that adjusts to image aspect ratios */}
      <div className="w-full rounded-lg overflow-hidden">
        <Swiper
          ref={swiperRef}
          spaceBetween={0}
          slidesPerView={1}
          centeredSlides={true}
          loop={slides.length > 1}
          autoplay={{
            delay: 10000,
            disableOnInteraction: false,
          }}
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={700}
          resistance={true}
          resistanceRatio={0.85}
          preventInteractionOnTransition={true}
          updateOnWindowResize={true}
          className="rounded-lg"
        >
          {slides.map((item, index) => {
            const dimensions = imageDimensions[item.id || item.image] || { width: 16, height: 9 };
            const aspectRatio = (dimensions.height / dimensions.width) * 100;
            
            return (
              <SwiperSlide key={item.id || index}>
                <div 
                  className="w-full flex items-center justify-center"
                  style={{ paddingBottom: `${aspectRatio}%`, position: 'relative' }}
                >
                  <img
                    src={`${baseURL}${item.image}`}
                    alt={`Banner ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default CarouselBanner;