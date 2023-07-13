import { useEffect, useRef, useState } from "react"
import { Connection, useConnection } from "./connection"
import { UsersList } from "./users-list"

export type User = {
  id: string
  userName: string
}

function App() {
  const webSocket = useRef<WebSocket | null>(null)
  const connectedRef = useRef<string>() // sort of my name or something??

  const [socketMessages, setSocketMessages] = useState<any[]>([])
  //@ts-ignore
  const [socketOpen, setSocketOpen] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [name, setName] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const [users, setUsers] = useState<User[]>([])

  const messagesRef = useRef({}) // ??
  //@ts-ignore
  const [messages, setMessages] = useState({})
  //@ts-ignore
  const [connectedTo, setConnectedTo] = useState("")
  //@ts-ignore
  const [connecting, setConnecting] = useState(false)

  const { channelRef, connectionRef } = useConnection()

  const send = (data: any) => {
    webSocket.current?.send(JSON.stringify(data))
  }

  console.log("ffffffffff", import.meta.env)

  useEffect(() => {
    webSocket.current = new WebSocket(
      import.meta.env.VITE_SOCKET_URL || "ws://127.0.0.1:1337",
    )
    webSocket.current.onmessage = (message) => {
      const data = JSON.parse(message.data)

      console.log({ data })

      setSocketMessages((prev) => [...prev, data])
    }
    webSocket.current.onclose = () => {
      webSocket.current?.close()
    }
    return () => webSocket.current?.close()
  }, [])

  useEffect(() => {
    let data = socketMessages.pop()
    if (data) {
      switch (data.type) {
        case "connect":
          setSocketOpen(true)
          break
        case "login":
          onLogin(data)
          break
        case "updateUsers":
          updateUsersList(data)
          break
        case "removeUser":
          removeUser(data)
          break
        case "offer":
          onOffer(data)
          break
        case "answer":
          onAnswer(data)
          break
        case "candidate":
          onCandidate(data)
          break
        default:
          break
      }
    }
  }, [socketMessages])

  const handleLogin = () => {
    setLoggingIn(true)
    send({
      type: "login",
      name,
    })
  }

  const onLogin = ({
    success,
    message,
    users: loggedIn,
  }: {
    success: boolean
    message: any
    users: any
  }) => {
    setLoggingIn(false)

    if (!success) {
      console.log("Login Error:", message)

      return
    }

    console.log("Logged in successfully!")

    setIsLoggedIn(true)
    setUsers(loggedIn)
    let localConnection = new RTCPeerConnection(configuration)

    //when the browser finds an ice candidate we send it to another peer
    localConnection.onicecandidate = ({ candidate }) => {
      let connectedTo = connectedRef.current

      if (candidate && !!connectedTo) {
        send({
          name: connectedTo,
          type: "candidate",
          candidate,
        })
      }
    }

    localConnection.ondatachannel = (event) => {
      console.log("Data channel is created!")
      let receiveChannel = event.channel

      receiveChannel.onopen = () => {
        console.log("Data channel is open and ready to be used.")
      }
      receiveChannel.onmessage = handleDataChannelMessageReceived

      // updateChannel(receiveChannel)

      channelRef.current = receiveChannel
    }

    // updateConnection(localConnection)
    connectionRef.current = localConnection
  }

  const handleDataChannelMessageReceived = ({ data }: { data: string }) => {
    console.log("msg", { data })

    const message = JSON.parse(data)
    const { name: user } = message
    let messages = messagesRef.current
    // @ts-ignore
    let userMessages = messages[user]
    if (userMessages) {
      userMessages = [...userMessages, message]
      let newMessages = Object.assign({}, messages, { [user]: userMessages })
      messagesRef.current = newMessages
      setMessages(newMessages)
    } else {
      let newMessages = Object.assign({}, messages, { [user]: [message] })
      messagesRef.current = newMessages
      setMessages(newMessages)
    }
  }

  const updateUsersList = ({ user }: { user: User }) => {
    console.log({ user })

    setUsers((prev) => [...prev, user])
  }

  const removeUser = ({ user }: { user: User }) => {
    setUsers((prev) => prev.filter((u) => u.userName !== user.userName))
  }

  const toggleConnection = (userName: string) => {
    if (connectedRef.current === userName) {
      setConnecting(true)
      setConnectedTo("")
      connectedRef.current = ""
      setConnecting(false)
    } else {
      setConnecting(true)
      setConnectedTo(userName)
      connectedRef.current = userName
      handleConnection(userName)
      setConnecting(false)
    }
  }

  const handleConnection = (name: string) => {
    let dataChannel = connectionRef.current?.createDataChannel("messenger")

    //@ts-ignore
    dataChannel!.onerror = (error) => {
      console.log("creating data channel: ", "An error has occurred.")
    }

    dataChannel!.onmessage = handleDataChannelMessageReceived
    // updateChannel(dataChannel)

    connectionRef.current
      ?.createOffer()
      .then((offer) => connectionRef.current?.setLocalDescription(offer))
      .then(() =>
        send({
          type: "offer",
          offer: connectionRef.current?.localDescription,
          name,
        }),
      )
      .catch((e) => console.log("create offer:  An error has occurred.", e))
  }

  //when somebody wants to message us
  const onOffer = ({
    offer,
    name,
  }: {
    offer: RTCSessionDescriptionInit
    name: string
  }) => {
    setConnectedTo(name)
    connectedRef.current = name

    // deprecated: https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription/RTCSessionDescription
    connectionRef.current
      ?.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => connectionRef.current?.createAnswer())
      .then((answer) => connectionRef.current?.setLocalDescription(answer))
      .then(() =>
        send({
          type: "answer",
          answer: connectionRef.current?.localDescription,
          name,
        }),
      )
      .catch((e) => {
        console.log("set remote description error: An error has occurred.", {
          e,
        })
      })
  }

  //when another user answers to our offer
  const onAnswer = ({ answer }: { answer: RTCSessionDescriptionInit }) => {
    connectionRef.current?.setRemoteDescription(
      new RTCSessionDescription(answer),
    )
  }

  //when we got ice candidate from another user
  const onCandidate = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    connectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
  }

  return (
    <Connection>
      <div>
        <p>login screen</p>
        {!isLoggedIn ? (
          <>
            <input
              disabled={loggingIn}
              type="text"
              onChange={(e) => setName(e.target.value)}
              placeholder="Username..."
            />
            <button disabled={!name || loggingIn} onClick={handleLogin}>
              Login
            </button>
          </>
        ) : (
          <p>Logged In as: {name}</p>
        )}
        <UsersList users={users} toggleConnection={toggleConnection} />

        <button
          onClick={() => {
            channelRef.current?.send("ffffffff" + Math.random())
          }}
        >
          ff
        </button>
      </div>
    </Connection>
  )
}

export default App

const configuration = {
  iceServers: [{ urls: "stun:stun.1.google.com:19302" }],
}
