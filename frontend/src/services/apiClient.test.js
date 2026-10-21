import Cookies from "js-cookie";
import apiClient, {
  clearTokenPair,
  getUserFriendlyErrorMessage,
  saveTokenPair,
} from "./apiClient";

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe("JWT cookie scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("saves access and refresh tokens for every application route", () => {
    saveTokenPair({ access: "access-token", refresh: "refresh-token" });

    expect(Cookies.set).toHaveBeenNthCalledWith(
      1,
      "access",
      "access-token",
      expect.objectContaining({ path: "/" }),
    );
    expect(Cookies.set).toHaveBeenNthCalledWith(
      2,
      "refresh",
      "refresh-token",
      expect.objectContaining({ path: "/" }),
    );
  });

  test("does not attach an expired access token to the refresh request", async () => {
    Cookies.get.mockReturnValue("expired-access-token");
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const requestConfig = await requestInterceptor({
      headers: {},
      _skipAuthToken: true,
    });

    expect(requestConfig.headers.Authorization).toBeUndefined();
    expect(Cookies.get).not.toHaveBeenCalled();
  });

  test("removes the application-wide token cookies", () => {
    clearTokenPair();

    expect(Cookies.remove).toHaveBeenCalledWith("access", { path: "/" });
    expect(Cookies.remove).toHaveBeenCalledWith("refresh", { path: "/" });
  });
});

describe("API error messages", () => {
  test("does not reduce a development proxy error response to its first letter", () => {
    const message = getUserFriendlyErrorMessage({
      response: {
        data: "Error occurred while trying to proxy: /api/v1/auth/google/",
      },
      message: "Request failed with status code 500",
    });

    expect(message).toBe(
      "Không kết nối được máy chủ TOEIC Lab. Hãy kiểm tra backend và thử lại.",
    );
  });

  test("returns a useful message for a network failure", () => {
    expect(getUserFriendlyErrorMessage({ message: "Network Error" })).toBe(
      "Không kết nối được máy chủ TOEIC Lab. Hãy kiểm tra backend và thử lại.",
    );
  });

  test("preserves a useful API error message", () => {
    expect(
      getUserFriendlyErrorMessage({
        response: { data: { error: "Thông tin xác thực Google không hợp lệ." } },
      }),
    ).toBe("Thông tin xác thực Google không hợp lệ.");
  });
});
