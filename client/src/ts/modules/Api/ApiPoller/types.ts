export type PollingObject = {
  stop: () => void
}

export type StartPollingParams = {
  delay?: number
  restartPollingDelayAfterrErr?: number
}
