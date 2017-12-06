function BrickBase (brickData){
    this.x = brickData.x;
    this.y = brickData.y;
    this.width = brickData.width;
    this.height = brickData.height;
    this.color = brickData.color;
    this.score = brickData.score;
    this.status = 1;
}


function DoubleHitBrick (brickData){
    BrickBase.call(this, brickData);
    this.status = 2;
    this.colorIndex = 0;    
}

DoubleHitBrick.prototype = Object.create(BrickBase.prototype);
DoubleHitBrick.prototype.constractor = DoubleHitBrick;
