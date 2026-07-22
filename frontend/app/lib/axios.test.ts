import api from "./axios"; // sesuaikan path

describe("Axios Interceptor Unit Test", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("1. Harus menyuntikkan Header Authorization Bearer jika token ada di localStorage", async () => {
    const fakeToken = "my_secret_jwt_token_xyz";
    localStorage.setItem("access_token", fakeToken);

    const config: any = { headers: {} };

    // @ts-ignore
    const fulfilledHandler = api.interceptors.request.handlers[0].fulfilled;
    const resultConfig = fulfilledHandler(config);

    expect(resultConfig.headers.Authorization).toBe(`Bearer ${fakeToken}`);
  });

  it("2. Tidak menyuntikkan Header Authorization jika localStorage kosong", async () => {
    const config: any = { headers: {} };

    // @ts-ignore
    const fulfilledHandler = api.interceptors.request.handlers[0].fulfilled;
    const resultConfig = fulfilledHandler(config);

    expect(resultConfig.headers.Authorization).toBeUndefined();
  });
});