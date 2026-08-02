import { useEffect, useState } from "react";
import "./App.css";
import { AlertCircleIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { create } from "zustand";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx";
import { Button } from "./components/ui/button.tsx";
import { Lobby } from "./Lobby.tsx";

// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// let ws: WebSocket = null;

export const RouterStates = Object.freeze({
  HOME: "Home",
  LOBBY: "Lobby",
});

type RouterState = (typeof RouterStates)[keyof typeof RouterStates];

type RouterStore = {
  router_state: RouterState;
  set_router_state: (state: RouterState) => void;
};

export const useRouterStore = create<RouterStore>((set) => ({
  router_state: RouterStates.HOME,
  set_router_state: (state) => set(() => ({ router_state: state })),
}));

function App() {
  const state = useRouterStore((state) => state.router_state);
  // return (<>
  //   <BrowserRouter>
  //     <Routes>
  //       <Route path='/' element={<Home />}></Route>
  //       <Route path='/game' element={<Game />}></Route>
  //     </Routes>
  //   </BrowserRouter>
  // </>)

  return <>{stateTable[state]}</>;
}

const stateTable: Record<RouterState, React.ReactNode> = {
  Home: <Home />,
  Lobby: <Lobby />,
};

function Home() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reconnect_name, setReconnectName] = useState<string | undefined>(
    undefined,
  );

  const setState = useRouterStore((state) => state.set_router_state);

  useEffect(() => {
    fetch("/session")
      .then((res) => res.json())
      .then((session: { in_game: boolean; name?: string }) => {
        if (session.in_game) {
          setReconnectName(session.name);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  // ws.send("Skeeby Deeby")

  return (
    <>
      <section id="center">
        {reconnect_name && (
          <p>
            You have a game in progress as {reconnect_name}.
            <Button onClick={() => setState(RouterStates.LOBBY)}>
              Reconnect
            </Button>
          </p>
        )}
        <Card className="border">
          <CardContent className="w-[30vw] text-left">
            <p>Your Name:</p>
            <input
              className="border rounded-md text-black w-full text-lg bg-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            ></input>
          </CardContent>
        </Card>
        <Button
          onClick={async () => {
            try {
              const res = await fetch("/names", {
                body: name,
                method: "PUT",
                headers: {
                  "Content-Type": "text",
                },
              });
              if (res.ok) {
                setState(RouterStates.LOBBY);
              } else if (res.status === 406) {
                setError(await res.text());
              } else {
                setError(res.statusText);
              }
            } catch (e) {
              console.log(e);
              setError(`${e}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Joining..." : "Join Game"}
        </Button>
      </section>
      {error && (
        <Alert
          variant="destructive"
          className="fixed top-2 left-2 w-fit animate-slide-in-right bg-red-50"
        >
          <AlertCircleIcon />
          <AlertTitle>Failed to connect to lobby</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

// WARN: Remove this function, replace with a query or mutation instead

// return ws;

// export function Button({ children, ...props }) {
//   return (
//     <button
//       className={`rounded-xl text-black bg-gray-400 p-2 ${props.className}`}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// }

// function MessageLog({ messages }) {
//
//   return (
//     <>
//       {
//         messages.map((message: string) => <p>{message}</p>)
//       }
//     </>
//   )
// }

// function sendMessage(ws: RefObject<WebSocket>, name: string, message: string, setInput: Dispatch<SetStateAction<string>>) {
//   ws.current.send(`[${name}]: ${message}`)
//   setInput("")
// }

export default App;
