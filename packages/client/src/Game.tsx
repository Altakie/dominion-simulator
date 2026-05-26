import { serializeMessage, MessageKind, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext } from 'react'
import { StateContext } from "./App";
import './App.css'

export function Game() {
  return <>
    <h1>Game</h1>
  </>
}
