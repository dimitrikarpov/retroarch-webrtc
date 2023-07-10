import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import { Connection } from "./connection.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Connection>
    <App />
  </Connection>,
)

/*
  <React.StrictMode>
    <App />
  </React.StrictMode>,
*/
