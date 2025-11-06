/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 import.meta.env 的类型定义
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // 可以在这里添加更多自定义环境变量的类型定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
