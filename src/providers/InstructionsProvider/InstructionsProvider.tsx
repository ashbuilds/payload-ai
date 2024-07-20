import { InstructionsProvider as Provider } from './index.js'

export const InstructionsProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return <Provider>{children}</Provider>
}
