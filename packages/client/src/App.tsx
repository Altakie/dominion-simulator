import {
  createContext,
  type RefObject,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Lobby } from "./Lobby.tsx";
// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const ROUTE_TABLE = {
  Home: <Home />,
  Game: <Lobby />,
  Test: <Test />,
} as const satisfies Record<string, ReactNode>;

type Route = keyof typeof ROUTE_TABLE;

export interface RouterContext {
    route: Route,
    setRoute: Dispatch<SetStateAction<Route>>,
}
export const RouterContext = createContext<RouterContext | null>(null);
export function useRouter() {
    const routerCtx = use(RouterContext);
    if (routerCtx === null) {
        throw new Error("`useRouter` must be used from a component that's a descendant of `RouterContext`.");
    }
    return routerCtx;
}



function App() {
  // return (<>
  //   <BrowserRouter>
  //     <Routes>
  //       <Route path='/' element={<Home />}></Route>
  //       <Route path='/game' element={<Game />}></Route>
  //     </Routes>
  //   </BrowserRouter>
  // </>)

  const [route, setRoute] = useState<Route>("Home");

  return (
      <RouterContext value={{ route, setRoute }}>
        {ROUTE_TABLE[route]}
      </RouterContext>
  );
}

function Test() {
  return <h1>Hi!</h1>;
}

function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [name, setName] = useState("");

  const ws = useMessageSocket();

  const { setRoute } = useRouter();

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (ev) => {
        const json = JSON.parse(ev.data);
        if (json.msg) {
          setMessages([...messages, json.msg]);
        }

        // queryClient.invalidateQueries({
        //   queryKey: ['count']
        // })
      };
    }
  }, [ws, messages]);

  // ws.send("Skeeby Deeby")

  return (
    <>
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
            setRoute("Game");
            ws.current.send(name);
          }}
        >
          Join Game
        </Button>
      </section>
    </>
  );
}

function useMessageSocket() {
  const ws = useRef<WebSocket>(null);
  // new WebSocket('/socket')
  useEffect(() => {
    function connect(attempt: number) {
      ws.current = new WebSocket("/socket");
      ws.current.onopen = () => {
        console.log("Opened Connection!");
      };

      ws.current.onclose = (ev) => {
        if (ev.code !== 1000) {
          setTimeout(
            () => connect(attempt + 1),
            Math.min(2000 ** attempt, 30000),
          );
        }
      };
    }

    connect(0);

    return () => ws.current.close(1000);
  }, []);

  return ws;
}

export function Button({ children, ...props }) {
  return (
    <button
      className={`rounded-xl text-black bg-gray-400 p-2 ${props.className}`}
      {...props}
    >
      {children}
    </button>
  );
}

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
