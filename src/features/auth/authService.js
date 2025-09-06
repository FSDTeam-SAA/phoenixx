
import { jwtDecode } from "jwt-decode";

export const saveToken = (token) => {
  localStorage?.setItem("loginToken", token);
};

export const getToken = () => {
  return localStorage?.getItem("loginToken");

};

export const removeToken = () => {
  localStorage.removeItem("loginToken");

};

export const isAuthenticated = () => {
  return getToken();
};


export const decodedUser = (token) => {
  const decoded = jwtDecode(JSON.stringify(token));
  localStorage.setItem("login_user_id", decoded?.id)
  // console.log(decoded)
};