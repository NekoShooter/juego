//contect
const canvas = document.querySelector('#game');
const btnArriba = document.querySelector('#arriba');
const btnAbajo = document.querySelector('#abajo');
const btnDer = document.querySelector('#derecha');
const btnIzq = document.querySelector('#izquierda');
const viewlive = document.querySelector('#lives');
const viewTime = document.querySelector('#time');

const juego  = canvas.getContext('2d');

//signals: 
window.addEventListener('load', loadEvent);
window.addEventListener('resize', resizeEvent);


let posJugador     = undefined; let mapa     = Array();  let nivel = 0;
let prePosJugador  = undefined; let celda_t  = 0;        let nivel_actual = undefined;
let puntoDePartida = Number(0); let canvas_t = 0;        var resize       = Boolean(true);
let explosionPos   = 0;         let vidas    = 3;        let timeStart    = undefined;
                                                         let timeInterval = undefined;
                                                         let playerTime   = 0;
                                                         let animationTxt = Boolean(false);
                                                         let scores       = undefined;
                                                         let playerName   = undefined;

const gameStatus = {['exec']: true, ['showFinalScreen']: false,['emblema']:undefined,
                    ['optionContinue']:undefined, ['frame']:0, ['optionResetStart']: undefined,
                    ['stack']: undefined,['newRecord']:false, ['runAnimation']: Boolean(false)};

function loadEvent(){
    readScoreEvent();
    animation(paintTimeEvent);
    resizeEvent();}

function resizeEvent(){
    resize = true;
    canvas_t = (window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight) *.75 ;
    canvas.setAttribute('width', canvas_t);
    canvas.setAttribute('height',canvas_t);
    celda_t = canvas_t / 10;
    juego.textAlign='end';
    juego.font = font_t() +'px arial';
    liveEvent();
    update();}

function font_t(){ return celda_t - celda_t / 10;}


function resetStartEvent(){
    posJugador = prePosJugador = undefined; 
    nivel = 0;
    nivel_actual = undefined;
    puntoDePartida = 0;
    vidas = 3;
    resize = true;
    gameStatus['optionContinue'] = 'si';
    gameStatus['showFinalScreen'] = false;
    gameStatus['optionResetStart'] = 'indeciso';
    gameStatus['emblema'] = '';
    animation(paintTimeEvent);
    liveEvent();
    playerTime = 0;
    update();}


function update(){
    if(gameStatus['showFinalScreen']) {
        if(gameStatus['newRecord']) paintScreenScore();
        else paintScreenFinal();}
    else{
        cargarMapa();
        clear();
        paintEvent();
        paintEventPlayer();}
    //terminado el risize   
    resize = false;}



function readScoreEvent(){
    if(!scores && !localStorage.getItem('score')){
        scores = Array(10);
        for(i = 0; i < 10; ++i)//defaultName una const con un listado de nombres random
            scores[i] = {['name']:defaultName[i],['time']:20000 + (i * 1000)};
        localStorage.setItem('score',stringScore());
        return;}

    const temp = localStorage.getItem('score').split(',');
    const cap = temp.length / 4;
    scores = Array(cap);
    for(j = i = 0; i < cap; ++i , j+= 4)
        scores[i] = {[temp[j]] : temp[j + 1], [temp[j + 2]]: Number(temp[j + 3])};}


function stringScore(){
    if(!scores) return '';
    const array = Array(scores.length);
    for(i = 0; i < scores.length; ++i)
        array[i] = 'name' +',' +scores[i]['name'] + ',' + 'time'+ ',' + scores[i]['time'];
    return array.join(',');}


function liveEvent(){
    const corazon = Array(3).fill('🖤');
    for(i = vidas - 1; i >= 0 ; --i ) corazon[i] = emojis['HEART'];
    viewlive.innerHTML = corazon.join('');}

function paintTimeEvent(){
    playerTime = timer();
    viewTime.innerHTML = stringTime(playerTime);}


function timeFormat(time_rang){
    let d = 0;
    let time_msec = time_rang;
    if(time_rang >= 0x5265C00){
        time_msec = (time_rang & 0x7FFFFFF) ^ 0x5265C00;
        d = ~~(time_rang / 86400000);}

    const time = ~~(time_msec / 1000);
    const hr = ~~(time / 3600);
    const min = ((time / 60) | 0) - (hr * 60);
    const sec =  time - ((min * 60) + (hr * 3600));    
    const msec = ((time_msec / 10) | 0) - (time * 100);
    return {['dia']:d, ['hr']:hr, ['min']:min, ['sec']:sec, ['msec']:msec};}


function stringTime(time_msec){
    t = timeFormat(time_msec);
    return (t['dia'] ?  t['dia'] + ':' : '') + 
           (t['hr'] ? (t['hr'] < 10 ? '0' + t['hr'] : t['hr']) + ':' : '') + 
           (t['min'] ? (t['min'] < 10 ? '0' + t['min'] : t['min'])+ ':' : '') + 
           (t['sec'] < 10 ? '0'+ t['sec']: t['sec']) + ':' +
           (t['msec'] < 10 ? '0'+ t['msec']: t['msec']);}

function timer(){ return Date.now() - timeStart;}


function runTime(var_function, time){
    if(!timeInterval){
        timeStart = Date.now();
        timeInterval = setInterval(var_function, time);}
    else{
        clearInterval(timeInterval);
        timeStart = undefined;
        timeInterval = undefined;}}

function animationActive(){return timeStart || timeInterval;}

function animation(paramatro = undefined, time = 100){
    gameStatus['frame'] = 0; //version segura por desgracia solo permite un proseso a la vez
    gameStatus['runAnimation'] =  false;
    if(!paramatro && timeInterval) runTime();
    else if(timeInterval && typeof paramatro != 'function') {
        console.log('FIN : [ '+ paramatro +' ]');
        runTime();
        return;}
    else if(timeInterval) {
        console.log('FIN : [ PROCESO : '+ timeInterval +' ]');
        runTime();}
    else if(!paramatro || typeof paramatro != 'function'|| typeof time != 'number') {
        console.log('AVISO : [' + typeof paramatro + ' : '+ paramatro +' ]-[' + typeof time +' : ' + time + ' ]');
        return;}
    runTime(paramatro,time);
    console.log('INICIO : [ '+ String(paramatro).split('{')[0] +' ] : [ ' + time + ' ]');}


function cargarMapa(){
    if(nivel_actual == nivel || gameFinish()) return;
    nivel_actual = nivel;
    mapa = map[nivel].match(/[IOX-]/g);}


function posY(indice){ return (~~(indice/10) + 1) * celda_t - celda_t / 5; }
function posX(indice){ return (indice - (~~(indice/10) * 10) + 1) * celda_t + celda_t / 10;}


function clear(){
    if(resize) {
        juego.clearRect(0,0, canvas_t, canvas_t);
        return;}
    
    if(posJugador == prePosJugador) return;
    clearRect(posJugador);
    clearRect(prePosJugador);}


function clearRect(indice){
    const x  = posX(indice ) - celda_t / 10;
    const y  = posY(indice ) + celda_t / 5;
    juego.clearRect(x - 1 ,y , - celda_t, - (celda_t + 1));}


function paintEvent(){
    if(resize)
        mapa.forEach((char, idx) => {
            if(char == 'O' && posJugador == undefined) puntoDePartida = posJugador = idx;       
            juego.fillText(emojis[char], posX(idx), posY(idx) );});}


function paintEventPlayer(){
    if(gameStatus['runAnimation']) return;
    if(victoryEvent()) animation(paintScreenEvent);
    else { 
        if(posJugador != undefined && prePosJugador != posJugador){
            juego.fillText(emojis[mapa[prePosJugador]],posX(prePosJugador),posY(prePosJugador));

            if(!gameOverEvent()) juego.fillText(emojis['PLAYER'],posX(posJugador),posY(posJugador));
            else {animation(paintScreenEvent);}}}}



function Victoria(){return nivel >= map.length;}
function gameFinish(){ return !Victoria() == (vidas <= 0);}


function gameOverEvent(){
    if(vidas && mapa[posJugador] == 'X'){ 
        explosionPos = posJugador;
        posJugador = puntoDePartida;
        juego.fillText(emojis['BOMB_COLLISION'],posX(explosionPos),posY(explosionPos));
        setTimeout(()=>{
            clearRect(explosionPos);
            juego.fillText(emojis['X'],posX(explosionPos),posY(explosionPos));},100);
        --vidas;
        liveEvent();}
    if(gameFinishEvent()) {
        gameStatus['optionContinue'] = 'si';
        return true;} /*juego terminado*/
    return false; /*continuar con el juego*/}


function victoryEvent(){
    if(mapa[posJugador] != 'I') return false;
    else if(nivel < map.length) ++nivel;
    
    if(gameFinishEvent()) return true;/*juego terminado*/

    posJugador = prePosJugador = undefined;
    resize = true;
    update();
    return false;/*continuar con el juego*/}


function gameFinishEvent(){ 
    if(gameFinish() && !gameStatus['showFinalScreen']) {
        gameStatus['emblema'] = Victoria() ? emojis['WIN']: emojis['GAME_OVER'];
        newRecordEvent();
        animation('cronometro');
        gameStatus['showFinalScreen'] = true;}

    return !(nivel >= map.length) == (vidas <= 0);}


function newRecordEvent(){
    if(!playerTime || !Victoria()) return false;
    prePosJugador = posJugador;
    posJugador = undefined;
    puntoDePartida = 0;
    for(i = 0; i < 10; ++i) {
        if(scores[i]['time'] > playerTime) {
            posJugador = i;
            break;}
        else posJugador = undefined;}

    if(posJugador == undefined) return false;
    gameStatus['emblema'] = emojis['PARTY_1'];
    gameStatus['newRecord'] = true;
    return true;}


function replaceScore(){
    if(!gameStatus['newRecord']) return;
    let temp = undefined;
    for(i = posJugador; i < 10; ++i){
        if(!temp){
            temp = scores[i];
            scores[i] = {['name']:playerName.join(''),['time']: playerTime};}
        else{
            const t = scores[i];
            scores[i] = temp;
            temp = t;}}}


function paintScreenEvent(){
    if(!animationMegaExplosion()) return;
    if(gameStatus['newRecord']) animation(animationNewRecordEvent,50);
    else paintScreenFinal();}


    function animationMegaExplosion(){
        if(!animationActive()) return false; // fin de la animacion
        gameStatus['runAnimation'] = true;
        if(!gameStatus['stack']) gameStatus['stack'] = Array();
        if(gameStatus['frame'] <= 10){
            if(Victoria()){
                clearRect(prePosJugador);
                if(gameStatus['frame'] % 3) juego.fillText('⭐️',posX(prePosJugador),posY(prePosJugador));
                else juego.fillText('🌟',posX(prePosJugador),posY(prePosJugador));}
    
            for(i = gameStatus['frame']; i <= gameStatus['frame'] + 90; i += 10){
                if(gameStatus['frame'] != 10)
                    paintCell(i,'X', emojis['BOMB_COLLISION']);
                if(gameStatus['frame'] && paintCell(i - 1,'X', gameStatus['emblema']))
                    gameStatus['stack'].push(i-1);}
    
                gameStatus['frame']++;
                return false;}// la animacion no acaba
    
        else animation('megaExplosion');
        gameStatus['stack'] = undefined;
        return true;}
    
    
    function paintCell(idx, id , img){
        if(mapa[idx]==id){ 
            clearRect(idx);
            juego.fillText(img,posX(idx),posY(idx));
            return true;}
        return false;}



function animationNewRecordEvent(){
    if(!animationTextNewRecord()) return;
    animation(animationScoreEvent);}


function animationTextNewRecord(){
    if(!animationActive()) return false;
    if(!gameStatus['newRecord']){
        animation('newRecord');
        return false;}
    //paintScreen();

    gameStatus['runAnimation'] = true;

    const media = canvas_t / 2;
    const str = '⭐️ New record ⭐️'.split('');
    if(gameStatus['frame'] <= ~~(str.length/2)){
        const msn = Array(str.length);
        if(!gameStatus['frame']) msn[0]='⭐️';
        else{
            for(i = 0; i < gameStatus['frame'] && gameStatus['frame'] <= ~~(str.length/2); ++i){
                msn[i] = str[i];
                msn[(str.length - 1) - i]= str[(str.length - 1) - i];}}

        paintRectText(msn.join(''), '#ffd700' , '#01433A','center',media, media);
        ++gameStatus['frame'];
        return false;}

    paintRectText('⭐️ New record ⭐️', '#ffd700' , '#01433A','center',media, media);
    if(2 < (timer() / 1000)){
        animation('newRecord');
        gameStatus['runAnimation'] = false;
        return true;}
    return false;}



function animationScoreEvent(){
    if(!paintScreenScore()) return;
    paintScreen();
    paintScreenFinal();}


function paintScreenScore(){
    if(!scores) return;
    if(!animationActive()) return false;
    animationTxt = true;

    gameStatus['runAnimation'] = true;
    gameStatus['newRecord'] = true;
    //041B0F 04160F
    juego.fillStyle ='#041F0F';
    juego.fillRect(0,0,canvas_t,canvas_t);
    const color = '#ffd700';
    const media = canvas_t / 2;
    
    paintRectText('🏆 Score Ranking 🏆',color,'','center',media,celda_t,font_t() - (font_t() / 4));
    const inih = (celda_t * 2) + (celda_t / 2);
    const newfont = font_t() - (font_t() / 2);
    const inih_plus = (celda_t / 2) + (celda_t / 4);
    const elite = ['🥇','🥈','🥉',];
    
    for(i = 0; i < 10; ++i){
        medalla = (i + 1) +'th';
        if(i < 3) medalla = elite[i];
        paintRectText(medalla,color,'','center',media, inih + (inih_plus * i),newfont);
        if(i == 9) break;
        p = 0;
        if(posJugador <= i) p = 1;
        else if(posJugador == i) continue;

        paintRectText(scores[i]['name'],color,'','right',media - (celda_t), inih + (inih_plus * (i + p)),newfont);
        paintRectText(stringTime(scores[i]['time']),color,'','left',media + celda_t, inih + (inih_plus * (i + p)),newfont);}

    if(validNamePlayerEvent()) if(~~(timer() /1000)% 2) gameStatus['frame']++;

    let marcador = ' \n';
    if(~~(timer() /1000)% 2) marcador = '_';
    if(playerName.length == 11 || gameStatus['frame']) marcador ='';

    paintRectText(playerName.join('')+marcador,color,'','right',media - (celda_t), inih + (inih_plus * posJugador),newfont);
    paintRectText(stringTime(playerTime),color,'','left',media + celda_t, inih + (inih_plus * posJugador),newfont);

    if(gameStatus['frame'] > 3) {
        replaceScore();
        localStorage.setItem('score',stringScore());
        animation('score ranking');
        playerName = undefined;
        gameStatus['newRecord'] = false;
        animationTxt = false;
        return true;}
    return false;}


function validNamePlayerEvent(key = '_'){
    if(!gameStatus['newRecord']) return false;
    if(gameStatus['frame']) return true;
    if(!playerName) playerName = Array();

    if(key == '_'){
        if(playerName.length > 1 && playerName[playerName.length - 1] == 'Enter'){
            playerName.pop();
            gameStatus['frame'] = 1;
            return true;}
        if(playerName.length > 11 || playerName[0] == 'Enter') playerName.pop();
        return false;}
    
    if(key.keyCode == 8) playerName.pop();

    if ((65 <= key.keyCode && key.keyCode <= 90) || (key.keyCode >= 96 && key.keyCode <= 105) || key.keyCode == 13)
        playerName.push(key.key);

    return false;}


function paintScreenFinal(){
    if(!gameStatus['showFinalScreen']) return;
    if(resize) paintScreen(); // solo pinta solo lo mod por animacion u otras funciones
    if(gameStatus['runAnimation']) return; // una animacion evitar el repintado
    
    
    if(!animationActive() && gameFinish() && gameStatus['exec']) {
        animation(paintScreenFinal); return;}

    const media = canvas_t / 2;
    const media_alta = media - font_t() + 1;
    const media_baja = media + font_t() - 1;

    let color, backgroundColor, y = media_alta;
    let text = Victoria() ? 'reintentar' :'continuar';

    if(Victoria()){ color = '#ffd700';
                    backgroundColor = '#01433A';}

    else {          color = '#FF2F22';
                    backgroundColor = '#211A27';}
    
    if(gameStatus['optionResetStart'] == 'no'){
        if(gameStatus['exec'])animation('terminar juego');
        if(!resize) paintScreen();
        text = 'Game Over';
        y = media + (font_t() / 2);
        gameStatus['exec'] = false;
        gameStatus['optionContinue'] = undefined;}

    else if(gameStatus['optionResetStart'] == 'si') {
        resetStartEvent();
        return;}

    else{
        if(animationActive()){
            const contador = 10 - ((timer() / 1000) | 0);
            text = text + ' ' + contador;
            if(contador < 0){
                animation('contador');
                gameStatus['optionResetStart'] = 'no';
                gameStatus['exec'] = false;
                update();
                return;}}

        paintRectText('', '' , backgroundColor,'center',media, media);
        paintRectText('', '' , backgroundColor,'center',media, media_baja);
        let siCa = color, siCb = backgroundColor;
        let noCa = color, noCb = backgroundColor;

        if(gameStatus['optionContinue'] == 'no')
             { noCa = backgroundColor;  noCb = color;}
        else { siCa = backgroundColor;  siCb = color;}

        paintRectText('no', noCa, noCb,'center',media + font_t(), media + (font_t() / 2));
        paintRectText('si', siCa, siCb,'center',media - font_t(), media + (font_t() / 2));}

    paintRectText('', '' , backgroundColor,'center',media, y);
    paintRectText(text, color , '','center',media, y);}



function paintScreen(){
    juego.clearRect(0,0, canvas_t, canvas_t);

        mapa.forEach((char, idx) =>{
            if(char == 'X' && !gameStatus['stack']) 
                juego.fillText(gameStatus['emblema'],posX(idx),posY(idx));
            else if(Victoria() && char == 'I') juego.fillText('⭐️',posX(idx),posY(idx));
            else juego.fillText(emojis[char],posX(idx),posY(idx));});

        if(gameStatus['stack']) 
            gameStatus['stack'].forEach(pos =>{juego.fillText(gameStatus['emblema'],posX(pos),posY(pos))});}


function paintRectText(txt, color = '', backgroundColor = '', aling = 'center', x = 0,y = 0,font = font_t()){
    if(aling) juego.textAlign = aling;
    juego.font = font +'px arial';
    if(backgroundColor){
        const rect = rectBgText(txt, x, y, aling,font);
        juego.fillStyle = backgroundColor;
        juego.fillRect(rect['x'], rect['y'], rect['width'], rect['height']);}
    if(color) juego.fillStyle = color;
    if(txt) juego.fillText(txt, x, y);
    juego.font = font_t() +'px arial';
    juego.textAlign = 'end';}


function rectBgText(txt, x = 0, y = 0, align='',font = 0){
    const height = font;
    const width = txt == ''|| txt == ' ' ? canvas_t : (font*.75)* txt.length;
    let px = x; let py = y - (height - (height / 6));
    if(align == 'center'){px = x - (width / 2);}
    else if(align != 'left')px = x - width;
    
    return {'width': width, 'height':height, 'x': px, 'y' : py};}

//signals:
window.addEventListener('keydown',keyMov);
btnArriba.addEventListener('click', movArriba);
btnAbajo.addEventListener('click', movAbajo);
btnDer.addEventListener('click', movDer);
btnIzq.addEventListener('click', movIzq);

//slots:
function keyMov(event){
    if(gameStatus['newRecord']) {
        validNamePlayerEvent(event);
        return;}

    switch(event.keyCode){
        //enter     S        N        Y
        case 13: case 83: case 78: case 89:
        selectOptionEvent(event.keyCode); 
                              break;//selecionar opciones
        case 37: movIzq();    break;//izquierda
        case 38: movArriba(); break;//arriba
        case 39: movDer();    break; //derecha
        case 40: movAbajo();  break;//abajo
        default:              break;}}

function selectOptionEvent(key){
    if(key == 83 || key == 89) gameStatus['optionResetStart']= 'si';
    else if(key == 78) gameStatus['optionResetStart'] = 'no';
    else gameStatus['optionResetStart'] = gameStatus['optionContinue'];
    update();}

function movArriba(){
    prePosJugador = posJugador;
    posJugador -= 10;
    if(posJugador < 0) posJugador = prePosJugador;
    if(!gameStatus['showFinalScreen']) update();}


function movAbajo(){
    prePosJugador = posJugador;
    posJugador += 10;
    if(posJugador >= 100) posJugador = prePosJugador;
    if(!gameStatus['showFinalScreen']) update();}


function movDer(){
    if(gameStatus['showFinalScreen'])  gameStatus['optionContinue'] = 'no';
    else{
        prePosJugador = posJugador;
        const pered = (~~(posJugador / 10)) *10 + 10;
        ++posJugador;
        if(posJugador >= pered) posJugador = prePosJugador;}
    update();}


function movIzq(){
    if(gameStatus['showFinalScreen'])  gameStatus['optionContinue'] = 'si';
    else{
        prePosJugador = posJugador;
        const pered  = ~~(posJugador /10) * 10; 
        --posJugador;
        if(posJugador < pered) posJugador = prePosJugador;}
    update();}