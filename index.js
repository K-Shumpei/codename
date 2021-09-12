$(function () {
    var socketio = io()
    var timer = ""

    // 名前送信
    $("#emitName").submit(function() {
        const myname = document.getElementById("name").value
        socketio.emit("name", myname)
        document.getElementById("myname").textContent = myname
        document.getElementById("typename").style.display = "none"
        return false
    })

    // 誰かが入室
    socketio.on("enter", function(namelist){
        if (document.getElementById("myname").textContent != ""){
            document.getElementById("main").style.display = "block"
            document.getElementById("member").textContent = namelist.join("、")
            if (namelist[0] == document.getElementById("myname").textContent){
                document.getElementById("host").textContent = "(ホスト)"
                document.getElementById("maketeam").style.display = "block"
            } else {
                document.getElementById("host").textContent = ""
                document.getElementById("maketeam").style.display = "none"
            }
        }
    })

    // チーム決め
    $("#team").submit(function() {
        socketio.emit("team", {})
        return false
    })

    // チーム決定
    socketio.on("team", function(team){
        for (const color of ["r", "b", "g"]){
            document.getElementById(color + "mem").textContent = team[color].join("、")
            document.getElementById(color + "mst").textContent = team[color + "mst"]
            if (team[color].includes(document.getElementById("myname").textContent) && document.getElementById(color + "mst").textContent == ""){
                document.getElementById(color + "mstbtn").style.display = "block"
            } else {
                document.getElementById(color + "mstbtn").style.display = "none"
            }
        }
        if (document.getElementById("rmst").textContent != "" && 
        document.getElementById("bmst").textContent != "" && 
        document.getElementById("gmst").textContent != ""){
            document.getElementById("startbtn").disabled = false
        } else {
            document.getElementById("startbtn").disabled = true
        }
    })

    // スパイマスターになる
    $("#rform").submit(function() {
        socketio.emit("mst", "r")
        return false
    })
    $("#bform").submit(function() {
        socketio.emit("mst", "b")
        return false
    })
    $("#gform").submit(function() {
        socketio.emit("mst", "g")
        return false
    })

    // 開始ボタン
    $("#start").submit(function() {
        socketio.emit("start", {})
        return false
    })

    // 開始
    socketio.on("start", function(word, panel, team){
        const myname = document.getElementById("myname").textContent
        const member = document.getElementById("member").textContent.split("、")

        document.getElementById("maketeam").style.display = "none"
        document.getElementById("table").style.display = "block"
        document.getElementById("title").style.display = "block"
        for (let i = 0; i < 6; i++){
            for (let j = 0; j < 6; j++){
                document.getElementById("word" + i + j).textContent = word[i * 6 + j]
            }
        }
        if (team.rmst == myname || team.bmst == myname || team.gmst == myname){
            document.getElementById("typehint1").style.display = "block"
            document.getElementById("typehint2").style.display = "block"
            for (const color of panel.r){
                document.getElementById("btn" + color).style.background = "#ff0000"
                document.getElementById("btn" + color).style.color = "#fff"
            }
            for (const color of panel.b){
                document.getElementById("btn" + color).style.background = "#0000ff"
                document.getElementById("btn" + color).style.color = "#fff"
            }
            for (const color of panel.g){
                document.getElementById("btn" + color).style.background = "#008000"
                document.getElementById("btn" + color).style.color = "#fff"
            }
            document.getElementById("btn" + panel.x).style.background = "#000000"
            document.getElementById("btn" + panel.x).style.color = "#fff"

        } else {
            document.getElementById("turnchange").style.display = "block"
        }
        // ペナルティ
        let table = document.getElementById("penalty")
        let savepena = []
        let savename = []
        let rowlen = table.rows.length
        console.log(rowlen)
        if (rowlen > 1){
            for (let i = 0; i < rowlen; i++){
                savepena.push(document.getElementById("limit" + i).textContent)
                savename.push(document.getElementById("member" + i).textContent)
            }
            // 今の表を削除
            for (let i = 1; i < rowlen; i++){
                table.deleteRow(rowlen - i)
            }
        }
        // 新しい表を作成
        for (let i = 0; i < member.length; i++){
            let row = table.insertRow(-1)
            let cell1 = row.insertCell(-1)
            let cell2 = row.insertCell(-1)
            cell1.innerHTML = "<span id='member"+i+"'>"+member[i]+"</span>"
            cell2.innerHTML = "<span id='limit"+i+"'>0</span>"
        }
        
        // 残りの数字
        for (const color of ["r", "b", "g"]){
            document.getElementById(color + "rest").textContent = panel[color].length
        }
        // 先行は赤チーム
        if (myname == team.rmst){
            document.getElementById("hintbtn").disabled = false
        }
        document.getElementById("turnplayer").textContent = "赤のスパイマスターのターン"
        // カウントダウン
        document.getElementById("limit").textContent = 90
        timer = setInterval(countdown, 1000)
    })

    // ヒント送信
    $("#hint").submit(function() {
        const hint = document.getElementById("hinttxt").value
        const num = document.getElementById("hintnum").value
        const time = document.getElementById("limit").textContent
        socketio.emit("hint", hint, num, time)
        document.getElementById("hinttxt").value = ""
        return false
    })

    // ヒント受信
    socketio.on("hint", (txt, turn, count, team, penalty) => {
        const myname = document.getElementById("myname").textContent
        const member = document.getElementById("member").textContent.split("、")

        // ログの記録
        document.getElementById("log").value += txt + "\n"
        // マスターのボタン停止
        if (myname == team.rmst || myname == team.bmst || myname == team.gmst){
            document.getElementById("hintbtn").disabled = true
        }
        // ターン諜報員のボタン有効
        if (team[turn[count % 3].color].includes(myname)){
            for (let i = 0; i < 6; i++){
                for (let j = 0; j < 6; j++){
                    if (document.getElementById("word" + i + j).textContent != "clear"){
                        document.getElementById("btn" + i + j).disabled = false
                    }
                }
            }
            document.getElementById("changebtn").disabled = false
        } else {
            for (let i = 0; i < 6; i++){
                for (let j = 0; j < 6; j++){
                    document.getElementById("btn" + i + j).disabled = true
                }
            }
            document.getElementById("changebtn").disabled = true
        }
        // ペナルティ加算
        for (let i = 0; i < member.length; i++){
            if (document.getElementById("member" + i).textContent == team[turn[count % 3].color + "mst"]){
                const now = Number(document.getElementById("limit" + i).textContent)
                document.getElementById("limit" + i).textContent = now + penalty
            }
        }
        // タイトル変更
        document.getElementById("turnplayer").textContent = turn[count % 3].jp + "の諜報員のターン"
        // タイマーリセット
        document.getElementById("limit").textContent = 60
    })

    // 回答送信
    for (let i = 0; i < 6; i++){
        for (let j = 0; j < 6; j++){
            $("#form" + i + j).submit(function() {
                socketio.emit("ans", String(i) + String(j))
                return false
            })
        }
    }

    // 回答の正誤判定
    socketio.on("ans", (num, ranpanel, turn, count, team, judge) => {
        // ログの記録
        const txt = turn[count % 3].jp + "の回答：" + document.getElementById("word" + num).textContent
        document.getElementById("log").value += txt + "\n"
        // パネルをclear
        document.getElementById("word" + num).textContent = "clear"

        // 誤答したとき
        if (!judge){
            // ターンマスターのボタン有効
            if (document.getElementById("myname").textContent == team[turn[(count + 1) % 3].color + "mst"]){
                document.getElementById("hintbtn").disabled = false
            } else { // それ以外のボタン停止
                document.getElementById("hintbtn").disabled = true
                for (let i = 0; i < 6; i++){
                    for (let j = 0; j < 6; j++){
                        document.getElementById("btn" + i + j).disabled = true
                    }
                }
                document.getElementById("changebtn").disabled = true
            }
            // タイトル変更
            document.getElementById("turnplayer").textContent = turn[(count + 1) % 3].jp + "のスパイマスターのターン"
            // カウントリセット
            document.getElementById("limit").textContent = 60
        }
        // ボタンの色付け
        for (let i = 0; i < 3; i++){
            if (ranpanel[turn[i].color].includes(num)){
                document.getElementById("btn" + num).style.background = turn[i].code
                document.getElementById("btn" + num).style.color = "#fff"
                document.getElementById(turn[i].color + "rest").textContent -= 1
            }
        }
        // 黒パネルを選んだとき
        if (ranpanel.x == num){
            document.getElementById("btn" + num).style.background = "#000000"
            document.getElementById("btn" + num).style.color = "#fff"
            document.getElementById("turnplayer").textContent = turn[count % 3].jp + "チームの負け！！！"
        }

        // 勝敗判定
        if (document.getElementById("rrest").textContent == 0){
            document.getElementById("turnplayer").textContent = "赤チームの勝ち！！！"
        } else if (document.getElementById("brest").textContent == 0){
            document.getElementById("turnplayer").textContent = "青チームの勝ち！！！"
        } else if (document.getElementById("grest").textContent == 0){
            document.getElementById("turnplayer").textContent = "緑チームの勝ち！！！"
        }

        // 勝敗がついたとき、ボタンの停止
        if (document.getElementById("turnplayer").textContent.includes("！！！")){
            document.getElementById("hintbtn").disabled = true
            document.getElementById("changebtn").disabled = true
            for (let i = 0; i < 6; i++){
                for (let j = 0; j < 6; j++){
                    document.getElementById("btn" + i + j).disabled = true
                }
            }
            // タイマーの停止
            clearInterval(timer)
            document.getElementById("limit").textContent = ""
            // ホストの画面に戻るボタン
            if (document.getElementById("host").textContent != ""){
                document.getElementById("comeback").style.display = "block"
            }
        }
    })

    // 終了送信
    $("#change").submit(function() {
        const time = document.getElementById("limit").textContent
        socketio.emit("change", time)
        return false
    })

    // 終了受信
    socketio.on("change", (turn, count, team, penalty) => {
        const member = document.getElementById("member").textContent.split("、")

        // ターンマスターのボタン有効
        if (document.getElementById("myname").textContent == team[turn[(count + 1) % 3].color + "mst"]){
            document.getElementById("hintbtn").disabled = false
        } else { // それ以外のボタン停止
            document.getElementById("hintbtn").disabled = true
            document.getElementById("changebtn").disabled = true
            for (let i = 0; i < 6; i++){
                for (let j = 0; j < 6; j++){
                    document.getElementById("btn" + i + j).disabled = true
                }
            }
        }
        // タイトル変更
        document.getElementById("turnplayer").textContent = turn[(count + 1) % 3].jp + "のスパイマスターのターン"
        // ペナルティ加算
        for (let i = 0; i < member.length; i++){
            if (team[turn[count % 3].color].includes(document.getElementById("member" + i).textContent)){
                const now = Number(document.getElementById("limit" + i).textContent)
                document.getElementById("limit" + i).textContent = now + penalty
            }
        }
        // タイマーリセット
        document.getElementById("limit").textContent = 60
    })

    // リセットボタン
    $("#back").submit(function() {
        socketio.emit("end", {})
        return false
    })
    socketio.on("end", () => {
        // パネルの色を戻す
        for (let i = 0; i < 6; i++){
            for (let j = 0; j < 6; j++){
                document.getElementById("btn" + i + j).style.background = "#fff"
                document.getElementById("btn" + i + j).style.color = "#000000"
            }
        }
        // ログを消す
        document.getElementById("log").value = ""
        // 画面の非表示
        document.getElementById("rmstbtn").style.display = "none"
        document.getElementById("bmstbtn").style.display = "none"
        document.getElementById("gmstbtn").style.display = "none"
        document.getElementById("title").style.display = "none"
        document.getElementById("table").style.display = "none"
        document.getElementById("typehint1").style.display = "none"
        document.getElementById("typehint2").style.display = "none"
        document.getElementById("turnchange").style.display = "none"
        document.getElementById("comeback").style.display = "none"
        // ホストはチーム決めボタンを表示
        if (document.getElementById("host").textContent != ""){
            document.getElementById("maketeam").style.display = "block"
        }
    })
})

// カウントダウン
function countdown(){
    document.getElementById("limit").textContent -= 1
}