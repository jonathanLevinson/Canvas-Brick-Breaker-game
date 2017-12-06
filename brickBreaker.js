var game = (function (){
    var canvas;
    var ctx;
    var levelsDatabase = [];
    var isOnPaddle = true;
    var currentGame;
    var musicButton = document.getElementById('musicButton');
    musicButton.addEventListener('change', toggleMusic);
    var fullScreen = document.getElementById('full');
    fullScreen.addEventListener('click', activateFullScreen);
    var songsId = ['song1', 'song2', 'song3'];
    var songsIdIndex = 0;
    var brickSound = document.getElementById('brickHit');
    var wallSound = document.getElementById('wallHit');
    var paddleSound = document.getElementById('paddleHit');
    var gameOverSound = document.getElementById('gameOver');
    var nextLevelSound = document.getElementById('finishedLevel');
    var loseLifeSound = document.getElementById('loseLife');
    var effectsButton = document.getElementById('effectsButton');        

    function privateInit (canvasId, levels){
        toggleMusic();
        canvas = document.getElementById(canvasId);
        ctx = canvas.getContext('2d');
        levelsDatabase = levels;        
        currentGame = new Game();
        currentGame.startGame();
    }

    function toggleMusic () {
        var music = document.getElementById(songsId[songsIdIndex]);
        music.addEventListener('ended', changeSong);
        if (musicButton.checked){
            music.play();
        }
        else{
            music.pause();
        }
    }

    function changeSong () {
        songsIdIndex++;
        if(songsIdIndex == songsId.length){
            songsIdIndex = 0;
        }
        toggleMusic();
    }

    function playEffect (soundName) {
        if (effectsButton.checked) {
            switch (soundName) {
                case 'brickHit':
                    brickSound.play();
                    break;
                case 'wallHit':
                    wallSound.play();
                    break;
                case 'paddleHit':
                    paddleSound.play();
                    break;
                case 'gameOver':
                    gameOverSound.play();
                    break;
                case 'finishedLevel':
                    nextLevelSound.play();
                    break;
                case 'loseLife':
                    loseLifeSound.play();
                    break;
            }
        }
    }

    function activateFullScreen (ev) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
        else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
        else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        }
        else if (canvas.webkitRequestFullScreen) {
            canvas.webkitRequestFullScreen();
        }
    }
    
    //**************************************************** Paddle VVV ***********************************/
    function Paddle(){
        this.width = 100;
        this.height = 20;
        this.x = (canvas.width / 2 - (this.width / 2)); 
        this.y = (canvas.height - (this.height + 10));      
        this.color = 'black';
    }
    Paddle.prototype.draw = function (){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    Paddle.prototype.move = function (ev){
        if(ev.offsetX >= 0 + (this.width / 2) && ev.offsetX  <= canvas.width - (this.width / 2)){
            this.x = ev.offsetX - (this.width / 2);
        }        
    }    

    /***************************************************** Ball VVV **************************************/
    function Ball(paddle){
        this.radius = 10;
        this.x = (paddle.x + (paddle.width / 2));
        this.y = paddle.y - this.radius;
        this.color = 'black';        
        this.dx = -4;
        this.dy = -4;
    }
    Ball.prototype.draw = function (){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x , this.y, this.radius, 0,(2 * Math.PI), true);
        ctx.fill();
    }
    Ball.prototype.move = function (){
        this.x += this.dx;
        this.y += this.dy;        
    }
    Ball.prototype.moveWithPaddle = function (paddle){
        this.x = (paddle.x + (paddle.width / 2));
        this.y = paddle.y - this.radius;
    }
    Ball.prototype.changeDeltaX = function (){
        this.dx *= -1;
    }
    Ball.prototype.changeDeltaY = function (){
        this.dy *= -1;
    }
    
    /**************************************************** BrickBase prototypes VVV ********************************/
    BrickBase.prototype.draw = function (){
        if(this.status == 1){
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    BrickBase.prototype.collide = function (){
        if(this.status == 1){
            this.status = 0;
            return this.score;
        }
    }
    /**************************************************** DoubleHitBrick prototypes VVV ********************************/
    DoubleHitBrick.prototype.draw = function (){
        if(this.status > 0){
            ctx.fillStyle = this.color[this.colorIndex];
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.font = '30px serif';
            ctx.fillStyle = 'white'
            //textSize = ctx.measureText(this.status);
            ctx.fillText(this.status, this.x + (this.width / 2), this.y + (this.height / 2));
        }
    }
    DoubleHitBrick.prototype.collide = function (){
        if(this.status > 0){
            this.status--;
            this.colorIndex++;
            if(this.status == 0){
                return this.score;
            }
            else{
                return 0;
            }
        }
    }
    /*************************************************** Game VVV ******************************************/
    function Game(){
        this.levelNumber = 0;
        this.bricks = levelsDatabase[this.levelNumber];
        this.paddle = new Paddle();
        this.ball = new Ball(this.paddle);
        this.lives = 3;
        this.score = 0;
        this.currentStateFunction = this.moveBallWithPaddle;
        this.clickStatus = 'play';
        this.brokenBricksCounter = 0;
    }

    Game.prototype.startGame = function () {         
        canvas.addEventListener('mousemove', this.paddle.move.bind(this.paddle)); //add arrow keys 
        var currLevel = this;
        canvas.addEventListener('click', function(){
            switch(currLevel.clickStatus){
                case 'play':
                    currLevel.currentStateFunction = currLevel.playGame;
                    break;
                case 'game over':
                    //currLevel.currentStateFunction = currLevel.reset;
                    break;
                case 'next level':
                    currLevel.currentStateFunction = currLevel.loadNextLevel;
            }
        }); 
        var animateGameFunc = this.animateGame.bind(this);
        requestAnimationFrame(animateGameFunc);
    }    
    
    Game.prototype.animateGame = function (){
        var rect = canvas.getBoundingClientRect();
        ctx.clearRect(0,0, rect.width, rect.height);
        this.currentStateFunction();        
        this.drawBoardContents();
        var animateGameFunc = this.animateGame.bind(this);
        requestAnimationFrame(animateGameFunc);
    }
/******************************************************* State functions VVV ****************************/
    Game.prototype.moveBallWithPaddle = function (){
        this.ball.moveWithPaddle(this.paddle);
    }

    Game.prototype.playGame = function (){
        this.ball.move();
        this.checkBallImpact();
        this.checkBrickImpact();
    }

    Game.prototype.displayGameOver = function (){
        this.clickStatus = 'game over';
        this.drawMessage('Game Over :(');        
    }

    Game.prototype.displayGameWon = function (){
        this.clickStatus = 'game over';
        this.drawMessage('Game Won! :)')
    }
    
    Game.prototype.displayFinishedLevel = function (){
        this.clickStatus = 'next level';
        this.drawFinishedLevel();
        this.brokenBricksCounter = 0;
    }

    Game.prototype.loadNextLevel = function (){
        this.bricks = levelsDatabase[this.levelNumber];
        this.currentStateFunction = this.moveBallWithPaddle;
        this.clickStatus = 'play';
    }

    // Game.prototype.reset = function () {        
    //     this.lives = 3;
    //     this.score = 0;
    //     this.paddle = new Paddle();
    //     this.ball = new Ball(this.paddle);
    //     this.levelNumber = 0;
    //     this.currentStateFunction = this.moveBallWithPaddle;
    //     this.gameOver = false;
    //     this.brokenBricksCounter = 0;
    //     this.clickStatus = 'play';
    //     this.bricks = levelsDatabase[this.levelNumber];
    //     canvas.addEventListener('mousemove', this.paddle.move.bind(this.paddle));
    // }
    
    /******************************************************** checking VVV ***********************************/
    Game.prototype.checkBallImpact = function (){
        var thisBall = this.ball;
        var thisPaddle = this.paddle;        
        
        if ((thisBall.x - thisBall.radius) < 0 || (thisBall.x + thisBall.radius) > canvas.width){ //left and right edges of the frame
            thisBall.changeDeltaX();
            playEffect('wallHit');
        }
        else if ((thisBall.y - thisBall.radius) < 0){ // top of the frame
            thisBall.changeDeltaY();
            playEffect('wallHit');
        }        
        else if ((thisBall.y + thisBall.radius + thisBall.dy) >= thisPaddle.y){ //pabble
            if (thisBall.x  > thisPaddle.x){
                if (thisBall.x < (thisPaddle.x + thisPaddle.width)){
                    thisBall.changeDeltaY();
                    playEffect('paddleHit');
                }
            }
        }
        if ((thisBall.y - thisBall.radius) >= canvas.height){
            this.currentStateFunction = this.moveBallWithPaddle;
            this.lives--;
            playEffect('loseLife');
            if (this.lives == 0){
                this.currentStateFunction = this.displayGameOver;
                playEffect('gameOver');
            }
        }
    }

    Game.prototype.checkBrickImpact = function (){
        for(var i = 0; i < this.bricks.length; i++){
            var currBrick = this.bricks[i];
            if (currBrick.status > 0){
                var ballNextX = this.ball.x + this.ball.dx;
                var ballNextY = this.ball.y + this.ball.dy;
                var ballRad = this.ball.radius;

                if (ballNextY > currBrick.y && ballNextY < (currBrick.y + currBrick.height) 
                    && Math.abs(ballNextX - (currBrick.x + currBrick.width / 2)) < (currBrick.width / 2) + ballRad){
                        this.ball.changeDeltaX();
                        this.score += currBrick.collide();
                        if (currBrick.status == 0){
                            this.brokenBricksCounter++;
                        }
                        playEffect('brickHit');
                }
                else if (ballNextX > currBrick.x && ballNextX < (currBrick.x + currBrick.width) 
                    && Math.abs(ballNextY - (currBrick.y + currBrick.height / 2)) < (currBrick.height / 2) + ballRad){
                        this.ball.changeDeltaY();
                        this.score += currBrick.collide();
                        if (currBrick.status == 0){
                            this.brokenBricksCounter++;
                        }
                        playEffect('brickHit');
                }
            }
        }

        if (this.bricks.length == this.brokenBricksCounter){
            this.levelNumber++;
            playEffect('finishedLevel');
            if (this.levelNumber == levelsDatabase.length){
                this.currentStateFunction=this.displayGameWon;
            }
            else{
                this.currentStateFunction = this.displayFinishedLevel;
            }
        }
    }
    /************************************************ drawing VVV **************************************/
    Game.prototype.drawBoardContents = function (){
        this.paddle.draw();
        this.ball.draw();
        this.drawBricks();
        this.drawScore(); 
        this.drawLives();       
    }
    Game.prototype.drawBricks = function (){
        for (var i = 0; i < this.bricks.length; i++){
            this.bricks[i].draw();
        }
    }
    Game.prototype.drawScore = function (){
        ctx.font = '16px serif';
        ctx.fillStyle = '#FF358B'
        ctx.fillText('Score: ' + this.score, 10, 20);
    }
    Game.prototype.drawLives = function (){
        ctx.font = '16px serif';
        ctx.fillStyle = '#FF358B'
        ctx.fillText('Lives: ' + this.lives, (canvas.width - 80), 20);
    }
    Game.prototype.drawMessage = function (message){
        ctx.font = '40px serif';
        ctx.fillStyle = '#FF358B'
        textSize = ctx.measureText(message);
        ctx.fillText(message, (canvas.width / 2) - (textSize.width / 2), (canvas.height / 2));
    }
    Game.prototype.drawFinishedLevel = function (){
        ctx.font = '30px serif';
        ctx.fillStyle = '#FF358B'
        textSize = ctx.measureText('You have completed this level!');
        ctx.fillText('You have completed this level!', (canvas.width / 2) - (textSize.width / 2), (canvas.height / 2));
        ctx.fillText('Go outside for a while', (canvas.width / 2) - (textSize.width / 2), (canvas.height / 2) + 35);
    }
    

    return {
        init:privateInit
    }
    
})();

game.init('canvas', levels);