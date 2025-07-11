/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DROPBOX_ACCESS_TOKEN: string
  readonly VITE_DROPBOX_APP_KEY: string
  readonly VITE_PUBLIC_URL: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}