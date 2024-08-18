const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server,{
  cors:{
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

//ゲームのロジック
// 〇マッチングまでの流れ
// ユーザからルームへの接続リクエスト
// ルームの中からプレーヤーが一人の部屋を探す
// 一人の部屋が存在しない場合はルームを作成する
// (ルームで30秒マッチングしなければBOTが参戦する)
// 〇マッチング後の流れ
// 二人目のユーザが入った後マッチング完了メッセージを送信
// それに応じて画面更新


// 使用するフラグ
// 〇マッチングフラグ

// const data = {
//   userId:userId,
//   username:userData.username,
//   photoURL:userData.photoURL,
//   rate:userData.rate,
//   message:userData.message
// };


const rooms = [];

io.on('connection', (socket)  => {
  // console.log('connected');
  socket.on('Matching-Request',async (data)=>{
    console.log('user:',data.username,'からのマッチングリクエスト');
    console.log('id:',data.userId);

    let room = searchRoom(data);
    if(room === null)room = makeRoom(data);
    console.log(room.roomId);

    socket.join(room.roomId);
    io.to(room.roomId).emit('Room-Response',room);
    
    
    //room検索処理
    function searchRoom(userData){
      console.log("room search");
      let findFlag=false;
      for(let i=0; i<rooms.length; i++){
        let room=rooms[i];
        if(room.numberOfPeople===1){
          room.subUserData=userData;
          room.numberOfPeople=2;
          console.log("roomに参加",room);
          findFlag=true;
          return room;
        }
      }
        console.log("roomが見つかりませんでした");
        return null;
    }
    //room作成処理
    function makeRoom(userData){
      console.log("room make");
      const room={
        roomId:userData.userId,
        state:'matching',
        turn:0,
        numberOfPeople:1,
        mainUserData:userData,
        subUserData:null
      };
      rooms.push(room);
      console.log("roomを作成\n\n\n",rooms,"\n\n\n現在のルーム数:",rooms.length);
      return room;
    }
  });
  socket.on('Game-Start-Request',(roomId)=>{
    startGame();
    //ゲームを開始する命令
    function startGame(){
      io.to(roomId).emit('Game-Start-Response',['Turn1',roomId]);
    }    
  });
  socket.on('disconnect',()=>{
    console.log('disconnect');
    //切断時の処理
  });
});

// setInterval(()=>{
//   console.log(rooms);
// },5000);

server.listen(4000, () => {
  console.log('server running at http://localhost:4000');
});