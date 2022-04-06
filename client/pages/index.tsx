import Head from 'next/head'
//import { useRouter } from "next/router";
//import Card from "../components/UI/Card";
//import UserInput from "../components/UserInput/UserInput";
import { io } from 'socket.io-client';
import { URL } from 'url';
//import Websocket from 'websocket';
import WebSocket from 'ws';
//const webClient = WebSocketClient.client
//const client: Websocket.client = new Websocket.client()

//const port = 3001;
//const endpoint = "";

const url = new URL('ws://localhost:3001/dev');
const socket = new WebSocket(url)
//const socket: WebSocket = new WebSocket('wss://j1j48k3i1l.execute-api.ap-northeast-1.amazonaws.com');



//client.connect('ws://localhost:3001/', 'dev');
//const wss = new WebSocket( "http://localhost:3001/dev" );
/*
//const socket = io(`wss://j1j48k3i1l.execute-api.ap-northeast-1.amazonaws.com/dev`, {
const socket = io(`http://localhost:3001/dev`, {
  withCredentials: true
});

socket.on('connect', () => console.log('connect'));
socket.on('message', (data: { message: string }) => {
  console.log(`type: ${typeof data}   data: ${data.message}`);
});
*/

export default function Home() {

  socket.on('connect', function open() {
  socket.send('something');
});

socket.on('message', function message(data) {
  console.log('received: %s', data);
});
socket.onmessage = (event) => {
  console.log('onmessage: %s', event.data);
};
//  const router = useRouter();
//  const context = useContext(AppContext);
//
//  const onSubmit = (username: string, roomName: string) => {
//    router.push({ pathname: `/chat/${roomName}`, query: { username }} );
//  };

  return (

    
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      
    </div>
  )
}
