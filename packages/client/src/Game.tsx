import { serializeMessage, MessageKind, parseMessage, type ConnectMessage, type DisconnectMessage, type PlayerNamesMessage } from "shared/messages"
import { useEffect, useState, useRef, useContext } from 'react'
import { StateContext } from "./App";
import './App.css'
import type { GameState } from "shared";

export function Game({ players, game_state }: { players: string[], game_state: GameState }) {
  return <>
    <h1>Game</h1>
    <PlayerList players={players} />
  </>
}

function PlayerList({ players }: { players: string[] }) {
  return <>
    <ol>
      {players.map((name) => <li>{name}</li>)}
    </ol>
  </>
}

function Supply() {

}

function Hand() {
}

function Card() {
}

function Log() {
}

