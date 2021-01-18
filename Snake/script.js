

var interface=document.getElementById("interface");
var can=document.getElementById("main");
can.offScree
ctx=can.getContext('2d');

function randomGrid(size){
    let x= Math.floor(Math.random()*can.width);
    return x-x%size;
}




function Rect(x,y,w,h,oldx,oldy)
{
    this.x=x;
    this.y=y;
    this.pos=new Vector(this.x, this.y);
    this.w=w;
    this.h=h;
    this.oldx=oldx;
    this.oldy=oldy;
}

Rect.prototype.draw= function(r,g,b){
	ctx.strokeStyle = 'rgb(130, 32, 42)';
	ctx.strokeRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle=`rgb(${r},${g},${b},0.7)`;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // console.log(this.x-can.width);
    
}


//Snake.prototype= Object.create(Rect.prototype);
function Snake(x,y,w,h,sx,sy,limits,oldx,oldy)
{
    //Rect.call(this,x,y,w,h,oldx,oldy);
    
    this.x=x;
    this.y=y;
    this.pos=new Vector(this.x, this.y);
    this.w=w;
    this.h=h;
    this.head= new Rect(this.x,this.y,this.w,this.h,oldx,oldy);
    this.tail=[new Rect(this.x,this.y,this.w,this.h)];
    this.sx=sx;
    this.sy=sy;
    this.limits=limits;
}

Snake.prototype.draw= function(r,g,b)
{
	this.head.draw(r,g,b);
	this.tail.forEach(element=>element.draw(r,g,b));
	ctx.strokeStyle = 'rgba(130, 222, 42,32)';
	ctx.beginPath();
    // ctx.moveTo(can.width, this.y+this.w/2);
    // ctx.lineTo(this.head.x+this.w, this.head.y+this.w/2);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+300, this.y);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y+300);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x-300, this.y);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y-300);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+300, this.y+300);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x-300, this.y+300);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x-300, this.y-300);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+300, this.y-300);
    ctx.stroke();

}


Snake.prototype.dist=function(a){
    return this.pos.dist(a.pos);
}

Snake.prototype.stop= function(){
    this.sx=0;
    this.sy=0;
    this.tail=[this.tail[0]];
    // interface.style.display="block";
}

Snake.prototype.update= function(){
    if(this.limits){
        if (this.x>=can.width){ 
        	this.stop();
            this.x=can.width-this.w;
            
        }
        if (this.x<0) {this.stop();this.x=0;}
        if (this.y>=can.height) {
        	this.stop();
            this.y=can.height-this.h;
            
        }
        if (this.y<0){this.stop();this.y=0;}

    }
    else{
        // console.log(this.oldx);
        if (this.x>=can.width)this.x=0;
        if (this.x<0)this.x=can.width-this.w;
        if (this.y>=can.height) this.y=0;
        if (this.y<0) this.y=can.height-this.h;
    }
    this.head.oldx=this.x;
    this.head.oldy=this.y;
    for(let i=0; i<this.tail.length; i++)
    {
    	this.tail[i].oldx=this.tail[i].x;
    	this.tail[i].oldy=this.tail[i].y;
    }
    this.x+=this.sx;
    this.y+=this.sy;
    this.head.x=this.x;
    this.head.y=this.y;
    this.tail[0].x=this.head.oldx;
    this.tail[0].y=this.head.oldy;
    for(let i=1; i<this.tail.length; i++)
    {
    	this.tail[i].x=this.tail[i-1].oldx;
    	this.tail[i].y=this.tail[i-1].oldy;
    }
    this.pos=new Vector(this.x,this.y)
}


Snake.prototype.getEvent=function(){
	let a=false;
    document.addEventListener('keydown', (event) => {
		a=true
		
        if (event.key === 'ArrowDown' && !this.sy) {
            this.sy=this.h;
            this.sx=0;
            // console.log(event.key);
            return;

        }
        else if (event.key === 'ArrowUp' && !this.sy) {
            this.sy=-this.h;
            this.sx=0;
            // console.log(event.key);
            return;
        }
        else if (event.key === 'ArrowLeft' && !this.sx) {
            this.sx=-this.w;
            this.sy=0;
            // console.log(event.key);
            return
        }
        else if (event.key === 'ArrowRight' && !this.sx) {
            this.sx=this.w;
            this.sy=0;
            // console.log(event.key);
            return;
        }

      },false);
      
}

Snake.prototype.automove=function(){
	let x=Math.floor(Math.random()*100)%4;
	console.log(x);
	if (x==0 && !this.sy) {
            this.sy=this.h;
            this.sx=0;
        }
        if (x==1 && !this.sy) {
            this.sy=-this.h;
            this.sx=0;
        }
        if (x==2 && !this.sx) {
            this.sx=-this.w;
            this.sy=0;
        }
        if (x==3 && !this.sx) {
            this.sx=this.w;
            this.sy=0;
        }


}


Snake.prototype.eats= function(f, gridsize)
{
	//let last= this.tail.length? this.tail[length-1]:this.head;
	f.x=randomGrid(gridsize);
	f.y=randomGrid(gridsize);
	let last=this.tail[this.tail.length-1];
	this.tail.push(new Rect(last.oldx, last.oldy, gridsize, gridsize));	
}

Snake.prototype.collide=function(obst)
{

	if((Math.abs(this.x-obst.x)<10 || Math.abs(this.x-obst.x)>590) && (Math.abs(this.y-obst.y)<10 ||Math.abs(this.y-obst.y)>590) ){
        
        return true ;
    }
    return false;
}


//////////////////////main loop/////////////////

function game(gridsize=20, borders=false){
var food=new Rect(randomGrid(gridsize),randomGrid(gridsize),gridsize,gridsize);
var snake=new Snake(gridsize*2,gridsize*2,gridsize,gridsize,0,0,borders);

function loop()
{
	ctx.clearRect(0, 0, can.width, can.height);
    var dat=new Matrix(3,8);
	snake.draw(0,100,12);
	food.draw(0,0,0);
	snake.update();
	snake.getEvent();
	if(snake.collide(food)){snake.eats(food, gridsize);dat.array[0]=([snake.dist(food),Math.sqrt(Math.pow((snake.x-can.width),2)+Math.pow((snake.y-can.height),2))]);
    console.log(dat.array);}
	snake.tail.forEach(element=> {if (snake.collide(element)) snake.stop();});
	// if(Math.abs(snake.x-food.x)==Math.abs(snake.y-food.y)){console.log(Math.sqrt(Math.pow((snake.x-food.x),2)+Math.pow((snake.y-food.y),2)))}
	// dat.array[0]=1;
	// dat.array.push([Math.sqrt(Math.pow((snake.x-food.x),2)+Math.pow((snake.y-food.y),2)),Math.sqrt(Math.pow((snake.x-can.width),2)+Math.pow((snake.y-can.height),2))])
    console.log(Math.sqrt(Math.pow((snake.x-food.x),2)+Math.pow((snake.y-food.y),2)));
    window.setTimeout(loop,80);
   
}
 interface.style.display="none";
loop();
}

// game(40);
// xx();