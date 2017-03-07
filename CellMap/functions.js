
//Should really make a Section class that all the others can extend
//instead of re-writing the same code over and over
//Maybe have a get pos() which returns a vector/point [x,y]
//as a complement to the x and y parameters

//Component is a component going through the cell
class Component {

	constructor(x, y) {
		this.x = x
		this.y = y

		this.vx
		this.vy

		this.birth = new Date()

		this.conv

		this.id = "C" + Math.floor(Math.random()*10000)
		this.color = "green"

		this.section = null

		this.type = "component"

		this.highlighted = false
	}

	get pos() {
		return [this.x, this.y]
	}

	set pos(pos) {
		this.x = pos[0]
		this.y = pos[1]
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
			if(!this.checkOnConv() && this.section.nextSec != null) {
				this.switchSection(this.section.nextSec)
			} else if (!this.checkOnConv() && this.section.nextSec == null) {
				this.moveTo(this.section.xe, this.section.ye)
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
		
		//It would perhaps be nicer to just have 
		//a getter for stop.xs/.ys for those types that have .x and .y 
		//and skip the switch
		switch (newSection.type) {
			case "conveyor":
				this.moveTo(newSection.xs, newSection.ys)
				newSection.addComp(this)
				break
			case "stop":
				this.moveTo(newSection.x, newSection.y)
				newSection.addComp(this)
				break
			default:
				console.log("Component can not switch to section!")
				break
		}
		if (this.section != null) {
			this.section.rmComp()
			this.section = newSection
		} else {
			this.section = newSection
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

		if (this.highlighted) {
			ctx.beginPath()
			ctx.strokeStyle = "cyan"
			ctx.arc(this.x,this.y,10,0,2*Math.PI)
			ctx.stroke()
		}
	}
}

//A conveyor able to transport components
class Conveyor {
	constructor(xs, ys, xe, ye) {
		this.xs = xs
		this.ys = ys
		this.xe = xe
		this.ye = ye
		this.w = 10
		

		this.speed = 2

		this.maxCap = 8
		this.comps = []
		//You should be able to link up different types of 
		//conveyor sections, elevators and stops
		this.nextSec
		this.prevSec

		this.id = "B" + Math.floor(Math.random()*10000)

		this.type = "conveyor"

		this.highlighted = false
	}

	get center() {
		return [this.xs+(this.dx)/2, this.ys+(this.dy)/2]
	}

	get dx() {
		return this.xe-this.xs
	}

	get dy() {
		return this.ye-this.ys
	}

	get startPos() {
		return [this.xs, this.ys]
	}

	set startPos(pos) {
		this.xs = pos[0]
		this.ys = pos[1]
	}

	get endPos() {
		return [this.xe, this.ye]
	}

	set endPos(pos) {
		this.xe = pos[0]
		this.ye = pos[1]
	}

	//length
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

	addComp(comp) {
		this.comps.push(comp)
	}

	//Implemnting FIFO
	rmComp() {
		this.comps.splice(0,1)
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

		if (this.highlighted) {
			ctx.beginPath()
			ctx.strokeStyle = "cyan"
			ctx.arc(this.center[0],this.center[1],10,0,2*Math.PI)
			ctx.stroke()
		}


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

//A robot arm that can move components
class RobotArm {
	constructor(x,y) {
		//Base of rotation
		this.x = x
		this.y = y
		this.speed = 1

		//Start extension. In the future maybe use this as max extension.
		this.extension = 20

		//Tool x and y positions
		this.tx = x + this.extension
		this.ty = y + 0

		this.maxCap = 1
		this.comps = []

		//Would be nice with a list of targets that come in order (linked list?)
		//Maybe even make a new target class
		this.targetx = this.tx
		this.targety = this.ty

		this.id = "R" + Math.floor(Math.random()*10000)

		this.type = "robotarm"

		this.highlighted = false
	}

	get pos() {
		return [this.x, this.y]
	}

	set pos(pos) {
		this.x = pos[0]
		this.y = pos[1]
	}

	get toolPos() {
		return [this.tx, this.ty]
	}

	set toolPos(pos) {
		this.tx = pos[0]
		this.ty = pos[1]
	}

	set target(target) {
		this.targetx = target[0]
		this.targety = target[1]
	}

	get target() {
		return [this.targetx, this.targety]
	}

	move(dx,dy) {
		this.tx += dx
		this.ty += dy
	}

	moveTo(x,y) {
		this.tx = x
		this.ty = y
	}

	addComp(comp) {
		this.comps.push(comp)
	}

	//Implemnting FIFO
	rmComp() {
		this.comps.splice(0,1)
	}

	moveToTarget() {
		//This can move too far
		var dx = vecHeading(this.toolPos,this.target)[0]*this.speed
		var dy = vecHeading(this.toolPos,this.target)[1]*this.speed
		
		if (withinRadius(this.toolPos,this.target,this.speed))
			this.moveTo(this.targetx, this.targety)
		else
			this.move(dx, dy)
	}

	checkAtTarget() {
		if (withinRadius(this.toolPos,this.target, 2))
			return true
		else
			return false
	}

	rotate(deg) {
		var rotated = vecRot([this.tx-this.x,this.ty-this.y],deg)
		this.tx = rotated[0] + this.x
		this.ty = rotated[1] + this.y
	}

	grab(comp) {
		this.addComp(comp)
		comp.section = this
	}

	grabFrom(section) {
		//Have the robotarm grab parts from a specific section
		//Check contact with all components on the section 
		//instead of all coponents
		this.addComp(section.comps[0])
		section.comps[0].section = this
		section.rmComp()
	}

	releaseTo(section) {
		this.comps[0].section = section
		section.addComp(this.comp)
		this.rmComp()
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

		if (this.highlighted) {
			ctx.beginPath()
			ctx.strokeStyle = "cyan"
			ctx.arc(this.x,this.y,5,0,2*Math.PI)
			ctx.stroke()
		}
	}
}

//A stop that can halt components
class Stop {
	constructor(x,y) {
		this.x = x
		this.y = y

		this.stopping = false
		//Maybe have a timer that keeps track of the time
		//it has been stopped

		this.nextSec = null
		this.prevSec = null

		this.maxCap = 1
		this.comps = []

		this.id = "S" + Math.floor(Math.random()*10000)

		this.type = "stop"

		this.highlighted = false
	}

	get pos() {
		return [this.x, this.y]
	}

	set pos(pos) {
		this.x = pos[0]
		this.y = pos[1]
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

	addComp(comp) {
		this.comps.push(comp)
	}

	//Implemnting FIFO
	rmComp() {
		this.comps.splice(0,1)
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.beginPath()
		ctx.strokeStyle = "grey"
		ctx.arc(this.x,this.y,7,0,2*Math.PI)
		ctx.stroke()

		if (this.highlighted) {
			ctx.beginPath()
			ctx.strokeStyle = "cyan"
			ctx.arc(this.x,this.y,8,0,2*Math.PI)
			ctx.stroke()
		}
	}
}

//A crosshairs used for marking stuff
class Crosshairs {
	constructor() {
		this.x = 0
		this.y = 0 

		this.l = 3
	}

	get pos(){
		return [this.x, this.y]
	}

	set pos(pos) {
		this.x = pos[0]
		this.y = pos[1]
	}

	draw() {
		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.lineStyle = "red"
		ctx.lineWidth = 1

		ctx.beginPath()
		ctx.moveTo(this.x-this.l, this.y)
		ctx.lineTo(this.x+this.l, this.y)
		ctx.stroke()

		ctx.beginPath()
		ctx.moveTo(this.x, this.y-this.l)
		ctx.lineTo(this.x, this.y+this.l)
		ctx.stroke()
	}

	static statDraw(x, y) {
		var l = 3

		var c = document.getElementById("mapcanvas")
		var ctx = c.getContext("2d")

		ctx.lineStyle = "red"
		ctx.lineWidth = 1

		ctx.beginPath()
		ctx.moveTo(x-l, y)
		ctx.lineTo(x+l, y)
		ctx.stroke()

		ctx.beginPath()
		ctx.moveTo(x, y-l)
		ctx.lineTo(x, y+l)
		ctx.stroke()
	}
}

//Variables used for animating
var running = false
var menuUpdated = true
var animationID = null
var menuID = null
var IOID = null

//Mouse position on the canvas
var mousePosMap = [-1,-1]

//Objects on canvas
var objects = []
var robs = []
var stops = []
var convs = []
var comps = []


//Maybe creat a ghost class
var anchored = false //Indicates that starting position of a conveyor has been set
var manuallyAdding = false
var objectToAdd = null //The object that is being added
var objectToAddType = null //Type of object being added
var snapped = false //The object being added is snapped to another object
var snapPos = null //Position of the snapped object
var snapObject = null //Object That has been snapped to 
var typeBtn = null //Button that has been pressed in the HTML

var highlightedObject = null
var selectedObject = null

var linking = false

//Initiate all stuff
init()

//Initiate all stuff
function init() {

	objects.push(comps)
	objects.push(robs)
	objects.push(convs)
	objects.push(stops)

	robs.push(new RobotArm(180, 40))

	stops.push(new Stop(180, 60))
	stops.push(new Stop(150, 40))

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
	convs.push(new Conveyor(0,0,0,0))


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
	convs[8].linkTo(convs[4])
	stops[1].linkTo(convs[8])


	comps.push(new Component(0,0))
	comps.push(new Component(0,0))
	comps.push(new Component(0,0))
	comps.push(new Component(0,0))
	//Component on second loop
	comps.push(new Component(0,0))
	comps.push(new Component(0,0))

	for (var i = 0; i < 4; i++) {
		comps[i].switchSection(convs[i])
	}

	comps[4].switchSection(convs[4])
	comps[5].switchSection(convs[5])

	robs[0].target = [stops[0].x, stops[0].y]
}

//NOT USED
//Reset ghost parameters
function resetGhost() {
	var anchored = false
	var manuallyAdding = false
	var objectToAdd = null
	var objectToAddType = null
	var snapped = false
	var snapPos = null
	var snapObject = null
	var typeBtn = null
}

function animateRobot() {
	for (var i = 0; i < robs.length; i++) {
		robs[i].draw()
		robs[i].moveToTarget()
	}
	if (robs[0].comps.length == 0 && stops[0].comps.length != 0 && robs[0].checkAtTarget() &&
			withinRadius(robs[0].toolPos,stops[0].pos, 3)) {
		robs[0].grabFrom(stops[0])
		robs[0].target = [150, 40]
	} else if (robs[0].comps[0] != null && robs[0].checkAtTarget()) {
		robs[0].releaseTo(stops[1])
		robs[0].target = [180, 60]
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

//Draw mouse coordinates
function drawMouseText() {
	var c = document.getElementById("mapcanvas")
	var ctx = c.getContext("2d")

	ctx.fillText("Mouse x: " + mousePosMap[0], 0, c.height-20)
	ctx.fillText("Mouse y: " + mousePosMap[1], 0, c.height-10)
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
	if (objectToAdd != null) {
		objectToAdd.draw()
		if (snapped)
			Crosshairs.statDraw(snapPos[0],snapPos[1])
	}
}

//Checks mouse snad snapping
function checkIO() {
	checkMouseOn()
	if (objectToAdd != null) {
		var snap = snapTo(false)
		if (objectToAddType == "conveyor" && snap != null) {
			snapped = true
			objectToAdd.endPos = snap[0]
			snapPos = snap[0]
			snapObject = snap[1]
		} else if (objectToAddType == "conveyor" && snap == null) {
			snapped = false
			objectToAdd.endPos = mousePosMap
			snapPos = null
			snapObject = null
		} else if (objectToAddType == "stop" && snap != null) {
			snapped = true
			objectToAdd.pos = snap[0]
			snapPos = snap[0]
			snapObject = snap[1]
		} else if (objectToAddType == "stop" && snap == null) {
			snapped = false
			objectToAdd.pos = mousePosMap
			snapPos = null
			snapObject = null
		}
	}
}

//Runing both animation and IO
function run() {
	if (!running) {
		animateCell()
		animationID = window.setInterval(animateCell, 33)
		IOID = window.setInterval(checkIO, 100)
		running = true
	}
} 

//When the user wants to manually add components to the canvas
function setManualAddType(type, btn) {
	if (typeBtn != null) {
		typeBtn.style.backgroundColor = "lightblue"
	}

	if (!manuallyAdding) {
		objectToAddType = type
		switch (type) {
			case "conveyor":
				//objectToAdd = new Conveyor(0,0,0,0)
				break
			case "stop":
				objectToAdd = new Stop(0,0)
				break
		}
		manuallyAdding = true
		btn.style.backgroundColor = "lightgreen"
		typeBtn = btn
	} else {
		objectToAdd = null
		objectToAddType = null
		manuallyAdding = false
		btn.style.backgroundColor = "lightblue"
		typeBtn = null
	}
}

//Start animating
function startAnimation() {
	animateCell()
	animationID = window.setInterval(animateCell,100)
}

//Stop animating
function stopAnimation() {
	running = false
	window.clearInterval(animationID)
}

//Add comps to the canvas
function addComponent() {
	comps.push(new Component(0,0))
	comps[comps.length-1].switchSection(convs[3])
}

//Remove all objects
function clearAll() {
	convs = []
	stops = []
	robs  = []
	comps = []
}

//Link two existing objects by clicking them
function linkObjects(type, btn) {
	if (selectedObject != null && !linking) {
		btn.style.backgroundColor = "lightgreen"
		typeBtn = btn 
		linking = true
	} else {
		btn.style.backgroundColor = "lightblue"
	}
}

//Would be nice not break the whole funtion upon detecting one hit
//Using return seems to work but not sure if it is the correct way in js
function checkMouseOn() {
	for (var i = 0; i < comps.length; i++) {
		if (withinRadius(mousePosMap, comps[i].pos, 5)) {
			comps[i].highlighted = true
			highlightedObject = comps[i]
			document.getElementById("idfield").innerHTML = "ID: " + comps[i].id
			document.getElementById("birthfield").innerHTML = "Entered cell: " + comps[i].birth
			return null
		} else {
			comps[i].highlighted = false
		}
	}
	for (var i = 0; i < convs.length; i++) {
		if (withinRadius(mousePosMap, convs[i].center, 5)) {
			convs[i].highlighted = true
			highlightedObject = convs[i]
			document.getElementById("idfield").innerHTML = "ID: " + convs[i].id
			return null
		} else {
			convs[i].highlighted = false
		}
	}
	for (var i = 0; i < robs.length; i++) {
		if (withinRadius(mousePosMap, robs[i].pos, 5)) {
			robs[i].highlighted = true
			highlightedObject = robs[i]
			document.getElementById("idfield").innerHTML = "ID: " + robs[i].id
			return null
		} else {
			robs[i].highlighted = false
		}
	}
	for (var i = 0; i < stops.length; i++) {
		if (withinRadius(mousePosMap, stops[i].pos, 5)) {
			stops[i].highlighted = true
			highlightedObject = stops[i]
			document.getElementById("idfield").innerHTML = "ID: " + stops[i].id
			return null
		} else {
			stops[i].highlighted = false
		}
	}
	highlightedObject = null
}

document.getElementById("mapcanvas").addEventListener("mousemove", getMousePosMap)
document.getElementById("mapcanvas").addEventListener("mousedown", onMapClick)

//When the canvas is clicked do this
function onMapClick(evt) {
	//First click = start coveyor or place component, robot or stop
	//Second click = end conveyor
	if (!manuallyAdding && !linking)
		if (highlightedObject != null) {
			selectedObject = highlightedObject
			drawObjectInfo()
		}
	switch (objectToAddType) {
		case "conveyor":
			manAddConv()
			break
		case "stop":
			manAddStop()
			break
	}
	if (linking) {
		selectedObject.linkTo(highlightedObject)
		typeBtn.style.backgroundColor = "lightblue"
		typeBtn = null
		linking = false
	}
}

//Manually add a conveyor with mouse
function manAddConv() {
	if (!anchored) {

		if (snapped) {
			objectToAdd = new Conveyor(snapPos[0], snapPos[1], snapPos[0], snapPos[1])
			snapObject.linkTo(objectToAdd)
			snapped = false
		} else {
			objectToAdd = new Conveyor(mousePosMap[0], mousePosMap[1], mousePosMap[0], mousePosMap[1])
		}
		anchored = true

	} else {
		if (snapped) {
			objectToAdd.linkTo(snapObject)
			snapped = false
		} else {
			objectToAdd.endPos = mousePosMap
			anchored = true
		}
		convs.push(objectToAdd)
		anchored = false
		objectToAdd = null
		objectToAddType = null
		manuallyAdding = false
		typeBtn.style.backgroundColor = "lightblue"
		typeBtn = null
	}
}

//Manually add a stop with the mouse
function manAddStop() {
	if (snapped) {
		if (vecEqual(snapPos,snapObject.startPos))
			objectToAdd.linkTo(snapObject)
		else if (vecEqual(snapPos,snapObject.endPos))
			snapObject.linkTo(objectToAdd)
	} else {
		objectToAdd.pos = mousePosMap
	}
	stops.push(objectToAdd)
	objectToAdd = null
	objectToAddType = null
	manuallyAdding = false
	typeBtn.style.backgroundColor = "lightblue"
	typeBtn = null
}

//Snaps to edges of objecs. Takes argument wether or not to snap to
//componants as well (true = snap to componants)
function snapTo(checkComponents) {
	var snapRadius = 10
	for (var i = 0; i < objects.length; i++) {
		if (!checkComponents && objects[i][0].type == "component") {
				//Do nothing
		}	else { 
			//Go through all elements
			for (var j = objects[i].length-1; j >= 0; j--) {
				switch (objects[i][j].type) {
					case "conveyor":
						if (withinRadius(mousePosMap, objects[i][j].startPos, snapRadius)) {
							return [objects[i][j].startPos, objects[i][j]]
						}
						if (withinRadius(mousePosMap, objects[i][j].endPos, snapRadius)) {
							return [objects[i][j].endPos, objects[i][j]]
						}
						break
					//In all other cases we only have to worry about pos
					default:
						if (withinRadius(mousePosMap, objects[i][j].pos, snapRadius)) {
							return [objects[i][j].pos, objects[i][j]]
						}
						break
				}
			}
		}
	}
	return null
}

//Returns vector with mouse coordinates on the canvas
function getMousePosMap(evt) {
	//console.log(evt)
	var c = document.getElementById("mapcanvas")

	var rect = c.getBoundingClientRect()

   mousePosMap = [evt.clientX - rect.left,
    			  evt.clientY - rect.top] 
}

//Updates the HTML page with inputs containing current object values
function drawObjectInfo() {
	var div = document.getElementById("selectedobjectinfo")
	var htmlStr = null
	for (var key in selectedObject) {
		htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key]+"\"></div>"
	}
	htmlStr += "<button onclick=\"updateSelected()\">Update</button>"
	div.innerHTML = htmlStr
}

//Uses the values in the HTML inputs to update object parameters 
function updateSelected() {
	var ancestor = document.getElementById("selectedobjectinfo")
	var descendents = ancestor.getElementsByTagName("input")

	for(var i = 0; i < descendents.length; i++) {
		selectedObject[descendents[i].name] = descendents[i].value
		console.log(descendents[i].name + "=" + descendents[i].value)
	}
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

//Linear transforms

//Vector addition
function vecAdd(a, b) {
	//
	return [a[0]+b[0], a[1]+b[1]]
}

//Rotation of a vectorby angle in degrees
function vecRot(a, ang) {
	return [Math.cos(ang*Math.PI/180)*a[0]-Math.sin(ang*Math.PI/180)*a[1], 
					Math.sin(ang*Math.PI/180)*a[0]+Math.cos(ang*Math.PI/180)*a[1]]
}

//Heading from a to b
function vecHeading(a, b) {
	var diff = vecAdd([b[0],b[1]], [-a[0],-a[1]])
	if (diff[0] == 0 && diff[1] == 0) {
		return [0,0]
	} else {
		return [diff[0]/vecNorm(diff),diff[1]/vecNorm(diff)]
	}
}

//Length of a vector
function vecNorm(a) {
	//Norm = sqrt(x^2+y^2)
	return Math.sqrt(Math.pow(a[0],2)+Math.pow(a[1],2))
}

//checks if vectors are equal by value
function vecEqual(a,b) {
	if (a[0] == b[0] && a[1] == b[1])
		return true
	return false
}

///////////Other helper functions/////////////////

//Copies array and removes null values. Super un-optimized!
function squeeze(array) {
	var squeezedArray = []
	for (var i = 0; i < array.length; i++) {
		if (array[i] != null) {
					squeezedArray.push(array[i])
		}
	}
	return squeezedArray
}

//Checks if point is within or on circle radius
function withinRadius(a, c, r) {
	if (c == null)
		console.log("c is null")
	if (((c[0]-a[0])*(c[0]-a[0])+(c[1]-a[1])*(c[1]-a[1]))<=r*r)
		return true
	return false
}