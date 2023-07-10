import { User } from "./App"

type Props = {
  users: User[]
  toggleConnection: (userName: string) => void
}

export const UsersList: React.FunctionComponent<Props> = ({
  users,
  toggleConnection,
}) => {
  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.userName}{" "}
            <button
              onClick={() => {
                toggleConnection(user.userName)
              }}
            >
              connect
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
