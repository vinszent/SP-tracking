class Component {

	constructor(x, y) {
		this.x = x
		this.y = y

		this.vx
		this.vy

		this.birth = new Date()

		this.conv

		this.id = Math.floor(Math.random()*10000)
		this.color = "green"

		this.type = "component"
	}

	moveTo(x,y) {
		this.x = x
		this.y = y
	}

	move(dx,dy) {
		this.x += dx
		this.y += dy
	}

	moveAlong() {
		switch (this.section.type) {
		case "conveyor": 
			if(!this.checkOnConv()) {
				this.switchSection(this.section.nextSec)
			} else {
			this.move((this.section.xe-this.section.xs)/this.section.l*this.section.speed,
								(this.section.ye-this.section.ys)/this.section.l*this.section.speed)
			}
			break
		case "stop":
			if (this.section.stopping) {
				this.move(0,0)
			} else {
				this.switchSection(this.section.nextSec)
			}
			break
		case "robotarm":
			this.moveTo(this.section.tx, this.section.ty)
			break
		default: 
			console.log("Cannot move along this section!")
			break
		}
	}

	switchSection(newSection) {
		this.section = newSection
		//It would perhaps be nicer to just have 
		//a getter for stop.xs/.ys for those types that have .x and .y 
		//and skip the switch
		switch (newSection.type) {
			case "conveyor":
				this.moveTo(newSection.xs, newSection.ys)
				break
			case "stop":
				this.moveTo(newSection.x, newSection.y)
				break
			default:
				console.log("Component can not switch to section!")
				break
		}
	}

	checkOnConv() {
		var minX = Math.min(this.section.xs,this.section.xe)
		var maxX = Math.max(this.section.xs,this.section.xe)
		var minY = Math.min(this.section.ys,this.section.ye)
		var maxY = Math.max(this.section.ys,this.section.ye)
		 
		if(this.x>=minX && this.x<=maxX) {
			if(this.y>=minY && this.y<=maxY) {
				return true
			}
		}
		return false
	}

	get age() {
		//Might be redundant since you can easily get birth
		//now - birth
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.beginPath()
		ctx.fillStyle = this.color
		ctx.arc(this.x,this.y,5,0,2*Math.PI)
		ctx.fill()
	}
}

class Conveyor {
	constructor(xs, ys, xe, ye) {
		this.xs = xs
		this.ys = ys
		this.xe = xe
		this.ye = ye
		this.w = 10
		this.center = [xs+(xs-xe)/2, xs+(ys-ye)/2]

		this.speed = 2

		this.comp
		//You should be able to link up different types of 
		//conveyor sections, elevators and stops
		this.nextSec
		this.prevSec

		this.type = "conveyor"
	}

	get dx() {
		return this.xe-this.xs
	}

	get dy() {
		return this.ye-this.ys
	}

	get l() {
		return Math.sqrt(Math.pow((this.xs-this.xe),2)+Math.pow((this.ys-this.ye),2))
	}

	linkTo(section) {
		this.nextSec = section
		section.prevSec = this
		switch (section.type) {
			case "conveyor":
				this.xe = section.xs
				this.ye = section.ys
				break
			case "stop":
				this.xe = section.x
				this.ye = section.y
				break
			default:
				console.log("Conveyor can not link to section!")
				break
		}
		
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		//ctx.fillStyle = "lightblue"
		//ctx.fillRect(0,0,c.width,c.height)
		//ctx.fillStyle = "green"
		//ctx.rotate(45*Math.PI/180)

		/*
		ctx.beginPath()
		ctx.strokeStyle = "black"
		ctx.moveTo(this.xs,this.ys)
		ctx.lineTo(this.xe,this.ye)
		ctx.stroke()
		*/

		ctx.lineWidth = "1"

		ctx.beginPath()
		ctx.strokeStyle = "red"
		ctx.moveTo(this.xs+(this.ys-this.ye)*this.w/(2*this.l),this.ys-(this.xs-this.xe)*this.w/(2*this.l))
		ctx.lineTo(this.xe+(this.ys-this.ye)*this.w/(2*this.l),this.ye-(this.xs-this.xe)*this.w/(2*this.l))
		ctx.stroke()

		ctx.beginPath()
		ctx.strokeStyle = "blue"
		ctx.moveTo(this.xs-(this.ys-this.ye)*this.w/(2*this.l),this.ys+(this.xs-this.xe)*this.w/(2*this.l))
		ctx.lineTo(this.xe-(this.ys-this.ye)*this.w/(2*this.l),this.ye+(this.xs-this.xe)*this.w/(2*this.l))
		ctx.stroke()



		/*
		ctx.beginPath()
		var center = [50,50]
		var startPos = [50,0]
		for (var i = 0; i < 36; i++) {
			console.log(i)
			var newPos = vecRot(startPos,i*10)
			ctx.moveTo(center[0], center[1])
			ctx.lineTo(center[0]+newPos[0],center[1]+newPos[1])
		}
		
		ctx.strokeStyle = "black"
		ctx.stroke()
		*/
	}
}

class RobotArm {
	constructor(x,y) {
		//Base of rotation
		this.x = x
		this.y = y

		this.extension = 20

		//Tool x and y positions
		this.tx = x+this.extension
		this.ty = y+0

		this.comp

		this.type = "robotarm"
	}

	move(dx,dy) {
		this.tx += dx
		this.ty += dy
	}

	rotate(deg) {
		var rotated = vecRot([this.tx-this.x,this.ty-this.y],deg)
		this.tx = rotated[0]+this.x
		this.ty = rotated[1]+this.y
	}

	grab(comp) {
		this.comp = comp
		comp.section = this
	}

	releaseTo(section) {
		this.comp.section = section
		this.comp = null
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.beginPath()
		ctx.fillStyle = "black"
		ctx.arc(this.x, this.y, 3, 0, 2*Math.PI)
		ctx.fill()

		ctx.beginPath()
		ctx.strokeStyle = "orange"
		ctx.lineWidth = "3"
		ctx.moveTo(this.x,this.y)
		ctx.lineTo(this.tx,this.ty)
		ctx.stroke()
	}
}

class Stop {
	constructor(x,y) {
		this.x = x
		this.y = y

		this.stopping = false
		//Maybe have a timer that keeps track of the time
		//it has been stopped

		this.nextSec
		this.prevSec

		this.type = "stop"
	}

	linkTo(section) {
		this.nextSec = section
		section.prevSec = this
		switch (section.type) {
			case "conveyor":
				section.xs = this.x
				section.ys = this.y
				break
			case "stop":
				//this.x = section.x
				//this.y = section.y
				break
			default:
				console.log("Conveyor can not link to section!")
				break
		}
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.beginPath()
		ctx.strokeStyle = "grey"
		ctx.arc(this.x,this.y,7,0,2*Math.PI)
		ctx.stroke()
	}
}

var mousePos = [0,0]

var robs = []
robs.push(new RobotArm(180, 40))

var stops = []
stops.push(new Stop(180, 60))

var convs = []
convs.push(new Conveyor(40,50,80,90))
convs.push(new Conveyor(80,90,120,40))
convs.push(new Conveyor(120,40,40,50))
//Inserter conveyor
convs.push(new Conveyor(0,0,40,50))

//New loop
convs.push(new Conveyor(120,80,140,60))
convs.push(new Conveyor(190,60,200,100))
convs.push(new Conveyor(200,100,120,120))
convs.push(new Conveyor(120,120,120,80))


for (var i = 0; i < 3; i++) {
	convs[i].nextSec = convs[(i+1)%(3)]
	convs[i].speed = i+1
}

convs[3].nextSec = convs[0]

convs[4].linkTo(stops[0])
stops[0].linkTo(convs[5])
convs[5].linkTo(convs[6])
convs[6].linkTo(convs[7])
convs[7].linkTo(convs[4])

var comps = []

comps.push(new Component(0,0))
comps.push(new Component(0,0))
comps.push(new Component(0,0))
comps.push(new Component(0,0))
//Component on second loop
comps.push(new Component(0,0))

for (var i = 0; i < 4; i++) {
	comps[i].switchSection(convs[i])
}

comps[4].switchSection(convs[4])


var running = false
var animationID
var IOID


function animateRobot() {
	for (var i = 0; i < robs.length; i++) {
		robs[i].rotate(1)
		robs[i].draw()
	}
}

function animateStop() {
	for (var i = 0; i < stops.length; i++) {
		stops[i].draw()
	}
}

function animateComponent() {
	for (var i = 0; i < comps.length; i++) {
		comps[i].draw()
		comps[i].moveAlong()
	}
}

function animateConveyor() {
	for (var i = 0; i < convs.length; i++) {
		convs[i].draw()
	}
}

function drawMouseText() {
	var c = document.getElementById("mapcanvas")
	var ctx = c.getContext("2d")

	ctx.fillText("Mouse x: " + mousePos[0], 0, c.height-20)
	ctx.fillText("Mouse y: " + mousePos[1], 0, c.height-10)
}

function drawData() {

}

//All moving should be done outside of the animation loop
function animateCell() {
	var c = document.getElementById("mapcanvas")
	var ctx = c.getContext("2d")

	ctx.clearRect(0,0,c.width,c.height)

	animateStop()
	animateConveyor()
	animateComponent()
	drawMouseText()
	animateRobot()
}

function checkIO() {
	//
	checkMouseOn()
}

function run() {
	if (!running) {
		animateCell()
		animationID = window.setInterval(animateCell,100)
		IOID = window.setInterval(checkIO, 100)
		running = true
	}
} 

function startAnimation() {
	animateCell()
	animationID = window.setInterval(animateCell,100)
}

function stopAnimation() {
	running = false
	window.clearInterval(animationID)
}

function addComponent() {
	comps.push(new Component(0,0))
	comps[comps.length-1].switchSection(convs[3])
}

function clearComponents() {
	//
	comps = []
}

//var nbrHits = 0
function checkMouseOn() {
	for (var i = 0; i < comps.length; i++) {
		if (withinRadius(mousePos[0], mousePos[1], comps[i].x, comps[i].y, 5)) {
			//console.log("Hit: " + nbrHits)
			//nbrHits++
			document.getElementById("idfield").innerHTML = "ID: " + comps[i].id
			document.getElementById("birthfield").innerHTML = "Entered cell: " + comps[i].birth
			break
		}
	}
}

document.getElementById("mapcanvas").addEventListener("mousemove", getMousePos)

function getMousePos(evt) {
	//console.log(evt)
	var c = document.getElementById("mapcanvas")

	var rect = c.getBoundingClientRect()

   mousePos = [evt.clientX - rect.left,
    			  evt.clientY - rect.top] 
}


///////////////MATH SECTION////////////////////////

//Return angle to point from origin, [0,0].
function getAng(x,y) {
	//First quadrant
	if (x>=0&&y>=0)
		return Math.atan(x/y)
	//Second quadrant
	else if (x>=0&&y<0)
		return Math.atan(x/y)
	//Third quadrant
	else if (x<0&&y<0)
		return Math.atan(x/y)
	//Fourth quadrant
	else if (x<0&&y>=0)
		return Math.atan(x/y)
	else
		return -1
} 

function withinRadius(x, y, cx, cy, r) {
	if (Math.abs(cx-x)+Math.abs(cy-y)<=r)
		return true
	return false
}


//Linear transforms
function vecAdd(a, b) {
	//
	return [a[0]+b[0], a[1]+b[1]]
}

function vecRot(a, ang) {
	return [Math.cos(ang*Math.PI/180)*a[0]-Math.sin(ang*Math.PI/180)*a[1], 
					Math.sin(ang*Math.PI/180)*a[0]+Math.cos(ang*Math.PI/180)*a[1]]
}

function getParallell(s,e) {
	//
	//
}