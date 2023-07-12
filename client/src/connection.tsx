import React, { useRef } from "react"

type TConnectionContext = {
  connectionRef: React.MutableRefObject<RTCPeerConnection | null>
  channelRef: React.MutableRefObject<RTCDataChannel | null>
}

export const ConnectionContext = React.createContext<TConnectionContext | null>(
  null,
)

type Props = {
  children: React.ReactNode
}

export const Connection: React.FunctionComponent<Props> = ({ children }) => {
  const connectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RTCDataChannel | null>(null)

  return (
    <ConnectionContext.Provider value={{ connectionRef, channelRef }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = React.useContext(ConnectionContext)

  if (!context) {
    throw new Error(
      `'This component must be used within a <Connection> component.'`,
    )
  }

  return context
}
