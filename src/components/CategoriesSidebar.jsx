"use client";

import { useCategoriesQuery } from '@/features/Category/CategoriesApi';
import { UnorderedListOutlined } from '@ant-design/icons';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useContext, useMemo, useState } from 'react';
import { baseURL } from '../../utils/BaseURL';
import { ThemeContext } from '../app/ClientLayout';

const CategoriesSidebar = ({ onSelectCategory, selectedCategory, selectedSubCategory }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const { isDarkMode } = useContext(ThemeContext);
  const { data: categoryData, isLoading: categoryLoading } = useCategoriesQuery();

  // Memoize derived data
  const { categories, totalPosts } = useMemo(() => {
    const categories = categoryData?.data?.result || [];
    const reversedCategories = [...categories].reverse();
    const total = reversedCategories.reduce((total, item) => total + (item.category.postCount || 0), 0);
    return { categories: reversedCategories, totalPosts: total };
  }, [categoryData]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const selectCategory = (categoryId) => {
    const category = categories.find(item => item.category._id === categoryId);
    const hasSubcategories = category?.subcategories?.length > 0;

    onSelectCategory(categoryId, "");

    if (hasSubcategories) {
      setTimeout(() => {
        toggleCategory(categoryId);
      }, 0);
    }
  };

  const selectSubcategory = (categoryId, subcategoryId) => {
    onSelectCategory(categoryId, subcategoryId);
  };

  const handleShowAllPosts = () => {
    onSelectCategory("", "");
    setExpandedCategories({});
  };

  const getCategoryIconContainerStyle = (isSelected) => {
    if (isSelected) {
      return 'shadow-sm';
    }
    return isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  };

  const getSubcategoryIconContainerStyle = (isSelected) => {
    if (isSelected) {
      return isDarkMode ? 'bg-blue-500' : 'bg-blue-100';
    }
    return isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  };

  const renderCategoryIcon = (category, isSelected) => {
    const imageUrl = isDarkMode && category.darkImage ? category.darkImage : category.image;

    return imageUrl ? (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${getCategoryIconContainerStyle(isSelected)}`}>
        <Image
          src={`${baseURL}${imageUrl}`}
          alt={category?.name || "Category image"}
          width={30}
          height={30}
          className="object-contain"
        />
      </div>
    ) : (
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${getCategoryIconContainerStyle(isSelected)} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <UnorderedListOutlined size={18} className='text-xl' />
      </div>
    );
  };

  const renderSubcategoryIcon = (subcategory, isSelected) => {
    const imageUrl = isDarkMode && subcategory.darkImage ? subcategory.darkImage : subcategory.image;

    return imageUrl ? (
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${getSubcategoryIconContainerStyle(isSelected)}`}>
        <Image
          src={`${baseURL}${imageUrl}`}
          alt={subcategory?.name || "Subcategory image"}
          width={18}
          height={18}
          className="object-contain"
        />
      </div>
    ) : (
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${getSubcategoryIconContainerStyle(isSelected)} text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {subcategory.name?.charAt(0)}
      </div>
    );
  };

  const getItemStyle = (isSelected) => {
    if (isSelected) {
      return isDarkMode
        ? 'bg-blue-600 text-white'
        : 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    return isDarkMode
      ? 'hover:bg-gray-700 text-gray-200'
      : 'hover:bg-gray-50 text-gray-700';
  };

  const getTextStyle = (isSelected) => {
    if (isSelected) {
      return isDarkMode ? 'text-white' : 'text-blue-700';
    }
    return isDarkMode ? 'text-gray-200' : 'text-gray-900';
  };

  const getSecondaryTextStyle = (isSelected) => {
    if (isSelected) {
      return isDarkMode ? 'text-blue-100' : 'text-blue-600';
    }
    return isDarkMode ? 'text-gray-400' : 'text-gray-500';
  };

  if (categoryLoading) {
    return (
      <div className={`rounded-2xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} h-fit`}>
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border h-fit`}>
      <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Categories
      </h2>

      <div className="space-y-2">
        {/* All Posts Button */}
        <div
          onClick={handleShowAllPosts}
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${getItemStyle(!selectedCategory && !selectedSubCategory)}`}
        >
          <div className="flex items-center space-x-3">
            {renderCategoryIcon({ name: 'All Posts' }, !selectedCategory && !selectedSubCategory)}
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium text-sm leading-tight ${getTextStyle(!selectedCategory && !selectedSubCategory)}`}>
                All Posts
              </h3>
              <p className={`text-xs leading-tight mt-0.5 ${getSecondaryTextStyle(!selectedCategory && !selectedSubCategory)}`}>
                {totalPosts.toLocaleString()} Posts
              </p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        {categories.map((item) => {
          const category = item.category;
          const subcategories = item.subcategories || [];
          const hasSubcategories = subcategories.length > 0;
          const isExpanded = expandedCategories[category._id];
          const isSelected = selectedCategory === category._id && !selectedSubCategory;

          return (
            <div key={category._id}>
              <div
                onClick={() => selectCategory(category._id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${getItemStyle(isSelected)}`}
              >
                <div className="flex items-center space-x-3">
                  {renderCategoryIcon(category, isSelected)}
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-medium text-sm leading-tight ${getTextStyle(isSelected)}`}>
                      {category.name}
                    </h3>
                    <p className={`text-xs leading-tight mt-0.5 ${getSecondaryTextStyle(isSelected)}`}>
                      {(category.postCount || 0).toLocaleString()} Posts
                    </p>
                  </div>
                </div>

                {hasSubcategories && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-700 ease-out ${isSelected ? (isDarkMode ? 'text-white' : 'text-blue-700') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')} ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
              </div>

              {/* Subcategories */}
              {hasSubcategories && (
                <div
                  className={`overflow-hidden transition-all duration-700 ease-out ${isExpanded ? 'opacity-100 mt-2 pb-2' : 'opacity-0 mt-0'}`}
                  style={{
                    maxHeight: isExpanded ? `${subcategories.length * 48 + 22}px` : '0px',
                    transition: 'max-height 700ms cubic-bezier(0.4, 0, 0.2, 1), opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), margin-top 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div className="ml-4 space-y-1">
                    {subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubCategory === subcategory._id && selectedCategory === category._id;

                      return (
                        <div
                          key={subcategory._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSubcategory(category._id, subcategory._id);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all duration-200 ${getItemStyle(isSubSelected)}`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {renderSubcategoryIcon(subcategory, isSubSelected)}
                            <h4 className={`font-medium text-sm leading-tight ${getTextStyle(isSubSelected)}`}>
                              {subcategory.name}
                            </h4>
                          </div>
                          <span className={`text-xs ${getSecondaryTextStyle(isSubSelected)}`}>
                            {(subcategory.postCount || 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesSidebar;