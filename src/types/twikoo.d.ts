declare module 'twikoo' {
  export function init(options: {
    el: HTMLElement
    path: string
    envId: string
    lang?: string
  }): void
}