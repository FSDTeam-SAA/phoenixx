import { useSilderQuery } from '@/features/report/reportApi';
import { useRef } from 'react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { baseURL } from '../../utils/BaseURL';
import './Banner.css';

const CarouselBanner = () => {
  const { data, isLoading, isError } = useSilderQuery();
  const swiperRef = useRef(null);
  const slides = data?.data || [];

  // Loading, error, or no data handling
  if (isLoading) {
    return (
      <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 bg-gray-200 animate-pulse rounded-xl mx-4 sm:mx-4 md:mx-10"></div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 bg-red-100 flex items-center justify-center rounded-xl text-sm text-red-700 mx-4 sm:mx-4 md:mx-10">
        Failed to load banner
      </div>
    );
  }

  if (!slides.length) return null;

  return (
    <div className="w-full px-4">
      <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 rounded-xl overflow-hidden">
        <Swiper
          ref={swiperRef}
          spaceBetween={0}
          slidesPerView={1}
          centeredSlides={true}
          loop={slides.length > 1}
          autoplay={{
            delay: 5000,
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
          className="h-full rounded-xl"
        >
          {slides.map((item, index) => (
            <SwiperSlide key={item.id || index}>
              <div className="w-full h-full relative">
                <img
                  src={`${baseURL}${item.image}`}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CarouselBanner;