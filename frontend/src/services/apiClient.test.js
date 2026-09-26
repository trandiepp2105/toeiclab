import Cookies from "js-cookie";
import apiClient, { clearTokenPair, saveTokenPair } from "./apiClient";

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
