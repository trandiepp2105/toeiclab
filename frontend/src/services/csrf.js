import Cookies from "js-cookie";

/**
 * Lấy CSRF token do backend lưu trong cookie.
 *
 * @returns {string} CSRF token hoặc chuỗi rỗng nếu chưa có token.
 */
const getCSRFToken = () => Cookies.get("csrftoken") || "";

export default getCSRFToken;
