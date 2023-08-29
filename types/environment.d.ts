export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ENV: "test" | "development" | "production";
      NEXTAUTH_URL: string;
      NEXTSCRIPT_UR: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_URL: string;
      DB_NAME: string;
    }
  }
}
