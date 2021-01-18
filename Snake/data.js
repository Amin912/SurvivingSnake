
function Matrix(lines, cols){
	this.array= [];
	this.array.length=lines;
	this.array.forEach(element=> {element=[]; element.array.length=cols;})
}

function Vector(x,y){
	this.x=x;
	this.y=y;
}

Vector.prototype.dist=function(a){
	return Math.sqrt(Math.pow((this.x-a.x),2)+Math.pow((this.y-a.y),2));
}

