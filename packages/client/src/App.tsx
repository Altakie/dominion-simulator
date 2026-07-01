import { useEffect, useState } from "react";
import "./App.css";
import { create } from "zustand";
import { Button } from "./components/ui/button.tsx";
import { Lobby } from "./Lobby.tsx";

// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

let ws: WebSocket = null;

export const RouterStates = {
  HOME: "Home",
  LOBBY: "Lobby",
};

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
  Game: <Lobby />,
};

function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [name, setName] = useState("");

  useMessageSocket();

  const setState = useRouterStore((state) => state.set_router_state);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (ev) => {
        const json = JSON.parse(ev.data);
        if (json.msg) {
          setMessages([...messages, json.msg]);
        }

        // queryClient.invalidateQueries({
        //   queryKey: ['count']
        // })
      };
    }
  }, [messages]);

  // ws.send("Skeeby Deeby")

  return (
    <section id="center">
      <p>
        Your Name:
        <input
          className="border text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
        ></input>
      </p>
      <Button
        onClick={() => {
          setState("Game");
          ws.send(name);
        }}
      >
        Join Game
      </Button>
    </section>
  );
}

// WARN: Remove this function, replace with a query or mutation instead
function useMessageSocket() {
  // new WebSocket('/socket')
  useEffect(() => {
    function connect(attempt: number) {
      ws = new WebSocket("/socket");
      ws.onopen = () => {
        console.log("Opened Connection!");
      };

      ws.onclose = (ev) => {
        if (ev.code !== 1000) {
          setTimeout(
            () => connect(attempt + 1),
            Math.min(2000 ** attempt, 30000),
          );
        }
      };
    }

    connect(0);

    return () => ws.close(1000);
  });

  // return ws;
}

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
