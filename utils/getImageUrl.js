import { Spin } from 'antd';

const { baseURL } = require("./BaseURL");

export const getImageUrl = (imageUrl) => {
  // Check if the imageUrl is empty
  if (!imageUrl || imageUrl.trim() === '') {
    return <Spin size='small' />
  }

  // Check if the imageUrl starts with "http"
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  } else {
    return `${baseURL}${imageUrl}`;
  }
};
