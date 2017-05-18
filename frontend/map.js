// Should really make a Section class that all the others can extend
// instead of re-writing the same code over and over
// Maybe have a get pos() which returns a vector/point [x,y]
// as a complement to the x and y parameters

// TODO: Check for empty arrays before looping through them.

// Runs when program starts
function canvasSetup(){
    var c = document.getElementById("mapcanvas");
    c.width = c.parentNode.clientWidth/2;
}

canvasSetup();

// Component is a component going through the cell
class Component{

    constructor(x, y) {
	this.x = x
	this.y = y

	this.vx
	this.vy

	this.birth = new Date()

	this.conv

	this.id = "C" + Math.floor(Math.random()*10000)
	this.color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ")"

	this.section = null

	this.type = "component"

	this.highlighted = false

	this.lastDetected = null;
	this.lastDetectedBy = null;

	this.group = null;
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

    //Moves to a position on the conveyor
    //d is the distance along the conveyor
    moveAlongTo(d) {
	switch (this.section.type) {
	case "conveyor": 
            var q = d/this.section.l
            var newX = this.section.xs + q*this.section.dx
            var newY = this.section.ys + q*this.section.dy
            this.moveTo(newX,newY)
            break
	case "stop":
            //Do nothing
            break
	case "robotarm":
            //Do nothing
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

class Group{

    constructor(x, y) {
	this.x = x;
	this.y = y;

	this.vx = null;
	this.vy = null;

	this.birth = new Date();

	this.conv = null;

	this.id = "G" + Math.floor(Math.random()*10000)
	this.color = ("rgb(" + Math.floor(Math.random()*255) +
		      "," + Math.floor(Math.random()*255) +
		      "," + Math.floor(Math.random()*255) + ")")

	this.section = null

	this.type = "group"

	this.highlighted = false

	this.comps = [];

	this.lastDetected = null;

	this.enlarged = false;
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

    //Moves to a position on the conveyor
    //d is the distance along the conveyor
    moveAlongTo(d) {
	switch (this.section.type) {
	case "conveyor": 
            var q = d/this.section.l
            var newX = this.section.xs + q*this.section.dx
            var newY = this.section.ys + q*this.section.dy
            this.moveTo(newX,newY)
            break
	case "stop":
            //Do nothing
            break
	case "robotarm":
            //Do nothing
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
	// Might be redundant since you can easily get birth
	// now - birth
    }

    addComp(comp) {
	if (comp.group === this)
	    return ;
	this.comps.push(comp);
	if (comp.group !== null)
	    comp.group.rmComp(comp);
	comp.group = this;
	
    }

    rmComp(comp) {
	for (var i in this.comps) {
	    if (this === this.comps[i]) {
		this.comps[i] = null;
		if (this.comps.length <= 1)
		    rmGroup();
		return;
	    }
	}
    }

    rmGroup() {
	for (var i in groups) {
	    if (this === groups[i]) {
		groups[i] = null;
		groups = squeeze(groups);
		return;
	    }
	}
    }

    copy(comp) {
	this.x = comp.x;
	this.y = comp.y;

	this.vx = comp.vx;
	this.vy = comp.vy;

	this.conv = comp.conv;

	this.section = comp.section;

	this.lastDetected = comp.lastDetected;

	this.lastDetectedBy = comp.lastDetectedBy;
    }

    draw() {
	var c = document.getElementById("mapcanvas")
	var ctx = c.getContext("2d")

	ctx.fillStyle = this.color
	ctx.fillRect(this.x-5,this.y-5, 10, 10)

	if (this.highlighted) {
	    ctx.beginPath()
	    ctx.strokeStyle = "cyan"
	    ctx.arc(this.x,this.y,10,0,2*Math.PI)
	    ctx.stroke()
	}
    }

    // Draw the components in the group on the side so the individual
    // components can be seen.
    drawEnlarged() {
	var trayDiv = document.getElementById('traydiv');
	while (trayDiv.firstChild) {
	    trayDiv.removeChild(trayDiv.firstChild);
	}
	for (var i in this.comps) {
	    
	    var compDiv = document.createElement('div');
	    var wrapperDiv = document.createElement('div');
	    compDiv.classList.add('traycomponent');
	    wrapperDiv.classList.add('traycomponentwrapper');

	    compDiv.style.backgroundColor = this.comps[i].color;
	    compDiv.innerHTML = this.comps[i].id;

	    compDiv.addEventListener('click', function(evt) {
		updateComponentTable(this.innerHTML);
	    });

	    
	    wrapperDiv.appendChild(compDiv);
	    trayDiv.appendChild(wrapperDiv);
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
	//Not used
	this.comps = []
	//You should be able to link up different types of 
	//conveyor sections, elevators and stops
	this.nextSec
	this.prevSec

	this.id = "B" + Math.floor(Math.random()*10000)

	this.type = "conveyor"

	this.highlighted = false

	this.camera = null
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

    linkStart(section) {
	this.prevSec = section
	section.nextSec = this
	switch (section.type) {
	case "conveyor":
            this.xs = section.xe
            this.ys = section.ye
            break
	case "stop":
            this.xs = section.x
            this.ys = section.y
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


// A robot arm that can move components
class RobotArm {
    constructor(x,y) {
	// Base of rotation
	this.x = x
	this.y = y
	this.speed = 1

	// Start extension. In the future maybe use this as max extension.
	this.extension = 20

	// Tool x and y positions
	this.tx = x + this.extension
	this.ty = y + 0

	this.maxCap = 1
	this.comps = []

	// Would be nice with a list of targets that come in order (linked list?)
	// Maybe even make a new target class
	this.targetx = this.tx
	this.targety = this.ty

	// Predefined operations that the robot can perform
	// [from, to, grab/release/move, speed]
	this. operations = []

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

    doOperation(op) {
	switch (op[2]) {
	    // Grab release
	case "gr":
            grabFrom(op[0])
            target = op[1]
	}
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

//A sensor that can detect components
//Can only be placed at a stop right now
class Sensor{

    constructor() {
	this.x = 0;
	this.y = 0;
	this.placement = 0;
	this.section = null;

	this.id = "CAM" + Math.floor(Math.random()*10000);

	this.highlighted = false;
    }

    monitorSection(section) {
	switch (section.type) {
	case 'stop':
	    this.section = section;
	    this.x = section.x;
	    this.y = section.y;
	    break;
	case 'robotarm':
	    this.section = section;
	    this.x = section.tx;
	    this.y = section.ty;
	    break;
	default:
	    console.log("Can't monitor section of type " + section.type);
	    break;
	}
    }

    // If we identify a component, we move it here
    detectedComp(compId, timestamp) {
	var comp = getByID(compId);
	if (comp !== null) {
	    comp.switchSection(this.section);
	    comp.moveAlongTo(this.placement);
	} else {
	    console.log("Adding new component to system!");
	    comps.push(new Component());
	    comp = comps[comps.length - 1];
	    comp.id = compId;
	    comp.color = compId < 10 ? 'yellow' : 'green';
	    comp.switchSection(this.section);
	}
	comp.lastDetected = timestamp;
	if (comp.group !== null && comp.group !== undefined) {
	    comp.group.lastDetectedBy = comp.lastDetectedBy;
	}
	comp.lastDetectedBy = this.id;
	correctGrouping(comp);
	if (comp.group !== null && comp.group !== undefined) {
	    comp.group.lastDetectedBy = comp.lastDetectedBy;
	    comp.group.pos = comp.pos;
	}
    }

    draw() {
	var c = document.getElementById("mapcanvas")
	var ctx = c.getContext("2d");
	
	ctx.beginPath()
	ctx.strokeStyle = "purple";
	ctx.rect(this.x-10, this.y-10, 20, 20);
	ctx.stroke();

	//Not sure if this will be implemented for sensors
	if (this.highlighted) {
	    ctx.beginPath();
	    
	    ctx.arc(this.x,this.y,8,0,2*Math.PI);
	    ctx.stroke();
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

    //There's no real need to have a class for this
    //you just want to draw a crosshairs at x,y.
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

//These are all global variables which is something that
//should be avoided.
//Variables used for animating
var running = false
var menuUpdated = true
var animationID = null
var menuID = null
var IOID = null

// Should we model the cell or just update it
var modelCell = false;

//Mouse position on the canvas
var mousePosMap = [-1,-1]

//Objects on canvas
var objects = [];
var robs = [];
var stops = [];
var convs = [];
var comps = [];
var sensors = [];
var groups = [];

//Maybe add a 'toDraw' array with everything that needs to be drawn.
var toDraw = []; // Not used

//Maybe creat a ghost class
var anchored = false //Indicates that starting position of a conveyor has been set
var manuallyAdding = false
var objectToAdd = null //The object that is being added
var objectToAddType = null //Type of object being added
var enlargedObject = null;
var snapped = false //The object being added is snapped to another object
var snapPos = null //Position of the snapped object
var snapObject = null //Object That has been snapped to 
var typeBtn = null //Button that has been pressed in the HTML


var highlightedObject = null
var selectedObject = null

var linking = false

//Initiate all stuff
init();

//Initiate all stuff
function init() {
    console.log("Initiating")

    objects.push(comps);
    objects.push(robs);
    objects.push(convs);
    objects.push(stops);
    objects.push(sensors);
    objects.push(groups);

    robs.push(new RobotArm(300, 190))
    robs.push(new RobotArm(280, 260))
    robs.push(new RobotArm(330, 260))

    stops.push(new Stop(250, 160))
    stops.push(new Stop(250, 210))
    stops.push(new Stop(290, 260))
    stops.push(new Stop(305, 260))
    stops.push(new Stop(320, 260))

    convs.push(new Conveyor(50 ,240,200,240))
    convs.push(new Conveyor(200,240,200,110))
    convs.push(new Conveyor(200,110,250,110))
    convs.push(new Conveyor(250,110,250,160))
    convs.push(new Conveyor(250,160,250,210))
    convs.push(new Conveyor(250,210,250,260))
    convs.push(new Conveyor(250,260,50 ,260))
    convs.push(new Conveyor(50 ,260,50 ,240))
    
    var i = 0

    for ( i; i < 3; i++) {
	convs[i].linkTo(convs[i+1])
    }

    convs[i].linkTo(stops[0]); i++
    stops[0].linkTo(convs[i]);
    convs[i].linkTo(stops[1]); i++
    stops[1].linkTo(convs[i]);

    for ( i; i < convs.length; i++) {
	convs[i].linkTo(convs[(i+1)%(convs.length)])
    }


    robs[0].target = [stops[0].x, stops[0].y]

    robs[0].operations.push([stops[0], stops[2], 'gr', 1])
    robs[0].operations.push([stops[2], stops[0], 'm', 1])

    sensors.push(new Sensor())
    sensors.push(new Sensor())
    sensors.push(new Sensor())
    sensors.push(new Sensor())
    sensors[0].monitorSection(stops[0])
    sensors[0].id = "camera_1"
    sensors[1].monitorSection(robs[0])
    sensors[1].id = "camera_2"
    sensors[2].monitorSection(stops[2])
    sensors[2].id = "camera_3"
    sensors[3].monitorSection(stops[4])
    sensors[3].id = "camera_4"
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

//Animate the robots in the cell
function animateRobot() {
    if (!robs.length) {
	return ;
    }
    for (var i = 0; i < robs.length; i++) {
	robs[i].draw()
	robs[i].moveToTarget()
    }
    if ( !robs[0].comps.length && stops[0].comps.length != 0 && robs[0].checkAtTarget() &&
	 withinRadius(robs[0].toolPos,stops[0].pos, 3)) {
	robs[0].grabFrom(stops[0])
	robs[0].target = [stops[1].x, stops[1].y]
    } else if (robs[0].comps[0] != null && robs[0].checkAtTarget()) {
	robs[0].releaseTo(stops[1])
	robs[0].target = [stops[0].x, stops[0].y]
    }
}

//Animate the stops in the cell
function animateStop() {
    if (!stops.length) {
	return ;
    }
    for (var i = 0; i < stops.length; i++) {
	stops[i].draw()
    }
}

//Animate the components
function animateComponent() {
    if (!comps.length) {
	return ;
    }
    for (var i = 0; i < comps.length; i++) {
	comps[i].draw()
	if (comps[i].sectio !== null)
	    comps[i].moveAlong()
    }
}

function animateGroup() {
    if (!groups.length) {
	return ;
    }
    for (var i = 0; i < groups.length; i++) {
	groups[i].draw();
	if (groups[i].section !== null){
	    // moving all groups through their first component 
	    groups[i].pos = groups[i].comps[0].pos;
	}
    }
}

function animateConveyor() {
    if (!convs.length) {
	return ;
    }
    for (var i = 0; i < convs.length; i++) {
	convs[i].draw()
    }
}

function animateSensor() {
    if (!sensors.length) {
	return ;
    }
    for (var i = 0; i < sensors.length; i++) {
	sensors[i].draw()
    }
}


//Draw mouse coordinates
function drawMouseText() {
    var c = document.getElementById("mapcanvas")
    var ctx = c.getContext("2d")

    ctx.fillText("Mouse x: " + mousePosMap[0], 0, c.height-20)
    ctx.fillText("Mouse y: " + mousePosMap[1], 0, c.height-10)
}

//Have a wnindow/canvas that can visualize all the data gathered
function drawData() {
    // Placeholder
}

//All moving should be done outside of the animation loop
function animateCell() {
    if (!objects.length)
	return 
    var c = document.getElementById("mapcanvas")
    var ctx = c.getContext("2d")

    // Clear the screen
    ctx.clearRect(0,0,c.width,c.height)

    
    //Everything will be drawn in this order, 
    //that is, the first stuff under the later.
    animateStop()
    animateConveyor()
    animateComponent()
    drawMouseText()
    animateRobot()
    animateSensor()
    animateGroup()

    if (objectToAdd != null) {
	objectToAdd.draw()
    }
    if (snapped)
	Crosshairs.statDraw(snapPos[0],snapPos[1])
}

// Just draw, don't model the cell
function drawCell() {
    if (!objects.length)
	return 
    var c = document.getElementById("mapcanvas")
    var ctx = c.getContext("2d")

    ctx.clearRect(0,0,c.width,c.height)


    //Everything will be drawn in this order, 
    //that is the first stuff under the later.
    for (var i = 0; i < objects.length; i++) {
	for (var j = 0; j < objects[i].length; j++) {
	    if (objects[i][j] !== null)
		objects[i][j].draw();
	}
    }

    if (objectToAdd !== null) {
	objectToAdd.draw()
    }
    if (snapped)
	Crosshairs.statDraw(snapPos[0],snapPos[1])
}

//Checks mouse and snapping
function checkIO() {
    checkMouseOn();
    if (objectToAdd != null) {
	var snap = snapTo(false)
	if (objectToAddType == "conveyor" && snap != null) {
	    if(!anchored){
		objectToAdd.endPos = snap[0]
		objectToAdd.startPos = snap[0]
	    } else {
		objectToAdd.endPos = snap[0]
	    }
	    snapped = true
	    snapPos = snap[0]
	    snapObject = snap[1]
	} else if (objectToAddType == "conveyor" && snap == null) {
	    if(!anchored){
		objectToAdd.endPos = mousePosMap
		objectToAdd.startPos = mousePosMap
	    } else {
		objectToAdd.endPos = mousePosMap
	    }
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
	if (modelCell) {
	    animateCell()
	    animationID = window.setInterval(animateCell, 33)
	} else {
	    drawCell()
	    animationID = window.setInterval(drawCell, 33)
	    console.log("Just drawing")
	}
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
            objectToAdd = new Conveyor(0,0,0,0)
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
    comps[comps.length-1].switchSection(convs[0])
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
    for (var i = 0; i < groups.length; i++) {
	if (withinRadius(mousePosMap, groups[i].pos, 5)) {
	    groups[i].highlighted = true
	    highlightedObject = groups[i]
	    document.getElementById("idfield").innerHTML = "ID: " + groups[i].id
	    document.getElementById("birthfield").innerHTML = "Entered cell: " + groups[i].birth
	    return null
	} else {
	    groups[i].highlighted = false
	}
    }
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
    if (!manuallyAdding && !linking) {
	if (highlightedObject != null) {
	    selectedObject = highlightedObject
	    if(selectedObject.type === 'component')
		updateComponentTable(selectedObject.id);
	    if(selectedObject.type === 'group')
		selectedObject.drawEnlarged();
	    //drawObjectInfo()
	}
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
	    console.log("Snapped first point")
	    objectToAdd.startPos = snapPos
	    objectToAdd.endPos = snapPos
	    objectToAdd.linkStart(snapObject)
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
	}  else { 
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
    return null;
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
	if(selectedObject[key] != null) {
	    switch (key) {
            case "section":
		htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key].id+"\"></div>"
		break
            case "prevSec":
		htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key].id+"\"></div>"
		break
            case "nextSec":
		htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key].id+"\"></div>"
		break
            case "comps":
		//htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key].id+"\"></div>"
		break
            default:
		htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key]+"\"></div>"
		break
	    }
	}
    }
    htmlStr += "<button onclick=\"updateSelected()\">Update</button>"
    div.innerHTML = htmlStr
}

//Uses the values in the HTML inputs to update object parameters 
function updateSelected() {
    var ancestor = document.getElementById("selectedobjectinfo")
    var descendents = ancestor.getElementsByTagName("input")

    for(var i = 0; i < descendents.length; i++) {
	console.log(descendents[i].name + "=" + descendents[i].value)
	switch (descendents[i].name) {
        case "section":
            selectedObject[descendents[i].name] = getByID(descendents[i].value)
            break
        case "prevSec":
            selectedObject.linkStart(getByID(descendents[i].value))
            break
        case "nextSec":
            selectedObject.linkTo(getByID(descendents[i].value))
            break
        case "comps":
            //htmlStr += "<div class=\"datadiv\"><p>"+key+"</p><input type=\"text\" name=\""+key+"\" value=\""+selectedObject[key].id+"\"></div>"
            break
        case "id":
            selectedObject[descendents[i].name] = descendents[i].value
            break
        case "type":
            selectedObject[descendents[i].name] = descendents[i].value
            break
        case "color":
            selectedObject[descendents[i].name] = descendents[i].value
            break
        default:
            selectedObject[descendents[i].name] = Number(descendents[i].value)
            break
	}
	//console.log(descendents[i].name + "=" + descendents[i].value)
    }
}

function initSave() {
    //Starts the save procedure by producing the dialog window.
    //I don't think this file API check is  is relevant as it is 
    //not used right now.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
	//Open dialog box so we can start selecting a file to save to
	var div = document.getElementById("maindiv")
	//var fileIOStr = "<input type=\"file\" id=\"cellfile\" name=\"fileToSaveTo\"/>"
	//Easier to use a link to download a file 
	var dlLinkStr = "<a id=\"dl\" href=\"\"></a>"
	var btnStr = "<button id=\"innersavebtn\">Save</button>"
	var popupInnerStr = "<div id=\"filesavepopup\">" + dlLinkStr + btnStr + "</div>"
	var popupStr = "<div id=\"popupbg\" class=\"popupbackground\">" + popupInnerStr + "</div>"
	div.innerHTML += popupStr

	document.getElementById("innersavebtn").addEventListener('click', saveCellToFile)
	document.getElementById("popupbg").addEventListener('click', closePopup)
	document.getElementById("filesavepopup").addEventListener('click', function(evt) {evt.stopPropagation()})
    } else {
	alert('The File APIs are not fully supported in this browser.')
    }
}

function saveCellToFile(fileName) {
    // Handle the file
    // This will only work on some browsers as the
    // download-attribute of <a> is not supported.
    // See: http://caniuse.com/#feat=download
    var dlLink = document.getElementById('dl')
    var cellBlob = new Blob([makeJSONStrToSave()], {type: 'application/json'})
    dlLink.href = URL.createObjectURL(cellBlob)
    dlLink.download = "cellmap.acm" //Automated Cell Map (acm) format
    dlLink.click()
    console.log("Cell Blob: " + cellBlob.toString())
    closePopup()
    
}

function saveCellToServer() {
    // Send cell configuration to server to be saved.
    // There should also be some kind of "load" function 
    // that can fetch cell configurations from the 
    // server and run them on the host. This will always 
    // work, and should be used if the browser does not 
    // have File API support. Also good as the cell will
    // be saved online. Makes for easy remote access.
}

function initLoad() {
    //Starts the save procedure by producing the dialog window.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
	//Open dialog box so we can start selecting a file to save to
	var div = document.getElementById("maindiv")
	var fileIOStr = "<input type=\"file\" id=\"fileloader\" name=\"loadfile\"/>"
	var btnStr = "<button id=\"innerloadbtn\">Load</button>"
	var popupInnerStr = "<div id=\"fileloadpopup\">" + fileIOStr + btnStr + "</div>"
	var popupStr = "<div id=\"popupbg\" class=\"popupbackground\">" + popupInnerStr + "</div>"
	div.innerHTML += popupStr

	document.getElementById("innerloadbtn").addEventListener('click', loadCellFromFile)
	document.getElementById("popupbg").addEventListener('click', closePopup)
	document.getElementById("fileloadpopup").addEventListener('click', function(evt) {evt.stopPropagation()})
    } else {
	alert('The File APIs are not fully supported in this browser.')
    }
}


function closePopup() {
    //Close all popup stuff
    var div = document.getElementById("maindiv")
    div.removeChild(document.getElementById("popupbg"))
}

function loadCellFromFile() {
    //Check compatability with file API
    if (window.File && window.FileReader && window.FileList && window.Blob) {
	console.log("We can read files! Yay!");
	//Check if there actually is a file to load
	var files = document.getElementById('fileloader').files;
	if (!files.length) {
	    alert("Please select a file!");
	    return ;
	}

	var file = files[0];
	var reader = new FileReader();

	reader.onloadend = function(evt) {
	    if (evt.target.readyState == FileReader.DONE) {
		console.log("File Reader is Ready!")
		console.log(evt.target.result)
		stuffs = JSON.parse(evt.target.result)
		console.log(stuffs)
	    }
	};

	var fileBlob = file;
	reader.readAsBinaryString(fileBlob);
	

	closePopup();
	
	
    } else {
	alert('The File APIs are not fully supported in this browser.')
    }
}

//As the "JSON" string is not proper JSON yet, this function 
//reads the string and makes a list of cell objects from it
function objectStrToArray() {

}

//Takes an object as argument and returns a JSON string
//Not really a JSON string yet, but the plan is to make it a 
//proper JSON string
function objectToJSONStr(obj) {
    var JSONStr = "{"
    for (var key in obj) {
	if (obj[key] == null) {
            JSONStr += "\"" + key + "\": " + "\"None\""
	} else if(typeof obj[key] == "object") {
            JSONStr += "\"" + key + "\": " + "\"" + obj[key].id + "\""
	} else if (typeof obj[key] == "string"){
            JSONStr += "\"" + key + "\": " + "\"" + obj[key] + "\""
	} else {
            JSONStr += "\"" + key + "\": " + obj[key]
	}
	JSONStr += ", "
    }

    return JSONStr.slice(0,-2) + "}"
}

//Returns the JSON string representation of all objects in cell
//Not really a JSON string yet, but the plan is to make it a 
//proper JSON string
function makeJSONStrToSave() {
    var JSONStr = "{\"objects\": \n[\n"
    for (var i = 0; i < objects.length; i++) {
	for (var j = 0; j < objects[i].length; j++) {
	    console.log(objects[i][j])
	    JSONStr += objectToJSONStr(objects[i][j]) + ","
	}
    }
    return JSONStr.slice(0, -1) + "\n]\n}"
}

function updateComponentTable(compId) {
    console.log('Component ' + compId + ' has been clicked, sending query!');
    var queryUrl = makeUrl('componentHistory', null, compId);
    makeQuery(queryUrl, responseHandler);
}


function correctGrouping(comp) {
    var maxDt = 1;
    
    for (var i = 0; i < comps.length; i++) {
	var skip = false;
	var dt = comp.lastDetected - comps[i].lastDetected;
	console.log( i + ". Comparing " + comp.id
	    + " to " + comps[i].id)
	
	if(comps[i] === comp){
	    console.log("Skipping bcuz of same object");
	    skip = true;
	}
	if (comps[i].group === comp.group && comp.group !== null &&
	    comp.group !== undefined) {
	    console.log("Skipping bcuz of same group");
	    skip = true;
	}
	if (comp.lastDetectedBy !== comps[i].lastDetectedBy) {
	    console.log("Skipping bcuz of not same camera");
	    console.log(comp.lastDetectedBy + " =/=" + comps[i].lastDetectedBy);
	    skip = true;
	}
	
	if (Math.abs(dt) <= maxDt && !skip) {
	    //console.log("Time between comps: " + dt);
	    //console.log(comp.lastDetectedBy + " == " + comps[i].lastDetectedBy);
	    //console.log("Distance is small enough between " + comp.id
	    //+ " and " + comps[i].id);
	    if (comps[i].group !== null &&
		comps[i].group !== undefined) {
		console.log("Adding " + comp.id + " to " + comps[i].group.id);
		comps[i].group.addComp(comp);
		return;
	    } else {
		// Make a new group and add both
		// Set group timestamp to erliest timestamp
		console.log("Making new group with " + comp.id +
			    " and " + comps[i].id + "!");
		groups.push(new Group());
		groups[groups.length - 1].addComp(comp);
		groups[groups.length - 1].addComp(comps[i]);
		groups[groups.length - 1].copy(comp);
		return;
	    }
	}
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

function getByID(idStr) {
    for (var i = 0; i < objects.length; i++) {
	for (var j = 0; j < objects[i].length; j++) {
	    if(objects[i][j].id == idStr)
		return objects[i][j]
	}
    }
    console.log("ID not found!")
    return null
}
