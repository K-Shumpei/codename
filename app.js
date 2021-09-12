// モジュール
const http = require("http")
const express = require("express")
const socketIO = require("socket.io")

// オブジェクト
const app = express()
const server = http.Server(app)
const io = socketIO(server)

// 定数
const PORT = process.env.PORT || 7000

// 公開フォルダの指定
app.use(express.static(__dirname))

// サーバーの起動
server.listen(PORT, () => {
    console.log("server starts on port: %d", PORT)
})

const wordlist = require("./wordlist")

let namelist = []
let idlist = []
let ranpanel = {r: [], b: [], g: [], x: ""}
let team = {r: [], b: [], g: [], rmst: "", bmst: "", gmst: ""}
let turn = [{color: "r", jp: "赤", code: "#ff0000"}, {color: "b", jp: "青", code: "#0000ff"}, {color: "g", jp: "緑", code: "#008000"}]
let count = 0

// 接続時の処理
io.on("connection", function(socket){
    // 名前受信
    socket.on("name", function(name){
        idlist.push(socket.id)
        namelist.push(name)
        io.emit("enter", namelist)
    })

    // 切断時の処理
    socket.on("disconnect", () => {
        if (idlist.includes(socket.id)){
            let num = idlist.indexOf(socket.id)
            idlist.splice(num, 1)
            namelist.splice(num, 1)
        }
        io.emit("enter", namelist)
    })

    // チーム決め
    socket.on("team", () => {
        let save = namelist.concat()
        const random = shuffle(save)
        team = {r: [], b: [], g: [], rmst: "", bmst: "", gmst: ""}
        for (let i = 0; i < random.length; i++){
            if (i % 3 == 0){
                team.r.push(random[i])
            } else if (i % 3 == 1){
                team.b.push(random[i])
            } else if (i % 3 == 2){
                team.g.push(random[i])
            }
        }
        io.emit("team", team)
    })

    // スパイマスター
    socket.on("mst", color => {
        let num = idlist.indexOf(socket.id)
        let num2 = team[color].indexOf(namelist[num])
        team[color].splice(num2, 1)
        team[color + "mst"] = namelist[num]
        io.emit("team", team)
    })

    // 開始
    socket.on("start", () => {
        ranpanel = {r: [], b: [], g: [], x: ""}
        let ranwords = shuffle(wordlist.word())
        const panel = shuffle(wordlist.panel())
        for (let i = 0; i < 10; i++){
            ranpanel.r.push(panel[i])
        }
        for (let i = 10; i < 19; i++){
            ranpanel.b.push(panel[i])
        }
        for (let i = 19; i < 28; i++){
            ranpanel.g.push(panel[i])
        }
        ranpanel.x = panel[28]
        let result = []
        for (let i = 0; i < 36; i++){
            result.push(ranwords[i])
        }
        io.emit("start", result, ranpanel, team)
    })

    // ヒント受信
    socket.on("hint", (hint, num, time) => {
        const txt = turn[count % 3].jp + "のヒント：" + hint + "　個数：" + num
        const penalty = Math.max(0, -time)
        io.emit("hint", txt, turn, count, team, penalty)
    })

    // 回答受信
    socket.on("ans", (num) => {
        if (ranpanel[turn[count % 3].color].includes(num)){
            io.emit("ans", num, ranpanel, turn, count, team, true)
        } else {
            io.emit("ans", num, ranpanel, turn, count, team, false)
            count += 1
        }
    })

    // 終了受信
    socket.on("change", (time) => {
        const penalty = Math.max(0, -time)
        io.emit("change", turn, count, team, penalty)
        count += 1
    })

    // リセットボタン
    socket.on("end", () => {
        ranpanel = {r: [], b: [], g: [], x: ""}
        team = {r: [], b: [], g: [], rmst: "", bmst: "", gmst: ""}
        count = 0
        io.emit("end", {})
    })
})


// リストのシャッフル関数
function shuffle(array){
    for(var i = array.length - 1; i > 0; i--){
        var r = Math.floor(Math.random() * (i + 1));
        var tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array
}